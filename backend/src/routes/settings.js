import { Router } from 'express';
import { company, settings } from '../data/platformData.js';
import { requireRole } from '../auth/middleware.js';
import { configureSessionDuration } from '../auth/authService.js';
import { readBoolean, readNumber, readPlainObject, readText, requireOneOf } from '../http/validation.js';
import { persistRuntimeSections } from '../data/runtimeStore.js';

const router = Router();
const SETTINGS_SECTIONS = ['kullanici', 'rol', 'bildirim', 'entegrasyon', 'veri', 'guvenlik', 'yedekleme'];
configureSessionDuration(settings.preferences.guvenlik.sessionMinutes);

function normalizeSection(section, body) {
  const payload = readPlainObject(body, 'Ayarlar', { maxKeys: 10 });
  switch (section) {
    case 'kullanici':
      return {
        defaultRole: requireOneOf(readText(payload.defaultRole, 'Varsayılan rol', { required: true }), 'Varsayılan rol', ['Analist', 'Denetçi', 'Yönetici']),
        requireInviteApproval: readBoolean(payload.requireInviteApproval, 'Davet onayı'),
      };
    case 'rol':
      return {
        analystCanExport: readBoolean(payload.analystCanExport, 'Analist dışa aktarma yetkisi'),
        auditorReadOnly: readBoolean(payload.auditorReadOnly, 'Denetçi salt okunur yetkisi'),
      };
    case 'bildirim':
      return {
        emailNotifications: readBoolean(payload.emailNotifications, 'E-posta bildirimleri'),
        criticalAlerts: readBoolean(payload.criticalAlerts, 'Kritik uyarılar'),
        weeklySummary: readBoolean(payload.weeklySummary, 'Haftalık özet'),
      };
    case 'entegrasyon':
      return {
        reportService: readBoolean(payload.reportService, 'Rapor servisi'),
        fileStorage: readBoolean(payload.fileStorage, 'Dosya depolama'),
        syncIntervalMinutes: readNumber(payload.syncIntervalMinutes, 'Eşitleme aralığı', { integer: true, min: 5, max: 1440 }),
      };
    case 'veri':
      return {
        autoSync: readBoolean(payload.autoSync, 'Otomatik eşitleme'),
        retentionDays: readNumber(payload.retentionDays, 'Veri saklama süresi', { integer: true, min: 30, max: 3650 }),
        qualityWarnings: readBoolean(payload.qualityWarnings, 'Veri kalitesi uyarıları'),
      };
    case 'guvenlik':
      return {
        twoFactorRequired: readBoolean(payload.twoFactorRequired, 'İki adımlı doğrulama'),
        sessionMinutes: readNumber(payload.sessionMinutes, 'Oturum süresi', { integer: true, min: 5, max: 1440 }),
        ipRestriction: readBoolean(payload.ipRestriction, 'IP kısıtı'),
      };
    case 'yedekleme':
      return {
        enabled: readBoolean(payload.enabled, 'Otomatik yedekleme'),
        frequency: requireOneOf(readText(payload.frequency, 'Yedekleme sıklığı', { required: true }), 'Yedekleme sıklığı', ['Saatlik', 'Günlük', 'Haftalık']),
        retentionDays: readNumber(payload.retentionDays, 'Yedek saklama süresi', { integer: true, min: 7, max: 3650 }),
      };
    default:
      return {};
  }
}

router.get('/', (_req, res) => res.json(settings));
router.put('/profile', requireRole('admin'), (req, res) => {
  const payload = readPlainObject(req.body, 'Profil');
  settings.profile = {
    companyName: readText(payload.companyName, 'Şirket adı', { required: true, maxLength: 160 }),
    sector: readText(payload.sector, 'Sektör', { required: true, maxLength: 100 }),
    employees: readNumber(payload.employees, 'Çalışan sayısı', { integer: true, min: 0, max: 1_000_000 }),
    country: readText(payload.country, 'Ülke', { required: true, maxLength: 100 }),
    currency: requireOneOf(readText(payload.currency, 'Para birimi', { required: true, maxLength: 3 }), 'Para birimi', ['TRY', 'EUR', 'USD']),
  };
  company.name = settings.profile.companyName;
  company.sector = settings.profile.sector;
  persistRuntimeSections({ settings });
  res.json(settings.profile);
});
router.put('/logo', requireRole('admin'), (req, res) => {
  settings.brandLogoDataUrl = readText(req.body?.dataUrl, 'Logo', {
    required: true,
    maxLength: 90_000,
    pattern: /^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/u,
  });
  persistRuntimeSections({ settings });
  res.json({ brandLogoDataUrl: settings.brandLogoDataUrl });
});
router.put('/:section', requireRole('admin'), (req, res) => {
  const section = requireOneOf(String(req.params.section), 'Ayar bölümü', SETTINGS_SECTIONS);
  settings.preferences ??= {};
  settings.preferences[section] = {
    ...normalizeSection(section, req.body),
    savedAt: new Date().toISOString(),
  };
  if (section === 'guvenlik') configureSessionDuration(settings.preferences.guvenlik.sessionMinutes);
  persistRuntimeSections({ settings });
  res.json({ section, values: settings.preferences[section], saved: true });
});

export default router;
