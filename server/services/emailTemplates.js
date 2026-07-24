/**
 * Email Templates Service
 * Centralized email template generation for various types of notifications
 */

/**
 * Create bilingual disease alert email template
 * @param {Object} params - Template parameters
 * @param {Object} params.user - User object
 * @param {string} params.disease - Disease name
 * @param {string} params.description - Disease description
 * @param {Object} params.location - Location coordinates
 * @param {Object} params.bilingualData - Bilingual disease data
 * @returns {Object} Email template with subject, text, and HTML content
 */
function createDiseaseAlertEmail({ user, disease, description, location, bilingualData }) {
  const subject = `🚨 Disease Alert / நோய் எச்சரிக்கை: ${disease}`;

  const htmlTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Disease Alert</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
      .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
      .content { padding: 20px; }
      .alert-box { background: #fef2f2; border: 2px solid #fca5a5; border-radius: 6px; padding: 15px; margin: 15px 0; }
      .info-box { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 15px 0; }
      .action-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 15px; margin: 15px 0; }
      .button { background: #16a34a; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
      .footer { background: #f9f9f9; padding: 15px; text-align: center; font-size: 12px; color: #666; }
      .divider { border-top: 2px solid #e5e5e5; margin: 20px 0; }
      .lang-label { background: #6b7280; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin: 10px 0; display: inline-block; }
      h1 { margin: 0; font-size: 24px; }
      h2 { color: #dc2626; margin: 0 0 10px 0; }
      h3 { color: #059669; margin: 15px 0 10px 0; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🚨 Disease Alert / நோய் எச்சரிக்கை</h1>
        <p style="margin: 5px 0 0 0; opacity: 0.9;">AgriTech Smart Agriculture System</p>
      </div>
      
      <div class="content">
        <!-- English Content -->
        <div class="lang-label">🇺🇸 ENGLISH</div>
        
        <h2>Hello ${user.name || 'Farmer'}!</h2>
        
        <div class="alert-box">
          <h3>🦠 Disease Detected: ${disease}</h3>
          <p><strong>Description:</strong> ${description}</p>
          <p><strong>Location:</strong> Near ${location.coordinates.join(', ')}</p>
          <p><strong>⚠️ Important:</strong> This disease can spread to your crops. Take immediate action!</p>
        </div>
        
        <div class="action-box">
          <h3>✅ What You Should Do:</h3>
          <ul>
            <li><strong>Check your crops</strong> for similar symptoms immediately</li>
            <li><strong>Isolate infected plants</strong> from healthy ones</li>
            <li><strong>Contact agricultural experts</strong> for professional advice</li>
            <li><strong>Apply proper treatment</strong> if needed</li>
            <li><strong>Monitor nearby crops</strong> regularly</li>
          </ul>
        </div>
        
        <div class="info-box">
          <p><strong>📞 Need Help?</strong></p>
          <p>📧 Email: support@agritech.com</p>
          <p>📱 Phone: +91-9876543210</p>
          <a href="#" class="button">📱 Open AgriTech App</a>
        </div>
        
        <!-- Divider -->
        <div class="divider"></div>
        
        <!-- Tamil Content -->
        <div class="lang-label">🇮🇳 தமிழ்</div>
        
        <h2>வணக்கம் ${user.name || 'விவசாயி'}!</h2>
        
        <div class="alert-box">
          <h3>🦠 நோய் கண்டறியப்பட்டது: ${disease}</h3>
          <p><strong>விளக்கம்:</strong> ${description}</p>
          <p><strong>இடம்:</strong> ${location.coordinates.join(', ')} அருகில்</p>
          <p><strong>⚠️ முக்கியம்:</strong> இந்த நோய் உங்கள் பயிர்களுக்கு பரவலாம். உடனே நடவடிக்கை எடுங்கள்!</p>
        </div>
        
        <div class="action-box">
          <h3>✅ நீங்கள் செய்ய வேண்டியது:</h3>
          <ul>
            <li><strong>உங்கள் பயிர்களை சரிபார்க்கவும்</strong> - இதே அறிகுறிகள் உள்ளதா என பாருங்கள்</li>
            <li><strong>நோயுள்ள செடிகளை தனிமைப்படுத்துங்கள்</strong> - ஆரோக்கியமான செடிகளிலிருந்து தனித்து வையுங்கள்</li>
            <li><strong>விவசாய நிபுணர்களை தொடர்பு கொள்ளுங்கள்</strong> - நிபுணர் ஆலோசனை பெறுங்கள்</li>
            <li><strong>தேவையான சிகிச்சை அளியுங்கள்</strong> - உரிய மருந்து தெளிக்கவும்</li>
            <li><strong>அருகிலுள்ள பயிர்களை கண்காணிக்கவும்</strong> - தொடர்ந்து பார்த்துக் கொள்ளுங்கள்</li>
          </ul>
        </div>
        
        <div class="info-box">
          <p><strong>📞 உதவி வேண்டுமா?</strong></p>
          <p>📧 மின்னஞ்சல்: support@agritech.com</p>
          <p>📱 தொலைபேசி: +91-9876543210</p>
          <a href="#" class="button">📱 AgriTech பயன்பாட்டைத் திறக்கவும்</a>
        </div>
      </div>
      
      <div class="footer">
        <p><strong>AgriTech Team / AgriTech குழு</strong></p>
        <p>Smart Agriculture Solutions / ஸ்மார்ட் விவசாய தீர்வுகள்</p>
        <p style="margin-top: 10px; font-size: 11px;">
          This alert is based on nearby farmer reports. Always consult local experts.<br>
          இந்த எச்சரிக்கை அருகிலுள்ள விவசாயிகளின் அறிக்கையின் அடிப்படையில் உள்ளது.
        </p>
      </div>
    </div>
  </body>
  </html>
  `;

  const textContent = `
=== DISEASE ALERT / நோய் எச்சரிக்கை ===

🇺🇸 ENGLISH:
===============
Dear ${user.name || 'Farmer'},

🚨 URGENT: Disease detected in your area!

Disease: ${disease}
Description: ${description}
Location: Near ${location.coordinates.join(', ')}

WHAT TO DO:
✓ Check your crops for similar symptoms
✓ Isolate infected plants from healthy ones  
✓ Contact agricultural experts for advice
✓ Apply proper treatment if needed
✓ Monitor nearby crops regularly

Need help? 
📧 Email: support@agritech.com
📱 Phone: +91-9876543210

Best regards,
AgriTech Team
Smart Agriculture Solutions

🇮🇳 தமிழ்:
============
அன்புள்ள ${user.name || 'விவசாயி'},

🚨 அவசரம்: உங்கள் பகுதியில் நோய் கண்டறியப்பட்டுள்ளது!

நோய்: ${disease}
விளக்கம்: ${description}
இடம்: ${location.coordinates.join(', ')} அருகில்

என்ன செய்ய வேண்டும்:
✓ உங்கள் பயிர்களில் இதே அறிகுறிகள் உள்ளதா பாருங்கள்
✓ நோயுள்ள செடிகளை ஆரோக்கியமான செடிகளிலிருந்து தனித்து வையுங்கள்
✓ விவசாய நிபுணர்களிடம் ஆலோசனை பெறுங்கள்  
✓ தேவையான சிகிச்சை அளியுங்கள்
✓ அருகிலுள்ள பயிர்களை தொடர்ந்து கண்காணிக்கவும்

உதவி வேண்டுமா?
📧 மின்னஞ்சல்: support@agritech.com
📱 தொலைபேசி: +91-9876543210

நன்றி,
AgriTech குழு
ஸ்மார்ட் விவசாய தீர்வுகள்

---
This alert is based on nearby farmer reports.
இந்த எச்சரிக்கை அருகிலுள்ள விவசாயிகளின் அறிக்கையின் அடிப்படையில்.
  `;

  return {
    subject,
    text: textContent,
    html: htmlTemplate
  };
}

/**
 * Create test email template
 * @param {Object} params - Template parameters
 * @param {string} params.email - Recipient email
 * @returns {Object} Email template
 */
function createTestEmail({ email }) {
  const subject = '✅ AgriTech Email Test - System Working';

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>AgriTech Test Email</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
      .container { max-width: 500px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
      .header { background: #16a34a; color: white; padding: 15px; text-align: center; border-radius: 6px; margin-bottom: 20px; }
      .content { text-align: center; }
      .emoji { font-size: 48px; margin: 20px 0; }
      .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h2>🌾 AgriTech Email Test</h2>
      </div>
      <div class="content">
        <div class="emoji">✅</div>
        <h3>Email System Working!</h3>
        <p>This is a test email from your AgriTech system.</p>
        <p><strong>Recipient:</strong> ${email}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <div class="footer">
          <p><strong>AgriTech Team</strong><br>
          Smart Agriculture Solutions</p>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  const textContent = `
AgriTech Email Test

Email System Working!

This is a test email from your AgriTech system.
Recipient: ${email}
Date: ${new Date().toLocaleString()}

AgriTech Team
Smart Agriculture Solutions
  `;

  return {
    subject,
    text: textContent,
    html: htmlContent
  };
}

/**
 * Create summary email template
 * @param {Object} params - Template parameters
 * @param {Object} params.summary - Alert summary data
 * @param {number} params.period - Period in days
 * @param {string} params.userEmail - User email
 * @returns {Object} Email template
 */
function createSummaryEmail({ summary, period, userEmail }) {
  const subject = `📊 AgriTech: Disease Alert Summary (${summary.alerts} alerts)`;

  let emailText = `Disease Alert Summary (Last ${period} days)\n\n`;
  let emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2E7D32;">🌱 Disease Alert Summary</h2>
      <p>Here's your disease alert summary for the last ${period} days:</p>
      <div style="background-color: #f9f9f9; padding: 16px; border-radius: 8px;">
  `;

  Object.entries(summary.summary).forEach(([disease, info]) => {
    emailText += `- ${disease}: ${info.count} alert(s), latest: ${new Date(info.latestDate).toLocaleDateString()}\n`;
    emailHtml += `
      <div style="margin-bottom: 16px; padding: 12px; background-color: white; border-radius: 4px; border-left: 4px solid #4CAF50;">
        <h4 style="margin: 0; color: #2E7D32;">${disease}</h4>
        <p style="margin: 4px 0; color: #666;">Count: ${info.count} alert(s)</p>
        <p style="margin: 4px 0; color: #666;">Latest: ${new Date(info.latestDate).toLocaleDateString()}</p>
      </div>
    `;
  });

  emailHtml += `
      </div>
      <p style="margin-top: 20px;">Total alerts: <strong>${summary.alerts}</strong></p>
      <p style="color: #666; font-size: 12px; margin-top: 32px;">
        This summary was generated on ${new Date().toLocaleString()}<br>
        AgriTech Disease Detection System
      </p>
    </div>
  `;

  return {
    subject,
    text: emailText,
    html: emailHtml
  };
}

module.exports = {
  createDiseaseAlertEmail,
  createTestEmail,
  createSummaryEmail
};
