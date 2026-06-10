import { icons } from '../utils/icons.js';
import { escapeHtml } from '../utils/text.js';

export function renderHeader(companyName, reportingPeriod = 'Raporlama dönemi') {
  return `
    <header class="page-header">
      <div>
        <h2 class="page-header__title">Hoş geldiniz, ${escapeHtml(companyName)}</h2>
        <p class="page-header__subtitle">Karbon ayak izinizi izleyin, yönetin ve optimize edin</p>
      </div>
      <div class="page-header__actions">
        <button type="button" class="btn btn--ghost">
          <span class="icon icon--primary">${icons.calendar}</span>
          ${escapeHtml(reportingPeriod)}
        </button>
        <button type="button" class="btn btn--ghost btn--icon" aria-label="Bildirimler" data-open-notifications>
          ${icons.bell}
          <span class="notification-dot"></span>
        </button>
      </div>
    </header>`;
}
