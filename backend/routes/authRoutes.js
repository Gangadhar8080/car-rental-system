const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('phone').matches(/^\+?[0-9]{10,15}$/).withMessage('A valid phone number is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('confirmPassword').notEmpty().withMessage('Please confirm your password'),
    body('drivingLicenseNumber').trim().notEmpty().withMessage('Driving license number is required'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  changePassword
);

module.exports = router;
