/* ============================================
   dashboard.js - User dashboard overview
   ============================================ */

async function loadDashboard() {
  if (!requireAuth()) return;
  const user = Storage.getUser();
  qs('#welcomeName').textContent = user.name.split(' ')[0];

  try {
    const { bookings } = await apiRequest('/bookings');

    const upcoming = bookings.find((b) => ['Pending', 'Confirmed', 'Active'].includes(b.status));
    const completed = bookings.filter((b) => b.status === 'Completed').length;
    const active = bookings.filter((b) => b.status === 'Active').length;
    const cancelled = bookings.filter((b) => ['Cancelled', 'Rejected'].includes(b.status)).length;

    qs('#statCompleted').textContent = completed;
    qs('#statActive').textContent = active;
    qs('#statCancelled').textContent = cancelled;
    qs('#statTotal').textContent = bookings.length;

    const upcomingEl = qs('#upcomingBooking');
    if (upcoming) {
      const car = upcoming.carId;
      upcomingEl.innerHTML = `
        <div class="booking-item">
          <img src="${car?.images?.[0] || 'https://via.placeholder.com/100x70'}" alt="${car?.brand}" />
          <div class="booking-item-info">
            <h4>${car?.brand} ${car?.model}</h4>
            <p>${formatDate(upcoming.pickupDate)} - ${formatDate(upcoming.returnDate)}</p>
            <p>${formatCurrency(upcoming.totalAmount)} · <span class="badge ${statusBadgeClass(upcoming.status)}">${upcoming.status}</span></p>
          </div>
          <div class="booking-item-actions">
            <a href="bookings.html" class="btn btn-outline btn-sm">View Details</a>
          </div>
        </div>
      `;
    } else {
      upcomingEl.innerHTML = `<div class="empty-state"><div class="icon">📅</div><p>No upcoming bookings.</p><a href="cars.html" class="btn btn-primary btn-sm mt-16">Browse Cars</a></div>`;
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (qs('#welcomeName')) loadDashboard();
});
