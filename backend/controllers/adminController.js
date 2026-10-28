const User = require('../models/User');
const Car = require('../models/Car');
const Booking = require('../models/Booking');

// @route GET /api/admin/dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    const [totalCars, totalUsers, totalBookings, activeRentals, availableCars] = await Promise.all([
      Car.countDocuments(),
      User.countDocuments({ role: 'user' }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'Active' }),
      Car.countDocuments({ status: 'Available' }),
    ]);

    const revenueAgg = await Booking.aggregate([
      { $match: { status: { $in: ['Confirmed', 'Active', 'Completed'] } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // Monthly bookings & revenue for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const monthlyStats = await Booking.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          bookings: { $sum: 1 },
          revenue: { $sum: '$totalAmount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const bookingStatusBreakdown = await Booking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const mostRentedCars = await Booking.aggregate([
      { $group: { _id: '$carId', bookingCount: { $sum: 1 } } },
      { $sort: { bookingCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'cars', localField: '_id', foreignField: '_id', as: 'car' } },
      { $unwind: '$car' },
      { $project: { bookingCount: 1, 'car.brand': 1, 'car.model': 1, 'car.images': 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        totalCars,
        totalUsers,
        totalBookings,
        activeRentals,
        availableCars,
        totalRevenue,
      },
      charts: {
        monthlyStats,
        bookingStatusBreakdown,
        mostRentedCars,
      },
    });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/admin/users
const getUsers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    const users = await User.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/admin/users/:id
const updateUser = async (req, res, next) => {
  try {
    const allowedFields = ['role', 'isActive', 'name', 'phone'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: 'User updated', user });
  } catch (err) {
    next(err);
  }
};

// @route DELETE /api/admin/users/:id
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/admin/bookings
const getAllBookings = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const bookings = await Booking.find(filter)
      .populate('carId', 'brand model images')
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: bookings.length, bookings });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/admin/revenue
const getRevenueReport = async (req, res, next) => {
  try {
    const revenueByStatus = await Booking.aggregate([
      { $group: { _id: '$status', total: { $sum: '$totalAmount' }, count: { $sum: 1 } } },
    ]);

    const revenueByMonth = await Booking.aggregate([
      { $match: { status: { $in: ['Confirmed', 'Active', 'Completed'] } } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total: { $sum: '$totalAmount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    res.json({ success: true, revenueByStatus, revenueByMonth });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  updateUser,
  deleteUser,
  getAllBookings,
  getRevenueReport,
};
