import { openModal, closeModal, showToast, bindPageTabs } from '../utils/ui.js';
import { navigateTo } from '../utils/navigation.js';

const FILTER_TABS = [
  { id: 'tumu', label: 'Tümü' },
  { id: 'uyari', label: 'Uyarılar' },
  { id: 'duyuru', label: 'Duyurular' },
  { id: 'hatirlatma', label: 'Hatırlatmalar' },
  { id: 'sistem', label: 'Sistem' },
];

const TYPE_ICON = {
  warning: { class: 'notif-icon notif-icon--red', icon: '⚠' },
  reminder: { class: 'notif-icon notif-icon--orange', icon: '⚠' },
  alert: { class: 'notif-icon notif-icon--orange', icon: '📈' },
  system: { class: 'notif-icon notif-icon--teal', icon: '⚙' },
  announcement: { class: 'notif-icon notif-icon--blue', icon: '📢' },
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
          <h4 class="notif-card__title">${n.title}</h4>
          <p class="notif-card__desc">${n.description}</p>
        </div>
        <div class="notif-card__meta">
          <span class="notif-card__time">${n.time}</span>
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
      <h2 class="page-title">8. Bildirimler</h2>

      <div class="page-toolbar">
        <div class="page-tabs" id="notif-tabs">${tabsHtml}</div>
        <button type="button" class="btn btn--ghost" id="btn-mark-all-read">Tümünü Okundu İşaretle</button>
      </div>

      <div class="notif-list" id="notif-list">${renderNotifList(pageData.items)}</div>
    </div>`;
}

function openNotifDetail(id) {
  const n = pageData.items.find((x) => x.id === Number(id));
  if (!n) return;

  n.unread = false;
  document.getElementById('notif-list').innerHTML = renderNotifList(pageData.items);

  const actionBtn = n.actionRoute
    ? `<button type="button" class="btn btn--primary" id="notif-action">${n.actionLabel || 'İşleme Git'}</button>`
    : `<button type="button" class="btn btn--primary" data-modal-close>Tamam</button>`;

  openModal({
    title: n.title,
    bodyHtml: `
      <p class="modal-text">${n.description}</p>
      <p class="modal-meta">Zaman: ${n.time} · Kategori: ${n.category || n.type}</p>`,
    footerHtml: `
      <button type="button" class="btn btn--ghost" data-modal-close>Kapat</button>
      ${actionBtn}`,
  });

  document.getElementById('notif-action')?.addEventListener('click', () => {
    closeModal();
    if (n.actionRoute) {
      navigateTo(n.actionRoute);
      showToast(`${n.actionLabel} — yönlendirildi`, 'success');
    }
  });
}

export function initNotificationsPage() {
  const page = document.getElementById('page-notifications');
  if (!page || !pageData) return;

  bindPageTabs(page, (tabId) => {
    activeCategory = tabId;
    document.getElementById('notif-list').innerHTML = renderNotifList(pageData.items);
  });

  document.getElementById('btn-mark-all-read')?.addEventListener('click', () => {
    pageData.items.forEach((n) => {
      n.unread = false;
    });
    document.getElementById('notif-list').innerHTML = renderNotifList(pageData.items);
    showToast('Tüm bildirimler okundu olarak işaretlendi', 'success');
  });

  document.getElementById('notif-list')?.addEventListener('click', (e) => {
    const card = e.target.closest('[data-notif-id]');
    if (card) openNotifDetail(card.dataset.notifId);
  });
}
