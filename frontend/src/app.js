import { initRouter } from './router.js';

export function initApp() {
  const root = document.getElementById('app');
  if (!root) return;
  root.innerHTML = '<p class="loading">Yükleniyor...</p>';
  initRouter();
}
