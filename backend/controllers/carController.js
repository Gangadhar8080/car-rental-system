const Car = require('../models/Car');
const Booking = require('../models/Booking');
const { datesOverlap } = require('../services/pricingService');

// @route GET /api/cars
// Supports: brand, model, fuelType, transmission, seats, location,
// minPrice, maxPrice, availability, sort, page, limit, q (text search)
const getCars = async (req, res, next) => {
  try {
    const {
      brand,
      model,
      fuelType,
      transmission,
      seats,
      location,
      minPrice,
      maxPrice,
      status,
      q,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const filter = {};

    if (brand) filter.brand = new RegExp(brand, 'i');
    if (model) filter.model = new RegExp(model, 'i');
    if (fuelType) filter.fuelType = fuelType;
    if (transmission) filter.transmission = transmission;
    if (seats) filter.seats = { $gte: Number(seats) };
    if (location) filter.location = new RegExp(location, 'i');
    if (status) filter.status = status;
    else filter.status = { $ne: 'Inactive' }; // hide inactive cars from public listing by default

    if (minPrice || maxPrice) {
      filter.pricePerDay = {};
      if (minPrice) filter.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) filter.pricePerDay.$lte = Number(maxPrice);
    }

    if (q) {
      filter.$or = [{ brand: new RegExp(q, 'i') }, { model: new RegExp(q, 'i') }, { description: new RegExp(q, 'i') }];
    }

    let sortOption = { createdAt: -1 }; // Newest first (default)
    if (sort === 'price_asc') sortOption = { pricePerDay: 1 };
    if (sort === 'price_desc') sortOption = { pricePerDay: -1 };
    if (sort === 'newest') sortOption = { createdAt: -1 };

    const pageNum = Math.max(Number(page), 1);
    const limitNum = Math.min(Number(limit), 50);
    const skip = (pageNum - 1) * limitNum;

    const [cars, total] = await Promise.all([
      Car.find(filter).sort(sortOption).skip(skip).limit(limitNum),
      Car.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: cars.length,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      cars,
    });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/cars/:id
const getCarById = async (req, res, next) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ success: false, message: 'Car not found' });
    res.json({ success: true, car });
  } catch (err) {
    next(err);
  }
};

// @route GET /api/cars/:id/availability?pickupDate=&returnDate=
const checkAvailability = async (req, res, next) => {
  try {
    const { pickupDate, returnDate } = req.query;
    if (!pickupDate || !returnDate) {
      return res.status(400).json({ success: false, message: 'pickupDate and returnDate are required' });
    }

    const car = await Car.findById(req.params.id);
    if (!car) return res.status(404).json({ success: false, message: 'Car not found' });

    if (['Maintenance', 'Inactive'].includes(car.status)) {
      return res.json({ success: true, available: false, reason: `Car is currently under ${car.status}` });
    }

    const conflictingBookings = await Booking.find({
      carId: car._id,
      status: { $in: ['Pending', 'Confirmed', 'Active'] },
    });

    const conflict = conflictingBookings.some((b) =>
      datesOverlap(b.pickupDate, b.returnDate, pickupDate, returnDate)
    );

    res.json({
      success: true,
      available: !conflict,
      reason: conflict ? 'Car is already booked for the selected dates' : null,
    });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/cars (Admin only)
const createCar = async (req, res, next) => {
  try {
    const car = await Car.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, message: 'Car added successfully', car });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/cars/:id (Admin only)
const updateCar = async (req, res, next) => {
  try {
    const car = await Car.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!car) return res.status(404).json({ success: false, message: 'Car not found' });
    res.json({ success: true, message: 'Car updated successfully', car });
  } catch (err) {
    next(err);
  }
};

// @route DELETE /api/cars/:id (Admin only)
const deleteCar = async (req, res, next) => {
  try {
    const car = await Car.findByIdAndDelete(req.params.id);
    if (!car) return res.status(404).json({ success: false, message: 'Car not found' });
    res.json({ success: true, message: 'Car deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/cars/:id/status (Admin/Manager)
const updateCarStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Available', 'Booked', 'Rented', 'Maintenance', 'Inactive'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }
    const car = await Car.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!car) return res.status(404).json({ success: false, message: 'Car not found' });
    res.json({ success: true, message: 'Car status updated', car });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCars,
  getCarById,
  checkAvailability,
  createCar,
  updateCar,
  deleteCar,
  updateCarStatus,
};
