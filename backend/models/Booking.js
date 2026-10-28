const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },

    pickupDate: { type: Date, required: true },
    returnDate: { type: Date, required: true },
    pickupLocation: { type: String, required: true },
    returnLocation: { type: String, required: true },

    numberOfDays: { type: Number, required: true, min: 1 },
    pricePerDay: { type: Number, required: true },

    subtotal: { type: Number, required: true },
    insurance: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    additionalCharges: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },

    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Active', 'Completed', 'Cancelled', 'Rejected'],
      default: 'Pending',
    },

    cancellationReason: { type: String, default: '' },
  },
  { timestamps: true }
);

bookingSchema.index({ carId: 1, pickupDate: 1, returnDate: 1 });
bookingSchema.index({ userId: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
