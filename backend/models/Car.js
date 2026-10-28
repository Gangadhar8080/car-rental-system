const mongoose = require('mongoose');

const carSchema = new mongoose.Schema(
  {
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true, min: 1990, max: new Date().getFullYear() + 1 },
    pricePerDay: { type: Number, required: true, min: 0 },
    fuelType: {
      type: String,
      enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'],
      required: true,
    },
    transmission: { type: String, enum: ['Automatic', 'Manual'], required: true },
    seats: { type: Number, required: true, min: 1, max: 20 },
    mileage: { type: String, default: '' }, // e.g. "18 km/l"
    location: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    features: [{ type: String }],
    images: [{ type: String }], // URLs / paths
    status: {
      type: String,
      enum: ['Available', 'Booked', 'Rented', 'Maintenance', 'Inactive'],
      default: 'Available',
    },
    ratingsAverage: { type: Number, default: 4.5, min: 0, max: 5 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

carSchema.index({ brand: 1, model: 1, pricePerDay: 1, status: 1 });

module.exports = mongoose.model('Car', carSchema);
