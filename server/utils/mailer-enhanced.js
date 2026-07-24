const nodemailer = require('nodemailer');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
dotenv.config();

// Primary transporter (SMTP)
const smtpTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 60000,
  greetingTimeout: 30000,
  socketTimeout: 60000,
});

// Fallback: SendGrid API (HTTP-based, bypasses firewall)
async function sendViaSendGrid({ to, subject, text, html }) {
  if (!process.env.SENDGRID_API_KEY) {
    throw new Error('SendGrid API key not configured');
  }

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: process.env.SMTP_USER || 'alerts@agritech.com' },
      subject,
      content: [
        { type: 'text/plain', value: text },
        { type: 'text/html', value: html || `<p>${text}</p>` }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`SendGrid API error: ${error}`);
  }

  return { messageId: 'sendgrid-' + Date.now(), service: 'sendgrid' };
}

// Fallback: Mailgun API (HTTP-based)
async function sendViaMailgun({ to, subject, text, html }) {
  if (!process.env.MAILGUN_API_KEY || !process.env.MAILGUN_DOMAIN) {
    throw new Error('Mailgun credentials not configured');
  }

  const formData = new URLSearchParams();
  formData.append('from', `AgriTech Alerts <alerts@${process.env.MAILGUN_DOMAIN}>`);
  formData.append('to', to);
  formData.append('subject', subject);
  formData.append('text', text);
  if (html) formData.append('html', html);

  const response = await fetch(`https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64')}`,
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Mailgun API error: ${error}`);
  }

  const result = await response.json();
  return { messageId: result.id, service: 'mailgun' };
}

// Smart email sender with multiple fallbacks
async function sendMail({ to, subject, text, html, attachments }) {
  const methods = [
    {
      name: 'SMTP', func: () => smtpTransporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to, subject, text, html, attachments
      })
    },
    { name: 'SendGrid', func: () => sendViaSendGrid({ to, subject, text, html }) },
    { name: 'Mailgun', func: () => sendViaMailgun({ to, subject, text, html }) }
  ];

  let lastError;

  for (const method of methods) {
    try {
      console.log(`📧 Attempting to send email via ${method.name}...`);
      const result = await method.func();
      console.log(`✅ Email sent successfully via ${method.name}`);
      return { ...result, method: method.name };
    } catch (error) {
      console.log(`❌ ${method.name} failed:`, error.message);
      lastError = error;

      // If it's a timeout/connection error, try next method immediately
      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        continue;
      }
    }
  }

  throw new Error(`All email methods failed. Last error: ${lastError.message}`);
}

// Test SMTP connection
async function testConnection() {
  try {
    await smtpTransporter.verify();
    console.log('✅ SMTP connection successful');
    return { success: true, message: 'SMTP connection verified', method: 'SMTP' };
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);

    // Test HTTP-based alternatives
    try {
      if (process.env.SENDGRID_API_KEY) {
        await sendViaSendGrid({
          to: process.env.SMTP_USER,
          subject: 'Connection Test',
          text: 'SendGrid API test'
        });
        return { success: true, message: 'SendGrid API working', method: 'SendGrid' };
      }
    } catch (sgError) {
      console.log('SendGrid also failed:', sgError.message);
    }

    return { success: false, error: error.message, suggestion: 'Try HTTP-based email services' };
  }
}

module.exports = { sendMail, testConnection };
