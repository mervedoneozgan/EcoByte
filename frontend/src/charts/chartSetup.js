import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  ArcElement,
  DoughnutController,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { BRAND, CHART_PALETTE } from '../utils/brandColors.js';
import { escapeHtml } from '../utils/text.js';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  ArcElement,
  DoughnutController,
  Tooltip,
  Legend,
  Filler
);

function tooltipOptions(unit = 'tCO2e') {
  return {
    enabled: false,
    external: externalTooltipHandler,
    callbacks: {
      label(context) {
        const label = context.dataset.label || context.label || '';
        const value = Number(context.raw || 0).toLocaleString('tr-TR');
        return `${label}: ${value} ${context.dataset.unit || unit}`;
      },
    },
  };
}

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: BRAND.lightText,
        boxWidth: 12,
        font: { family: 'Oxanium', size: 11, weight: 600 },
      },
    },
    tooltip: tooltipOptions(),
  },
};

function getOrCreateTooltip(chart) {
  let tooltip = chart.canvas.parentNode.querySelector('.chart-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    chart.canvas.parentNode.appendChild(tooltip);
  }
  return tooltip;
}

function externalTooltipHandler(context) {
  const { chart, tooltip } = context;
  const tooltipEl = getOrCreateTooltip(chart);
  if (tooltip.opacity === 0) {
    tooltipEl.style.opacity = 0;
    return;
  }

  const title = tooltip.title?.[0] || '';
  const body = tooltip.body?.map((item) => item.lines).flat() || [];
  tooltipEl.innerHTML = `
    ${title ? `<div class="chart-tooltip__title">${escapeHtml(title)}</div>` : ''}
    ${body.map((line) => `<div class="chart-tooltip__line">${escapeHtml(line)}</div>`).join('')}`;

  const { offsetLeft, offsetTop, clientHeight } = chart.canvas;
  const parentWidth = chart.canvas.parentNode.clientWidth;
  const parentHeight = chart.canvas.parentNode.clientHeight;
  const tooltipWidth = tooltipEl.offsetWidth || 160;
  const tooltipHeight = tooltipEl.offsetHeight || 56;
  const padding = 10;
  const rawX = offsetLeft + tooltip.caretX + 14;
  const rawY = offsetTop + tooltip.caretY - tooltipHeight / 2;
  const maxX = Math.max(padding, parentWidth - tooltipWidth - padding);
  const maxY = Math.max(padding, (parentHeight || clientHeight) - tooltipHeight - padding);

  tooltipEl.style.opacity = 1;
  tooltipEl.style.transform = `translate(${Math.min(Math.max(padding, rawX), maxX)}px, ${Math.min(Math.max(padding, rawY), maxY)}px)`;
}

function standardScales() {
  return {
    x: {
      ticks: { color: BRAND.cyan, font: { family: 'Oxanium', weight: 600 } },
      grid: { color: 'rgba(66, 183, 214, 0.12)' },
    },
    y: {
      beginAtZero: true,
      ticks: { color: BRAND.cyan, font: { family: 'Oxanium', weight: 600 } },
      grid: { color: 'rgba(66, 183, 214, 0.12)' },
    },
  };
}

export function createTrendChart(canvas, data, source = 'electricity', fuelEmission = 0) {
  const sources = {
    electricity: {
      label: 'Elektrik kaynaklı emisyon',
      color: BRAND.primaryBlue,
      data: data.map((item) => item.electricityEmission ?? 0),
    },
    naturalGas: {
      label: 'Doğalgaz kaynaklı emisyon',
      color: BRAND.cyan,
      data: data.map((item) => item.naturalGasEmission ?? 0),
    },
    fuel: {
      label: 'Yakıt kaynaklı emisyon',
      color: '#F5C76B',
      data: [fuelEmission],
      labels: ['Dönem atanmamış'],
    },
  };
  const selected = sources[source] ?? sources.electricity;

  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: selected.labels ?? data.map((item) => item.label),
      datasets: [
        {
          label: selected.label,
          data: selected.data,
          unit: 'tCO2e',
          borderColor: selected.color,
          backgroundColor: `${selected.color}24`,
          fill: true,
          tension: 0.35,
          pointRadius: source === 'fuel' ? 6 : 4,
          pointBackgroundColor: selected.color,
        },
      ],
    },
    options: {
      ...chartDefaults,
      interaction: { mode: 'index', intersect: false },
      scales: standardScales(),
    },
  });
}

export function createSolarProductionChart(canvas, monthly, facilityLabel = 'GES') {
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: monthly.map((item) => `${item.monthName ?? item.month} ${item.year}`),
      datasets: [
        {
          label: `${facilityLabel} üretimi`,
          data: monthly.map((item) => item.productionKwh),
          unit: 'kWh',
          yAxisID: 'production',
          borderColor: BRAND.lightGreen,
          backgroundColor: 'rgba(109, 204, 91, 0.16)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: BRAND.lightGreen,
        },
        {
          label: 'Kaçınılan karbon emisyonu',
          data: monthly.map((item) => item.positiveImpactTco2 ?? 0),
          unit: 'tCO2',
          yAxisID: 'impact',
          borderColor: BRAND.primaryBlue,
          tension: 0.35,
          pointRadius: 3,
          pointBackgroundColor: BRAND.primaryBlue,
        },
      ],
    },
    options: {
      ...chartDefaults,
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: standardScales().x,
        production: {
          ...standardScales().y,
          position: 'left',
          title: { display: true, text: 'Üretim (kWh)', color: BRAND.lightGreen },
        },
        impact: {
          ...standardScales().y,
          position: 'right',
          grid: { drawOnChartArea: false },
          title: { display: true, text: 'Kaçınılan emisyon (tCO2)', color: BRAND.primaryBlue },
        },
      },
    },
  });
}

export function createDistributionChart(canvas, distribution) {
  const items = distribution.items;
  const colors = items.map((item, index) => item.color || CHART_PALETTE[index % CHART_PALETTE.length]);

  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: items.map((item) => item.name),
      datasets: [
        {
          data: items.map((item) => item.value),
          backgroundColor: colors,
          borderColor: '#071016',
          borderWidth: 2,
          hoverOffset: 22,
        },
      ],
    },
    options: {
      ...chartDefaults,
      cutout: '62%',
      animation: { animateRotate: true, animateScale: true, duration: 650 },
      layout: { padding: 20 },
      plugins: {
        ...chartDefaults.plugins,
        legend: { display: false },
      },
    },
  });
}

export function createQuotaGauge(canvas, used, remaining, overage = 0) {
  const exceeded = overage > 0;
  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: exceeded ? ['Kullanılan', 'Aşım'] : ['Kullanılan', 'Kalan'],
      datasets: [
        {
          data: exceeded ? [used, overage] : [used, remaining],
          backgroundColor: exceeded
            ? ['#F5C76B', '#F87171']
            : [BRAND.darkGreen, 'rgba(46, 143, 176, 0.35)'],
          borderWidth: 0,
          hoverOffset: 10,
        },
      ],
    },
    options: {
      ...chartDefaults,
      rotation: -90,
      circumference: 180,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: tooltipOptions('tCO2e'),
      },
    },
  });
}

export function createSparkline(canvas, values, color = BRAND.primaryBlue) {
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: values.map((_, index) => index),
      datasets: [
        {
          data: values,
          borderColor: color,
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.35,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
    },
  });
}
