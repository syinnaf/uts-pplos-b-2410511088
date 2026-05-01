const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const healthRoutes = require('./routes/healthRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const { testConnection } = require('./config/db');

const app = express();

const PORT = process.env.PORT || 8003;

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/', healthRoutes);
app.use('/', bookingRoutes);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

app.use((error, req, res, next) => {
  console.error(error);

  return res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
  });
});

const startServer = async () => {
  try {
    await testConnection();

    app.listen(PORT, () => {
      console.log(`Booking Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start Booking Service:', error.message);
    process.exit(1);
  }
};

startServer();