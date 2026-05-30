import { icons } from '../utils/icons.js';
import { formatNumber } from '../utils/format.js';

export function renderKPICards(summary, trend) {
  const trendData = trend?.map((r) => r.actual) || [9800, 10200, 10800, 11500, 11800, 12450];
  const profitTrend = [45, 52, 48, 55, 60, 58, 62, 65];
  const quotaClass = summary.quotaExceeded ? 'text-danger' : 'text-accent';

  return `
    <div class="kpi-grid">
      <article class="card">
        <p class="card__label">Toplam Emisyon</p>
        <p class="card__value">${formatNumber(summary.totalEmission)} <span class="card__unit">tCO2e</span></p>
        <p class="card__trend">${icons.trending} +${summary.trendPercent}% geçen aya göre</p>
        <div class="sparkline-wrap"><canvas id="spark-emission" height="36"></canvas></div>
      </article>

      <article class="card">
        <p class="card__label">Emisyon Kotası</p>
        <p class="card__value">${formatNumber(summary.quotaLimit)} <span class="card__unit">tCO2e</span></p>
        <div class="progress">
          <div class="progress__labels"><span>Kullanım</span><span>${summary.usedPercent}%</span></div>
          <div class="progress__track"><div class="progress__bar" style="width:${summary.usedPercent}%"></div></div>
        </div>
      </article>

      <article class="card">
        <p class="card__label card__label--icon">${icons.target} Kota Durumu</p>
        <p class="card__status ${quotaClass}">${summary.quotaStatus}</p>
        <p class="card__meta">Kalan: ${formatNumber(summary.remaining)} tCO2e</p>
      </article>

      <article class="card">
        <p class="card__label card__label--icon">${icons.euro} Potansiyel Kazanç / Vergi</p>
        <p class="card__profit">+${formatNumber(summary.potentialProfit)} €</p>
        <div class="sparkline-wrap"><canvas id="spark-profit" height="36"></canvas></div>
      </article>
    </div>`;
}
