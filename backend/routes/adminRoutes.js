const express = require('express');
const {
  getDashboardStats,
  getUsers,
  updateUser,
  deleteUser,
  getAllBookings,
  getRevenueReport,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/dashboard', getDashboardStats);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/bookings', getAllBookings);
router.get('/revenue', getRevenueReport);

module.exports = router;
