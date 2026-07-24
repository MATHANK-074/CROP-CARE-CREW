/**
 * Logger Utility
 * Centralized logging system with environment-based log level control
 */

const { isDevelopment } = require('../config');

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Get log level from environment variable
const getLogLevel = () => {
  const envLevel = process.env.LOG_LEVEL ? process.env.LOG_LEVEL.toUpperCase() : 'INFO';
  return LOG_LEVELS[envLevel] !== undefined ? LOG_LEVELS[envLevel] : LOG_LEVELS.INFO;
};

// Check if specific logging is disabled
const isAuthLogsDisabled = () => process.env.DISABLE_AUTH_LOGS === 'true';
const isSocketLogsDisabled = () => process.env.DISABLE_SOCKET_LOGS === 'true';

// Color codes for console output
const COLORS = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  reset: '\x1b[0m'
};

// Emoji prefixes for different log types
const EMOJIS = {
  error: '❌',
  warn: '⚠️',
  info: 'ℹ️',
  success: '✅',
  debug: '🐛',
  api: '🌐',
  database: '💾',
  email: '📧',
  file: '📁',
  auth: '🔐',
  disease: '🦠',
  crop: '🌾',
  task: '📋',
  weather: '🌤️'
};

class Logger {
  constructor() {
    this.level = isDevelopment() ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;
  }

  /**
   * Format timestamp
   * @returns {string} Formatted timestamp
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Format log message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {string} emoji - Emoji prefix
   * @param {string} color - Color code
   * @returns {string} Formatted message
   */
  formatMessage(level, message, emoji = '', color = COLORS.white) {
    const timestamp = this.getTimestamp();
    const prefix = emoji ? `${emoji} ` : '';

    if (isDevelopment()) {
      return `${color}[${timestamp}] ${level.padEnd(5)} ${prefix}${message}${COLORS.reset}`;
    }

    return `[${timestamp}] ${level.padEnd(5)} ${prefix}${message}`;
  }

  /**
   * Log error message
   * @param {string} message - Error message
   * @param {Error|Object} error - Error object or additional data
   */
  error(message, error = null) {
    if (this.level >= LOG_LEVELS.ERROR) {
      const formattedMessage = this.formatMessage('ERROR', message, EMOJIS.error, COLORS.red);
      console.error(formattedMessage);

      if (error) {
        if (error instanceof Error) {
          console.error(`${COLORS.red}Stack:${COLORS.reset}`, error.stack);
        } else {
          console.error(`${COLORS.red}Details:${COLORS.reset}`, error);
        }
      }
    }
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {*} data - Additional data
   */
  warn(message, data = null) {
    if (this.level >= LOG_LEVELS.WARN) {
      const formattedMessage = this.formatMessage('WARN', message, EMOJIS.warn, COLORS.yellow);
      console.warn(formattedMessage);

      if (data && isDevelopment()) {
        console.warn(`${COLORS.yellow}Data:${COLORS.reset}`, data);
      }
    }
  }

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {*} data - Additional data
   */
  info(message, data = null) {
    if (this.level >= LOG_LEVELS.INFO) {
      const formattedMessage = this.formatMessage('INFO', message, EMOJIS.info, COLORS.blue);
      console.log(formattedMessage);

      if (data && isDevelopment()) {
        console.log(`${COLORS.blue}Data:${COLORS.reset}`, data);
      }
    }
  }

  /**
   * Log success message
   * @param {string} message - Success message
   * @param {*} data - Additional data
   */
  success(message, data = null) {
    if (this.level >= LOG_LEVELS.INFO) {
      const formattedMessage = this.formatMessage('INFO', message, EMOJIS.success, COLORS.green);
      console.log(formattedMessage);

      if (data && isDevelopment()) {
        console.log(`${COLORS.green}Data:${COLORS.reset}`, data);
      }
    }
  }

  /**
   * Log debug message
   * @param {string} message - Debug message
   * @param {*} data - Additional data
   */
  debug(message, data = null) {
    if (this.level >= LOG_LEVELS.DEBUG) {
      const formattedMessage = this.formatMessage('DEBUG', message, EMOJIS.debug, COLORS.gray);
      console.log(formattedMessage);

      if (data) {
        console.log(`${COLORS.gray}Data:${COLORS.reset}`, data);
      }
    }
  }

  /**
   * Log API-related message
   * @param {string} message - API message
   * @param {*} data - Additional data
   */
  api(message, data = null) {
    const formattedMessage = this.formatMessage('API', message, EMOJIS.api, COLORS.cyan);
    console.log(formattedMessage);

    if (data && isDevelopment()) {
      console.log(`${COLORS.cyan}Data:${COLORS.reset}`, data);
    }
  }

  /**
   * Log database-related message
   * @param {string} message - Database message
   * @param {*} data - Additional data
   */
  database(message, data = null) {
    const formattedMessage = this.formatMessage('DB', message, EMOJIS.database, COLORS.magenta);
    console.log(formattedMessage);

    if (data && isDevelopment()) {
      console.log(`${COLORS.magenta}Data:${COLORS.reset}`, data);
    }
  }

  /**
   * Log email-related message
   * @param {string} message - Email message
   * @param {*} data - Additional data
   */
  email(message, data = null) {
    const formattedMessage = this.formatMessage('EMAIL', message, EMOJIS.email, COLORS.blue);
    console.log(formattedMessage);

    if (data && isDevelopment()) {
      console.log(`${COLORS.blue}Data:${COLORS.reset}`, data);
    }
  }

  /**
   * Log file operation message
   * @param {string} message - File message
   * @param {*} data - Additional data
   */
  file(message, data = null) {
    const formattedMessage = this.formatMessage('FILE', message, EMOJIS.file, COLORS.yellow);
    console.log(formattedMessage);

    if (data && isDevelopment()) {
      console.log(`${COLORS.yellow}Data:${COLORS.reset}`, data);
    }
  }

  /**
   * Log authentication-related message (respects DISABLE_AUTH_LOGS)
   * @param {string} message - Auth message
   * @param {*} data - Additional data
   */
  auth(message, data = null) {
    if (!isAuthLogsDisabled() && this.level >= LOG_LEVELS.DEBUG) {
      const formattedMessage = this.formatMessage('AUTH', message, EMOJIS.auth, COLORS.green);
      console.log(formattedMessage);

      if (data && isDevelopment()) {
        console.log(`${COLORS.green}Data:${COLORS.reset}`, data);
      }
    }
  }

  /**
   * Log socket-related message (respects DISABLE_SOCKET_LOGS)
   * @param {string} message - Socket message
   * @param {*} data - Additional data
   */
  socket(message, data = null) {
    if (!isSocketLogsDisabled() && this.level >= LOG_LEVELS.INFO) {
      const formattedMessage = this.formatMessage('SOCKET', message, EMOJIS.socket, COLORS.cyan);
      console.log(formattedMessage);

      if (data && isDevelopment()) {
        console.log(`${COLORS.cyan}Data:${COLORS.reset}`, data);
      }
    }
  }

  /**
   * Log disease-related message
   * @param {string} message - Disease message
   * @param {*} data - Additional data
   */
  disease(message, data = null) {
    const formattedMessage = this.formatMessage('DISEASE', message, EMOJIS.disease, COLORS.red);
    console.log(formattedMessage);

    if (data && isDevelopment()) {
      console.log(`${COLORS.red}Data:${COLORS.reset}`, data);
    }
  }

  /**
   * Create a child logger with context
   * @param {string} context - Logger context
   * @returns {Object} Child logger with context
   */
  child(context) {
    const self = this;
    return {
      error: (message, error) => self.error(`[${context}] ${message}`, error),
      warn: (message, data) => self.warn(`[${context}] ${message}`, data),
      info: (message, data) => self.info(`[${context}] ${message}`, data),
      success: (message, data) => self.success(`[${context}] ${message}`, data),
      debug: (message, data) => self.debug(`[${context}] ${message}`, data),
      api: (message, data) => self.api(`[${context}] ${message}`, data),
      database: (message, data) => self.database(`[${context}] ${message}`, data),
      email: (message, data) => self.email(`[${context}] ${message}`, data),
      file: (message, data) => self.file(`[${context}] ${message}`, data),
      auth: (message, data) => self.auth(`[${context}] ${message}`, data),
      socket: (message, data) => self.socket(`[${context}] ${message}`, data),
      disease: (message, data) => self.disease(`[${context}] ${message}`, data)
    };
  }
}

// Create singleton logger instance
const logger = new Logger();

module.exports = logger;