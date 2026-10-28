/* ============================================
   api.js - Central fetch wrapper + shared helpers
   Loaded on every page BEFORE any other script.
   ============================================ */

const API_BASE_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : 'https://car-rental-system-vs21.onrender.com/api';

const Storage = {
  getToken: () => localStorage.getItem('crs_token'),
  setToken: (token) => localStorage.setItem('crs_token', token),
  clearToken: () => localStorage.removeItem('crs_token'),

  getUser: () => {
    const raw = localStorage.getItem('crs_user');
    return raw ? JSON.parse(raw) : null;
  },
  setUser: (user) => localStorage.setItem('crs_user', JSON.stringify(user)),
  clearUser: () => localStorage.removeItem('crs_user'),

  clearAll: () => {
    localStorage.removeItem('crs_token');
    localStorage.removeItem('crs_user');
  },
};

/**
 * Core API call helper. Automatically attaches JWT and parses JSON.
 * Throws an Error with a readable .message on failure.
 */
async function apiRequest(endpoint, { method = 'GET', body = null, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = Storage.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (networkErr) {
    throw new Error('Cannot reach the server. Please make sure the backend is running.');
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    if (response.status === 401 && auth) {
      // Token invalid/expired - clean up and send to login
      Storage.clearAll();
    }
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

/* ---------- Toast notifications ---------- */
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

/* ---------- Formatting helpers ---------- */
function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function statusBadgeClass(status) {
  const map = {
    Available: 'badge-success',
    Confirmed: 'badge-success',
    Completed: 'badge-success',
    Pending: 'badge-warning',
    Booked: 'badge-warning',
    Maintenance: 'badge-warning',
    Active: 'badge-info',
    Rented: 'badge-info',
    Cancelled: 'badge-danger',
    Rejected: 'badge-danger',
    Inactive: 'badge-muted',
  };
  return map[status] || 'badge-muted';
}

function qs(selector, parent = document) {
  return parent.querySelector(selector);
}
function qsa(selector, parent = document) {
  return Array.from(parent.querySelectorAll(selector));
}
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}