require('dotenv').config();

const verifyInternalToken = (req, res, next) => {
  const token = req.header('X-Internal-Token');

  if (!token || token !== process.env.INTERNAL_SERVICE_TOKEN) {
    return res.status(403).json({
      success: false,
      message: 'Invalid internal service token',
    });
  }

  return next();
};

module.exports = {
  verifyInternalToken,
};