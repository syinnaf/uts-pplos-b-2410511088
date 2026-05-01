const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
require('dotenv').config();

const createServiceProxy = (target, rewritePath) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: rewritePath,
    on: {
      proxyReq: fixRequestBody,
      error: (err, req, res) => {
        console.error('Proxy error:', err.message);

        if (!res.headersSent) {
          res.status(502).json({
            success: false,
            message: 'Target service is unavailable',
          });
        }
      },
    },
  });
};

const authProxy = createServiceProxy(
  process.env.AUTH_SERVICE_URL,
  (path) => `/api/auth${path}`
);

const fieldProxy = createServiceProxy(
  process.env.FIELD_SERVICE_URL,
  (path) => `/fields${path}`
);

const bookingProxy = createServiceProxy(
  process.env.BOOKING_SERVICE_URL,
  (path) => `/bookings${path}`
);

const ownerProxy = createServiceProxy(
  process.env.BOOKING_SERVICE_URL,
  (path) => `/owner${path}`
);

module.exports = {
  authProxy,
  fieldProxy,
  bookingProxy,
  ownerProxy,
};