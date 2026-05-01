const axios = require('axios');
require('dotenv').config();

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://127.0.0.1:8001/api';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

const getUserById = async (userId) => {
  try {
    const response = await axios.get(`${AUTH_SERVICE_URL}/internal/users/${userId}`, {
      headers: {
        'Accept': 'application/json',
        'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
      },
    });

    return response.data.data.user;
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Failed to fetch user from Auth Service';

    const customError = new Error(message);
    customError.status = status;
    throw customError;
  }
};

module.exports = {
  getUserById,
};