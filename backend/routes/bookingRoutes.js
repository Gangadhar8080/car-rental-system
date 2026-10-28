const express = require('express');
const { body } = require('express-validator');
const {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect); // every booking route requires auth

router.post(
  '/',
  [
    body('carId').notEmpty().withMessage('carId is required'),
    body('pickupDate').isISO8601().withMessage('A valid pickupDate is required'),
    body('returnDate').isISO8601().withMessage('A valid returnDate is required'),
    body('pickupLocation').trim().notEmpty(),
    body('returnLocation').trim().notEmpty(),
  ],
  validate,
  createBooking
);

router.get('/', getBookings);
router.get('/:id', getBookingById);
router.put('/:id', authorize('admin', 'manager'), updateBookingStatus);
router.delete('/:id', cancelBooking); // ownership/cancellation-window checked in controller

module.exports = router;
