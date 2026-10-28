const MS_PER_DAY = 1000 * 60 * 60 * 24;

const INSURANCE_RATE = 0.05; // 5% of subtotal
const TAX_RATE = 0.1; // 10% of (subtotal + insurance)

/**
 * Calculates number of rental days (minimum 1).
 */
const calculateDays = (pickupDate, returnDate) => {
  const pickup = new Date(pickupDate);
  const ret = new Date(returnDate);
  const diff = Math.ceil((ret - pickup) / MS_PER_DAY);
  return Math.max(diff, 1);
};

/**
 * Server-side price calculation. NEVER trust price values sent from the client.
 * Returns the full breakdown used for booking + invoice.
 */
const calculatePrice = ({ pricePerDay, pickupDate, returnDate, additionalDriver = false, discount = 0 }) => {
  const numberOfDays = calculateDays(pickupDate, returnDate);
  const subtotal = numberOfDays * pricePerDay;
  const insurance = Math.round(subtotal * INSURANCE_RATE);
  const additionalCharges = additionalDriver ? numberOfDays * 200 : 0;
  const taxableAmount = subtotal + insurance + additionalCharges;
  const tax = Math.round(taxableAmount * TAX_RATE);
  const safeDiscount = Math.min(Math.max(discount, 0), subtotal); // discount can't exceed subtotal
  const totalAmount = subtotal + insurance + additionalCharges + tax - safeDiscount;

  return {
    numberOfDays,
    pricePerDay,
    subtotal,
    insurance,
    tax,
    additionalCharges,
    discount: safeDiscount,
    totalAmount,
  };
};

/**
 * Two date ranges overlap if:
 * requestedPickup < existingReturn AND requestedReturn > existingPickup
 */
const datesOverlap = (existingPickup, existingReturn, requestedPickup, requestedReturn) => {
  return (
    new Date(requestedPickup) < new Date(existingReturn) &&
    new Date(requestedReturn) > new Date(existingPickup)
  );
};

const generateBookingId = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(10000 + Math.random() * 90000);
  return `CRS-${dateStr}-${random}`;
};

module.exports = { calculateDays, calculatePrice, datesOverlap, generateBookingId };
