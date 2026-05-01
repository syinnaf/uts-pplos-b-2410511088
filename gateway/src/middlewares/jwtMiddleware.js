const jwt = require('jsonwebtoken');
require('dotenv').config();

const publicPaths = [
  '/api/auth/register',
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/google/redirect',
  '/api/auth/google/callback',
];

const isPublicPath = (path) => {
  return publicPaths.some((publicPath) => path.startsWith(publicPath));
};

const verifyJwt = (req, res, next) => {
  if (isPublicPath(req.path)) {
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

    req.user = {
      id: payload.sub,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      jti: payload.jti,
    };

    req.headers['x-user-id'] = String(payload.sub);
    req.headers['x-user-email'] = payload.email || '';
    req.headers['x-user-role'] = payload.role || '';

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }
};

module.exports = {
  verifyJwt,
};