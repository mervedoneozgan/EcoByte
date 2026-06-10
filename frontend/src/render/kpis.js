import { icons } from '../utils/icons.js';
import { formatNumber } from '../utils/format.js';

export function renderKPICards(summary) {
  const trendPrefix = summary.trendPercent >= 0 ? '+' : '';

  return `
    <div class="kpi-grid">
      <article class="card">
        <p class="card__label">${summary.reportingYear} Yıllık Brüt Emisyon</p>
        <p class="card__value">${formatNumber(summary.totalEmission)} <span class="card__unit">tCO2e</span></p>
        <p class="card__trend">${icons.trending} ${trendPrefix}${summary.trendPercent}% son ay enerji değişimi</p>
        <p class="card__meta">Elektrik + doğalgaz · Kapsam 1 + 2</p>
        <div class="sparkline-wrap"><canvas id="spark-emission" height="36"></canvas></div>
      </article>

      <article class="card">
        <p class="card__label">Elektrik Emisyonu</p>
        <p class="card__value">${formatNumber(summary.electricityEmission)} <span class="card__unit">tCO2e</span></p>
        <p class="card__meta">Şebeke elektriği · Kapsam 2</p>
      </article>

      <article class="card">
        <p class="card__label">Doğalgaz Emisyonu</p>
        <p class="card__value">${formatNumber(summary.naturalGasEmission)} <span class="card__unit">tCO2e</span></p>
        <p class="card__meta">Doğrudan yakıt kullanımı · Kapsam 1</p>
      </article>

      <article class="card">
        <p class="card__label">Yakıt Emisyonu</p>
        <p class="card__value">${formatNumber(summary.fuelEmissionUnassigned)} <span class="card__unit">tCO2e</span></p>
        <p class="card__meta">Mazot + benzin + LPG · dönem atanmamış</p>
      </article>

      <article class="card card--positive">
        <p class="card__label">GES Üretimi</p>
        <p class="card__value text-accent">${formatNumber(summary.solarProductionKwh)} <span class="card__unit">kWh</span></p>
        <p class="card__meta">Pozitif etki: +${formatNumber(summary.solarPositiveImpact)} tCO2</p>
      </article>
    </div>`;
}
