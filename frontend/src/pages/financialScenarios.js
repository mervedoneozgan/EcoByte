import { api } from '../api/client.js';
import { formatEuro, formatNumber } from '../utils/format.js';
import { showToast } from '../utils/ui.js';
import { escapeHtml } from '../utils/text.js';

let pageData = null;

function buildRows(data) {
  const base = data.summary.estimatedTradingProfit;
  const latestYear = Math.max(...data.trend.map((item) => item.year));
  const currentYearTrend = data.trend.filter((item) => item.year === latestYear);
  const electricity = currentYearTrend.reduce((sum, item) => sum + item.electricityEmission, 0);
  const gas = currentYearTrend.reduce((sum, item) => sum + item.naturalGasEmission, 0);
  return [
    { name: 'Enerji verimliliği', reduction: electricity * 0.12, investment: 42000, saving: base * 0.18, payback: '18 ay' },
    { name: 'Doğalgaz optimizasyonu', reduction: gas * 0.09, investment: 26000, saving: base * 0.11, payback: '14 ay' },
    { name: 'Kota ticareti', reduction: 0, investment: 0, saving: base, payback: 'Tahsis gerekli' },
  ];
}

function renderHistory(items) {
  if (!items.length) return '<div class="data-list__row"><dt>Durum</dt><dd>Henüz kayıt yok</dd></div>';
  return items
    .map((item) => `<div class="data-list__row"><dt>${escapeHtml(item.name)}</dt><dd>${escapeHtml(new Date(item.createdAt).toLocaleString('tr-TR'))}</dd></div>`)
    .join('');
}

export function renderFinancialScenariosPage(data) {
  pageData = JSON.parse(JSON.stringify(data));
  const rows = buildRows(pageData);
  const totalReduction = rows.reduce((sum, row) => sum + row.reduction, 0);
  const totalSaving = rows.reduce((sum, row) => sum + row.saving, 0);
  const totalInvestment = rows.reduce((sum, row) => sum + row.investment, 0);
  const roi = totalInvestment ? ((totalSaving - totalInvestment) / totalInvestment) * 100 : 0;

  return `
    <div class="page" id="page-scenarios">
      <div class="page-toolbar">
        <div><h2 class="page-title page-title--left">Finansal Senaryolar</h2><p class="page-header__subtitle">Azaltım, yatırım, geri dönüş ve kota geliri analizi</p></div>
        <button type="button" class="btn btn--primary" id="btn-scenario-export">Analizi Kaydet</button>
      </div>
      <div class="summary-grid summary-grid--4">
        <div class="summary-card summary-card--accent"><p class="summary-card__label">Toplam azaltım</p><p class="summary-card__value">${formatNumber(totalReduction)} tCO2e</p></div>
        <div class="summary-card"><p class="summary-card__label">Yatırım</p><p class="summary-card__value">${formatEuro(totalInvestment)}</p></div>
        <div class="summary-card"><p class="summary-card__label">Getiri</p><p class="summary-card__value">${formatEuro(totalSaving)}</p></div>
        <div class="summary-card"><p class="summary-card__label">ROI</p><p class="summary-card__value">${roi.toFixed(1)}%</p></div>
      </div>
      <section class="card card--table">
        <h3 class="card__heading">Senaryo matrisi</h3>
        <div class="table-wrap"><table class="data-table">
          <thead><tr><th>Senaryo</th><th>Azaltım</th><th>Yatırım</th><th>Getiri</th><th>Geri dönüş</th></tr></thead>
          <tbody>${rows.map((row) => `<tr><td>${row.name}</td><td>${formatNumber(row.reduction)} tCO2e</td><td>${formatEuro(row.investment)}</td><td>${formatEuro(row.saving)}</td><td>${row.payback}</td></tr>`).join('')}</tbody>
        </table></div>
      </section>
      <div class="grid grid--3">
        ${pageData.scenarios.map((scenario) => `<section class="card"><h3 class="card__heading">${scenario.label}</h3><p class="card__value">${formatEuro(scenario.value)}</p><p class="card__meta">Piyasa ve azaltım varsayımı</p></section>`).join('')}
      </div>
      <section class="card"><h3 class="card__heading">Kayıt geçmişi</h3><dl class="data-list" id="scenario-history">${renderHistory(pageData.scenarioData?.exports ?? [])}</dl></section>
    </div>`;
}

export function initFinancialScenariosPage() {
  document.getElementById('btn-scenario-export')?.addEventListener('click', async () => {
    try {
      const item = await api.saveScenarioAnalysis({
        name: `Finansal senaryo analizi ${new Date().toLocaleDateString('tr-TR')}`,
        assumptions: { marketPrice: pageData.summary.marketPrice, quotaLimit: pageData.summary.quotaLimit },
      });
      pageData.scenarioData ??= { exports: [] };
      pageData.scenarioData.exports.unshift(item);
      document.getElementById('scenario-history').innerHTML = renderHistory(pageData.scenarioData.exports);
      showToast('Analiz backend üzerine kaydedildi', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}
