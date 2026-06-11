import { dashboard, emissionInventory } from './platformData.js';
import { loadRuntimeSection } from './runtimeStore.js';

export const trading = loadRuntimeSection('trading', {
  market: {
    currency: 'EUR',
    price: dashboard.summary.marketPrice,
    dailyChangePercent: 1.8,
    updatedAt: '05.06.2026 12:00',
  },
  orders: [],
});

export const quotaPlans = loadRuntimeSection('quotaPlans', [
  {
    id: 1,
    title: 'Elektrik verimliliği programı',
    targetTco2e: 140,
    owner: 'Enerji Yönetimi',
    dueDate: '30.09.2026',
    status: 'active',
  },
  {
    id: 2,
    title: 'Doğalgaz kazan optimizasyonu',
    targetTco2e: 90,
    owner: 'Teknik İşler',
    dueDate: '31.12.2026',
    status: 'planned',
  },
]);

export const scenarioExports = loadRuntimeSection('scenarioExports', []);

const latestYear = emissionInventory.summary.latestYear;
const monthlyPeak = [...emissionInventory.monthly]
  .filter((row) => row.year === latestYear.year)
  .sort((left, right) => right.actual - left.actual)[0];
const latestMonth = emissionInventory.monthly.at(-1);

const graphSummary = {
  annualEmission: latestYear.grossEnergyEmission,
  avoidedEmission: latestYear.avoidedEmission,
  latestEmission: latestMonth.actual,
  latestPeriod: `${latestMonth.monthName} ${latestMonth.year}`,
  peakEmission: monthlyPeak.actual,
  peakPeriod: `${monthlyPeak.monthName} ${monthlyPeak.year}`,
};
const graphObservations = [
  {
    id: 1,
    priority: 'high',
    title: 'Aylık emisyon zirvesi',
    description: `${monthlyPeak.monthName} ${monthlyPeak.year}, grafikte yılın en yüksek toplam emisyon değerine sahip ayıdır.`,
    impactTco2e: monthlyPeak.actual,
    unit: 'tCO2e',
    savingTry: 0,
    effort: '',
    status: 'open',
  },
  {
    id: 2,
    priority: 'high',
    title: 'Son ay doğalgaz emisyonu',
    description: `${latestMonth.monthName} ${latestMonth.year} doğalgaz kaynaklı emisyon değeri grafikte gösterilmektedir.`,
    impactTco2e: latestMonth.naturalGasEmission,
    unit: 'tCO2e',
    savingTry: 0,
    effort: '',
    status: 'open',
  },
  {
    id: 3,
    priority: 'medium',
    title: 'Son ay GES göstergesi',
    description: `${latestMonth.monthName} ${latestMonth.year} GES kaynaklı kaçınılan emisyon değeri grafikte gösterilmektedir.`,
    impactTco2e: latestMonth.avoidedEmission,
    unit: 'tCO2',
    savingTry: 0,
    effort: '',
    status: 'open',
  },
];

export const aiAnalysis = loadRuntimeSection('aiAnalysis', {
  generatedAt: '05.06.2026 12:00',
  summary: graphSummary,
  recommendations: graphObservations,
  risks: [],
});

// AI görünümü yalnızca hesaplanmış grafik değerlerini sunar; eski kayıtlı öneri metinlerini taşımaz.
aiAnalysis.summary = structuredClone(graphSummary);
aiAnalysis.recommendations = structuredClone(graphObservations);
aiAnalysis.risks = [];
