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

export function renderDistributionLegend(distribution) {
  return distribution.items
    .map(
      (item) => `
      <div class="legend-item">
        <span class="legend-item__dot" style="background:${item.color}"></span>
        <span class="legend-item__name">${item.name}</span>
        <span class="legend-item__percent">${formatNumber(item.value)} ${item.unit} · ${item.percent}%</span>
      </div>`
    )
    .join('');
}

export function renderDistributionChart(distribution) {
  const selectedYear = distribution.selectedYear ?? distribution.year;
  const yearButtons = (distribution.years ?? [distribution])
    .map((item) => `
      <button type="button"
        class="segmented__item ${item.year === selectedYear ? 'segmented__item--active' : ''}"
        data-distribution-year="${item.year}"
        aria-pressed="${item.year === selectedYear ? 'true' : 'false'}">${item.year}</button>`)
    .join('');

  return `
    <article class="card card--chart">
      <div class="card__heading-row">
        <div>
          <h3 class="card__heading">Toplam Emisyon Dağılımı</h3>
          <p class="card__meta" id="distribution-chart-meta">${selectedYear} yıllık brüt emisyon · Kapsam 1 + 2</p>
        </div>
        <div class="segmented chart-filters" aria-label="Dağılım yılı seçimi">${yearButtons}</div>
      </div>
      <div class="chart-box chart-box--donut">
        <canvas id="chart-distribution"></canvas>
        <div class="donut-center">
          <span class="donut-center__label" id="distribution-total-label">${selectedYear} toplam</span>
          <span class="donut-center__value" id="distribution-total">${formatNumber(distribution.total)}</span>
          <span class="donut-center__unit">tCO2e</span>
        </div>
      </div>
      <div class="legend-grid" id="distribution-legend">${renderDistributionLegend(distribution)}</div>
      <p class="trade-card-note" id="distribution-chart-note">${distribution.note ?? 'Yıllık dağılım elektrik, doğalgaz ve dönem atanmamış yakıt emisyonlarını gösterir.'}</p>
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
  const annualQuotas = summary.annualQuotas ?? [];
  const selectedQuota = annualQuotas.find((item) => item.year === summary.quotaYear) ?? {
    year: summary.quotaYear,
    actualEmission: summary.quotaEmission,
    quotaLimit: summary.quotaLimit,
    usedPercent: summary.usedPercent,
    status: summary.quotaStatus,
    hasActual: summary.quotaMeasurementAvailable,
    hasQuota: true,
  };
  const yearButtons = annualQuotas
    .map((item) => `
      <button type="button"
        class="segmented__item ${item.year === selectedQuota.year ? 'segmented__item--active' : ''}"
        data-quota-year="${item.year}"
        aria-pressed="${item.year === selectedQuota.year ? 'true' : 'false'}">${item.year}</button>`)
    .join('');

  return `
    <article class="card card--chart">
      <div class="card__heading-row">
        <div>
          <h3 class="card__heading">Emisyon Kotası</h3>
          <p class="card__meta" id="quota-chart-meta">${selectedQuota.year} · ${selectedQuota.status}</p>
        </div>
        <div class="segmented chart-filters" aria-label="Kota yılı seçimi">${yearButtons}</div>
      </div>
      <div class="chart-box chart-box--gauge"><canvas id="chart-quota"></canvas></div>
      <div class="gauge-footer">
        <p class="gauge-footer__percent" id="quota-gauge-percent">${selectedQuota.usedPercent === null ? '-' : `${selectedQuota.usedPercent}%`}</p>
        <div class="gauge-footer__stats">
          <div>
            <p class="gauge-footer__label">Yıllık emisyon</p>
            <p class="gauge-footer__value" id="quota-gauge-actual">${selectedQuota.hasActual ? `${formatNumber(selectedQuota.actualEmission)} t` : 'Ölçüm bekleniyor'}</p>
          </div>
          <div>
            <p class="gauge-footer__label">Kota limiti</p>
            <p class="gauge-footer__value gauge-footer__value--accent" id="quota-gauge-limit">${selectedQuota.hasQuota ? `${formatNumber(selectedQuota.quotaLimit)} t` : 'Tanımlı değil'}</p>
          </div>
        </div>
      </div>
      <p class="trade-card-note" id="quota-chart-note">Kota ve gerçekleşen emisyon yalnızca aynı yıl içinde karşılaştırılır.</p>
    </article>`;
}
