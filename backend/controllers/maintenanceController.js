const Maintenance = require('../models/Maintenance');
const Car = require('../models/Car');

// @route GET /api/maintenance
const getMaintenanceRecords = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.carId) filter.carId = req.query.carId;
    if (req.query.status) filter.status = req.query.status;

    const records = await Maintenance.find(filter).populate('carId', 'brand model year').sort({ startDate: -1 });
    res.json({ success: true, count: records.length, records });
  } catch (err) {
    next(err);
  }
};

// @route POST /api/maintenance (Admin/Manager)
const createMaintenanceRecord = async (req, res, next) => {
  try {
    const { carId, maintenanceType, description, startDate, endDate, cost } = req.body;

    const car = await Car.findById(carId);
    if (!car) return res.status(404).json({ success: false, message: 'Car not found' });

    const record = await Maintenance.create({
      carId,
      maintenanceType,
      description,
      startDate,
      endDate,
      cost,
      createdBy: req.user._id,
    });

    // A car under maintenance must not appear as available for booking
    car.status = 'Maintenance';
    await car.save();

    res.status(201).json({ success: true, message: 'Maintenance record created', record });
  } catch (err) {
    next(err);
  }
};

// @route PUT /api/maintenance/:id (Admin/Manager)
const updateMaintenanceRecord = async (req, res, next) => {
  try {
    const record = await Maintenance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!record) return res.status(404).json({ success: false, message: 'Maintenance record not found' });

    if (record.status === 'Completed') {
      await Car.findByIdAndUpdate(record.carId, { status: 'Available' });
    }

    res.json({ success: true, message: 'Maintenance record updated', record });
  } catch (err) {
    next(err);
  }
};

// @route DELETE /api/maintenance/:id (Admin/Manager)
const deleteMaintenanceRecord = async (req, res, next) => {
  try {
    const record = await Maintenance.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Maintenance record not found' });
    res.json({ success: true, message: 'Maintenance record deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMaintenanceRecords,
  createMaintenanceRecord,
  updateMaintenanceRecord,
  deleteMaintenanceRecord,
};
