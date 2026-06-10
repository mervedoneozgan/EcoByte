import { renderHeader } from '../render/header.js';
import { renderKPICards } from '../render/kpis.js';
import {
  renderTrendChart,
  renderDistributionChart,
  renderSolarProductionChart,
  renderQuotaGauge,
} from '../render/charts.js';
import { renderTradingCard } from '../render/trading.js';
import { renderFinancialScenarios } from '../render/scenarios.js';
import { renderAIInsights } from '../render/insights.js';
import {
  createTrendChart,
  createDistributionChart,
  createSolarProductionChart,
  createQuotaGauge,
  createSparkline,
} from '../charts/chartSetup.js';
import { getScenarioColor } from '../render/scenarios.js';
import { navigateTo } from '../utils/navigation.js';
import { formatNumber } from '../utils/format.js';

export function renderDashboardContent(data) {
  const { company, summary, trend, distribution, solar, scenarios, aiInsights } = data;

  return `
    ${renderHeader(company.name, `${trend.at(-1).monthName ?? trend.at(-1).month} ${trend.at(-1).year ?? ''}`.trim())}
    <div class="dashboard">
      ${renderKPICards(summary)}
      <div class="grid grid--2">
        ${renderTrendChart([...new Set(trend.map((item) => item.year))])}
        ${renderDistributionChart(distribution)}
      </div>
      <div class="grid grid--2">
        ${renderSolarProductionChart(solar)}
        ${renderQuotaGauge(summary)}
      </div>
      <div class="grid grid--2">
        ${renderTradingCard(summary)}
        ${renderFinancialScenarios(scenarios)}
      </div>
      ${renderAIInsights(aiInsights)}
    </div>`;
}

export function mountDashboardCharts(data) {
  const trendCanvas = document.getElementById('chart-trend');
  const distributionCanvas = document.getElementById('chart-distribution');
  const solarCanvas = document.getElementById('chart-solar-production');
  const quotaCanvas = document.getElementById('chart-quota');
  const sparkEmission = document.getElementById('spark-emission');

  if (trendCanvas) {
    const trendData = data.trend.map((item) => ({
      ...item,
      label: `${item.monthName ?? item.month} ${item.year}`,
    }));
    let activeSource = 'electricity';
    let activeYear = Math.max(...trendData.map((item) => item.year));
    let trendChart;
    const trendViews = {
      electricity: {
        activityField: 'electricityKwh',
        factor: data.factors.electricityGrid,
        meta: (year, total) => `${year} elektrik emisyonu · ${formatNumber(total)} tCO2e`,
        note: (year) => `Grafik, ${year} yılı elektrik kaynaklı aylık emisyon değerlerini gösterir.`,
      },
      naturalGas: {
        activityField: 'naturalGasM3',
        factor: data.factors.naturalGas,
        meta: (year, total) => `${year} doğalgaz emisyonu · ${formatNumber(total)} tCO2e`,
        note: (year) => `Grafik, ${year} yılı doğalgaz kaynaklı aylık emisyon değerlerini gösterir.`,
      },
      fuel: {
        meta: () => `Yakıt kaynaklı toplam emisyon · ${formatNumber(data.summary.fuelEmissionUnassigned)} tCO2e`,
        note: () => 'Grafik, yakıt kaynaklı toplam emisyon değerini gösterir.',
      },
    };

    const renderSelectedTrend = () => {
      const selectedData = activeSource === 'fuel'
        ? trendData
        : trendData.filter((item) => item.year === activeYear);
      trendChart?.destroy();
      trendChart = createTrendChart(
        trendCanvas,
        selectedData,
        activeSource,
        data.summary.fuelEmissionUnassigned
      );
      const view = trendViews[activeSource];
      const total = activeSource === 'fuel'
        ? data.summary.fuelEmissionUnassigned
        : Number((
          selectedData.reduce((sum, item) => sum + item[view.activityField], 0)
          * view.factor.value
          / 1000
        ).toFixed(3));
      document.getElementById('trend-chart-meta').textContent = view.meta(activeYear, total);
      document.getElementById('trend-chart-note').textContent = view.note(activeYear);
      document.querySelectorAll('[data-trend-source]').forEach((item) => {
        const active = item.dataset.trendSource === activeSource;
        item.classList.toggle('segmented__item--active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      document.querySelectorAll('[data-trend-year]').forEach((item) => {
        const active = Number(item.dataset.trendYear) === activeYear;
        item.disabled = activeSource === 'fuel';
        item.classList.toggle('segmented__item--active', active && activeSource !== 'fuel');
        item.setAttribute('aria-pressed', String(active && activeSource !== 'fuel'));
      });
    };

    renderSelectedTrend();
    document.querySelectorAll('[data-trend-source]').forEach((button) => {
      button.addEventListener('click', () => {
        activeSource = button.dataset.trendSource;
        renderSelectedTrend();
      });
    });
    document.querySelectorAll('[data-trend-year]').forEach((button) => {
      button.addEventListener('click', () => {
        activeYear = Number(button.dataset.trendYear);
        renderSelectedTrend();
      });
    });
  }
  if (distributionCanvas) createDistributionChart(distributionCanvas, data.distribution);
  if (solarCanvas) {
    const facilities = data.solar.facilities ?? [];
    const initialFacility = facilities[0];
    let solarChart = createSolarProductionChart(
      solarCanvas,
      initialFacility?.monthly ?? data.solar.monthly,
      initialFacility?.label ?? 'GES'
    );
    document.querySelectorAll('[data-solar-facility]').forEach((button) => {
      button.addEventListener('click', () => {
        const facility = facilities.find((item) => item.key === button.dataset.solarFacility);
        if (!facility) return;
        solarChart.destroy();
        solarChart = createSolarProductionChart(solarCanvas, facility.monthly, facility.label);
        document.querySelectorAll('[data-solar-facility]').forEach((item) => {
          const active = item === button;
          item.classList.toggle('segmented__item--active', active);
          item.setAttribute('aria-pressed', String(active));
        });
        document.getElementById('solar-chart-meta').textContent =
          `${facility.label} · aylık ortalama ${formatNumber(facility.monthlyAverageKwh)} kWh`;
        document.getElementById('solar-positive-impact').textContent =
          `+${formatNumber(facility.positiveImpactTco2)} tCO2 pozitif etki`;
        document.getElementById('solar-production-total').textContent =
          `${formatNumber(facility.productionKwh)} kWh`;
        document.getElementById('solar-impact-total').textContent =
          `+${formatNumber(facility.positiveImpactTco2)} tCO2`;
      });
    });
  }
  if (quotaCanvas) {
    const used = data.summary.quotaExceeded
      ? data.summary.quotaLimit
      : data.summary.quotaLimit - data.summary.remaining;
    createQuotaGauge(quotaCanvas, used, data.summary.remaining, data.summary.overage || 0);
  }
  if (sparkEmission) createSparkline(sparkEmission, data.trend.map((row) => row.actual));

  data.scenarios.forEach((scenario, index) => {
    const canvas = document.getElementById(`spark-scenario-${index}`);
    if (canvas) createSparkline(canvas, scenario.trend, getScenarioColor(scenario.type));
  });
  document.querySelectorAll('[data-open-ai-analysis]').forEach((button) => {
    button.addEventListener('click', () => navigateTo('ai'));
  });
  document.querySelectorAll('[data-open-trading]').forEach((button) => {
    button.addEventListener('click', () => navigateTo('trading'));
  });
  document.querySelector('[data-open-notifications]')?.addEventListener('click', () => navigateTo('notifications'));
}
