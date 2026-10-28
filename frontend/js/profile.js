/* ============================================
   profile.js - View/update profile + change password
   ============================================ */

async function loadProfile() {
  if (!requireAuth()) return;
  const user = Storage.getUser();

  qs('#avatarInitials').textContent = user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
  qs('#name').value = user.name;
  qs('#email').value = user.email;
  qs('#phone').value = user.phone;
  qs('#drivingLicenseNumber').value = user.drivingLicenseNumber;
  qs('#role').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
}

function initProfileForm() {
  const form = qs('#profileForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = qs('button[type="submit"]', form);
    const originalText = btn.textContent;

    try {
      btn.disabled = true;
      btn.textContent = 'Saving...';

      const data = await apiRequest('/auth/profile', {
        method: 'PUT',
        body: {
          name: qs('#name').value.trim(),
          phone: qs('#phone').value.trim(),
          drivingLicenseNumber: qs('#drivingLicenseNumber').value.trim(),
        },
      });

      Storage.setUser(data.user);
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

function initPasswordForm() {
  const form = qs('#passwordForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentPassword = qs('#currentPassword').value;
    const newPassword = qs('#newPassword').value;
    const confirmNewPassword = qs('#confirmNewPassword').value;

    if (newPassword !== confirmNewPassword) {
      showToast('New passwords do not match', 'error');
      return;
    }

    const btn = qs('button[type="submit"]', form);
    const originalText = btn.textContent;

    try {
      btn.disabled = true;
      btn.textContent = 'Updating...';
      await apiRequest('/auth/change-password', {
        method: 'PUT',
        body: { currentPassword, newPassword },
      });
      showToast('Password changed successfully', 'success');
      form.reset();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (qs('#profileForm')) {
    loadProfile();
    initProfileForm();
    initPasswordForm();
  }
});
