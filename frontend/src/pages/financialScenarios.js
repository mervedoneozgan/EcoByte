import { api } from '../api/client.js';
import { formatEuro, formatNumber } from '../utils/format.js';
import { downloadJson, showToast } from '../utils/ui.js';
import { escapeHtml } from '../utils/text.js';

let pageData = null;
let currentAssumptions = null;
let currentResults = null;
let activePresetId = 'balanced';

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

export function calculateScenarioLocally(context, assumptions) {
  const electricityReduction = round(
    context.electricityEmission * assumptions.electricityReductionPercent / 100,
    3
  );
  const naturalGasReduction = round(
    context.naturalGasEmission * assumptions.naturalGasReductionPercent / 100,
    3
  );
  const totalReduction = round(electricityReduction + naturalGasReduction, 3);
  const projectedEmission = round(Math.max(0, context.actualEmission - totalReduction), 3);
  const projectedQuotaRemaining = round(Math.max(0, context.quotaLimit - projectedEmission), 3);
  const projectedQuotaOverage = round(Math.max(0, projectedEmission - context.quotaLimit), 3);
  const additionalQuotaHeadroom = round(
    Math.max(0, projectedQuotaRemaining - context.currentQuotaRemaining),
    3
  );
  const annualCarbonReferenceValueEur = round(totalReduction * assumptions.carbonPriceEur, 2);
  const annualEvaluatedBenefitEur = round(
    assumptions.annualOperationalSavingsEur
      + (assumptions.includeCarbonValueInReturn ? annualCarbonReferenceValueEur : 0),
    2
  );
  const grossBenefitEur = round(annualEvaluatedBenefitEur * assumptions.analysisYears, 2);
  const netBenefitEur = round(grossBenefitEur - assumptions.investmentEur, 2);
  const roiPercent = assumptions.investmentEur > 0
    ? round((netBenefitEur / assumptions.investmentEur) * 100, 1)
    : null;
  const simplePaybackYears = annualEvaluatedBenefitEur > 0
    ? round(assumptions.investmentEur / annualEvaluatedBenefitEur, 2)
    : null;
  const discountRate = assumptions.discountRatePercent / 100;
  let npvEur = -assumptions.investmentEur;
  for (let year = 1; year <= assumptions.analysisYears; year += 1) {
    npvEur += annualEvaluatedBenefitEur / ((1 + discountRate) ** year);
  }

  return {
    electricityReduction,
    naturalGasReduction,
    totalReduction,
    projectedEmission,
    projectedQuotaRemaining,
    projectedQuotaOverage,
    additionalQuotaHeadroom,
    annualCarbonReferenceValueEur,
    annualEvaluatedBenefitEur,
    grossBenefitEur,
    netBenefitEur,
    roiPercent,
    simplePaybackYears,
    npvEur: round(npvEur, 2),
  };
}

function scenarioDataWithFallback(data) {
  const latestYear = Math.max(...(data.trend ?? []).map((item) => item.year).filter(Number.isFinite));
  const latestTrend = (data.trend ?? []).filter((item) => item.year === latestYear);
  const trendElectricityEmission = latestTrend.reduce(
    (sum, item) => sum + Number(item.electricityEmission ?? 0),
    0
  );
  const trendNaturalGasEmission = latestTrend.reduce(
    (sum, item) => sum + Number(item.naturalGasEmission ?? 0),
    0
  );
  const latestQuota = data.summary.annualQuotas?.find((item) => item.year === data.summary.quotaYear)
    ?? data.summary.annualQuotas?.at(-1);
  const electricityEmission = data.summary.electricityEmission ?? trendElectricityEmission;
  const naturalGasEmission = data.summary.naturalGasEmission ?? trendNaturalGasEmission;
  const actualEmission = latestQuota?.actualEmission
    ?? data.summary.totalEmission
    ?? electricityEmission + naturalGasEmission;
  const quotaLimit = latestQuota?.quotaLimit ?? data.summary.quotaLimit ?? 0;
  const context = data.scenarioData?.context ?? {
    year: latestQuota?.year ?? data.summary.reportingYear ?? latestYear,
    electricityEmission,
    naturalGasEmission,
    actualEmission,
    quotaLimit,
    currentQuotaRemaining: latestQuota?.remaining ?? Math.max(0, quotaLimit - actualEmission),
    currentQuotaOverage: latestQuota?.overage ?? Math.max(0, actualEmission - quotaLimit),
    referenceCarbonPriceEur: data.summary.marketPrice ?? 0,
  };
  const defaultAssumptions = {
    electricityReductionPercent: 12,
    naturalGasReductionPercent: 9,
    investmentEur: 68000,
    annualOperationalSavingsEur: 30000,
    analysisYears: 5,
    discountRatePercent: 10,
    carbonPriceEur: context.referenceCarbonPriceEur,
    includeCarbonValueInReturn: false,
  };
  return {
    context,
    presets: data.scenarioData?.presets ?? [
      { id: 'balanced', label: 'Dengeli', assumptions: defaultAssumptions },
    ],
    exports: data.scenarioData?.exports ?? [],
  };
}

function renderPresetButtons(presets) {
  return presets
    .map((preset) => `
      <button type="button"
        class="segmented__item ${preset.id === activePresetId ? 'segmented__item--active' : ''}"
        data-scenario-preset="${escapeHtml(preset.id)}"
        aria-pressed="${preset.id === activePresetId ? 'true' : 'false'}">${escapeHtml(preset.label)}</button>`)
    .join('');
}

function renderHistory(items) {
  if (!items.length) {
    return '<tr><td colspan="6" class="table-empty">Henüz kaydedilmiş senaryo yok.</td></tr>';
  }
  return items
    .map((item) => `
      <tr>
        <td><strong>${escapeHtml(item.name)}</strong></td>
        <td>${escapeHtml(new Date(item.createdAt).toLocaleString('tr-TR'))}</td>
        <td>${formatNumber(item.results?.totalReduction ?? 0)} tCO2e</td>
        <td>${item.results?.roiPercent === null || item.results?.roiPercent === undefined ? '-' : `%${formatNumber(item.results.roiPercent)}`}</td>
        <td>${formatEuro(item.results?.npvEur ?? 0)}</td>
        <td><button type="button" class="btn btn--outline btn--sm" data-load-scenario="${item.id}">Yükle</button></td>
      </tr>`)
    .join('');
}

function renderResults(results) {
  const roi = results.roiPercent === null ? 'Hesaplanamadı' : `%${formatNumber(results.roiPercent)}`;
  const payback = results.simplePaybackYears === null
    ? 'Hesaplanamadı'
    : `${formatNumber(results.simplePaybackYears)} yıl`;
  return `
    <div class="summary-grid summary-grid--4">
      <div class="summary-card summary-card--accent"><p class="summary-card__label">Toplam azaltım</p><p class="summary-card__value">${formatNumber(results.totalReduction)} tCO2e</p></div>
      <div class="summary-card"><p class="summary-card__label">Yıllık değerlendirilen fayda</p><p class="summary-card__value">${formatEuro(results.annualEvaluatedBenefitEur)}</p></div>
      <div class="summary-card"><p class="summary-card__label">ROI</p><p class="summary-card__value">${roi}</p></div>
      <div class="summary-card"><p class="summary-card__label">Net bugünkü değer</p><p class="summary-card__value">${formatEuro(results.npvEur)}</p></div>
    </div>
    <div class="grid grid--2">
      <section class="card">
        <h3 class="card__heading">Emisyon ve kota etkisi</h3>
        <dl class="data-list">
          <div class="data-list__row"><dt>Elektrik azaltımı</dt><dd>${formatNumber(results.electricityReduction)} tCO2e</dd></div>
          <div class="data-list__row"><dt>Doğalgaz azaltımı</dt><dd>${formatNumber(results.naturalGasReduction)} tCO2e</dd></div>
          <div class="data-list__row"><dt>Senaryo sonrası emisyon</dt><dd>${formatNumber(results.projectedEmission)} tCO2e</dd></div>
          <div class="data-list__row"><dt>Senaryo sonrası kota bakiyesi</dt><dd>${results.projectedQuotaOverage > 0 ? `${formatNumber(results.projectedQuotaOverage)} tCO2e aşım` : `${formatNumber(results.projectedQuotaRemaining)} tCO2e kalan`}</dd></div>
          <div class="data-list__row data-list__row--total"><dt>Ek kota hareket alanı</dt><dd class="text-accent">+${formatNumber(results.additionalQuotaHeadroom)} tCO2e</dd></div>
        </dl>
      </section>
      <section class="card">
        <h3 class="card__heading">Finansal sonuçlar</h3>
        <dl class="data-list">
          <div class="data-list__row"><dt>Karbon referans değeri / yıl</dt><dd>${formatEuro(results.annualCarbonReferenceValueEur)}</dd></div>
          <div class="data-list__row"><dt>Toplam dönem faydası</dt><dd>${formatEuro(results.grossBenefitEur)}</dd></div>
          <div class="data-list__row"><dt>Net dönem faydası</dt><dd>${formatEuro(results.netBenefitEur)}</dd></div>
          <div class="data-list__row"><dt>Basit geri ödeme süresi</dt><dd>${payback}</dd></div>
          <div class="data-list__row data-list__row--total"><dt>Net bugünkü değer</dt><dd class="${results.npvEur >= 0 ? 'text-accent' : 'text-danger'}">${formatEuro(results.npvEur)}</dd></div>
        </dl>
      </section>
    </div>`;
}

function renderAssumptionForm(assumptions) {
  return `
    <form class="form" id="scenario-form">
      <label class="form__label">Senaryo adı
        <input class="form__input" name="name" maxlength="160" value="Dengeli azaltım senaryosu" required />
      </label>
      <div class="trade-form">
        <label class="form__label">Elektrik azaltımı (%)
          <input class="form__input" name="electricityReductionPercent" type="number" min="0" max="100" step="0.1" value="${assumptions.electricityReductionPercent}" required />
        </label>
        <label class="form__label">Doğalgaz azaltımı (%)
          <input class="form__input" name="naturalGasReductionPercent" type="number" min="0" max="100" step="0.1" value="${assumptions.naturalGasReductionPercent}" required />
        </label>
        <label class="form__label">Yatırım (€)
          <input class="form__input" name="investmentEur" type="number" min="0" step="100" value="${assumptions.investmentEur}" required />
        </label>
        <label class="form__label">Yıllık operasyonel tasarruf (€)
          <input class="form__input" name="annualOperationalSavingsEur" type="number" min="0" step="100" value="${assumptions.annualOperationalSavingsEur}" required />
        </label>
        <label class="form__label">Analiz süresi (yıl)
          <input class="form__input" name="analysisYears" type="number" min="1" max="50" step="1" value="${assumptions.analysisYears}" required />
        </label>
        <label class="form__label">İskonto oranı (%)
          <input class="form__input" name="discountRatePercent" type="number" min="0" max="100" step="0.1" value="${assumptions.discountRatePercent}" required />
        </label>
        <label class="form__label">Karbon referans fiyatı (€/tCO2e)
          <input class="form__input" name="carbonPriceEur" type="number" min="0" step="0.01" value="${assumptions.carbonPriceEur}" required />
        </label>
      </div>
      <label class="form__label settings-card__label">
        <input type="checkbox" name="includeCarbonValueInReturn" ${assumptions.includeCarbonValueInReturn ? 'checked' : ''} />
        Karbon referans değerini ROI, geri ödeme ve NPV hesabına dahil et
      </label>
    </form>`;
}

function readAssumptionsFromForm() {
  const form = document.getElementById('scenario-form');
  return {
    electricityReductionPercent: Number(form.electricityReductionPercent.value),
    naturalGasReductionPercent: Number(form.naturalGasReductionPercent.value),
    investmentEur: Number(form.investmentEur.value),
    annualOperationalSavingsEur: Number(form.annualOperationalSavingsEur.value),
    analysisYears: Number(form.analysisYears.value),
    discountRatePercent: Number(form.discountRatePercent.value),
    carbonPriceEur: Number(form.carbonPriceEur.value),
    includeCarbonValueInReturn: form.includeCarbonValueInReturn.checked,
  };
}

function scenarioNameInput() {
  return document.getElementById('scenario-form')?.elements.namedItem('name');
}

function setAssumptionsInForm(assumptions) {
  const form = document.getElementById('scenario-form');
  Object.entries(assumptions).forEach(([key, value]) => {
    const input = form.elements.namedItem(key);
    if (!input) return;
    if (input.type === 'checkbox') input.checked = Boolean(value);
    else input.value = value;
  });
}

function updateResults(assumptions, results = calculateScenarioLocally(pageData.scenarioData.context, assumptions)) {
  currentAssumptions = structuredClone(assumptions);
  currentResults = structuredClone(results);
  document.getElementById('scenario-results').innerHTML = renderResults(currentResults);
}

export function renderFinancialScenariosPage(data) {
  pageData = JSON.parse(JSON.stringify(data));
  pageData.scenarioData = scenarioDataWithFallback(pageData);
  const balanced = pageData.scenarioData.presets.find((preset) => preset.id === 'balanced')
    ?? pageData.scenarioData.presets[0];
  activePresetId = balanced.id;
  currentAssumptions = structuredClone(balanced.assumptions);
  currentResults = calculateScenarioLocally(pageData.scenarioData.context, currentAssumptions);
  const context = pageData.scenarioData.context;

  return `
    <div class="page" id="page-scenarios">
      <div class="page-toolbar">
        <div>
          <h2 class="page-title page-title--left">Finansal Senaryolar</h2>
          <p class="page-header__subtitle">Azaltım yatırımlarını emisyon, kota, geri ödeme, ROI ve NPV üzerinden karşılaştırın</p>
        </div>
        <div class="page-header__actions">
          <button type="button" class="btn btn--ghost" id="btn-scenario-download">JSON İndir</button>
          <button type="button" class="btn btn--primary" id="btn-scenario-save">Senaryoyu Kaydet</button>
        </div>
      </div>

      <div class="grid grid--2">
        <section class="card">
          <div class="card__heading-row">
            <h3 class="card__heading">Senaryo varsayımları</h3>
            <div class="segmented" aria-label="Hazır senaryo seçimi">${renderPresetButtons(pageData.scenarioData.presets)}</div>
          </div>
          ${renderAssumptionForm(currentAssumptions)}
          <div class="trade-actions">
            <p>Alanları değiştirdiğinizde sonuçlar anlık hesaplanır.</p>
            <button type="button" class="btn btn--outline" id="btn-scenario-verify">Sunucuda Doğrula</button>
          </div>
        </section>

        <section class="card">
          <h3 class="card__heading">${context.year} başlangıç durumu</h3>
          <dl class="data-list">
            <div class="data-list__row"><dt>Elektrik emisyonu</dt><dd>${formatNumber(context.electricityEmission)} tCO2e</dd></div>
            <div class="data-list__row"><dt>Doğalgaz emisyonu</dt><dd>${formatNumber(context.naturalGasEmission)} tCO2e</dd></div>
            <div class="data-list__row"><dt>Gerçekleşen emisyon</dt><dd>${formatNumber(context.actualEmission)} tCO2e</dd></div>
            <div class="data-list__row"><dt>Kota limiti</dt><dd>${formatNumber(context.quotaLimit)} tCO2e</dd></div>
            <div class="data-list__row"><dt>Mevcut kota bakiyesi</dt><dd>${context.currentQuotaOverage > 0 ? `${formatNumber(context.currentQuotaOverage)} tCO2e aşım` : `${formatNumber(context.currentQuotaRemaining)} tCO2e kalan`}</dd></div>
            <div class="data-list__row data-list__row--total"><dt>Referans karbon fiyatı</dt><dd>${context.referenceCarbonPriceEur.toFixed(2)} €/tCO2e</dd></div>
          </dl>
          <p class="trade-card-note">Karbon referans değeri resmî ETS geliri değildir. ROI ve NPV hesabına yalnızca seçeneği etkinleştirirseniz dahil edilir.</p>
        </section>
      </div>

      <div id="scenario-results">${renderResults(currentResults)}</div>

      <section class="card card--table">
        <div class="card__heading-row">
          <div>
            <h3 class="card__heading">Kayıt geçmişi</h3>
            <p class="card__meta">Kaydedilen senaryolar sonuçlarıyla birlikte sunucuda kalıcı tutulur.</p>
          </div>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Senaryo</th><th>Kayıt zamanı</th><th>Azaltım</th><th>ROI</th><th>NPV</th><th>İşlem</th></tr></thead>
            <tbody id="scenario-history">${renderHistory(pageData.scenarioData.exports)}</tbody>
          </table>
        </div>
      </section>
    </div>`;
}

export function initFinancialScenariosPage() {
  const page = document.getElementById('page-scenarios');
  const form = document.getElementById('scenario-form');
  if (!page || !form || !pageData) return;

  const refreshFromForm = () => {
    if (!form.checkValidity()) return;
    activePresetId = '';
    page.querySelectorAll('[data-scenario-preset]').forEach((button) => {
      button.classList.remove('segmented__item--active');
      button.setAttribute('aria-pressed', 'false');
    });
    updateResults(readAssumptionsFromForm());
  };
  form.addEventListener('input', refreshFromForm);
  form.addEventListener('change', refreshFromForm);

  page.querySelectorAll('[data-scenario-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      const preset = pageData.scenarioData.presets.find((item) => item.id === button.dataset.scenarioPreset);
      if (!preset) return;
      activePresetId = preset.id;
      page.querySelectorAll('[data-scenario-preset]').forEach((item) => {
        const active = item === button;
        item.classList.toggle('segmented__item--active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      setAssumptionsInForm(preset.assumptions);
      scenarioNameInput().value = `${preset.label} azaltım senaryosu`;
      updateResults(preset.assumptions);
      showToast(`${preset.label} senaryo yüklendi`, 'info');
    });
  });

  document.getElementById('btn-scenario-verify')?.addEventListener('click', async () => {
    if (!form.reportValidity()) return;
    try {
      const result = await api.calculateScenario({ assumptions: readAssumptionsFromForm() });
      updateResults(result.assumptions, result.results);
      showToast('Senaryo hesabı sunucuda doğrulandı', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  document.getElementById('btn-scenario-save')?.addEventListener('click', async () => {
    if (!form.reportValidity()) return;
    try {
      const item = await api.saveScenarioAnalysis({
        name: scenarioNameInput().value,
        assumptions: readAssumptionsFromForm(),
      });
      pageData.scenarioData.exports.unshift(item);
      updateResults(item.assumptions, item.results);
      document.getElementById('scenario-history').innerHTML = renderHistory(pageData.scenarioData.exports);
      showToast('Senaryo sonuçlarıyla birlikte kaydedildi', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  });

  document.getElementById('btn-scenario-download')?.addEventListener('click', () => {
    downloadJson('ecobyte-finansal-senaryo.json', {
      name: scenarioNameInput().value,
      context: pageData.scenarioData.context,
      assumptions: currentAssumptions,
      results: currentResults,
    });
    showToast('Senaryo JSON olarak indirildi', 'success');
  });

  page.addEventListener('click', (event) => {
    const button = event.target.closest('[data-load-scenario]');
    if (!button) return;
    const item = pageData.scenarioData.exports.find((entry) => entry.id === Number(button.dataset.loadScenario));
    if (!item) return;
    scenarioNameInput().value = item.name;
    setAssumptionsInForm(item.assumptions);
    updateResults(item.assumptions, item.results);
    showToast('Kayıtlı senaryo yüklendi', 'success');
  });
}
