import { renderHeader } from '../render/header.js';
import { renderKPICards } from '../render/kpis.js';
import {
  renderTrendChart,
  renderDistributionChart,
  renderQuotaGauge,
} from '../render/charts.js';
import { renderTradingCard } from '../render/trading.js';
import { renderFinancialScenarios } from '../render/scenarios.js';
import { renderAIInsights } from '../render/insights.js';
import {
  createTrendChart,
  createDistributionChart,
  createQuotaGauge,
  createSparkline,
} from '../charts/chartSetup.js';
import { getScenarioColor } from '../render/scenarios.js';

export function renderDashboardContent(data, useMock) {
  const { company, summary, trend, distribution, scenarios, aiInsights } = data;

  return `
    ${
      useMock
        ? `<div class="banner banner--warning">Backend bağlantısı yok — örnek veriler gösteriliyor.</div>`
        : ''
    }
    ${renderHeader(company.name)}
    <div class="dashboard">
      ${renderKPICards(summary, trend)}
      <div class="grid grid--2">
        ${renderTrendChart()}
        ${renderDistributionChart(distribution)}
      </div>
      <div class="grid grid--3">
        ${renderQuotaGauge(summary)}
        ${renderTradingCard(summary)}
        ${renderFinancialScenarios(scenarios)}
      </div>
      ${renderAIInsights(aiInsights)}
    </div>`;
}

export function mountDashboardCharts(data) {
  const trendCanvas = document.getElementById('chart-trend');
  const distributionCanvas = document.getElementById('chart-distribution');
  const quotaCanvas = document.getElementById('chart-quota');
  const sparkEmission = document.getElementById('spark-emission');
  const sparkProfit = document.getElementById('spark-profit');

  if (trendCanvas) createTrendChart(trendCanvas, data.trend);
  if (distributionCanvas) {
    createDistributionChart(distributionCanvas, data.distribution.items);
  }
  if (quotaCanvas) {
    const used = data.summary.quotaLimit - data.summary.remaining;
    createQuotaGauge(quotaCanvas, used, data.summary.remaining);
  }
  if (sparkEmission) {
    createSparkline(sparkEmission, data.trend.map((row) => row.actual));
  }
  if (sparkProfit) {
    createSparkline(sparkProfit, [45, 52, 48, 55, 60, 58, 62, 65]);
  }
  data.scenarios.forEach((scenario, index) => {
    const canvas = document.getElementById(`spark-scenario-${index}`);
    if (canvas) {
      createSparkline(canvas, scenario.trend, getScenarioColor(scenario.type));
    }
  });
}
