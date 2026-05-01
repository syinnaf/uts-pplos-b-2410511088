const express = require('express');
const { pool } = require('../config/db');

const router = express.Router();

router.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');

    return res.status(200).json({
      success: true,
      service: 'booking-service',
      message: 'Booking Service is running',
      database: 'connected',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      service: 'booking-service',
      message: 'Booking Service is running but database is not connected',
      error: error.message,
    });
  }
});

module.exports = router;