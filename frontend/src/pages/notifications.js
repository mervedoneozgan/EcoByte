import { api } from '../api/client.js';
import { openModal, closeModal, showToast, bindPageTabs } from '../utils/ui.js';
import { navigateTo } from '../utils/navigation.js';
import { escapeHtml } from '../utils/text.js';

const FILTER_TABS = [
  { id: 'tumu', label: 'Tümü' },
  { id: 'uyari', label: 'Uyarılar' },
  { id: 'duyuru', label: 'Duyurular' },
  { id: 'hatirlatma', label: 'Hatırlatmalar' },
  { id: 'sistem', label: 'Sistem' },
];

const TYPE_ICON = {
  warning: { class: 'notif-icon notif-icon--red', icon: '!' },
  reminder: { class: 'notif-icon notif-icon--orange', icon: '•' },
  alert: { class: 'notif-icon notif-icon--orange', icon: '↑' },
  system: { class: 'notif-icon notif-icon--teal', icon: 'S' },
  announcement: { class: 'notif-icon notif-icon--blue', icon: 'A' },
};

let pageData = null;
let activeCategory = 'tumu';

function renderNotifList(items) {
  const filtered =
    activeCategory === 'tumu'
      ? items
      : items.filter((n) => n.category === activeCategory);

  if (!filtered.length) {
    return `<p class="notif-empty">Bu kategoride bildirim yok.</p>`;
  }

  return filtered
    .map((n) => {
      const cfg = TYPE_ICON[n.type] || TYPE_ICON.warning;
      return `
      <article class="notif-card notif-card--clickable ${n.unread ? 'notif-card--unread' : ''}"
               data-notif-id="${n.id}" role="button" tabindex="0">
        <div class="${cfg.class}">${cfg.icon}</div>
        <div class="notif-card__body">
          <h4 class="notif-card__title">${escapeHtml(n.title)}</h4>
          <p class="notif-card__desc">${escapeHtml(n.description)}</p>
        </div>
        <div class="notif-card__meta">
          <span class="notif-card__time">${escapeHtml(n.time)}</span>
          ${n.unread ? '<span class="notif-dot"></span>' : ''}
        </div>
      </article>`;
    })
    .join('');
}

export function renderNotificationsPage(data) {
  pageData = JSON.parse(JSON.stringify(data));
  activeCategory = 'tumu';

  const tabsHtml = FILTER_TABS.map(
    (t, i) =>
      `<button type="button" class="page-tab ${i === 0 ? 'page-tab--active' : ''}" data-tab="${t.id}">${t.label}</button>`
  ).join('');

  return `
    <div class="page" id="page-notifications">
      <div>
        <h2 class="page-title page-title--left">Bildirimler</h2>
        <p class="page-header__subtitle">Uyarıları, duyuruları ve görev hatırlatmalarını takip edin</p>
      </div>

      <div class="page-toolbar">
        <div class="page-tabs" id="notif-tabs">${tabsHtml}</div>
        <button type="button" class="btn btn--ghost" id="btn-mark-all-read">Tümünü Okundu Yap</button>
      </div>

      <div class="notif-list" id="notif-list">${renderNotifList(pageData.items)}</div>
    </div>`;
}

async function openNotifDetail(id) {
  const n = pageData.items.find((x) => x.id === Number(id));
  if (!n) return;

  try {
    await api.markNotificationRead(n.id);
    n.unread = false;
    document.getElementById('notif-list').innerHTML = renderNotifList(pageData.items);
  } catch (error) {
    showToast(error.message, 'error');
    return;
  }

  const actionBtn = n.actionRoute
    ? `<button type="button" class="btn btn--primary" id="notif-action">${escapeHtml(n.actionLabel || 'İşleme Git')}</button>`
    : `<button type="button" class="btn btn--primary" data-modal-close>Tamam</button>`;

  openModal({
    title: n.title,
    bodyHtml: `
      <p class="modal-text">${escapeHtml(n.description)}</p>
      <p class="modal-meta">Zaman: ${escapeHtml(n.time)} · Kategori: ${escapeHtml(n.category || n.type)}</p>`,
    footerHtml: `
      <button type="button" class="btn btn--ghost" data-modal-close>Kapat</button>
      ${actionBtn}`,
  });

  document.getElementById('notif-action')?.addEventListener('click', () => {
    closeModal();
    if (n.actionRoute) navigateTo(n.actionRoute);
  });
}

export function initNotificationsPage() {
  const page = document.getElementById('page-notifications');
  if (!page || !pageData) return;

  bindPageTabs(page, (tabId) => {
    activeCategory = tabId;
    document.getElementById('notif-list').innerHTML = renderNotifList(pageData.items);
  });

  document.getElementById('btn-mark-all-read')?.addEventListener('click', async () => {
    try {
      await api.markAllNotificationsRead();
      pageData.items.forEach((n) => {
        n.unread = false;
      });
      document.getElementById('notif-list').innerHTML = renderNotifList(pageData.items);
      showToast('Bildirimler güncellendi', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  document.getElementById('notif-list')?.addEventListener('click', (e) => {
    const card = e.target.closest('[data-notif-id]');
    if (card) openNotifDetail(card.dataset.notifId);
  });
  document.getElementById('notif-list')?.addEventListener('keydown', (event) => {
    const card = event.target.closest('[data-notif-id]');
    if (card && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      openNotifDetail(card.dataset.notifId);
    }
  });
}
