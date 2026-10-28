/* ============================================
   auth.js - Login/Register forms + shared navbar auth state
   ============================================ */

// ---------- Renders the nav-actions area based on login state ----------
function renderNavAuthState() {
  const container = qs('#navActions');
  if (!container) return;

  const user = Storage.getUser();

  if (!user) {
    container.innerHTML = `
      <a href="login.html" class="btn btn-outline btn-sm">Login</a>
      <a href="register.html" class="btn btn-primary btn-sm">Register</a>
    `;
    return;
  }

  const initials = user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  const dashboardLink = user.role === 'user' ? 'dashboard.html' : 'admin/dashboard.html';

  container.innerHTML = `
    <a href="${dashboardLink}" class="nav-user-badge">${initials} &nbsp;${user.name.split(' ')[0]}</a>
    <button class="btn btn-ghost btn-sm" id="logoutBtn">Logout</button>
  `;

  qs('#logoutBtn').addEventListener('click', () => {
    Storage.clearAll();
    showToast('Logged out successfully', 'success');
    setTimeout(() => (window.location.href = getRootRelativePath('index.html')), 600);
  });
}

// Works whether the current page is at root or inside /admin
function getRootRelativePath(target) {
  return window.location.pathname.includes('/admin/') ? `../${target}` : target;
}

// ---------- Guards ----------
// Redirect to login if not authenticated at all
function requireAuth() {
  if (!Storage.getToken() || !Storage.getUser()) {
    window.location.href = getRootRelativePath('login.html');
    return false;
  }
  return true;
}

// Redirect non admin/manager users away from admin pages
function requireAdmin(allowedRoles = ['admin']) {
  const user = Storage.getUser();
  if (!requireAuth()) return false;
  if (!allowedRoles.includes(user.role)) {
    showToast('You do not have permission to view this page', 'error');
    window.location.href = getRootRelativePath('index.html');
    return false;
  }
  return true;
}

// ---------- Mobile nav toggle (shared across pages) ----------
document.addEventListener('DOMContentLoaded', () => {
  renderNavAuthState();

  const toggle = qs('.nav-toggle');
  const links = qs('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
  }
});

/* ============================================
   Login form handler
   ============================================ */
function initLoginForm() {
  const form = qs('#loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = qs('#email').value.trim();
    const password = qs('#password').value;
    const btn = qs('button[type="submit"]', form);
    const originalText = btn.textContent;

    try {
      btn.disabled = true;
      btn.textContent = 'Logging in...';

      const data = await apiRequest('/auth/login', {
        method: 'POST',
        auth: false,
        body: { email, password },
      });

      Storage.setToken(data.token);
      Storage.setUser(data.user);
      showToast('Welcome back!', 'success');

      setTimeout(() => {
        window.location.href = data.user.role === 'user' ? 'dashboard.html' : 'admin/dashboard.html';
      }, 400);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

/* ============================================
   Register form handler
   ============================================ */
function initRegisterForm() {
  const form = qs('#registerForm');
  if (!form) return;

  const passwordInput = qs('#password');
  const strengthBar = qs('.password-strength-bar');

  if (passwordInput && strengthBar) {
    passwordInput.addEventListener('input', () => {
      const val = passwordInput.value;
      let strength = 0;
      if (val.length >= 6) strength += 33;
      if (/[A-Z]/.test(val) && /[0-9]/.test(val)) strength += 33;
      if (/[^A-Za-z0-9]/.test(val)) strength += 34;
      strengthBar.style.width = `${strength}%`;
      strengthBar.style.background = strength < 40 ? '#c0392b' : strength < 80 ? '#b8860b' : '#1a7f4a';
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      name: qs('#name').value.trim(),
      email: qs('#email').value.trim(),
      phone: qs('#phone').value.trim(),
      password: qs('#password').value,
      confirmPassword: qs('#confirmPassword').value,
      drivingLicenseNumber: qs('#drivingLicenseNumber').value.trim(),
    };

    if (payload.password !== payload.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (payload.password.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (!/^\+?[0-9]{10,15}$/.test(payload.phone)) {
      showToast('Please enter a valid phone number', 'error');
      return;
    }

    const btn = qs('button[type="submit"]', form);
    const originalText = btn.textContent;

    try {
      btn.disabled = true;
      btn.textContent = 'Creating account...';

      const data = await apiRequest('/auth/register', { method: 'POST', auth: false, body: payload });

      Storage.setToken(data.token);
      Storage.setUser(data.user);
      showToast('Account created successfully!', 'success');

      setTimeout(() => (window.location.href = 'dashboard.html'), 500);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initLoginForm();
  initRegisterForm();
});
