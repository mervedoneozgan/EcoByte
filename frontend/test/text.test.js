import assert from 'node:assert/strict';
import test from 'node:test';
import { escapeHtml, normalizeDisplayText } from '../src/utils/text.js';
import { renderHeader } from '../src/render/header.js';
import { renderSolarProductionChart, renderTrendChart } from '../src/render/charts.js';
import { renderTradingCard } from '../src/render/trading.js';
import { renderLoginPage } from '../src/pages/login.js';
import { renderSettingsPage } from '../src/pages/settings.js';
import { renderConsultancyPage } from '../src/pages/consultancy.js';

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

test('renders a dashboard action that opens emission trading', () => {
  const html = renderTradingCard({
    sellableSurplus: 100,
    marketPrice: 25.4,
    estimatedTradingProfit: 2540,
  });
  assert.match(html, /data-open-trading/);
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
