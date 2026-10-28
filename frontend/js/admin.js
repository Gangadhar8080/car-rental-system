/* ============================================
   admin.js - Admin panel: dashboard, cars, bookings,
   users, maintenance management
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  requireAdmin(['admin', 'manager']);
  renderAdminSidebarUser();

  const toggle = qs('.admin-mobile-toggle');
  const sidebar = qs('.admin-sidebar');
  if (toggle && sidebar) toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
});

function renderAdminSidebarUser() {
  const user = Storage.getUser();
  const el = qs('#adminUserLabel');
  if (el && user) el.textContent = `${user.name} (${user.role})`;
}

/* ============================================
   DASHBOARD
   ============================================ */
async function loadAdminDashboard() {
  if (!qs('#statTotalCars')) return;
  try {
    const { stats, charts } = await apiRequest('/admin/dashboard');

    qs('#statTotalCars').textContent = stats.totalCars;
    qs('#statTotalUsers').textContent = stats.totalUsers;
    qs('#statTotalBookings').textContent = stats.totalBookings;
    qs('#statActiveRentals').textContent = stats.activeRentals;
    qs('#statAvailableCars').textContent = stats.availableCars;
    qs('#statRevenue').textContent = formatCurrency(stats.totalRevenue);

    renderMonthlyChart(charts.monthlyStats);
    renderStatusChart(charts.bookingStatusBreakdown);
    renderMostRentedList(charts.mostRentedCars);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function renderMonthlyChart(monthlyStats) {
  const el = qs('#monthlyChart');
  if (!el) return;
  if (!monthlyStats.length) { el.innerHTML = '<p class="text-muted text-center">No data yet.</p>'; return; }

  const maxRevenue = Math.max(...monthlyStats.map((m) => m.revenue), 1);
  el.innerHTML = `
    <div class="bar-chart">
      ${monthlyStats.map((m) => `
        <div class="bar-col">
          <div class="bar" style="height:${Math.max((m.revenue / maxRevenue) * 100, 4)}%;" title="${formatCurrency(m.revenue)}"></div>
          <div class="bar-label">${MONTH_NAMES[m._id.month - 1]}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderStatusChart(breakdown) {
  const el = qs('#statusChart');
  if (!el) return;
  if (!breakdown.length) { el.innerHTML = '<p class="text-muted text-center">No data yet.</p>'; return; }

  el.innerHTML = breakdown
    .map((s) => `
      <div class="flex-between mb-8">
        <span class="badge ${statusBadgeClass(s._id)}">${s._id}</span>
        <strong>${s.count}</strong>
      </div>
    `)
    .join('');
}

function renderMostRentedList(cars) {
  const el = qs('#mostRentedList');
  if (!el) return;
  if (!cars.length) { el.innerHTML = '<p class="text-muted text-center">No data yet.</p>'; return; }

  el.innerHTML = cars
    .map((c) => `
      <div class="flex-between mb-8">
        <span>${c.car.brand} ${c.car.model}</span>
        <strong>${c.bookingCount} bookings</strong>
      </div>
    `)
    .join('');
}

/* ============================================
   CARS MANAGEMENT
   ============================================ */
async function loadAdminCars() {
  const tbody = qs('#adminCarsTableBody');
  if (!tbody) return;

  try {
    const data = await apiRequest('/cars?limit=50&status=Available');
    // Fetch all statuses (admin should see everything) by hitting each status or omitting filter server-side.
    const all = await apiRequest('/cars?limit=100');
    renderAdminCarsTable(all.cars);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">${err.message}</div></td></tr>`;
  }
}

function renderAdminCarsTable(cars) {
  const tbody = qs('#adminCarsTableBody');
  if (!cars.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><p>No cars yet. Add your first car.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = cars
    .map(
      (c) => `
      <tr>
        <td><img src="${c.images?.[0] || 'https://via.placeholder.com/60x40'}" style="width:60px;height:40px;object-fit:cover;border-radius:4px;" /></td>
        <td>${c.brand} ${c.model}</td>
        <td>${c.year}</td>
        <td>${formatCurrency(c.pricePerDay)}</td>
        <td>
          <select onchange="changeCarStatus('${c._id}', this.value)" style="width:auto;padding:6px 8px;">
            ${['Available', 'Booked', 'Rented', 'Maintenance', 'Inactive']
              .map((s) => `<option value="${s}" ${s === c.status ? 'selected' : ''}>${s}</option>`)
              .join('')}
          </select>
        </td>
        <td>${c.location}</td>
        <td>
          <div class="action-icons">
            <button onclick="openEditCarModal('${c._id}')">Edit</button>
            <button onclick="deleteCar('${c._id}')" style="color:var(--color-danger);">Delete</button>
          </div>
        </td>
      </tr>
    `
    )
    .join('');
}

async function changeCarStatus(id, status) {
  try {
    await apiRequest(`/cars/${id}/status`, { method: 'PUT', body: { status } });
    showToast('Car status updated', 'success');
  } catch (err) {
    showToast(err.message, 'error');
    loadAdminCars();
  }
}

async function deleteCar(id) {
  if (!confirm('Delete this car permanently?')) return;
  try {
    await apiRequest(`/cars/${id}`, { method: 'DELETE' });
    showToast('Car deleted', 'success');
    loadAdminCars();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

let editingCarId = null;

function openAddCarModal() {
  editingCarId = null;
  qs('#carModalTitle').textContent = 'Add New Car';
  qs('#carForm').reset();
  qs('#carModalOverlay').classList.add('open');
}

async function openEditCarModal(id) {
  try {
    const { car } = await apiRequest(`/cars/${id}`);
    editingCarId = id;
    qs('#carModalTitle').textContent = 'Edit Car';
    qs('#cf_brand').value = car.brand;
    qs('#cf_model').value = car.model;
    qs('#cf_year').value = car.year;
    qs('#cf_pricePerDay').value = car.pricePerDay;
    qs('#cf_fuelType').value = car.fuelType;
    qs('#cf_transmission').value = car.transmission;
    qs('#cf_seats').value = car.seats;
    qs('#cf_mileage').value = car.mileage || '';
    qs('#cf_location').value = car.location;
    qs('#cf_description').value = car.description || '';
    qs('#cf_features').value = (car.features || []).join(', ');
    qs('#cf_images').value = (car.images || []).join(', ');
    qs('#carModalOverlay').classList.add('open');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function closeCarModal() {
  qs('#carModalOverlay').classList.remove('open');
}

function initCarForm() {
  const form = qs('#carForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      brand: qs('#cf_brand').value.trim(),
      model: qs('#cf_model').value.trim(),
      year: Number(qs('#cf_year').value),
      pricePerDay: Number(qs('#cf_pricePerDay').value),
      fuelType: qs('#cf_fuelType').value,
      transmission: qs('#cf_transmission').value,
      seats: Number(qs('#cf_seats').value),
      mileage: qs('#cf_mileage').value.trim(),
      location: qs('#cf_location').value.trim(),
      description: qs('#cf_description').value.trim(),
      features: qs('#cf_features').value.split(',').map((f) => f.trim()).filter(Boolean),
      images: qs('#cf_images').value.split(',').map((f) => f.trim()).filter(Boolean),
    };

    try {
      if (editingCarId) {
        await apiRequest(`/cars/${editingCarId}`, { method: 'PUT', body: payload });
        showToast('Car updated', 'success');
      } else {
        await apiRequest('/cars', { method: 'POST', body: payload });
        showToast('Car added', 'success');
      }
      closeCarModal();
      loadAdminCars();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

/* ============================================
   BOOKINGS MANAGEMENT
   ============================================ */
async function loadAdminBookings() {
  const tbody = qs('#adminBookingsTableBody');
  if (!tbody) return;

  try {
    const { bookings } = await apiRequest('/admin/bookings');
    renderAdminBookingsTable(bookings);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">${err.message}</div></td></tr>`;
  }
}

function renderAdminBookingsTable(bookings) {
  const tbody = qs('#adminBookingsTableBody');
  if (!bookings.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><p>No bookings yet.</p></div></td></tr>`;
    return;
  }
  const statuses = ['Pending', 'Confirmed', 'Active', 'Completed', 'Cancelled', 'Rejected'];
  tbody.innerHTML = bookings
    .map(
      (b) => `
      <tr>
        <td>${b.bookingId}</td>
        <td>${b.userId?.name || 'Unknown'}<br/><span class="text-muted" style="font-size:0.8rem;">${b.userId?.email || ''}</span></td>
        <td>${b.carId?.brand || ''} ${b.carId?.model || ''}</td>
        <td>${formatDate(b.pickupDate)} → ${formatDate(b.returnDate)}</td>
        <td>${formatCurrency(b.totalAmount)}</td>
        <td>
          <select onchange="changeBookingStatus('${b._id}', this.value)" style="width:auto;padding:6px 8px;">
            ${statuses.map((s) => `<option value="${s}" ${s === b.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
        <td><a href="../invoice.html?bookingId=${b._id}" target="_blank" class="btn btn-outline btn-sm">Invoice</a></td>
      </tr>
    `
    )
    .join('');
}

async function changeBookingStatus(id, status) {
  try {
    await apiRequest(`/bookings/${id}`, { method: 'PUT', body: { status } });
    showToast('Booking status updated', 'success');
  } catch (err) {
    showToast(err.message, 'error');
    loadAdminBookings();
  }
}

/* ============================================
   USERS MANAGEMENT
   ============================================ */
async function loadAdminUsers() {
  const tbody = qs('#adminUsersTableBody');
  if (!tbody) return;

  try {
    const { users } = await apiRequest('/admin/users');
    renderAdminUsersTable(users);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">${err.message}</div></td></tr>`;
  }
}

function renderAdminUsersTable(users) {
  const tbody = qs('#adminUsersTableBody');
  if (!users.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><p>No users yet.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = users
    .map(
      (u) => `
      <tr>
        <td>${u.name}</td>
        <td>${u.email}</td>
        <td>${u.phone}</td>
        <td>
          <select onchange="changeUserRole('${u._id}', this.value)" style="width:auto;padding:6px 8px;">
            ${['user', 'manager', 'admin'].map((r) => `<option value="${r}" ${r === u.role ? 'selected' : ''}>${r}</option>`).join('')}
          </select>
        </td>
        <td><span class="badge ${u.isActive ? 'badge-success' : 'badge-danger'}">${u.isActive ? 'Active' : 'Deactivated'}</span></td>
        <td>
          <div class="action-icons">
            <button onclick="toggleUserActive('${u._id}', ${!u.isActive})">${u.isActive ? 'Deactivate' : 'Activate'}</button>
            <button onclick="deleteUser('${u._id}')" style="color:var(--color-danger);">Delete</button>
          </div>
        </td>
      </tr>
    `
    )
    .join('');
}

async function changeUserRole(id, role) {
  try {
    await apiRequest(`/admin/users/${id}`, { method: 'PUT', body: { role } });
    showToast('User role updated', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function toggleUserActive(id, isActive) {
  try {
    await apiRequest(`/admin/users/${id}`, { method: 'PUT', body: { isActive } });
    showToast(`User ${isActive ? 'activated' : 'deactivated'}`, 'success');
    loadAdminUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteUser(id) {
  if (!confirm('Delete this user permanently?')) return;
  try {
    await apiRequest(`/admin/users/${id}`, { method: 'DELETE' });
    showToast('User deleted', 'success');
    loadAdminUsers();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ============================================
   MAINTENANCE MANAGEMENT
   ============================================ */
async function loadMaintenanceRecords() {
  const tbody = qs('#maintenanceTableBody');
  if (!tbody) return;

  try {
    const { records } = await apiRequest('/maintenance');
    renderMaintenanceTable(records);
    populateMaintenanceCarSelect();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">${err.message}</div></td></tr>`;
  }
}

function renderMaintenanceTable(records) {
  const tbody = qs('#maintenanceTableBody');
  if (!records.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><p>No maintenance records yet.</p></div></td></tr>`;
    return;
  }
  const statuses = ['Scheduled', 'InProgress', 'Completed', 'Cancelled'];
  tbody.innerHTML = records
    .map(
      (r) => `
      <tr>
        <td>${r.carId?.brand || ''} ${r.carId?.model || ''}</td>
        <td>${r.maintenanceType}</td>
        <td>${formatDate(r.startDate)} → ${formatDate(r.endDate)}</td>
        <td>${formatCurrency(r.cost)}</td>
        <td>
          <select onchange="changeMaintenanceStatus('${r._id}', this.value)" style="width:auto;padding:6px 8px;">
            ${statuses.map((s) => `<option value="${s}" ${s === r.status ? 'selected' : ''}>${s}</option>`).join('')}
          </select>
        </td>
        <td><button onclick="deleteMaintenanceRecord('${r._id}')" style="color:var(--color-danger);">Delete</button></td>
      </tr>
    `
    )
    .join('');
}

async function populateMaintenanceCarSelect() {
  try {
    const { cars } = await apiRequest('/cars?limit=100');
    const select = qs('#mf_carId');
    if (!select) return;
    select.innerHTML = cars.map((c) => `<option value="${c._id}">${c.brand} ${c.model} (${c.year})</option>`).join('');
  } catch (err) {
    // silent - non-critical
  }
}

function openAddMaintenanceModal() {
  qs('#maintenanceForm').reset();
  qs('#maintenanceModalOverlay').classList.add('open');
}
function closeMaintenanceModal() {
  qs('#maintenanceModalOverlay').classList.remove('open');
}

function initMaintenanceForm() {
  const form = qs('#maintenanceForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      carId: qs('#mf_carId').value,
      maintenanceType: qs('#mf_type').value,
      description: qs('#mf_description').value.trim(),
      startDate: qs('#mf_startDate').value,
      endDate: qs('#mf_endDate').value,
      cost: Number(qs('#mf_cost').value) || 0,
    };
    try {
      await apiRequest('/maintenance', { method: 'POST', body: payload });
      showToast('Maintenance record created', 'success');
      closeMaintenanceModal();
      loadMaintenanceRecords();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

async function changeMaintenanceStatus(id, status) {
  try {
    await apiRequest(`/maintenance/${id}`, { method: 'PUT', body: { status } });
    showToast('Maintenance status updated', 'success');
    loadMaintenanceRecords();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteMaintenanceRecord(id) {
  if (!confirm('Delete this maintenance record?')) return;
  try {
    await apiRequest(`/maintenance/${id}`, { method: 'DELETE' });
    showToast('Record deleted', 'success');
    loadMaintenanceRecords();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/* ============================================
   Page init dispatcher
   ============================================ */
document.addEventListener('DOMContentLoaded', () => {
  loadAdminDashboard();
  loadAdminCars();
  initCarForm();
  loadAdminBookings();
  loadAdminUsers();
  loadMaintenanceRecords();
  initMaintenanceForm();
});
