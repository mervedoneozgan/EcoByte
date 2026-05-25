import { renderLogoImg } from '../utils/ecobyteLogo.js';
import { openModal, closeModal, showToast, bindPageTabs, downloadJson } from '../utils/ui.js';

const SETTINGS_TABS = [
  { id: 'genel', label: 'Genel Ayarlar' },
  { id: 'kullanici', label: 'Kullanıcı Yönetimi' },
  { id: 'rol', label: 'Rol ve Yetkiler' },
  { id: 'bildirim', label: 'Bildirim Ayarları' },
  { id: 'entegrasyon', label: 'Entegrasyonlar' },
  { id: 'veri', label: 'Veri Yönetimi' },
  { id: 'guvenlik', label: 'Güvenlik' },
  { id: 'yedekleme', label: 'Yedekleme' },
];

let pageData = null;

function renderGeneralPanel(profile, system) {
  return `
    <div class="settings-grid" data-tab-panel="genel">
      <section class="card settings-card">
        <h3 class="card__heading">Profil Bilgileri</h3>
        <dl class="info-list" id="profile-display">
          <div><dt>Şirket Adı</dt><dd data-field="companyName">${profile.companyName}</dd></div>
          <div><dt>Sektör</dt><dd data-field="sector">${profile.sector}</dd></div>
          <div><dt>Çalışan Sayısı</dt><dd data-field="employees">${profile.employees}</dd></div>
          <div><dt>Ülke</dt><dd data-field="country">${profile.country}</dd></div>
          <div><dt>Para Birimi</dt><dd data-field="currency">${profile.currency}</dd></div>
        </dl>
        <button type="button" class="btn btn--primary" id="btn-update-profile">Güncelle</button>
      </section>

      <section class="card settings-card">
        <h3 class="card__heading">Sistem Bilgileri</h3>
        <dl class="info-list">
          <div><dt>Sürüm</dt><dd>${system.version}</dd></div>
          <div><dt>Son Güncelleme</dt><dd>${system.lastUpdate}</dd></div>
          <div><dt>Veritabanı</dt><dd>${system.database}</dd></div>
          <div><dt>Lisans</dt><dd>${system.license}</dd></div>
        </dl>
        <button type="button" class="btn btn--ghost btn--block-center" id="btn-download-system">Sistem Bilgilerini İndir</button>
      </section>

      <section class="card settings-card settings-card--logo">
        <h3 class="card__heading">Logo ve Marka</h3>
        <p class="settings-card__label">Mevcut Logo</p>
        <div class="settings-logo" id="logo-preview">${renderLogoImg('settings-logo__img')}</div>
        <button type="button" class="btn btn--ghost btn--block-center" id="btn-change-logo">Değiştir</button>
      </section>
    </div>`;
}

function renderPlaceholderPanel(tabId, title) {
  return `
    <div class="card placeholder-card tab-panel" data-tab-panel="${tabId}" hidden>
      <p class="placeholder-card__text">
        <strong>${title}</strong> — Bu sekme backend bağlandığında yapılandırılacak.
        Şimdilik demo arayüzü.
      </p>
      <button type="button" class="btn btn--outline" data-action="coming-soon">Yapılandır</button>
    </div>`;
}

export function renderSettingsPage(data) {
  pageData = JSON.parse(JSON.stringify(data));
  const { profile, system } = pageData;

  const tabsHtml = SETTINGS_TABS.map(
    (t, i) =>
      `<button type="button" class="page-tab ${i === 0 ? 'page-tab--active' : ''}" data-tab="${t.id}">${t.label}</button>`
  ).join('');

  const otherPanels = SETTINGS_TABS.slice(1)
    .map((t) => renderPlaceholderPanel(t.id, t.label))
    .join('');

  return `
    <div class="page" id="page-settings">
      <h2 class="page-title">9. Ayarlar</h2>
      <div class="page-tabs page-tabs--wrap" id="settings-tabs">${tabsHtml}</div>
      <div id="settings-panels">
        ${renderGeneralPanel(profile, system)}
        ${otherPanels}
      </div>
    </div>`;
}

function openProfileEditModal() {
  const p = pageData.profile;
  openModal({
    title: 'Profil Bilgilerini Güncelle',
    bodyHtml: `
      <form id="form-profile" class="form">
        <label class="form__label">Şirket Adı
          <input class="form__input" name="companyName" value="${p.companyName}" required />
        </label>
        <label class="form__label">Sektör
          <input class="form__input" name="sector" value="${p.sector}" />
        </label>
        <label class="form__label">Çalışan Sayısı
          <input class="form__input" name="employees" type="number" value="${p.employees}" />
        </label>
        <label class="form__label">Ülke
          <input class="form__input" name="country" value="${p.country}" />
        </label>
        <label class="form__label">Para Birimi
          <select class="form__input" name="currency">
            <option ${p.currency === 'TRY' ? 'selected' : ''}>TRY</option>
            <option ${p.currency === 'EUR' ? 'selected' : ''}>EUR</option>
            <option ${p.currency === 'USD' ? 'selected' : ''}>USD</option>
          </select>
        </label>
      </form>`,
    footerHtml: `
      <button type="button" class="btn btn--ghost" data-modal-close>İptal</button>
      <button type="button" class="btn btn--primary" id="save-profile">Kaydet</button>`,
  });

  document.getElementById('save-profile')?.addEventListener('click', () => {
    const form = document.getElementById('form-profile');
    pageData.profile = {
      companyName: form.companyName.value,
      sector: form.sector.value,
      employees: Number(form.employees.value),
      country: form.country.value,
      currency: form.currency.value,
    };
    Object.entries(pageData.profile).forEach(([key, val]) => {
      const el = document.querySelector(`[data-field="${key}"]`);
      if (el) el.textContent = val;
    });
    closeModal();
    showToast('Profil bilgileri kaydedildi (demo)', 'success');
  });
}

export function initSettingsPage() {
  const page = document.getElementById('page-settings');
  if (!page || !pageData) return;

  bindPageTabs(page, (tabId) => {
    const label = SETTINGS_TABS.find((t) => t.id === tabId)?.label;
    showToast(`${label} sekmesi`, 'info');
  });

  document.getElementById('btn-update-profile')?.addEventListener('click', openProfileEditModal);

  document.getElementById('btn-download-system')?.addEventListener('click', () => {
    downloadJson('ecobyte-sistem-bilgileri.json', pageData.system);
    showToast('Sistem bilgileri indirildi', 'success');
  });

  document.getElementById('btn-change-logo')?.addEventListener('click', () => {
    openModal({
      title: 'Logo Değiştir',
      bodyHtml: `
        <p class="modal-text">PNG veya SVG yükleyin (max 2MB). Önizleme anında güncellenir.</p>
        <input type="file" id="logo-file" accept="image/png,image/svg+xml,image/jpeg" class="form__input" />`,
      footerHtml: `
        <button type="button" class="btn btn--ghost" data-modal-close>İptal</button>
        <button type="button" class="btn btn--primary" id="apply-logo">Uygula</button>`,
    });
    document.getElementById('apply-logo')?.addEventListener('click', () => {
      const file = document.getElementById('logo-file')?.files?.[0];
      if (!file) {
        showToast('Dosya seçin', 'error');
        return;
      }
      const url = URL.createObjectURL(file);
      document.getElementById('logo-preview').innerHTML =
        `<img src="${url}" alt="Yeni logo" class="settings-logo__img" />`;
      closeModal();
      showToast('Logo önizlemesi güncellendi', 'success');
    });
  });

  page.querySelectorAll('[data-action="coming-soon"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      showToast('Bu ayar backend hazır olunca aktif olacak', 'info');
    });
  });
}
