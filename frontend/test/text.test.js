import assert from 'node:assert/strict';
import test from 'node:test';
import { escapeHtml, normalizeDisplayText } from '../src/utils/text.js';
import { renderHeader } from '../src/render/header.js';
import {
  renderDistributionChart,
  renderQuotaGauge,
  renderSolarProductionChart,
  renderTrendChart,
} from '../src/render/charts.js';
import { renderTradingCard } from '../src/render/trading.js';
import { renderLoginPage } from '../src/pages/login.js';
import { renderSettingsPage } from '../src/pages/settings.js';
import { renderConsultancyPage } from '../src/pages/consultancy.js';
import { renderQuotaPage } from '../src/pages/quota.js';
import { bindModalCloseActions } from '../src/utils/ui.js';

test('escapes user-controlled values before HTML rendering', () => {
  assert.equal(
    escapeHtml('<img src=x onerror="alert(1)">'),
    '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;'
  );
});

test('repairs legacy mojibake without changing valid Turkish text', () => {
  assert.equal(normalizeDisplayText('KiÅŸisel araç'), 'Kişisel araç');
  assert.equal(normalizeDisplayText('Doğalgaz tüketimi'), 'Doğalgaz tüketimi');
});

test('escapes profile values rendered in the page header', () => {
  const html = renderHeader('<img src=x onerror="alert(1)">', 'Haziran 2026');
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img src=x/);
});

test('renders local login credentials without prefilling the form', () => {
  const html = renderLoginPage('<script>alert(1)</script>');
  assert.match(html, /admin@ecobyte\.com/);
  assert.match(html, /<code>1234<\/code>/);
  assert.doesNotMatch(html, /name="email"[^>]+value=/);
  assert.doesNotMatch(html, /<script>alert/);
  assert.match(html, /&lt;script&gt;alert/);
});

test('renders source filters for the emission trend', () => {
  const html = renderTrendChart([2024, 2025]);
  assert.match(html, /data-trend-source="electricity"/);
  assert.match(html, /data-trend-source="naturalGas"/);
  assert.match(html, /data-trend-source="fuel"/);
  assert.match(html, /data-trend-year="2024"/);
  assert.match(html, /data-trend-year="2025"/);
  assert.doesNotMatch(html, /varsay|kabul edilir|Kaynak CSV|Formül:/i);
});

test('renders all solar facility selectors', () => {
  const facilities = Array.from({ length: 5 }, (_, index) => ({
    key: `ges-${index}`,
    label: `GES ${index + 1}`,
    monthlyAverageKwh: 100,
    productionKwh: 1200,
    positiveImpactTco2: 10,
  }));
  const html = renderSolarProductionChart({ facilities, monthlyAverageKwh: 500 });
  assert.equal((html.match(/data-solar-facility=/g) ?? []).length, 5);
  assert.match(html, /Kaçınılan karbon emisyonu/);
});

test('renders 2024 and 2025 controls for annual emission distribution', () => {
  const years = [
    { year: 2024, total: 1397.003, scope: 'Kapsam 1 + Kapsam 2', note: 'Yıllık', items: [] },
    { year: 2025, total: 2160.351, scope: 'Kapsam 1 + Kapsam 2', note: 'Yıllık', items: [] },
  ];
  const html = renderDistributionChart({ ...years[1], selectedYear: 2025, years });

  assert.match(html, /data-distribution-year="2024"/);
  assert.match(html, /data-distribution-year="2025"/);
  assert.match(html, /2025 yıllık brüt emisyon/);
});

test('renders yearly quota controls with distinct baseline and target quotas', () => {
  const html = renderQuotaGauge({
    quotaYear: 2024,
    quotaStatus: 'Kota aşılmadı',
    quotaLimit: 5000,
    quotaEmission: null,
    quotaMeasurementAvailable: false,
    usedPercent: 27.9,
    annualQuotas: [
      { year: 2024, actualEmission: 1397.003, quotaLimit: 5000, hasActual: true, hasQuota: true, usedPercent: 27.9, status: 'Kota aşılmadı' },
      { year: 2025, actualEmission: 2160.351, quotaLimit: 5000, hasActual: true, hasQuota: true, usedPercent: 43.2, status: 'Kota aşılmadı' },
    ],
  });

  assert.match(html, /data-quota-year="2024"/);
  assert.match(html, /data-quota-year="2025"/);
  assert.match(html, /27\.9%/);
  assert.doesNotMatch(html, /Kota tanımlı değil/);
});

test('renders a dashboard action that opens emission trading', () => {
  const html = renderTradingCard({
    sellableSurplus: 100,
    marketPrice: 25.4,
    estimatedTradingProfit: 2540,
  });
  assert.match(html, /data-open-trading/);
  assert.match(html, /Satılabilir kota yalnızca belgelenmiş resmî ETS tahsisinden hesaplanır/);
});

test('renders yearly quota management with 2024 and 2025 quotas', () => {
  const annualQuotas = [
    {
      year: 2024, actualEmission: 1397.003, quotaLimit: 5000, baselineYear: 2024,
      hasQuota: true, hasActual: true, usedPercent: 27.9, remaining: 0, overage: 0,
      quotaExceeded: false, status: 'Kota aşılmadı',
    },
    {
      year: 2025, actualEmission: 2160.351, quotaLimit: 5000, baselineYear: 2025,
      hasQuota: true, hasActual: true, usedPercent: 43.2, remaining: 0, overage: 0,
      quotaExceeded: false, status: 'Kota aşılmadı',
    },
  ];
  const html = renderQuotaPage({
    summary: {
      quotaLimit: 5000,
      quotaEmission: null,
      quotaYear: 2025,
      quotaBaselineYear: 2025,
      quotaBaselineEmission: 5000,
      quotaReductionTarget: 0,
      quotaReductionPercent: 0,
      quotaScope: 'Kapsam 1 + Kapsam 2',
      quotaStatus: 'Yıllık ölçüm bekleniyor',
      etsStatus: 'Resmî ETS tahsisi bulunmuyor.',
      etsScreeningThresholdTco2e: 50000,
      usedPercent: null,
      quotaExceeded: false,
      overage: 0,
      remaining: null,
      sellableSurplus: 0,
      marketPrice: 25.4,
      estimatedTradingProfit: 0,
    },
    annualQuotas,
    plans: [],
    methodology: {
      title: '5.000 tCO2e Kurumsal Emisyon Kotası',
      legalNature: 'EcoByte içinde kullanılan kurumsal kotadır.',
      calculation: '2024 ve 2025 için kota limiti 5.000 tCO2e olarak sabitlendi.',
      regulatoryNotes: ['2024 ve 2025 için kota limiti 5.000 tCO2e olarak tanımlandı.'],
      exclusions: ['Dönemi belirsiz yakıt dahil değildir.'],
      sources: [{ label: 'Resmî kaynak', url: 'https://example.com' }],
    },
  });

  assert.match(html, /Kota Yönetimi/);
  assert.match(html, /5\.000 tCO2e Kurumsal Emisyon Kotası/);
  assert.match(html, /2025 kota limiti/);
  assert.match(html, /5\.000 tCO2e/);
  assert.match(html, /43\.2%/);
  assert.match(html, /Kota aşılmadı/);
  assert.match(html, /Yıllık kota karşılaştırması/);
  assert.match(html, /data-quota-page-year="2024"/);
  assert.match(html, /data-quota-page-year="2025"/);
  assert.match(html, /Satılabilir kota/);
  assert.match(html, /50\.000/);
});

test('renders persisted settings preferences as editable controls', () => {
  const html = renderSettingsPage({
    profile: { companyName: 'EcoByte', sector: 'Eğitim', employees: 250, country: 'Türkiye', currency: 'TRY' },
    system: { version: '2.1.0', lastUpdate: '09.06.2026', database: 'Hazır', license: 'Premium' },
    preferences: {
      kullanici: { defaultRole: 'Denetçi', requireInviteApproval: true },
      rol: {}, bildirim: {}, entegrasyon: {}, veri: {}, guvenlik: {}, yedekleme: {},
    },
  });
  assert.match(html, /data-settings-form="kullanici"/);
  assert.match(html, /<option selected>Denetçi<\/option>/);
  assert.match(html, /name="requireInviteApproval" checked/);
});

test('escapes consultancy values rendered from the API', () => {
  const malicious = '<img src=x onerror="alert(1)">';
  const html = renderConsultancyPage({
    summary: { total: 1, open: 1, ongoing: 0, completed: 0 },
    requests: [{ id: 1, title: malicious, expert: malicious, date: '09.06.2026', status: 'open', statusLabel: 'Açık' }],
    appointments: [{ id: 1, expert: malicious, service: malicious, datetime: malicious, avatar: malicious }],
    experts: [{ id: 1, name: malicious, specialty: malicious, rating: 5, requests: 1 }],
    services: [{ id: 1, name: malicious, duration: malicious, price: malicious }],
    documents: [{ id: 1, name: malicious, date: malicious, size: malicious }],
  });
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img src=x/);
});

test('closes modals from dynamically rendered cancel buttons', () => {
  let clickHandler;
  let closeCount = 0;
  const root = {
    addEventListener(type, handler) {
      if (type === 'click') clickHandler = handler;
    },
  };

  bindModalCloseActions(root, () => { closeCount += 1; });
  clickHandler({ target: { closest: (selector) => selector === '[data-modal-close]' ? {} : null } });
  clickHandler({ target: { closest: () => null } });

  assert.equal(closeCount, 1);
});
