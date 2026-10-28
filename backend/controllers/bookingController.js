const Booking = require('../models/Booking');
const Car = require('../models/Car');
const Notification = require('../models/Notification');
const {
  calculatePrice,
  datesOverlap,
  generateBookingId,
} = require('../services/pricingService');
const {
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
  sendStatusUpdateEmail,
} = require('../services/emailService');

const CANCELLATION_WINDOW_HOURS = Number(process.env.CANCELLATION_WINDOW_HOURS) || 24;

// @route POST /api/bookings
// User creates a booking. Price is ALWAYS recalculated server-side.
const createBooking = async (req, res, next) => {
  try {
    const { carId, pickupDate, returnDate, pickupLocation, returnLocation, additionalDriver, discount } = req.body;

    if (!carId || !pickupDate || !returnDate || !pickupLocation || !returnLocation) {
      return res.status(400).json({ success: false, message: 'Missing required booking fields' });
    }

    if (new Date(returnDate) <= new Date(pickupDate)) {
      return res.status(400).json({ success: false, message: 'Return date must be after pickup date' });
    }

    if (new Date(pickupDate) < new Date(new Date().toDateString())) {
      return res.status(400).json({ success: false, message: 'Pickup date cannot be in the past' });
    }

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ success: false, message: 'Car not found' });

    if (['Maintenance', 'Inactive'].includes(car.status)) {
      return res.status(400).json({ success: false, message: `Car is unavailable (${car.status})` });
    }

    // Overlap check against all currently-active bookings for this car
    const existingBookings = await Booking.find({
      carId,
      status: { $in: ['Pending', 'Confirmed', 'Active'] },
    });

    const hasConflict = existingBookings.some((b) =>
      datesOverlap(b.pickupDate, b.returnDate, pickupDate, returnDate)
    );

    if (hasConflict) {
      return res.status(409).json({ success: false, message: 'Car is already booked for the selected dates' });
    }

    // NEVER trust price sent from frontend - always recalculate here
    const pricing = calculatePrice({
      pricePerDay: car.pricePerDay,
      pickupDate,
      returnDate,
      additionalDriver: Boolean(additionalDriver),
      discount: Number(discount) || 0,
    });

    const booking = await Booking.create({
      bookingId: generateBookingId(),
      userId: req.user._id,
      carId,
      pickupDate,
      returnDate,
      pickupLocation,
      returnLocation,
      ...pricing,
      status: 'Pending',
    });

    await Notification.create({
      userId: req.user._id,
      title: 'Booking Placed',
      message: `Your booking ${booking.bookingId} for ${car.brand} ${car.model} is pending confirmation.`,
      type: 'booking',
    });

    sendBookingConfirmationEmail(req.user, booking, car).catch(() => {});

    res.status(201).json({ success: true, message: 'Booking created successfully', booking });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/bookings
// Regular users only see their own bookings; admins/managers see all (or filter by ?userId=)
const getBookings = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'user') {
      filter.userId = req.user._id;
    } else if (req.query.userId) {
      filter.userId = req.query.userId;
    }
    if (req.query.status) filter.status = req.query.status;

    const bookings = await Booking.find(filter)
      .populate('carId', 'brand model year images pricePerDay')
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/bookings/:id
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('carId')
      .populate('userId', 'name email phone drivingLicenseNumber');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Ownership check: users may only access their own bookings
    if (req.user.role === 'user' && String(booking.userId._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this booking' });
    }

    res.json({ success: true, booking });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/bookings/:id
// Admin/Manager updates booking status (Pending -> Confirmed -> Active -> Completed, or Rejected)
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Active', 'Completed', 'Cancelled', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const booking = await Booking.findById(req.params.id).populate('userId');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    booking.status = status;
    await booking.save();

    // Reflect status on the car itself for quick availability visibility
    if (status === 'Active') {
      await Car.findByIdAndUpdate(booking.carId, { status: 'Rented' });
    } else if (['Completed', 'Cancelled', 'Rejected'].includes(status)) {
      const stillActive = await Booking.exists({
        carId: booking.carId,
        status: { $in: ['Pending', 'Confirmed', 'Active'] },
        _id: { $ne: booking._id },
      });
      if (!stillActive) {
        await Car.findByIdAndUpdate(booking.carId, { status: 'Available' });
      }
    }

    await Notification.create({
      userId: booking.userId._id,
      title: 'Booking Status Updated',
      message: `Your booking ${booking.bookingId} status changed to ${status}.`,
      type: 'status',
    });

    sendStatusUpdateEmail(booking.userId, booking).catch(() => {});

    res.json({ success: true, message: 'Booking status updated', booking });
  } catch (err) {
    next(err);
  }
};

// @route DELETE /api/bookings/:id
// Users cancel their own eligible bookings; admins can cancel any booking
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('userId');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    if (req.user.role === 'user') {
      if (String(booking.userId._id) !== String(req.user._id)) {
        return res.status(403).json({ success: false, message: 'You cannot cancel another user\'s booking' });
      }
      if (['Completed', 'Cancelled', 'Rejected'].includes(booking.status)) {
        return res.status(400).json({ success: false, message: `Booking already ${booking.status}` });
      }
      const hoursUntilPickup = (new Date(booking.pickupDate) - new Date()) / (1000 * 60 * 60);
      if (hoursUntilPickup < CANCELLATION_WINDOW_HOURS) {
        return res.status(400).json({
          success: false,
          message: `Cancellations must be made at least ${CANCELLATION_WINDOW_HOURS} hours before pickup`,
        });
      }
    }

    booking.status = 'Cancelled';
    booking.cancellationReason = req.body.reason || 'Cancelled by user';
    await booking.save();

    const stillActive = await Booking.exists({
      carId: booking.carId,
      status: { $in: ['Pending', 'Confirmed', 'Active'] },
      _id: { $ne: booking._id },
    });
    if (!stillActive) {
      await Car.findByIdAndUpdate(booking.carId, { status: 'Available' });
    }

    await Notification.create({
      userId: booking.userId._id,
      title: 'Booking Cancelled',
      message: `Your booking ${booking.bookingId} has been cancelled.`,
      type: 'cancellation',
    });

    sendBookingCancellationEmail(booking.userId, booking).catch(() => {});

    res.json({ success: true, message: 'Booking cancelled successfully', booking });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
};
