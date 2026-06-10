import { api } from './api/client.js';
import { clearAuthSession, hasAuthSession, updateStoredUser } from './auth/session.js';
import { initLoginPage, renderLoginPage } from './pages/login.js';
import { initRouter, renderRoute } from './router.js';
import { setLogoSrc } from './utils/ecobyteLogo.js';

let routerInitialized = false;

function showLogin(message = '') {
  const root = document.getElementById('app');
  if (!root) return;
  document.body.classList.add('auth-screen');
  root.innerHTML = renderLoginPage(message);
  initLoginPage(async (user) => {
    updateStoredUser(user);
    const settings = await api.getSettings().catch(() => null);
    setLogoSrc(settings?.brandLogoDataUrl);
    document.body.classList.remove('auth-screen');
    if (!routerInitialized) {
      routerInitialized = true;
      initRouter();
    } else {
      await renderRoute('dashboard');
    }
  });
}

async function showApplication() {
  const [auth, settings] = await Promise.all([
    api.getCurrentUser(),
    api.getSettings().catch(() => null),
  ]);
  updateStoredUser(auth.user);
  setLogoSrc(settings?.brandLogoDataUrl);
  document.body.classList.remove('auth-screen');
  routerInitialized = true;
  initRouter();
}

export async function initApp() {
  const root = document.getElementById('app');
  if (!root) return;
  root.innerHTML = '<p class="loading">Yükleniyor...</p>';

  window.addEventListener('ecobyte:unauthorized', () => {
    clearAuthSession();
    showLogin('Oturum süreniz doldu. Lütfen yeniden giriş yapın.');
  });
  window.addEventListener('ecobyte:logout-request', async () => {
    try {
      await api.logout();
    } catch {
      // Oturum sunucuda zaten sonlanmış olabilir.
    }
    clearAuthSession();
    showLogin('Güvenli şekilde çıkış yaptınız.');
  });

  if (!hasAuthSession()) {
    showLogin();
    return;
  }
  try {
    await showApplication();
  } catch {
    clearAuthSession();
    showLogin('Oturum doğrulanamadı. Lütfen yeniden giriş yapın.');
  }
}
