import { formatNumber } from '../utils/format.js';
import { downloadJson, showToast } from '../utils/ui.js';

let pageData = null;
let activeDatasetId = null;

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function renderValidationRows(checks) {
  return checks
    .map(
      (check) => `
      <tr>
        <td>${escapeHtml(check.label)}</td>
        <td><span class="pill ${check.status === 'verified' ? 'pill--green' : check.status === 'warning' ? 'pill--yellow' : 'pill--red'}">${check.status === 'verified' ? 'Doğrulandı' : check.status === 'warning' ? 'Uyarı' : 'Hata'}</span></td>
        <td>${escapeHtml(check.detail)}</td>
      </tr>`
    )
    .join('');
}

function renderFormulaCards(formulas) {
  return formulas
    .map(
      (formula) => `
      <article class="formula-card">
        <span class="formula-card__class">${escapeHtml(formula.classification)}</span>
        <h4>${escapeHtml(formula.label)}</h4>
        <code>${escapeHtml(formula.symbolicExpression)}</code>
        <p class="formula-card__expression">${escapeHtml(formula.expression)}</p>
        <p>${escapeHtml(formula.note)}</p>
      </article>`
    )
    .join('');
}

function renderFactorRows(factors) {
  return Object.values(factors)
    .map(
      (factor) => `
      <tr>
        <td>${escapeHtml(factor.label)}</td>
        <td>${formatNumber(factor.value)} ${escapeHtml(factor.unit)}</td>
        <td>${escapeHtml(factor.scope)}</td>
        <td>${escapeHtml(factor.source)}<br><small>Veri yılı: ${factor.sourceYear}</small></td>
        <td>${escapeHtml(factor.publishedAt || factor.sourceUpdatedAt || 'Resmi kaynakta belirtilmemiş')}</td>
        <td>${escapeHtml(factor.currencyStatus)}<br><small>Kontrol: ${escapeHtml(factor.checkedAt)}</small></td>
        <td><a class="source-link" href="${escapeHtml(factor.sourceUrl)}" target="_blank" rel="noopener noreferrer">Resmi kaynağı aç</a></td>
      </tr>`
    )
    .join('');
}

function renderCalculationRows(items) {
  return items
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.label)}</td>
        <td>${escapeHtml(item.classification)}</td>
        <td>${formatNumber(item.activity)} ${escapeHtml(item.activityUnit)}</td>
        <td>${formatNumber(item.factor)} ${escapeHtml(item.factorUnit)}</td>
        <td><code>${escapeHtml(item.numericFormula)}</code></td>
        <td class="${item.classification.startsWith('Pozitif') ? 'text-accent' : ''}">${item.classification.startsWith('Pozitif') ? '+' : ''}${formatNumber(item.result)} ${escapeHtml(item.resultUnit)}</td>
      </tr>`
    )
    .join('');
}

function renderMonthlyCalculationRows(items) {
  return items
    .map(
      (item) => `
      <tr>
        <td>${item.month} ${item.year}</td>
        <td><code>${escapeHtml(item.electricity.numericFormula)}</code></td>
        <td><code>${escapeHtml(item.naturalGas.numericFormula)}</code></td>
        <td class="text-accent"><code>${escapeHtml(item.solar.numericFormula)}</code></td>
      </tr>`
    )
    .join('');
}

function renderFuelCalculationRows(items) {
  return items
    .map(
      (item) => `
      <tr>
        <td>${escapeHtml(item.usageArea)}</td>
        <td>${escapeHtml(item.fuel)}</td>
        <td>${formatNumber(item.litres)} litre</td>
        <td>${formatNumber(item.factor)} ${escapeHtml(item.factorUnit)}</td>
        <td><code>${escapeHtml(item.numericFormula)}</code></td>
        <td>${formatNumber(item.emission)} tCO2e</td>
      </tr>`
    )
    .join('');
}

function renderDatasetButtons(datasets) {
  return datasets
    .map(
      (dataset, index) => `
      <button type="button" class="page-tab ${index === 0 ? 'page-tab--active' : ''}" data-dataset-id="${dataset.id}">
        ${escapeHtml(dataset.label)} <span>${dataset.rowCount}</span>
      </button>`
    )
    .join('');
}

function renderDataset(dataset) {
  const totals = Object.entries(dataset.totals)
    .filter(([, value]) => value !== 0)
    .map(([column, value]) => `<div class="data-list__row"><dt>${escapeHtml(column)}</dt><dd>${formatNumber(value)}</dd></div>`)
    .join('');
  const rows = dataset.rows
    .map(
      (row) => `<tr>${dataset.columns.map((column) => `<td>${escapeHtml(row[column] || '—')}</td>`).join('')}</tr>`
    )
    .join('');

  return `
    <div class="dataset-audit">
      <div><strong>${dataset.rowCount}</strong><span>satır</span></div>
      <div><strong>${dataset.columnCount}</strong><span>sütun</span></div>
      <div><strong>${dataset.audit.blankCells}</strong><span>boş hücre</span></div>
      <div><strong>${dataset.audit.invalidNumericCells.length}</strong><span>geçersiz sayı</span></div>
    </div>
    <p class="page-header__subtitle">${escapeHtml(dataset.description)}</p>
    <p class="dataset-checksum"><strong>SHA-256:</strong> ${dataset.checksumSha256}</p>
    <div class="grid grid--2">
      <section class="card">
        <h4 class="card__heading">Kolon toplamları</h4>
        <dl class="data-list">${totals || '<div class="data-list__row"><dt>Toplam</dt><dd>Sayısal kolon yok</dd></div>'}</dl>
      </section>
      <section class="card">
        <h4 class="card__heading">Okuma denetimi</h4>
        <dl class="data-list">
          <div class="data-list__row"><dt>Satır genişliği hatası</dt><dd>${dataset.audit.rowWidthIssues.length}</dd></div>
          <div class="data-list__row"><dt>Geçersiz sayısal hücre</dt><dd>${dataset.audit.invalidNumericCells.length}</dd></div>
          <div class="data-list__row"><dt>Durum</dt><dd class="${dataset.audit.status === 'verified' ? 'text-accent' : 'text-danger'}">${dataset.audit.status === 'verified' ? 'Doğrulandı' : 'Kontrol gerekli'}</dd></div>
        </dl>
      </section>
    </div>
    <div class="table-wrap raw-data-table">
      <table class="data-table">
        <thead><tr>${dataset.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

export function renderDataCatalogPage(data) {
  pageData = JSON.parse(JSON.stringify(data));
  activeDatasetId = pageData.datasets[0]?.id;
  const totals = pageData.totals;

  return `
    <div class="page" id="page-data-catalog">
      <div class="page-toolbar">
        <div>
          <h2 class="page-title page-title--left">Veri ve Formüller</h2>
          <p class="page-header__subtitle">Tüm kaynak kayıtlar, doğrulama kontrolleri ve karbon hesaplama adımları</p>
        </div>
        <button type="button" class="btn btn--primary" id="btn-download-catalog">Kataloğu İndir</button>
      </div>

      <div class="summary-grid summary-grid--4">
        <div class="summary-card summary-card--accent"><p class="summary-card__label">Kaynak dosya</p><p class="summary-card__value">${pageData.metadata.sourceFileCount}</p></div>
        <div class="summary-card"><p class="summary-card__label">Ham kayıt</p><p class="summary-card__value">${pageData.metadata.rawRecordCount}</p></div>
        <div class="summary-card"><p class="summary-card__label">Kapsamlı brüt emisyon</p><p class="summary-card__value">${formatNumber(totals.comprehensiveGrossEmission)} tCO2e</p></div>
        <div class="summary-card summary-card--positive"><p class="summary-card__label">GES pozitif etkisi</p><p class="summary-card__value">+${formatNumber(totals.positiveSolarImpact)} tCO2</p></div>
      </div>

      <section class="card methodology-banner">
        <h3 class="card__heading">Hesaplama politikası</h3>
        <p>${escapeHtml(pageData.metadata.calculationPolicy)}</p>
        <p><strong>Önemli:</strong> GES pozitif etki olarak gösterilir. Farklı muhasebe sınıfında olduğu için brüt tCO2e toplamından çıkarılmaz.</p>
      </section>

      <section class="card card--table">
        <h3 class="card__heading">Veri doğrulama sonuçları</h3>
        <div class="table-wrap"><table class="data-table">
          <thead><tr><th>Kontrol</th><th>Durum</th><th>Sonuç</th></tr></thead>
          <tbody>${renderValidationRows(pageData.validationChecks)}</tbody>
        </table></div>
      </section>

      <section class="card">
        <h3 class="card__heading">Matematiksel formüller</h3>
        <p class="card__description">Hesaplamalarda kullanılan sembolik gösterimler, sayısal karşılıkları ve muhasebe notları.</p>
        <div class="formula-grid">${renderFormulaCards(pageData.formulas)}</div>
      </section>

      <section class="card card--table">
        <h3 class="card__heading">Emisyon faktörleri ve resmi kaynaklar</h3>
        <div class="table-wrap"><table class="data-table">
          <thead><tr><th>Faktör</th><th>Değer</th><th>Sınıf</th><th>Kaynak / veri yılı</th><th>Yayım / güncelleme</th><th>2026 güncellik durumu</th><th>Bağlantı</th></tr></thead>
          <tbody>${renderFactorRows(pageData.factors)}</tbody>
        </table></div>
      </section>

      <section class="card card--table">
        <h3 class="card__heading">Toplam hesaplama defteri</h3>
        <div class="table-wrap"><table class="data-table">
          <thead><tr><th>Hesap</th><th>Sınıf</th><th>Aktivite</th><th>Faktör</th><th>Sayısal formül</th><th>Sonuç</th></tr></thead>
          <tbody>${renderCalculationRows(pageData.calculationLedger)}</tbody>
        </table></div>
      </section>

      <section class="card card--table">
        <h3 class="card__heading">Tüm aylık hesaplamalar</h3>
        <div class="table-wrap"><table class="data-table">
          <thead><tr><th>Dönem</th><th>Elektrik formülü</th><th>Doğalgaz formülü</th><th>GES pozitif etki formülü</th></tr></thead>
          <tbody>${renderMonthlyCalculationRows(pageData.monthlyCalculationLedger)}</tbody>
        </table></div>
      </section>

      <section class="card card--table">
        <h3 class="card__heading">Tüm yakıt hesaplamaları</h3>
        <div class="table-wrap"><table class="data-table">
          <thead><tr><th>Kullanım alanı</th><th>Yakıt</th><th>Tüketim</th><th>Faktör</th><th>Sayısal formül</th><th>Sonuç</th></tr></thead>
          <tbody>${renderFuelCalculationRows(pageData.fuelCalculationLedger)}</tbody>
        </table></div>
      </section>

      <section class="card">
        <div class="card__heading-row">
          <h3 class="card__heading">Tüm ham veriler</h3>
          <span class="page-header__subtitle">91 kaydın tamamı</span>
        </div>
        <div class="page-tabs page-tabs--wrap data-catalog-tabs">${renderDatasetButtons(pageData.datasets)}</div>
        <div id="dataset-content">${renderDataset(pageData.datasets[0])}</div>
      </section>
    </div>`;
}

export function initDataCatalogPage() {
  const page = document.getElementById('page-data-catalog');
  if (!page || !pageData) return;

  page.querySelectorAll('[data-dataset-id]').forEach((button) => {
    button.addEventListener('click', () => {
      activeDatasetId = button.dataset.datasetId;
      page.querySelectorAll('[data-dataset-id]').forEach((item) => item.classList.remove('page-tab--active'));
      button.classList.add('page-tab--active');
      const dataset = pageData.datasets.find((item) => item.id === activeDatasetId);
      document.getElementById('dataset-content').innerHTML = renderDataset(dataset);
    });
  });

  document.getElementById('btn-download-catalog')?.addEventListener('click', () => {
    downloadJson('ecobyte-veri-ve-formuller.json', pageData);
    showToast('Veri kataloğu indirildi', 'success');
  });
}
