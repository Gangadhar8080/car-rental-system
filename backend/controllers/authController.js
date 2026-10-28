const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendWelcomeEmail } = require('../services/emailService');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// @route POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, confirmPassword, drivingLicenseNumber } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      drivingLicenseNumber,
      role: 'user', // role is never taken from client input for security
    });

    const token = signToken(user._id);

    sendWelcomeEmail(user).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated' });
    }

    const token = signToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user,
    });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/auth/profile
const getProfile = async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'phone', 'drivingLicenseNumber'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, message: 'Profile updated', user });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getProfile, updateProfile, changePassword };
