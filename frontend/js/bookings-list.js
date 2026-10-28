/* ============================================
   bookings-list.js - Booking history page (user)
   ============================================ */

let allBookings = [];

async function loadBookingsList() {
  if (!requireAuth()) return;
  const tbody = qs('#bookingsTableBody');

  try {
    const { bookings } = await apiRequest('/bookings');
    allBookings = bookings;
    renderBookingsTable(bookings);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">${err.message}</div></td></tr>`;
  }
}

function renderBookingsTable(bookings) {
  const tbody = qs('#bookingsTableBody');
  if (!bookings.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="icon">📖</div><p>No bookings yet.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = bookings
    .map((b) => {
      const car = b.carId;
      const canCancel = ['Pending', 'Confirmed'].includes(b.status);
      return `
        <tr>
          <td>${b.bookingId}</td>
          <td>${car?.brand || ''} ${car?.model || ''}</td>
          <td>${formatDate(b.pickupDate)}</td>
          <td>${formatDate(b.returnDate)}</td>
          <td>${formatCurrency(b.totalAmount)}</td>
          <td><span class="badge ${statusBadgeClass(b.status)}">${b.status}</span></td>
          <td>
            <div class="action-icons">
              <button onclick="viewInvoice('${b._id}')">Invoice</button>
              ${canCancel ? `<button onclick="cancelBooking('${b._id}')" style="color:var(--color-danger);">Cancel</button>` : ''}
            </div>
          </td>
        </tr>
      `;
    })
    .join('');
}

function filterBookingsByStatus(status) {
  if (!status) {
    renderBookingsTable(allBookings);
    return;
  }
  renderBookingsTable(allBookings.filter((b) => b.status === status));
}

async function cancelBooking(id) {
  if (!confirm('Are you sure you want to cancel this booking?')) return;
  try {
    await apiRequest(`/bookings/${id}`, { method: 'DELETE' });
    showToast('Booking cancelled', 'success');
    loadBookingsList();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function viewInvoice(id) {
  window.open(`invoice.html?bookingId=${id}`, '_blank');
}

document.addEventListener('DOMContentLoaded', () => {
  if (qs('#bookingsTableBody')) {
    loadBookingsList();
    qs('#statusFilter')?.addEventListener('change', (e) => filterBookingsByStatus(e.target.value));
  }
});
