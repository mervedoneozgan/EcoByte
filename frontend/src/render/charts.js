import { formatNumber } from '../utils/format.js';
import { escapeHtml } from '../utils/text.js';

export function renderTrendChart(years = [2024, 2025]) {
  const selectedYear = Math.max(...years);
  const yearButtons = years
    .map((year) => `
      <button type="button"
        class="segmented__item ${year === selectedYear ? 'segmented__item--active' : ''}"
        data-trend-year="${year}"
        aria-pressed="${year === selectedYear ? 'true' : 'false'}">${year}</button>`)
    .join('');

  return `
    <article class="card card--chart">
      <div class="card__heading-row">
        <div>
          <h3 class="card__heading">Aylık Emisyon Trendi</h3>
          <p class="card__meta" id="trend-chart-meta">${selectedYear} elektrik emisyonu</p>
        </div>
        <div class="chart-heading-actions">
          <div class="segmented chart-filters" aria-label="Emisyon kaynağı seçimi">
            <button type="button" class="segmented__item segmented__item--active" data-trend-source="electricity" aria-pressed="true">Elektrik</button>
            <button type="button" class="segmented__item" data-trend-source="naturalGas" aria-pressed="false">Doğalgaz</button>
            <button type="button" class="segmented__item" data-trend-source="fuel" aria-pressed="false">Yakıt</button>
          </div>
          <div class="segmented chart-filters" aria-label="Emisyon yılı seçimi">${yearButtons}</div>
        </div>
      </div>
      <div class="chart-box"><canvas id="chart-trend"></canvas></div>
      <p class="trade-card-note" id="trend-chart-note">Grafik, seçilen yılın elektrik kaynaklı aylık emisyon değerlerini gösterir.</p>
    </article>`;
}

export function renderDistributionChart(distribution) {
  const legend = distribution.items
    .map(
      (item) => `
      <div class="legend-item">
        <span class="legend-item__dot" style="background:${item.color}"></span>
        <span class="legend-item__name">${item.name}</span>
        <span class="legend-item__percent">${formatNumber(item.value)} ${item.unit} · ${item.percent}%</span>
      </div>`
    )
    .join('');

  return `
    <article class="card card--chart">
      <h3 class="card__heading">Toplam Emisyon Dağılımı</h3>
      <div class="chart-box chart-box--donut">
        <canvas id="chart-distribution"></canvas>
        <div class="donut-center">
          <span class="donut-center__label">Brüt toplam</span>
          <span class="donut-center__value">${formatNumber(distribution.total)}</span>
          <span class="donut-center__unit">tCO2e</span>
        </div>
      </div>
      <div class="legend-grid">${legend}</div>
      <p class="trade-card-note">Tek halka yalnızca elektrik, doğalgaz ve yakıtın brüt emisyon paylarını gösterir.</p>
    </article>`;
}

export function renderSolarProductionChart(solar) {
  const facilities = solar.facilities ?? [];
  const selectedFacility = facilities[0];
  const facilityButtons = facilities
    .map(
      (facility, index) => `
        <button type="button"
          class="segmented__item ${index === 0 ? 'segmented__item--active' : ''}"
          data-solar-facility="${escapeHtml(facility.key)}"
          aria-pressed="${index === 0 ? 'true' : 'false'}">${escapeHtml(facility.label)}</button>`
    )
    .join('');

  return `
    <article class="card card--chart card--positive">
      <div class="card__heading-row">
        <div>
          <h3 class="card__heading">GES Üretimi</h3>
          <p class="card__meta" id="solar-chart-meta">${escapeHtml(selectedFacility?.label ?? 'Tesis toplamı')} · aylık ortalama ${formatNumber(selectedFacility?.monthlyAverageKwh ?? solar.monthlyAverageKwh)} kWh</p>
        </div>
        <div class="chart-heading-actions">
          <div class="segmented chart-filters chart-filters--solar" aria-label="GES tesisi seçimi">${facilityButtons}</div>
          <strong class="text-accent" id="solar-positive-impact">+${formatNumber(selectedFacility?.positiveImpactTco2 ?? solar.positiveImpactTco2)} tCO2 pozitif etki</strong>
        </div>
      </div>
      <div class="chart-box"><canvas id="chart-solar-production"></canvas></div>
      <div class="legend-grid">
        <div class="legend-item">
          <span class="legend-item__name">Yıllık GES üretimi</span>
          <span class="legend-item__percent" id="solar-production-total">${formatNumber(selectedFacility?.productionKwh ?? solar.totalProductionKwh)} kWh</span>
        </div>
        <div class="legend-item">
          <span class="legend-item__name">Kaçınılan karbon emisyonu</span>
          <span class="legend-item__percent" id="solar-impact-total">+${formatNumber(selectedFacility?.positiveImpactTco2 ?? solar.positiveImpactTco2)} tCO2</span>
        </div>
      </div>
      <p class="trade-card-note">Seçilen GES tesisinin üretimi ve kaçınılan karbon emisyonu birlikte gösterilir.</p>
    </article>`;
}

export function renderQuotaGauge(summary) {
  const used = summary.quotaEmission ?? (
    summary.quotaExceeded ? summary.quotaLimit : summary.quotaLimit - summary.remaining
  );

  return `
    <article class="card card--chart">
      <h3 class="card__heading">Emisyon Kotası</h3>
      <p class="card__meta">${summary.quotaYear} kurumsal kota limiti · ${summary.quotaBaselineYear} Scope 1+2 baz yılı</p>
      <div class="chart-box chart-box--gauge"><canvas id="chart-quota"></canvas></div>
      <div class="gauge-footer">
        <p class="gauge-footer__percent">${summary.usedPercent}%</p>
        <div class="gauge-footer__stats">
          <div>
            <p class="gauge-footer__label">Kullanılan</p>
            <p class="gauge-footer__value">${formatNumber(used)} t</p>
          </div>
          <div>
            <p class="gauge-footer__label">${summary.quotaExceeded ? 'Aşım' : 'Kalan'}</p>
            <p class="gauge-footer__value ${summary.quotaExceeded ? 'text-danger' : 'gauge-footer__value--accent'}">
              ${formatNumber(summary.quotaExceeded ? summary.overage : summary.remaining)} t
            </p>
          </div>
        </div>
      </div>
    </article>`;
}
