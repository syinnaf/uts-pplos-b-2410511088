const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:8001';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

const publicPaths = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/google/redirect',
  '/api/auth/google/callback',

  '/register',
  '/login',
  '/refresh',
  '/google/redirect',
  '/google/callback',
];

const isPublicPath = (req) => {
  const originalPath = req.originalUrl.split('?')[0];
  const mountedPath = req.path.split('?')[0];

  return publicPaths.some((publicPath) => {
    return originalPath === publicPath || mountedPath === publicPath;
  });
};

const verifyTokenWithAuthService = async (token) => {
  const response = await axios.post(
    `${AUTH_SERVICE_URL}/api/internal/tokens/verify`,
    {},
    {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
      },
      timeout: 5000,
    }
  );

  return response.data.data;
};

const verifyJwt = async (req, res, next) => {
  if (isPublicPath(req)) {
    return next();
  }

  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authorization token is required',
    });
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const authVerification = await verifyTokenWithAuthService(token);
    const user = authVerification.user;

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role?.name || payload.role || null,
      jti: payload.jti,
    };

    req.headers['x-user-id'] = String(user.id);
    req.headers['x-user-email'] = user.email || '';
    req.headers['x-user-role'] = user.role?.name || payload.role || '';

    return next();
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Invalid or expired token';

    return res.status(401).json({
      success: false,
      message,
    });
  }
};

module.exports = {
  verifyJwt,
};