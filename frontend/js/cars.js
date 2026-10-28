/* ============================================
   cars.js - Car listing, search, filters, favorites
   ============================================ */

function carCardHTML(car, index = 0) {
  const img = car.images && car.images[0] ? car.images[0] : 'https://via.placeholder.com/400x240?text=No+Image';
  const isAvailable = car.status === 'Available';
  const delay = Math.min(index * 60, 360);

  return `
    <div class="car-card animate-in-fast" style="animation-delay:${delay}ms;">
      <div class="car-card-image">
        <img src="${img}" alt="${car.brand} ${car.model}" loading="lazy" />
      </div>
      <div class="car-card-body">
        <div class="flex-between">
          <div class="car-card-title">${car.brand} ${car.model}</div>
          <span class="badge ${statusBadgeClass(car.status)}">${car.status}</span>
        </div>
        <div class="car-card-meta">${car.year} · ${car.fuelType} · ${car.transmission} · ${car.seats} Seats</div>
        <div class="car-card-price">${formatCurrency(car.pricePerDay)} <span>/ day</span></div>
        <div class="car-card-actions">
          <a href="car-details.html?id=${car._id}" class="btn btn-outline btn-sm">View Details</a>
          <a href="${isAvailable ? `booking.html?carId=${car._id}` : '#'}"
             class="btn btn-primary btn-sm" ${isAvailable ? '' : 'style="pointer-events:none;opacity:0.5;"'}>
             Book Now
          </a>
        </div>
      </div>
    </div>
  `;
}

async function loadFeaturedCars() {
  const grid = qs('#featuredCarsGrid');
  if (!grid) return;

  try {
    const data = await apiRequest('/cars?limit=6&sort=newest', { auth: false });
    if (!data.cars.length) {
      grid.innerHTML = `<div class="empty-state"><div class="icon">🚗</div><p>No cars available right now.</p></div>`;
      return;
    }
    grid.innerHTML = data.cars.map(carCardHTML).join('');
    grid.classList.add('in-view'); // already-visible grid: reveal immediately instead of re-observing
    window.refreshScrollReveal?.();
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><p>${err.message}</p></div>`;
  }
}

/* ============================================
   Full cars.html page: filters + pagination
   ============================================ */
let currentPage = 1;

function buildFilterQuery() {
  const params = new URLSearchParams();
  const brand = qs('#filterBrand')?.value.trim();
  const fuelType = qs('#filterFuelType')?.value;
  const transmission = qs('#filterTransmission')?.value;
  const seats = qs('#filterSeats')?.value;
  const location = qs('#filterLocation')?.value.trim();
  const minPrice = qs('#filterMinPrice')?.value;
  const maxPrice = qs('#filterMaxPrice')?.value;
  const sort = qs('#filterSort')?.value;
  const q = qs('#filterSearch')?.value.trim();

  if (brand) params.set('brand', brand);
  if (fuelType) params.set('fuelType', fuelType);
  if (transmission) params.set('transmission', transmission);
  if (seats) params.set('seats', seats);
  if (location) params.set('location', location);
  if (minPrice) params.set('minPrice', minPrice);
  if (maxPrice) params.set('maxPrice', maxPrice);
  if (sort) params.set('sort', sort);
  if (q) params.set('q', q);
  params.set('page', currentPage);
  params.set('limit', 9);

  return params;
}

async function loadCarsPage() {
  const grid = qs('#carsGrid');
  const pagination = qs('#pagination');
  if (!grid) return;

  grid.innerHTML = `<div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div><div class="skeleton skeleton-card"></div>`;

  try {
    const params = buildFilterQuery();
    const data = await apiRequest(`/cars?${params.toString()}`, { auth: false });

    if (!data.cars.length) {
      grid.innerHTML = `<div class="empty-state"><div class="icon">🔍</div><p>No cars match your filters. Try adjusting your search.</p></div>`;
      pagination.innerHTML = '';
      return;
    }

    grid.innerHTML = data.cars.map((car, i) => carCardHTML(car, i)).join('');
    renderPagination(data.page, data.pages);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><p>${err.message}</p></div>`;
  }
}

function renderPagination(page, pages) {
  const el = qs('#pagination');
  if (!el || pages <= 1) {
    if (el) el.innerHTML = '';
    return;
  }
  let html = '';
  for (let i = 1; i <= pages; i++) {
    html += `<button class="btn ${i === page ? 'btn-primary' : 'btn-outline'} btn-sm" data-page="${i}">${i}</button>`;
  }
  el.innerHTML = html;
  qsa('button[data-page]', el).forEach((btn) => {
    btn.addEventListener('click', () => {
      currentPage = Number(btn.dataset.page);
      loadCarsPage();
      window.scrollTo({ top: qs('#carsGrid').offsetTop - 100, behavior: 'smooth' });
    });
  });
}

function initCarsPage() {
  const grid = qs('#carsGrid');
  if (!grid) return;

  // Pre-fill from query params (coming from hero search)
  const location = getQueryParam('location');
  if (location && qs('#filterLocation')) qs('#filterLocation').value = location;

  qs('#filtersForm').addEventListener('submit', (e) => {
    e.preventDefault();
    currentPage = 1;
    loadCarsPage();
  });

  qs('#resetFiltersBtn').addEventListener('click', () => {
    qs('#filtersForm').reset();
    currentPage = 1;
    loadCarsPage();
  });

  qs('#filterSort').addEventListener('change', () => {
    currentPage = 1;
    loadCarsPage();
  });

  loadCarsPage();
}

document.addEventListener('DOMContentLoaded', initCarsPage);
