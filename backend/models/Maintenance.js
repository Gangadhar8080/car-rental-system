const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema(
  {
    carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
    maintenanceType: {
      type: String,
      enum: ['Service', 'Repair', 'Cleaning', 'Inspection', 'Other'],
      required: true,
    },
    description: { type: String, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    cost: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['Scheduled', 'InProgress', 'Completed', 'Cancelled'],
      default: 'Scheduled',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Maintenance', maintenanceSchema);
