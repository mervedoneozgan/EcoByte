import { BRAND } from '../utils/brandColors.js';
import { formatEuro } from '../utils/format.js';

const SCENARIO_COLORS = {
  base: BRAND.lightGreen,
  pessimistic: BRAND.cyan,
  optimistic: BRAND.primaryBlue,
  conservative: BRAND.cyan,
  balanced: BRAND.lightGreen,
  ambitious: BRAND.primaryBlue,
};

export function getScenarioColor(type) {
  return SCENARIO_COLORS[type] || BRAND.primaryBlue;
}

export function renderFinancialScenarios(scenarios) {
  const rows = scenarios
    .map(
      (s, index) => `
      <div class="scenario-row">
        <div>
          <p class="scenario-row__label">${s.label}</p>
          <p class="scenario-row__value">${formatEuro(s.value)}</p>
        </div>
        <div class="sparkline-wrap sparkline-wrap--wide">
          <canvas id="spark-scenario-${index}" height="32"></canvas>
        </div>
      </div>`
    )
    .join('');

  return `
    <article class="card">
      <h3 class="card__heading">Finansal Senaryolar</h3>
      <div class="scenario-list">${rows}</div>
      <p class="trade-card-note">Değerler, hazır senaryoların net bugünkü değerini gösterir.</p>
      <button type="button" class="btn btn--primary btn--block" data-open-scenarios>Senaryoları Hesapla</button>
    </article>`;
}
