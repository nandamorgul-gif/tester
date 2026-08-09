/**
 * MORGUL Store - Backend Authentication Manager
 * Handles admin login, session management, and auth guard protection.
 */

const AUTH_STORAGE_KEY = 'morgul_admin_session_v1';

class AuthManager {
  constructor() {
    this.session = this.loadSession();
  }

  loadSession() {
    try {
      const saved = sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to read auth session:', e);
    }
    return null;
  }

  isLoggedIn() {
    return this.session !== null && this.session.authenticated === true;
  }

  login(username, password, rememberMe = false) {
    const validUsernames = ['admin', 'morgul'];
    const validPasswords = ['morgul123', 'admin123'];

    const userClean = String(username).trim().toLowerCase();
    const passClean = String(password).trim();

    if (validUsernames.includes(userClean) && validPasswords.includes(passClean)) {
      const sessionData = {
        authenticated: true,
        username: userClean,
        role: 'SUPER_ADMIN',
        loginTime: new Date().toLocaleString('id-ID')
      };

      this.session = sessionData;

      if (rememberMe) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
      } else {
        sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
      }

      return { success: true, message: 'Login berhasil! Selamat datang Admin MORGUL STORE.' };
    }

    return { success: false, message: 'Username atau Password salah!' };
  }

  logout() {
    this.session = null;
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);

    const overlay = document.getElementById('loginOverlay');
    if (overlay) {
      overlay.style.display = 'flex';
    } else {
      window.location.reload();
    }
  }

  checkAuthGuard() {
    const overlay = document.getElementById('loginOverlay');
    if (!this.isLoggedIn()) {
      if (overlay) {
        overlay.style.display = 'flex';
      }
    } else {
      if (overlay) {
        overlay.style.display = 'none';
      }
    }
  }
}

// Global Singleton Instance
const MorgulAuth = new AuthManager();
