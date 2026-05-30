import { formatNumber } from '../utils/format.js';

export function renderTrendChart() {
  return `
    <article class="card card--chart">
      <h3 class="card__heading">Emisyon Trendi</h3>
      <div class="chart-box"><canvas id="chart-trend"></canvas></div>
    </article>`;
}

export function renderDistributionChart(distribution) {
  const legend = distribution.items
    .map(
      (item) => `
      <div class="legend-item">
        <span class="legend-item__dot" style="background:${item.color}"></span>
        <span class="legend-item__name">${item.name}</span>
        <span class="legend-item__percent">${item.percent}%</span>
      </div>`
    )
    .join('');

  return `
    <article class="card card--chart">
      <h3 class="card__heading">Emisyon Dağılımı</h3>
      <div class="chart-box chart-box--donut">
        <canvas id="chart-distribution"></canvas>
        <div class="donut-center">
          <span class="donut-center__label">Toplam</span>
          <span class="donut-center__value">${formatNumber(distribution.total)}</span>
          <span class="donut-center__unit">tCO2e</span>
        </div>
      </div>
      <div class="legend-grid">${legend}</div>
    </article>`;
}

export function renderQuotaGauge(summary) {
  return `
    <article class="card card--chart">
      <h3 class="card__heading">Kota Kullanım Özeti</h3>
      <div class="chart-box chart-box--gauge"><canvas id="chart-quota"></canvas></div>
      <div class="gauge-footer">
        <p class="gauge-footer__percent">${summary.usedPercent}%</p>
        <div class="gauge-footer__stats">
          <div>
            <p class="gauge-footer__label">Kullanılan</p>
            <p class="gauge-footer__value">${formatNumber(summary.quotaLimit - summary.remaining)} t</p>
          </div>
          <div>
            <p class="gauge-footer__label">Kalan</p>
            <p class="gauge-footer__value gauge-footer__value--accent">${formatNumber(summary.remaining)} t</p>
          </div>
        </div>
      </div>
    </article>`;
}
