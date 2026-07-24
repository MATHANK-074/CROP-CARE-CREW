/**
 * Configuration Management
 * Centralized configuration and environment variable management
 */

require('dotenv').config();

/**
 * Application configuration object
 */
const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 5000,
    host: process.env.HOST || 'localhost',
    nodeEnv: process.env.NODE_ENV || 'development'
  },

  // Database configuration
  database: {
    mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/agritech',
    mongoOptions: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },

  // Email configuration
  email: {
    smtp: {
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.EMAIL_FROM || process.env.SMTP_USER
    },
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY
    },
    mailgun: {
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN
    }
  },

  // External API configuration
  apis: {
    huggingFace: {
      token: process.env.HUGGING_FACE_TOKEN,
      modelUrl: process.env.HUGGING_FACE_MODEL_URL || 'https://api-inference.huggingface.co/models/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification'
    },
    weather: {
      apiKey: process.env.WEATHER_API_KEY,
      baseUrl: process.env.WEATHER_API_URL || 'https://api.tomorrow.io/v4'
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      baseUrl: process.env.GEMINI_API_URL
    }
  },

  // File upload configuration
  upload: {
    maxFileSize: Number(process.env.MAX_FILE_SIZE || 5 * 1024 * 1024), // 5MB
    allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
    tempCleanupInterval: Number(process.env.TEMP_CLEANUP_INTERVAL || 60 * 60 * 1000) // 1 hour
  },

  // Disease alert configuration
  disease: {
    alertRadius: Number(process.env.DISEASE_ALERT_RADIUS || 500000), // 500km in meters
    emailNotifications: process.env.DISEASE_EMAIL_NOTIFICATIONS !== 'false'
  },

  // Rate limiting configuration
  rateLimit: {
    windowMs: Number(process.env.RATE_LIMIT_WINDOW || 15 * 60 * 1000), // 15 minutes
    max: Number(process.env.RATE_LIMIT_MAX || 100), // limit each IP to 100 requests per windowMs
    predictionLimit: Number(process.env.PREDICTION_RATE_LIMIT || 10) // predictions per window
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  },

  // Socket.io configuration
  socket: {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  }
};

/**
 * Validate required environment variables
 * @returns {Array} Array of missing required environment variables
 */
function validateConfig() {
  const required = [
    'MONGO_URI',
    'JWT_SECRET'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.warn('⚠️ Missing required environment variables:', missing.join(', '));
  }

  // Warn about missing optional but recommended variables
  const recommended = [
    'HUGGING_FACE_TOKEN',
    'SMTP_USER',
    'SMTP_PASS'
  ];

  const missingRecommended = recommended.filter(key => !process.env[key]);
  if (missingRecommended.length > 0) {
    console.warn('⚠️ Missing recommended environment variables:', missingRecommended.join(', '));
  }

  return missing;
}

/**
 * Check if we're in development mode
 * @returns {boolean} True if in development mode
 */
function isDevelopment() {
  return config.server.nodeEnv === 'development';
}

/**
 * Check if we're in production mode
 * @returns {boolean} True if in production mode
 */
function isProduction() {
  return config.server.nodeEnv === 'production';
}

/**
 * Get database connection string
 * @returns {string} MongoDB connection string
 */
function getDatabaseUrl() {
  return config.database.mongoUri;
}

/**
 * Get server configuration
 * @returns {Object} Server configuration
 */
function getServerConfig() {
  return {
    port: config.server.port,
    host: config.server.host,
    env: config.server.nodeEnv
  };
}

/**
 * Get email configuration for a specific provider
 * @param {string} provider - Email provider ('smtp', 'sendgrid', 'mailgun')
 * @returns {Object} Email provider configuration
 */
function getEmailConfig(provider = 'smtp') {
  return config.email[provider];
}

module.exports = {
  config,
  validateConfig,
  isDevelopment,
  isProduction,
  getDatabaseUrl,
  getServerConfig,
  getEmailConfig
};