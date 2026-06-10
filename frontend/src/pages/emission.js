import { formatNumber } from '../utils/format.js';
import { openModal, showToast } from '../utils/ui.js';

let pageData = null;

function renderMonthlyRows(records) {
  return records
    .map(
      (row) => `
      <tr>
        <td>${row.monthName}</td>
        <td>${formatNumber(row.electricityKwh)} kWh</td>
        <td>${formatNumber(row.naturalGasM3)} m³</td>
        <td>${formatNumber(row.solarProductionKwh)} kWh</td>
        <td>${formatNumber(row.electricityEmission)} tCO2e</td>
        <td>${formatNumber(row.naturalGasEmission)} tCO2e</td>
        <td>${formatNumber(row.actual)} tCO2e</td>
        <td>${formatNumber(row.avoidedEmission)} tCO2</td>
      </tr>`
    )
    .join('');
}

function renderFuelRows(fuel) {
  return fuel.items
    .map(
      (item) => `
      <tr>
        <td>${item.fuel}</td>
        <td>${formatNumber(item.litres)} litre</td>
        <td>${item.factor} ${item.factorUnit}</td>
        <td>${formatNumber(item.emission)} tCO2e</td>
      </tr>`
    )
    .join('');
}

function renderUnavailablePage() {
  return `
    <div class="page" id="page-emission">
      <div class="page-toolbar">
        <div>
          <h2 class="page-title page-title--left">Emisyon Ölçümü</h2>
          <p class="page-header__subtitle">Gerçek emisyon envanteri için backend bağlantısı gereklidir.</p>
        </div>
      </div>
      <section class="card">
        <p class="page-header__subtitle">Backend çalıştırıldığında CSV verileri formülize edilerek burada gösterilecektir.</p>
      </section>
    </div>`;
}

export function renderEmissionPage(data) {
  if (!data?.summary?.latestYear) return renderUnavailablePage();
  pageData = JSON.parse(JSON.stringify(data));

  const latest = pageData.summary.latestYear;
  const monthly = pageData.monthly.filter((row) => row.year === latest.year);
  const factors = Object.values(pageData.factors);

  return `
    <div class="page" id="page-emission">
      <div class="page-toolbar">
        <div>
          <h2 class="page-title page-title--left">Emisyon Ölçümü</h2>
          <p class="page-header__subtitle">${latest.year} enerji aktivite verileri ve karbon emisyon envanteri</p>
        </div>
        <button type="button" class="btn btn--primary" id="btn-emission-method">Metodolojiyi Göster</button>
      </div>

      <div class="summary-grid summary-grid--4">
        <div class="summary-card summary-card--accent">
          <p class="summary-card__label">Kapsamlı brüt emisyon</p>
          <p class="summary-card__value">${formatNumber(pageData.summary.comprehensiveGrossEmission)} tCO2e</p>
        </div>
        <div class="summary-card">
          <p class="summary-card__label">Elektrik + doğalgaz</p>
          <p class="summary-card__value">${formatNumber(latest.grossEnergyEmission)} tCO2e</p>
        </div>
        <div class="summary-card">
          <p class="summary-card__label">Dönem atanmamış yakıt</p>
          <p class="summary-card__value">${formatNumber(pageData.fuel.totalEmission)} tCO2e</p>
        </div>
        <div class="summary-card summary-card--positive">
          <p class="summary-card__label">GES pozitif etkisi</p>
          <p class="summary-card__value">+${formatNumber(latest.avoidedEmission)} tCO2</p>
        </div>
      </div>

      <div class="grid grid--2">
        <section class="card">
          <h3 class="card__heading">Hesaplama formülleri</h3>
          <dl class="data-list">
          ${pageData.formulas
              .map(
                (formula) => `
                <div class="data-list__row">
                  <dt>${formula.label}</dt>
                  <dd>${formula.expression}</dd>
                </div>`
              )
              .join('')}
          </dl>
        </section>

        <section class="card">
          <h3 class="card__heading">Emisyon faktörleri</h3>
          <dl class="data-list">
            ${factors
              .map(
                (factor) => `
                <div class="data-list__row">
                  <dt>${factor.label} · ${factor.scope}</dt>
                  <dd>${factor.value} ${factor.unit}</dd>
                </div>`
              )
              .join('')}
          </dl>
        </section>
      </div>

      <section class="card card--table">
        <h3 class="card__heading">${latest.year} aylık aktivite ve emisyon kayıtları</h3>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ay</th>
                <th>Elektrik</th>
                <th>Doğalgaz</th>
                <th>GES üretimi</th>
                <th>Elektrik CO2e</th>
                <th>Doğalgaz CO2e</th>
                <th>Brüt toplam</th>
                <th>Kaçınılan CO2</th>
              </tr>
            </thead>
            <tbody>${renderMonthlyRows(monthly)}</tbody>
          </table>
        </div>
      </section>

      <section class="card card--table">
        <h3 class="card__heading">Yakıt kaynaklı emisyonlar</h3>
        <p class="page-header__subtitle">${pageData.fuel.reportingPeriod}; kapsamlı brüt dağılıma eklenir fakat dönem atanmamış olarak işaretlenir.</p>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Yakıt</th><th>Tüketim</th><th>Faktör</th><th>Emisyon</th></tr></thead>
            <tbody>${renderFuelRows(pageData.fuel)}</tbody>
            <tfoot>
              <tr>
                <th>Toplam</th>
                <th>${formatNumber(pageData.fuel.totalLitres)} litre</th>
                <th>-</th>
                <th>${formatNumber(pageData.fuel.totalEmission)} tCO2e</th>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section class="card">
        <h3 class="card__heading">Veri kalitesi notları</h3>
        <dl class="data-list">
          ${pageData.metadata.dataQuality
            .map(
              (note, index) => `
              <div class="data-list__row">
                <dt>Not ${index + 1}</dt>
                <dd>${note}</dd>
              </div>`
            )
            .join('')}
        </dl>
      </section>
    </div>`;
}

export function initEmissionPage() {
  document.getElementById('btn-emission-method')?.addEventListener('click', () => {
    openModal({
      title: 'Emisyon Hesaplama Metodolojisi',
      bodyHtml: `
        <dl class="detail-list">
          ${pageData.formulas.map((formula) => `<div><dt>${formula.label}</dt><dd>${formula.expression}</dd></div>`).join('')}
        </dl>
        <h4 class="card__heading">Kaynaklar</h4>
        <dl class="detail-list">
          ${Object.values(pageData.factors).map((factor) => `<div><dt>${factor.label}</dt><dd>${factor.source} · ${factor.sourceYear}</dd></div>`).join('')}
        </dl>`,
    });
    showToast('Metodoloji ve kaynaklar gösterildi', 'success');
  });
}
