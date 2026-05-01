const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { verifyJwt } = require('./middlewares/jwtMiddleware');
const {
  authProxy,
  fieldProxy,
  bookingProxy,
  ownerProxy,
} = require('./routes/proxyRoutes');

const app = express();

const PORT = process.env.PORT || 8000;

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 60000),
  max: Number(process.env.RATE_LIMIT_MAX || 60),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
});

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(limiter);

app.get('/health', (req, res) => {
  return res.status(200).json({
    success: true,
    service: 'api-gateway',
    message: 'API Gateway is running',
    routes: {
      auth: '/api/auth/*',
      fields: '/api/fields/*',
      bookings: '/api/bookings/*',
      owner: '/api/owner/*',
    },
  });
});

app.use('/api/auth', verifyJwt, authProxy);

app.use('/api/fields', verifyJwt, fieldProxy);
app.use('/api/bookings', verifyJwt, bookingProxy);
app.use('/api/owner', verifyJwt, ownerProxy);

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Gateway route not found',
  });
});

app.use((error, req, res, next) => {
  console.error(error);

  return res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal gateway error',
  });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});