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

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: { color: BRAND.lightText, boxWidth: 12, font: { size: 11 } },
    },
    tooltip: {
      backgroundColor: '#0f2430',
      borderColor: BRAND.cyan,
      borderWidth: 1,
      titleColor: BRAND.lightText,
      bodyColor: BRAND.cyan,
    },
  },
};

export function createTrendChart(canvas, data) {
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: data.map((d) => d.month),
      datasets: [
        {
          label: 'Gerçek Emisyon',
          data: data.map((d) => d.actual),
          borderColor: BRAND.lightGreen,
          backgroundColor: 'rgba(165, 242, 121, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: BRAND.primaryBlue,
        },
        {
          label: 'Kota',
          data: data.map((d) => d.quota),
          borderColor: BRAND.cyan,
          borderDash: [5, 5],
          tension: 0.35,
          pointRadius: 0,
        },
      ],
    },
    options: {
      ...chartDefaults,
      scales: {
        x: {
          ticks: { color: BRAND.cyan },
          grid: { color: 'rgba(66, 183, 214, 0.15)' },
        },
        y: {
          ticks: { color: BRAND.cyan },
          grid: { color: 'rgba(66, 183, 214, 0.15)' },
        },
      },
    },
  });
}

export function createDistributionChart(canvas, items) {
  const colors = items.map((item, i) => item.color || CHART_PALETTE[i % CHART_PALETTE.length]);

  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: items.map((i) => i.name),
      datasets: [
        {
          data: items.map((i) => i.value),
          backgroundColor: colors,
          borderWidth: 0,
        },
      ],
    },
    options: {
      ...chartDefaults,
      cutout: '65%',
      plugins: { legend: { display: false } },
    },
  });
}

export function createQuotaGauge(canvas, used, remaining) {
  return new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: ['Kullanılan', 'Kalan'],
      datasets: [
        {
          data: [used, remaining],
          backgroundColor: [BRAND.darkGreen, 'rgba(46, 143, 176, 0.35)'],
          borderWidth: 0,
        },
      ],
    },
    options: {
      ...chartDefaults,
      rotation: -90,
      circumference: 180,
      cutout: '68%',
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
    },
  });
}

export function createSparkline(canvas, values, color = BRAND.primaryBlue) {
  return new Chart(canvas, {
    type: 'line',
    data: {
      labels: values.map((_, i) => i),
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
      scales: {
        x: { display: false },
        y: { display: false },
      },
    },
  });
}
