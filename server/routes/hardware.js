const express = require('express');
const router = express.Router();

// @route   POST /api/hardware/telemetry
// @desc    Ingest telemetry data from ESP32 crop recommendation hardware
// @access  Public (Should ideally be secured with a device token in production)
router.post('/telemetry', async (req, res) => {
  try {
    const { temperature, humidity, soilMoisture, phRaw, waterLevelRaw, n, p, k } = req.body;

    console.log('Received hardware telemetry payload:', req.body);

    // Basic validation
    if (temperature === undefined || humidity === undefined || soilMoisture === undefined) {
      return res.status(400).json({ error: 'Missing critical sensor data' });
    }

    // Here, you would typically:
    // 1. Identify which field/user this hardware belongs to (e.g. via a device ID in the payload).
    // 2. Store the telemetry data in MongoDB (e.g., in a SensorData or Telemetry collection).
    // 3. Trigger the ML service to provide crop recommendations if needed.

    // For now, we'll just log it and return success
    return res.status(200).json({
      success: true,
      message: 'Telemetry data ingested successfully',
      receivedData: req.body
    });

  } catch (error) {
    console.error('Error ingesting telemetry data:', error);
    res.status(500).json({ error: 'Server error while processing hardware data' });
  }
});

module.exports = router;
