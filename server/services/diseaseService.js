/**
 * Disease Service Module
 * Centralized service for disease-related operations
 * Handles disease reporting, prediction, alerts, and notifications
 */

const mongoose = require('mongoose');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const DiseaseAlert = require('../models/disease');
const User = require('../models/User');
const { sendMail } = require('../utils/email/mailer-enhanced');
const { createDiseaseAlertEmail } = require('./emailTemplates');
const { config } = require('../config');
const logger = require('../utils/logger').child('DiseaseService');

/**
 * Report a disease in a specific location and notify nearby users
 * @param {Object} params - Disease report parameters
 * @param {string} params.disease - Disease name
 * @param {string} params.description - Disease description
 * @param {Object} params.location - GeoJSON location object
 * @param {Object} params.bilingualData - Bilingual disease information
 * @param {Object} params.io - Socket.io instance for real-time notifications
 * @returns {Object} Report result with notification count and alert IDs
 */
async function reportDisease({ disease, description, location, bilingualData, io }) {
  logger.disease(`Disease report received: ${disease}`, { location: location.coordinates });

  // Find users within configured radius
  const searchRadius = config.disease.alertRadius;
  const usersNearby = await User.find({
    location: {
      $near: {
        $geometry: location,
        $maxDistance: searchRadius
      }
    }
  });

  logger.info(`Found ${usersNearby.length} users within ${searchRadius / 1000}km`);

  // Create alerts and send notifications
  const alerts = [];
  for (const user of usersNearby) {
    const alertData = {
      user: user._id,
      disease,
      description,
      location
    };

    // Add bilingual data if available
    if (bilingualData && bilingualData.english && bilingualData.tamil) {
      alertData.bilingualData = bilingualData;
    }

    // Create alert in database
    const alert = await DiseaseAlert.create(alertData);
    alerts.push(alert._id);

    // Send real-time notification via Socket.io
    if (io) {
      io.to(`user-${user._id}`).emit('new-disease-alert', {
        alert: alert,
        message: `New disease alert: ${disease} detected in your area`
      });
    }

    // Send email notification (non-blocking)
    if (user.email && config.disease.emailNotifications) {
      sendDiseaseAlertEmail({
        user,
        disease,
        description,
        location,
        bilingualData
      }).catch(error => {
        logger.error(`Failed to send email to ${user.email}`, error);
      });
    }
  }

  return {
    success: true,
    notified: usersNearby.length,
    alerts,
    message: `Disease reported successfully. ${usersNearby.length} users notified.`
  };
}

/**
 * Send disease alert email to a user
 * @param {Object} params - Email parameters
 */
async function sendDiseaseAlertEmail({ user, disease, description, location, bilingualData }) {
  logger.email(`Sending disease alert email to: ${user.email}`);

  const emailContent = createDiseaseAlertEmail({
    user,
    disease,
    description,
    location,
    bilingualData
  });

  await sendMail({
    to: user.email,
    subject: emailContent.subject,
    text: emailContent.text,
    html: emailContent.html
  });
}

/**
 * Predict plant disease from image using external AI service
 * @param {Buffer} imageBuffer - Image data buffer
 * @returns {Array} Array of disease predictions with confidence scores
 */
async function predictDisease(imageBuffer) {
  const base64Image = imageBuffer.toString('base64');

  logger.api('Calling Hugging Face API for disease prediction');

  const response = await fetch(config.apis.huggingFace.modelUrl, {
    headers: {
      Authorization: `Bearer ${config.apis.huggingFace.token}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify({ inputs: base64Image }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    logger.error('Hugging Face API error', errorData);
    throw new Error(`Disease prediction failed: ${errorData}`);
  }

  const result = await response.json();
  logger.success('Disease prediction completed successfully');

  // Ensure consistent response format
  const predictions = Array.isArray(result) ? result : [result];

  // Sort by confidence score (descending)
  return predictions
    .map(pred => ({
      label: pred.label || pred.class_name || "Unknown",
      score: pred.score || pred.confidence || 0
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * Get disease alerts for a specific user
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of alerts to return
 * @returns {Array} Array of disease alerts
 */
async function getUserAlerts(userId, limit = 20) {
  logger.debug(`Fetching alerts for user: ${userId}`);

  const alerts = await DiseaseAlert.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  logger.info(`Found ${alerts.length} alerts for user`);
  return alerts;
}

/**
 * Mark all unread alerts as read for a user
 * @param {string} userId - User ID
 * @returns {number} Number of alerts marked as read
 */
async function markAlertsAsRead(userId) {
  logger.debug(`Marking alerts as read for user: ${userId}`);

  const result = await DiseaseAlert.updateMany(
    { user: userId, read: { $ne: true } },
    { $set: { read: true, readAt: new Date() } }
  );

  logger.info(`Marked ${result.modifiedCount} alerts as read`);
  return result.modifiedCount;
}

/**
 * Get alert summary for a user within a specified period
 * @param {string} userId - User ID
 * @param {number} days - Number of days to look back
 * @returns {Object} Alert summary with counts and latest dates
 */
async function getAlertSummary(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const alerts = await DiseaseAlert.find({
    user: userId,
    createdAt: { $gte: startDate }
  }).sort({ createdAt: -1 });

  const summary = {};
  alerts.forEach(alert => {
    const disease = alert.disease;
    if (!summary[disease]) {
      summary[disease] = {
        count: 0,
        latestDate: alert.createdAt
      };
    }
    summary[disease].count++;
    if (alert.createdAt > summary[disease].latestDate) {
      summary[disease].latestDate = alert.createdAt;
    }
  });

  return {
    alerts: alerts.length,
    summary,
    period: days
  };
}

module.exports = {
  reportDisease,
  predictDisease,
  getUserAlerts,
  markAlertsAsRead,
  getAlertSummary,
  sendDiseaseAlertEmail
};
