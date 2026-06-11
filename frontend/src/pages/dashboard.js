import { renderHeader } from '../render/header.js';
import { renderKPICards } from '../render/kpis.js';
import {
  renderTrendChart,
  renderDistributionChart,
  renderDistributionLegend,
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
  if (distributionCanvas) {
    const annualDistributions = data.distribution.years ?? [data.distribution];
    let distributionChart;
    const renderDistributionYear = (year) => {
      const selected = annualDistributions.find((item) => item.year === year) ?? annualDistributions.at(-1);
      distributionChart?.destroy();
      distributionChart = createDistributionChart(distributionCanvas, selected);
      document.getElementById('distribution-chart-meta').textContent =
        `${selected.year} enerji emisyonu + dönem atanmamış yakıt`;
      document.getElementById('distribution-total-label').textContent = 'Görünüm toplamı';
      document.getElementById('distribution-total').textContent = formatNumber(selected.total);
      document.getElementById('distribution-legend').innerHTML = renderDistributionLegend(selected);
      document.getElementById('distribution-chart-note').textContent = selected.note;
      document.querySelectorAll('[data-distribution-year]').forEach((button) => {
        const active = Number(button.dataset.distributionYear) === selected.year;
        button.classList.toggle('segmented__item--active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    };
    renderDistributionYear(data.distribution.selectedYear ?? annualDistributions.at(-1).year);
    document.querySelectorAll('[data-distribution-year]').forEach((button) => {
      button.addEventListener('click', () => renderDistributionYear(Number(button.dataset.distributionYear)));
    });
  }
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
    const annualQuotas = data.summary.annualQuotas ?? [];
    let quotaChart;
    const renderQuotaYear = (year) => {
      const selected = annualQuotas.find((item) => item.year === year) ?? annualQuotas.at(-1);
      const actual = selected.hasActual ? selected.actualEmission : 0;
      const remaining = selected.hasQuota && !selected.hasActual
        ? selected.quotaLimit
        : selected.remaining ?? 0;
      const mode = selected.hasQuota
        ? selected.hasActual ? 'comparison' : 'quota-only'
        : 'actual-only';
      quotaChart?.destroy();
      quotaChart = createQuotaGauge(quotaCanvas, actual, remaining, selected.overage || 0, mode);
      document.getElementById('quota-chart-meta').textContent = `${selected.year} · ${selected.status}`;
      document.getElementById('quota-gauge-percent').textContent =
        selected.usedPercent === null ? '-' : `${selected.usedPercent}%`;
      document.getElementById('quota-gauge-actual').textContent =
        selected.hasActual ? `${formatNumber(selected.actualEmission)} tCO2e` : 'Ölçüm bekleniyor';
      document.getElementById('quota-gauge-limit').textContent =
        selected.hasQuota ? `${formatNumber(selected.quotaLimit)} tCO2e` : 'Tanımlı değil';
      document.getElementById('quota-chart-note').textContent = selected.hasQuota
        ? selected.hasActual
          ? 'Kota ve gerçekleşen emisyon aynı yıl içinde karşılaştırılıyor.'
          : 'Yıllık kota tanımlı; gerçekleşen tam yıl emisyonu henüz bulunmuyor.'
        : 'Bu yıl için kayıtlı kurumsal kota bulunmuyor; yalnızca gerçekleşen emisyon gösteriliyor.';
      document.querySelectorAll('[data-quota-year]').forEach((button) => {
        const active = Number(button.dataset.quotaYear) === selected.year;
        button.classList.toggle('segmented__item--active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    };
    renderQuotaYear(data.summary.quotaYear);
    document.querySelectorAll('[data-quota-year]').forEach((button) => {
      button.addEventListener('click', () => renderQuotaYear(Number(button.dataset.quotaYear)));
    });
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
  document.querySelectorAll('[data-open-scenarios]').forEach((button) => {
    button.addEventListener('click', () => navigateTo('scenarios'));
  });
  document.querySelector('[data-open-notifications]')?.addEventListener('click', () => navigateTo('notifications'));
}
