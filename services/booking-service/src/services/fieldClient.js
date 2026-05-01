const axios = require('axios');
require('dotenv').config();

const FIELD_SERVICE_URL = process.env.FIELD_SERVICE_URL || 'http://127.0.0.1:8002';
const INTERNAL_SERVICE_TOKEN = process.env.INTERNAL_SERVICE_TOKEN;

const getFieldById = async (courtId) => {
  try {
    const response = await axios.get(`${FIELD_SERVICE_URL}/fields/${courtId}`, {
      headers: {
        Accept: 'application/json',
      },
    });

    return response.data.data;
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Failed to fetch field from Field Service';

    const customError = new Error(message);
    customError.status = status;
    throw customError;
  }
};

const getSlotsByDate = async (courtId, bookingDate) => {
  try {
    const response = await axios.get(`${FIELD_SERVICE_URL}/fields/${courtId}/slots`, {
      params: {
        date: bookingDate,
      },
      headers: {
        Accept: 'application/json',
      },
    });

    return response.data.data;
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Failed to fetch slots from Field Service';

    const customError = new Error(message);
    customError.status = status;
    throw customError;
  }
};

const updateSlotStatus = async (courtId, slotId, status) => {
  try {
    const response = await axios.patch(
      `${FIELD_SERVICE_URL}/fields/${courtId}/slots/${slotId}/status`,
      { status },
      {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-Internal-Token': INTERNAL_SERVICE_TOKEN,
        },
      }
    );

    return response.data.data;
  } catch (error) {
    const responseStatus = error.response?.status || 500;
    const message = error.response?.data?.message || 'Failed to update slot status in Field Service';

    const customError = new Error(message);
    customError.status = responseStatus;
    throw customError;
  }
};

module.exports = {
  getFieldById,
  getSlotsByDate,
  updateSlotStatus,
};