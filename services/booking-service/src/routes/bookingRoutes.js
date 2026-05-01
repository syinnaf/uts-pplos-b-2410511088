const express = require('express');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

router.post('/bookings', bookingController.createBooking);
router.get('/bookings', bookingController.listBookings);
router.get('/bookings/:id', bookingController.getBookingById);
router.patch('/bookings/:id/cancel', bookingController.cancelBooking);
router.post('/bookings/:id/dp', bookingController.payDownPayment);
router.post('/bookings/:id/pay-full', bookingController.payFullPayment);

router.get('/owner/dashboard', bookingController.getOwnerDashboard);

module.exports = router;