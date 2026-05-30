import { icons } from '../utils/icons.js';

export function renderHeader(companyName) {
  return `
    <header class="page-header">
      <div>
        <h2 class="page-header__title">Hoş geldiniz, ${companyName}</h2>
        <p class="page-header__subtitle">Karbon ayak izinizi izleyin, yönetin ve optimize edin</p>
      </div>
      <div class="page-header__actions">
        <button type="button" class="btn btn--ghost">
          <span class="icon icon--primary">${icons.calendar}</span>
          Mayıs 2024
        </button>
        <button type="button" class="btn btn--ghost btn--icon" aria-label="Bildirimler">
          ${icons.bell}
          <span class="notification-dot"></span>
        </button>
      </div>
    </header>`;
}
