import { getDataCatalog, getEmissionInventory } from './energyData.js';
import { loadRuntimeSection, persistRuntimeSections } from '../data/runtimeStore.js';

const inventory = getEmissionInventory();
const catalog = getDataCatalog();
const latestYear = inventory.annual.at(-1).year;
const reportDefinitions = loadRuntimeSection('reportDefinitions', []);

const generatedReports = inventory.annual
  .map((annual, index) => createReportRecord({
    id: Number(`${annual.year}${String(index + 1).padStart(3, '0')}`),
    name: `${annual.year} Kurumsal Karbon Emisyon Raporu`,
    type: 'Kurumsal Karbon Envanteri',
    period: String(annual.year),
    year: annual.year,
    includeUnassignedFuel: annual.year === latestYear,
    status: 'published',
    statusLabel: 'PDF hazır',
  }))
  .reverse();
const reportItems = [
  ...reportDefinitions.map((definition) => createReportRecord(definition)),
  ...generatedReports.filter((generated) => !reportDefinitions.some((definition) => definition.id === generated.id)),
];

function formatDate(date = new Date()) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function createReportRecord(values) {
  const annual = inventory.annual.find((item) => item.year === Number(values.year)) ?? inventory.annual.at(-1);
  const includeUnassignedFuel = Boolean(values.includeUnassignedFuel);
  const fuelEmission = includeUnassignedFuel ? inventory.fuel.totalEmission : 0;

  return {
    id: values.id ?? Date.now(),
    name: String(values.name ?? `${annual.year} Kurumsal Karbon Emisyon Raporu`),
    type: String(values.type ?? 'Kurumsal Karbon Envanteri'),
    period: String(values.period ?? annual.year),
    year: annual.year,
    date: String(values.date ?? formatDate()),
    status: String(values.status ?? 'published'),
    statusLabel: String(values.statusLabel ?? 'PDF hazır'),
    format: 'PDF',
    engine: 'Python 3 · ReportLab · pypdf denetimi',
    includeUnassignedFuel,
    metrics: {
      electricityEmission: annual.scope2ElectricityEmission,
      naturalGasEmission: annual.scope1NaturalGasEmission,
      fuelEmissionUnassigned: fuelEmission,
      grossEmission: Number((annual.grossEnergyEmission + fuelEmission).toFixed(3)),
      solarProductionKwh: annual.solarProductionKwh,
      solarPositiveImpact: annual.avoidedEmission,
    },
  };
}

export function getReports() {
  const summary = reportItems.reduce(
    (result, report) => {
      result.total += 1;
      result[report.status] = (result[report.status] ?? 0) + 1;
      return result;
    },
    { total: 0, draft: 0, published: 0, planned: 0 }
  );

  return {
    summary,
    items: reportItems,
    calendar: reportItems.slice(0, 3).map((report) => ({
      date: report.date,
      title: `${report.name} · PDF`,
    })),
    source: {
      reportingYears: inventory.metadata.reportingYears,
      rawRecordCount: catalog.metadata.rawRecordCount,
      sourceFileCount: catalog.metadata.sourceFileCount,
    },
  };
}

export function getReport(id) {
  return reportItems.find((report) => report.id === Number(id)) ?? null;
}

export function createReport(payload = {}) {
  const requestedYear = Number(payload.year ?? payload.period ?? latestYear);
  const year = inventory.annual.some((item) => item.year === requestedYear) ? requestedYear : latestYear;
  const report = createReportRecord({
    ...payload,
    year,
    period: payload.period ?? String(year),
    includeUnassignedFuel: payload.includeUnassignedFuel ?? year === latestYear,
  });
  reportItems.unshift(report);
  reportDefinitions.unshift({
    id: report.id,
    name: report.name,
    type: report.type,
    period: report.period,
    year: report.year,
    date: report.date,
    status: report.status,
    statusLabel: report.statusLabel,
    includeUnassignedFuel: report.includeUnassignedFuel,
  });
  persistRuntimeSections({ reportDefinitions });
  return report;
}
