/* ============================================
   booking.js - Booking form, live price preview,
   availability check, and confirmation
   ============================================ */

let currentCar = null;

// Client-side preview ONLY. The backend recalculates authoritatively.
function previewPrice(car, pickupDate, returnDate, additionalDriver) {
  const days = Math.max(Math.ceil((new Date(returnDate) - new Date(pickupDate)) / 86400000), 1);
  const subtotal = days * car.pricePerDay;
  const insurance = Math.round(subtotal * 0.05);
  const additionalCharges = additionalDriver ? days * 200 : 0;
  const tax = Math.round((subtotal + insurance + additionalCharges) * 0.1);
  const total = subtotal + insurance + additionalCharges + tax;
  return { days, subtotal, insurance, additionalCharges, tax, total };
}

function renderPriceBreakdown(preview) {
  qs('#priceBreakdown').innerHTML = `
    <div class="flex-between mb-8"><span>Rental (${preview.days} day${preview.days > 1 ? 's' : ''})</span><strong>${formatCurrency(preview.subtotal)}</strong></div>
    <div class="flex-between mb-8"><span>Insurance</span><strong>${formatCurrency(preview.insurance)}</strong></div>
    ${preview.additionalCharges ? `<div class="flex-between mb-8"><span>Additional Driver</span><strong>${formatCurrency(preview.additionalCharges)}</strong></div>` : ''}
    <div class="flex-between mb-8"><span>Tax</span><strong>${formatCurrency(preview.tax)}</strong></div>
    <div class="divider"></div>
    <div class="flex-between"><span style="font-weight:700;">Total Amount</span><strong style="font-size:1.3rem;color:var(--color-primary);">${formatCurrency(preview.total)}</strong></div>
  `;
}

async function loadCarForBooking() {
  const carId = getQueryParam('carId');
  if (!carId) {
    qs('#bookingContainer').innerHTML = `<div class="empty-state"><p>No car selected.</p></div>`;
    return;
  }

  try {
    const { car } = await apiRequest(`/cars/${carId}`, { auth: false });
    currentCar = car;

    if (car.status !== 'Available') {
      qs('#bookingContainer').innerHTML = `<div class="empty-state"><p>This car is currently ${car.status.toLowerCase()} and cannot be booked.</p></div>`;
      return;
    }

    qs('#carSummary').innerHTML = `
      <img src="${car.images?.[0] || 'https://via.placeholder.com/300x200'}" alt="${car.brand}" style="width:100%;border-radius:10px;margin-bottom:14px;object-fit:cover;height:160px;" />
      <h3>${car.brand} ${car.model}</h3>
      <p class="mt-8">${car.year} · ${car.fuelType} · ${car.transmission} · ${car.seats} Seats</p>
      <p class="mt-8">📍 ${car.location}</p>
      <div class="car-card-price mt-16">${formatCurrency(car.pricePerDay)} <span>/ day</span></div>
    `;

    // Set min dates to today
    const today = new Date().toISOString().split('T')[0];
    qs('#pickupDate').min = today;
    qs('#returnDate').min = today;

    bindBookingFormEvents();
  } catch (err) {
    qs('#bookingContainer').innerHTML = `<div class="empty-state"><p>${err.message}</p></div>`;
  }
}

function bindBookingFormEvents() {
  const pickupInput = qs('#pickupDate');
  const returnInput = qs('#returnDate');
  const driverCheckbox = qs('#additionalDriver');

  function recalc() {
    if (!pickupInput.value || !returnInput.value) return;
    if (new Date(returnInput.value) <= new Date(pickupInput.value)) {
      qs('#dateError').textContent = 'Return date must be after pickup date';
      qs('#priceBreakdown').innerHTML = '';
      qs('#confirmBookingBtn').disabled = true;
      return;
    }
    qs('#dateError').textContent = '';
    const preview = previewPrice(currentCar, pickupInput.value, returnInput.value, driverCheckbox.checked);
    renderPriceBreakdown(preview);
    qs('#confirmBookingBtn').disabled = false;
  }

  pickupInput.addEventListener('change', () => {
    returnInput.min = pickupInput.value;
    recalc();
  });
  returnInput.addEventListener('change', recalc);
  driverCheckbox.addEventListener('change', recalc);

  qs('#bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!Storage.getToken()) {
      showToast('Please log in to book a car', 'info');
      setTimeout(() => (window.location.href = `login.html`), 800);
      return;
    }

    const btn = qs('#confirmBookingBtn');
    const originalText = btn.textContent;

    try {
      btn.disabled = true;
      btn.textContent = 'Confirming...';

      const payload = {
        carId: currentCar._id,
        pickupDate: pickupInput.value,
        returnDate: returnInput.value,
        pickupLocation: qs('#pickupLocation').value.trim() || currentCar.location,
        returnLocation: qs('#returnLocation').value.trim() || currentCar.location,
        additionalDriver: driverCheckbox.checked,
      };

      const data = await apiRequest('/bookings', { method: 'POST', body: payload });

      showToast(`Booking confirmed! ID: ${data.booking.bookingId}`, 'success');
      setTimeout(() => (window.location.href = 'bookings.html'), 1200);
    } catch (err) {
      showToast(err.message, 'error');
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (qs('#bookingContainer')) loadCarForBooking();
});
