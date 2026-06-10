import { api } from '../api/client.js';
import { renderLogoImg, setLogoSrc } from '../utils/ecobyteLogo.js';
import { openModal, closeModal, showToast, bindPageTabs, downloadJson } from '../utils/ui.js';
import { escapeHtml } from '../utils/text.js';

const SETTINGS_TABS = [
  { id: 'genel', label: 'Genel' },
  { id: 'kullanici', label: 'Kullanıcılar' },
  { id: 'rol', label: 'Yetkiler' },
  { id: 'bildirim', label: 'Bildirimler' },
  { id: 'entegrasyon', label: 'Entegrasyonlar' },
  { id: 'veri', label: 'Veri' },
  { id: 'guvenlik', label: 'Güvenlik' },
  { id: 'yedekleme', label: 'Yedekleme' },
];

const SETTINGS_FIELDS = {
  kullanici: [
    { name: 'defaultRole', label: 'Yeni kullanıcı varsayılan rolü', type: 'select', options: ['Analist', 'Denetçi', 'Yönetici'] },
    { name: 'requireInviteApproval', label: 'Kullanıcı davetlerinde yönetici onayı iste', type: 'checkbox' },
  ],
  rol: [
    { name: 'analystCanExport', label: 'Analistler rapor dışa aktarabilsin', type: 'checkbox' },
    { name: 'auditorReadOnly', label: 'Denetçi rolünü salt okunur tut', type: 'checkbox' },
  ],
  bildirim: [
    { name: 'emailNotifications', label: 'E-posta bildirimlerini gönder', type: 'checkbox' },
    { name: 'criticalAlerts', label: 'Kritik uyarıları anında bildir', type: 'checkbox' },
    { name: 'weeklySummary', label: 'Haftalık yönetici özeti gönder', type: 'checkbox' },
  ],
  entegrasyon: [
    { name: 'reportService', label: 'Kurumsal rapor servisini etkinleştir', type: 'checkbox' },
    { name: 'fileStorage', label: 'Dosya depolama entegrasyonunu etkinleştir', type: 'checkbox' },
    { name: 'syncIntervalMinutes', label: 'Eşitleme aralığı (dakika)', type: 'number', min: 5, max: 1440 },
  ],
  veri: [
    { name: 'autoSync', label: 'Kaynak verileri otomatik eşitle', type: 'checkbox' },
    { name: 'retentionDays', label: 'Veri saklama süresi (gün)', type: 'number', min: 30, max: 3650 },
    { name: 'qualityWarnings', label: 'Veri kalitesi uyarılarını göster', type: 'checkbox' },
  ],
  guvenlik: [
    { name: 'twoFactorRequired', label: 'Yöneticiler için iki adımlı doğrulama iste', type: 'checkbox' },
    { name: 'sessionMinutes', label: 'Oturum süresi (dakika)', type: 'number', min: 5, max: 1440 },
    { name: 'ipRestriction', label: 'IP kısıtlamasını etkinleştir', type: 'checkbox' },
  ],
  yedekleme: [
    { name: 'enabled', label: 'Otomatik yedeklemeyi etkinleştir', type: 'checkbox' },
    { name: 'frequency', label: 'Yedekleme sıklığı', type: 'select', options: ['Saatlik', 'Günlük', 'Haftalık'] },
    { name: 'retentionDays', label: 'Yedek saklama süresi (gün)', type: 'number', min: 7, max: 3650 },
  ],
};

let pageData = null;

function createLogoDataUrl(file) {
  return new Promise((resolve, reject) => {
    const sourceUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, 600 / image.naturalWidth, 200 / image.naturalHeight);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(sourceUrl);
      const dataUrl = canvas.toDataURL('image/webp', 0.88);
      if (dataUrl.length > 90_000) reject(new Error('Logo dosyası optimize edildikten sonra da çok büyük.'));
      else resolve(dataUrl);
    };
    image.onerror = () => {
      URL.revokeObjectURL(sourceUrl);
      reject(new Error('Logo görseli okunamadı.'));
    };
    image.src = sourceUrl;
  });
}

function renderGeneralPanel(profile, system) {
  return `
    <div class="settings-grid" data-tab-panel="genel">
      <section class="card settings-card">
        <h3 class="card__heading">Profil Bilgileri</h3>
        <dl class="info-list" id="profile-display">
          <div><dt>Şirket Adı</dt><dd data-field="companyName">${escapeHtml(profile.companyName)}</dd></div>
          <div><dt>Sektör</dt><dd data-field="sector">${escapeHtml(profile.sector)}</dd></div>
          <div><dt>Çalışan Sayısı</dt><dd data-field="employees">${escapeHtml(profile.employees)}</dd></div>
          <div><dt>Ülke</dt><dd data-field="country">${escapeHtml(profile.country)}</dd></div>
          <div><dt>Para Birimi</dt><dd data-field="currency">${escapeHtml(profile.currency)}</dd></div>
        </dl>
        <button type="button" class="btn btn--primary" id="btn-update-profile">Güncelle</button>
      </section>

      <section class="card settings-card">
        <h3 class="card__heading">Sistem Bilgileri</h3>
        <dl class="info-list">
          <div><dt>Sürüm</dt><dd>${escapeHtml(system.version)}</dd></div>
          <div><dt>Son Güncelleme</dt><dd>${escapeHtml(system.lastUpdate)}</dd></div>
          <div><dt>Veritabanı</dt><dd>${escapeHtml(system.database)}</dd></div>
          <div><dt>Lisans</dt><dd>${escapeHtml(system.license)}</dd></div>
        </dl>
        <button type="button" class="btn btn--ghost btn--block-center" id="btn-download-system">İndir</button>
      </section>

      <section class="card settings-card settings-card--logo">
        <h3 class="card__heading">Logo ve Marka</h3>
        <div class="settings-logo" id="logo-preview">${renderLogoImg('settings-logo__img')}</div>
        <button type="button" class="btn btn--ghost btn--block-center" id="btn-change-logo">Değiştir</button>
      </section>
    </div>`;
}

function renderSettingField(field, value) {
  if (field.type === 'checkbox') {
    return `
      <label class="form__label settings-card__label">
        <input type="checkbox" name="${field.name}" ${value ? 'checked' : ''} />
        ${escapeHtml(field.label)}
      </label>`;
  }
  if (field.type === 'select') {
    return `
      <label class="form__label">${escapeHtml(field.label)}
        <select class="form__input" name="${field.name}">
          ${field.options.map((option) => `<option ${value === option ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}
        </select>
      </label>`;
  }
  return `
    <label class="form__label">${escapeHtml(field.label)}
      <input class="form__input" name="${field.name}" type="number" min="${field.min}" max="${field.max}" value="${escapeHtml(value)}" required />
    </label>`;
}

function renderSettingsPanel(tabId, title) {
  const fields = SETTINGS_FIELDS[tabId] || [];
  const values = pageData.preferences?.[tabId] ?? {};
  const hint = tabId === 'guvenlik'
    ? 'Oturum süresi yeni girişlerde uygulanır; diğer seçenekler kurumsal güvenlik politikası olarak saklanır.'
    : 'Bu tercihler yönetim politikası olarak operasyonel depoda kalıcı saklanır.';
  const securityAction = tabId === 'guvenlik'
    ? '<button type="button" class="btn btn--ghost" id="btn-change-password">Parola Değiştir</button>'
    : '';
  return `
    <div class="settings-grid tab-panel" data-tab-panel="${tabId}" hidden>
      <section class="card settings-card">
        <h3 class="card__heading">${escapeHtml(title)}</h3>
        <p class="card__meta">${hint}</p>
        <form class="form" data-settings-form="${tabId}">
          ${fields.map((field) => renderSettingField(field, values[field.name])).join('')}
        </form>
        ${securityAction}
        <button type="button" class="btn btn--primary" data-action="save-settings">Kaydet</button>
      </section>
    </div>`;
}

export function renderSettingsPage(data) {
  pageData = JSON.parse(JSON.stringify(data));
  pageData.preferences ??= {};
  const { profile, system } = pageData;

  const tabsHtml = SETTINGS_TABS.map(
    (t, i) =>
      `<button type="button" class="page-tab ${i === 0 ? 'page-tab--active' : ''}" data-tab="${t.id}">${t.label}</button>`
  ).join('');

  const otherPanels = SETTINGS_TABS.slice(1)
    .map((t) => renderSettingsPanel(t.id, t.label))
    .join('');

  return `
    <div class="page" id="page-settings">
      <div>
        <h2 class="page-title page-title--left">Ayarlar</h2>
        <p class="page-header__subtitle">Firma profili, entegrasyon, güvenlik ve veri tercihleri</p>
      </div>
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
          <input class="form__input" name="companyName" value="${escapeHtml(p.companyName)}" required />
        </label>
        <label class="form__label">Sektör
          <input class="form__input" name="sector" value="${escapeHtml(p.sector)}" />
        </label>
        <label class="form__label">Çalışan Sayısı
          <input class="form__input" name="employees" type="number" value="${escapeHtml(p.employees)}" />
        </label>
        <label class="form__label">Ülke
          <input class="form__input" name="country" value="${escapeHtml(p.country)}" />
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

  document.getElementById('save-profile')?.addEventListener('click', async () => {
    const form = document.getElementById('form-profile');
    const nextProfile = {
      companyName: form.companyName.value,
      sector: form.sector.value,
      employees: Number(form.employees.value),
      country: form.country.value,
      currency: form.currency.value,
    };
    try {
      pageData.profile = await api.updateProfile(nextProfile);
      Object.entries(pageData.profile).forEach(([key, val]) => {
        const el = document.querySelector(`[data-field="${key}"]`);
        if (el) el.textContent = val;
      });
      closeModal();
      showToast('Profil kaydedildi', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

export function initSettingsPage() {
  const page = document.getElementById('page-settings');
  if (!page || !pageData) return;

  bindPageTabs(page);

  document.getElementById('btn-update-profile')?.addEventListener('click', openProfileEditModal);

  document.getElementById('btn-download-system')?.addEventListener('click', () => {
    downloadJson('ecobyte-sistem-bilgileri.json', pageData.system);
    showToast('Dosya indirildi', 'success');
  });

  document.getElementById('btn-change-logo')?.addEventListener('click', () => {
    openModal({
      title: 'Logo Değiştir',
      bodyHtml: `<input type="file" id="logo-file" accept="image/png,image/jpeg,image/webp" class="form__input" />`,
      footerHtml: `
        <button type="button" class="btn btn--ghost" data-modal-close>İptal</button>
        <button type="button" class="btn btn--primary" id="apply-logo">Uygula</button>`,
    });
    document.getElementById('apply-logo')?.addEventListener('click', async () => {
      const file = document.getElementById('logo-file')?.files?.[0];
      if (!file) {
        showToast('Dosya seçin', 'error');
        return;
      }
      try {
        const dataUrl = await createLogoDataUrl(file);
        const result = await api.updateBrandLogo({ dataUrl });
        pageData.brandLogoDataUrl = result.brandLogoDataUrl;
        setLogoSrc(result.brandLogoDataUrl);
        document.querySelectorAll('.sidebar__logo-img, .settings-logo__img').forEach((image) => {
          image.src = result.brandLogoDataUrl;
        });
        closeModal();
        showToast('Logo kalıcı olarak güncellendi', 'success');
      } catch (error) {
        showToast(error.message, 'error');
      }
    });
  });

  document.getElementById('btn-change-password')?.addEventListener('click', () => {
    openModal({
      title: 'Parola Değiştir',
      bodyHtml: `
        <form id="change-password-form" class="form">
          <label class="form__label">Mevcut parola<input class="form__input" name="currentPassword" type="password" autocomplete="current-password" required /></label>
          <label class="form__label">Yeni parola<input class="form__input" name="newPassword" type="password" autocomplete="new-password" minlength="10" required /></label>
          <label class="form__label">Yeni parola tekrar<input class="form__input" name="confirmPassword" type="password" autocomplete="new-password" minlength="10" required /></label>
        </form>`,
      footerHtml: `
        <button type="button" class="btn btn--ghost" data-modal-close>İptal</button>
        <button type="button" class="btn btn--primary" id="save-new-password">Parolayı Güncelle</button>`,
    });
    document.getElementById('save-new-password')?.addEventListener('click', async () => {
      const form = document.getElementById('change-password-form');
      if (!form.reportValidity()) return;
      if (form.newPassword.value !== form.confirmPassword.value) {
        showToast('Yeni parolalar eşleşmiyor', 'error');
        return;
      }
      try {
        await api.changePassword({
          currentPassword: form.currentPassword.value,
          newPassword: form.newPassword.value,
        });
        closeModal();
        showToast('Parola değiştirildi. Yeniden giriş yapılıyor.', 'success');
        window.dispatchEvent(new CustomEvent('ecobyte:logout-request'));
      } catch (error) {
        showToast(error.message, 'error');
      }
    });
  });

  page.querySelectorAll('[data-action="save-settings"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const panel = btn.closest('[data-tab-panel]');
      const section = panel?.dataset.tabPanel ?? '';
      const form = panel?.querySelector('[data-settings-form]');
      const fields = SETTINGS_FIELDS[section] ?? [];
      if (!form?.reportValidity()) return;
      const payload = Object.fromEntries(fields.map((field) => {
        const input = form?.elements.namedItem(field.name);
        if (field.type === 'checkbox') return [field.name, Boolean(input?.checked)];
        if (field.type === 'number') return [field.name, Number(input?.value)];
        return [field.name, input?.value ?? ''];
      }));
      try {
        const result = await api.updateSettingsSection(section, payload);
        pageData.preferences[section] = result.values;
        showToast('Ayarlar kaydedildi', 'success');
      } catch (error) {
        showToast(error.message, 'error');
      }
    });
  });
}
