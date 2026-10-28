const express = require('express');
const { body } = require('express-validator');
const {
  getCars,
  getCarById,
  checkAvailability,
  createCar,
  updateCar,
  deleteCar,
  updateCarStatus,
} = require('../controllers/carController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const validate = require('../middleware/validate');

const router = express.Router();

const carValidation = [
  body('brand').trim().notEmpty().withMessage('Brand is required'),
  body('model').trim().notEmpty().withMessage('Model is required'),
  body('year').isInt({ min: 1990 }).withMessage('A valid year is required'),
  body('pricePerDay').isFloat({ min: 0 }).withMessage('Price per day must be a positive number'),
  body('fuelType').isIn(['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG']),
  body('transmission').isIn(['Automatic', 'Manual']),
  body('seats').isInt({ min: 1, max: 20 }),
  body('location').trim().notEmpty().withMessage('Location is required'),
];

// Public routes
router.get('/', getCars);
router.get('/:id', getCarById);
router.get('/:id/availability', checkAvailability);

// Admin-only routes
router.post('/', protect, authorize('admin'), carValidation, validate, createCar);
router.put('/:id', protect, authorize('admin'), updateCar);
router.delete('/:id', protect, authorize('admin'), deleteCar);

// Admin + Manager can update vehicle status/availability
router.put('/:id/status', protect, authorize('admin', 'manager'), updateCarStatus);

module.exports = router;
