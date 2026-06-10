import { api } from '../api/client.js';
import { formatNumber } from '../utils/format.js';
import { showToast } from '../utils/ui.js';

let pageData = null;

function renderObservationRows(items) {
  return items
    .map(
      (item) => `
      <tr>
        <td>
          <strong>${item.title}</strong>
          <p class="page-header__subtitle">${item.description}</p>
        </td>
        <td>${formatNumber(item.impactTco2e)} tCO2e</td>
      </tr>`
    )
    .join('');
}

export function renderAiAnalysisPage(data) {
  pageData = JSON.parse(JSON.stringify(data));
  const { summary, recommendations } = pageData;

  return `
    <div class="page" id="page-ai-analysis">
      <div class="page-toolbar">
        <div>
          <h2 class="page-title page-title--left">Grafik Analizi</h2>
          <p class="page-header__subtitle">Grafiklerde görüntülenen ölçülmüş değerlerin özeti</p>
        </div>
        <button type="button" class="btn btn--primary" id="btn-refresh-analysis">Özeti Yenile</button>
      </div>

      <div class="summary-grid summary-grid--4">
        <div class="summary-card summary-card--accent"><p class="summary-card__label">Yıllık emisyon</p><p class="summary-card__value">${formatNumber(summary.annualEmission)} tCO2e</p></div>
        <div class="summary-card"><p class="summary-card__label">Kaçınılan emisyon</p><p class="summary-card__value">${formatNumber(summary.avoidedEmission)} tCO2</p></div>
        <div class="summary-card"><p class="summary-card__label">${summary.latestPeriod}</p><p class="summary-card__value">${formatNumber(summary.latestEmission)} tCO2e</p></div>
        <div class="summary-card"><p class="summary-card__label">Zirve · ${summary.peakPeriod}</p><p class="summary-card__value">${formatNumber(summary.peakEmission)} tCO2e</p></div>
      </div>

      <section class="card card--table">
        <h3 class="card__heading">Grafik Gözlemleri</h3>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Gösterge</th><th>Grafikteki değer</th></tr></thead>
            <tbody id="ai-observation-table">${renderObservationRows(recommendations)}</tbody>
          </table>
        </div>
      </section>
    </div>`;
}

export function initAiAnalysisPage() {
  const page = document.getElementById('page-ai-analysis');
  if (!page || !pageData) return;

  document.getElementById('btn-refresh-analysis')?.addEventListener('click', async () => {
    pageData = await api.getAiAnalysis();
    document.getElementById('ai-observation-table').innerHTML = renderObservationRows(pageData.recommendations);
    showToast('Grafik özeti güncellendi', 'success');
  });
}
