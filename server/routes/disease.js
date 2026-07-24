const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const { sendMail, testConnection } = require('../utils/mailer-enhanced');
const DiseaseAlert = require('../models/disease');
const User = require('../models/User');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/disease-images/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// POST /api/disease/report - Report a disease in a location
router.post('/report', async (req, res) => {
  try {
    const { disease, description, location, bilingualData } = req.body;

    if (process.env.NODE_ENV === 'development') {
      console.log(`📢 Disease report: ${disease} at [${location.coordinates.join(', ')}]`);
    }

    // Find users within 500km radius for testing (was 10km)
    const usersNearby = await User.find({
      location: {
        $near: {
          $geometry: location,
          $maxDistance: 500000  // 500km radius for testing (was 10000)
        }
      }
    });

    console.log(`📍 Disease alert: ${disease} - notifying ${usersNearby.length} users`);

    // Create in-app notifications for each user
    let alerts = [];
    const io = req.app.get('io'); // Get socket.io instance

    for (const user of usersNearby) {
      const alertData = {
        user: user._id,
        // Use English disease name if available, otherwise use the provided disease name
        disease: bilingualData && bilingualData.english && bilingualData.english.disease
          ? bilingualData.english.disease
          : disease,
        description,
        location
      };      // Add bilingual data if available
      if (bilingualData && bilingualData.english && bilingualData.tamil) {
        alertData.bilingualData = bilingualData;
      }

      const alert = await DiseaseAlert.create(alertData);
      alerts.push(alert._id);

      // Emit real-time alert to the specific user
      if (io) {
        io.to(`user-${user._id}`).emit('new-disease-alert', {
          alert: alert,
          message: `New disease alert: ${disease} detected in your area`
        });
      }

      // Send email notification (non-blocking)
      if (user.email) {
        console.log(`📧 Sending email to: ${user.email}`);

        // Simple bilingual email template  
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
            h1 { margin: 0; font-size: 24px; }
            h2 { color: #dc2626; margin: 0 0 10px 0; }
            h3 { color: #059669; margin: 15px 0 10px 0; }
            .lang-label { background: #6b7280; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; margin: 10px 0; display: inline-block; }
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

        sendMail({
          to: user.email,
          subject: `🚨 Disease Alert / நோய் எச்சரிக்கை: ${disease}`,
          text: textContent,
          html: htmlTemplate
        }).catch(error => {
          console.error(`❌ Failed to send email to ${user.email}:`, error);
        });
      }
    }
    res.json({ notified: usersNearby.length, alerts });
  } catch (err) {
    console.error('Error in disease report:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/disease/predict - Endpoint to predict plant disease from image
router.post('/predict', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }

    // Read the image file
    const imagePath = path.join(__dirname, '..', req.file.path);
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    // Call the Hugging Face model API
    console.log(`Calling Hugging Face API for image: ${req.file.path}`);

    const response = await fetch(
      "https://api-inference.huggingface.co/models/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification",
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGING_FACE_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: base64Image,
        }),
      }
    );

    const predictions = await response.json();
    console.log('Hugging Face API response:', predictions);

    // Clean up the uploaded file
    fs.unlinkSync(imagePath);

    if (Array.isArray(predictions) && predictions.length > 0) {
      // Sort predictions by confidence score
      const sortedPredictions = predictions.sort((a, b) => b.score - a.score);
      res.json({ predictions: sortedPredictions });
    } else {
      res.status(500).json({ error: 'Failed to get predictions from the model' });
    }

  } catch (error) {
    console.error('Error predicting disease:', error);

    // Clean up file if it exists
    if (req.file) {
      const imagePath = path.join(__dirname, '..', req.file.path);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/disease/alerts - Get disease alerts for user
router.get('/alerts', async (req, res) => {
  try {
    // Try to get userId from query parameter or authenticated user
    const userId = req.query.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User ID required' });
    }

    console.log(`📋 Fetching alerts for user: ${userId}`);

    const alerts = await DiseaseAlert.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(20); // Limit to latest 20 alerts

    console.log(`📋 Found ${alerts.length} alerts for user ${userId}`);
    res.json({ alerts });
  } catch (err) {
    console.error('Error fetching alerts:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/disease/alerts/read - Mark alerts as read for user
router.patch('/alerts/read', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID required' });
    }

    console.log(`📋 Marking alerts as read for user: ${userId}`);

    // Update all unread alerts for this user
    const result = await DiseaseAlert.updateMany(
      { user: userId, read: { $ne: true } },
      { $set: { read: true, readAt: new Date() } }
    );

    console.log(`📋 Marked ${result.modifiedCount} alerts as read for user ${userId}`);
    res.json({ success: true, markedAsRead: result.modifiedCount });
  } catch (err) {
    console.error('Error marking alerts as read:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/disease/test-email - Test email functionality
router.post('/test-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const testEmailContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>AgriTech Test Email</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { background: #16a34a; color: white; padding: 15px; text-align: center; border-radius: 6px; margin-bottom: 20px; }
        .content { text-align: center; }
        .emoji { font-size: 48px; margin: 20px 0; }
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
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          <hr style="margin: 20px 0;">
          <p style="font-size: 14px; color: #666;">
            <strong>AgriTech Team</strong><br>
            Smart Agriculture Solutions
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    const result = await sendMail({
      to: email,
      subject: '✅ AgriTech Email Test - System Working',
      text: `AgriTech Email Test\n\nThis is a test email from your AgriTech system.\nDate: ${new Date().toLocaleString()}\n\nAgriTech Team\nSmart Agriculture Solutions`,
      html: testEmailContent
    });

    console.log('✅ Test email sent successfully:', result);
    res.json({
      success: true,
      message: 'Test email sent successfully',
      details: result
    });

  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send email',
      details: error.message
    });
  }
});

// POST /api/disease/test-connection - Test email service connection
router.post('/test-connection', async (req, res) => {
  try {
    const connectionResult = await testConnection();
    console.log('📧 Email connection test result:', connectionResult);
    res.json({ success: true, connection: connectionResult });
  } catch (error) {
    console.error('❌ Email connection test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Connection test failed',
      details: error.message
    });
  }
});

module.exports = router;