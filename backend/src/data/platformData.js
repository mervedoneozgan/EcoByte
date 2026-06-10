import { calculateDashboardFromEnergy, round } from '../domain/emissions.js';
import { getEmissionInventory, getLatestEnergyRecords } from '../services/energyData.js';
import { loadRuntimeSection } from './runtimeStore.js';

export const company = {
  id: 1,
  name: 'Hasan Kalyoncu Üniversitesi',
  sector: 'Eğitim',
  export_status: 'Kampüs operasyonları',
  slogan: 'Daha az emisyon, daha güçlü gelecek',
};

export const energyRecords = getLatestEnergyRecords();
export const emissionInventory = getEmissionInventory();
const unassignedFuelEmission = emissionInventory.fuel.totalEmission;
export const dashboardTrend = emissionInventory.monthly.map((record) => ({
  month: record.month,
  monthName: record.monthName,
  year: record.year,
  electricityKwh: record.electricityKwh,
  naturalGasM3: record.naturalGasM3,
  electricityEmission: record.electricityEmission,
  naturalGasEmission: record.naturalGasEmission,
  actual: record.actual,
}));

function buildAnnualDistribution(annualRecord) {
  const total = round(annualRecord.grossEnergyEmission + unassignedFuelEmission, 3);
  return {
    year: annualRecord.year,
    total,
    scope: 'Kapsam 1 + Kapsam 2 + dönem atanmamış yakıt',
    note: 'Dönemi bilinmeyen yakıt emisyonları yıllık toplamda ayrı bir dilim olarak gösterilir.',
    items: [
      {
        name: 'Elektrik',
        value: annualRecord.scope2ElectricityEmission,
        percent: round((annualRecord.scope2ElectricityEmission / total) * 100, 1),
        color: '#67D2F5',
        impactType: 'emission',
        unit: 'tCO2e',
      },
      {
        name: 'Doğalgaz',
        value: annualRecord.scope1NaturalGasEmission,
        percent: round((annualRecord.scope1NaturalGasEmission / total) * 100, 1),
        color: '#42B7D6',
        impactType: 'emission',
        unit: 'tCO2e',
      },
      {
        name: 'Yakıt',
        value: unassignedFuelEmission,
        percent: round((unassignedFuelEmission / total) * 100, 1),
        color: '#F5C76B',
        impactType: 'emission',
        unit: 'tCO2e',
      },
    ],
  };
}

function buildAnnualQuota({
  year,
  actualEmission = null,
  quotaLimit = null,
  baselineYear = null,
  baselineEmission = null,
}) {
  const hasQuota = Number.isFinite(quotaLimit);
  const hasActual = Number.isFinite(actualEmission);
  const difference = hasQuota && hasActual ? round(quotaLimit - actualEmission, 3) : null;
  const quotaExceeded = difference !== null && difference < 0;
  return {
    year,
    actualEmission,
    quotaLimit,
    baselineYear,
    baselineEmission,
    hasQuota,
    hasActual,
    usedPercent: hasQuota && hasActual ? round((actualEmission / quotaLimit) * 100, 1) : null,
    remaining: difference === null ? null : Math.max(0, difference),
    overage: quotaExceeded ? Math.abs(difference) : 0,
    quotaExceeded,
    status: !hasQuota
      ? 'Kota tanımlı değil'
      : !hasActual
        ? 'Yıllık ölçüm bekleniyor'
        : quotaExceeded ? 'Kota aşıldı' : 'Kota aşılmadı',
  };
}

export const annualDistributions = emissionInventory.annual.map(buildAnnualDistribution);
const latestAnnual = emissionInventory.summary.latestYear;
const annual2024 = emissionInventory.annual.find((record) => record.year === 2024) ?? emissionInventory.annual[0];
const quotaLimit2024 = round(annual2024.grossEnergyEmission * 0.95, 3);
const quotaLimit2025 = round(latestAnnual.grossEnergyEmission * 0.95, 3);
const annualQuotaEntries = [
  buildAnnualQuota({
    year: annual2024.year,
    actualEmission: annual2024.grossEnergyEmission,
    quotaLimit: quotaLimit2024,
    baselineYear: annual2024.year,
    baselineEmission: annual2024.grossEnergyEmission,
  }),
  buildAnnualQuota({
    year: latestAnnual.year,
    actualEmission: latestAnnual.grossEnergyEmission,
    quotaLimit: quotaLimit2025,
    baselineYear: latestAnnual.year,
    baselineEmission: latestAnnual.grossEnergyEmission,
  }),
];
export const annualQuotas = [
  ...annualQuotaEntries,
];

const calculated = calculateDashboardFromEnergy(energyRecords, {
  quotaLimit: quotaLimit2025,
  quotaYear: latestAnnual.year,
  quotaBaselineYear: latestAnnual.year,
  quotaBaselineEmission: latestAnnual.grossEnergyEmission,
  quotaScope: 'Kapsam 1 + Kapsam 2 (elektrik ve doğal gaz)',
  quotaNote: '2024 ve 2025 ölçülmüş Scope 1+2 baz yıllarına göre tam %5 azaltım hedefiyle hesaplanan kurumsal emisyon kotalarıdır.',
  reportingYear: latestAnnual.year,
  etsEligible: false,
  etsStatus: 'Üniversitelere özel resmî ETS tahsisi belgelenmedi; kurumsal kotalar yalnızca EcoByte içi azaltım izleme için kullanılır.',
  etsScreeningThresholdTco2e: 50000,
  marketPrice: 25.4,
  fuelEmission: unassignedFuelEmission,
  solarPositiveImpact: emissionInventory.summary.latestYear.avoidedEmission,
  solarFacilities: emissionInventory.solar.facilities,
});
const latestTrend = calculated.trend.at(-1);
calculated.summary.annualQuotas = annualQuotas;
const latestDistribution = annualDistributions.at(-1);
calculated.distribution = {
  ...latestDistribution,
  selectedYear: latestDistribution.year,
  years: annualDistributions,
  unassignedFuelEmission,
};
const largestDistributionItem = [...calculated.distribution.items]
  .sort((left, right) => right.value - left.value)[0];

export const dashboard = {
  company,
  ...calculated,
  scenarios: [
    { type: 'base', label: 'Temel', value: calculated.summary.estimatedTradingProfit, trend: [45, 52, 48, 55, 60, 58, 62, 65] },
    { type: 'pessimistic', label: 'Kötümser', value: Math.round(calculated.summary.estimatedTradingProfit * 0.78), trend: [60, 58, 55, 52, 50, 48, 45, 42] },
    { type: 'optimistic', label: 'İyimser', value: Math.round(calculated.summary.estimatedTradingProfit * 1.26), trend: [40, 45, 50, 55, 60, 68, 72, 78] },
  ],
  aiInsights: [
    { type: 'suggestion', title: 'Aylık emisyon trendi', description: `${latestTrend.monthName} ${latestTrend.year} toplam emisyon değeri grafikte gösteriliyor.`, impact: `${latestTrend.actual} tCO2e` },
    { type: 'risk', title: 'Yıllık emisyon dağılımı', description: 'Grafik, seçilen yıldaki elektrik, doğalgaz ve yakıt emisyonlarının toplam içindeki payını gösteriyor.', impact: `En yüksek pay: ${largestDistributionItem.name} · %${largestDistributionItem.percent}` },
    { type: 'opportunity', title: 'GES üretimi', description: `${latestTrend.monthName} ${latestTrend.year} GES üretimi grafikte gösteriliyor.`, impact: `${latestTrend.solarProductionKwh} kWh` },
  ],
};

export const consultancy = loadRuntimeSection('consultancy', {
  summary: { total: 18, open: 6, ongoing: 7, completed: 5 },
  requests: [
    { id: 1, title: 'Karbon ayak izi analizi', expert: 'Dr. Ahmet Yılmaz', date: '25.05.2026', status: 'ongoing', statusLabel: 'Devam ediyor' },
    { id: 2, title: 'Sürdürülebilirlik stratejisi', expert: 'Dr. Elif Kaya', date: '22.05.2026', status: 'open', statusLabel: 'Açık' },
    { id: 3, title: 'Enerji verimliliği danışmanlığı', expert: 'Mehmet Demir', date: '18.05.2026', status: 'ongoing', statusLabel: 'Devam ediyor' },
    { id: 4, title: 'Emisyon azaltım planı', expert: 'Dr. Ahmet Yılmaz', date: '10.05.2026', status: 'completed', statusLabel: 'Tamamlandı' },
  ],
  experts: [
    { id: 1, name: 'Dr. Ahmet Yılmaz', specialty: 'Karbon muhasebesi', rating: 4.9, requests: 12 },
    { id: 2, name: 'Dr. Elif Kaya', specialty: 'Sürdürülebilirlik', rating: 4.8, requests: 9 },
    { id: 3, name: 'Mehmet Demir', specialty: 'Enerji verimliliği', rating: 4.7, requests: 7 },
  ],
  services: [
    { id: 1, name: 'Karbon ayak izi analizi', duration: '2-4 hafta', price: '15.000 ₺' },
    { id: 2, name: 'Sürdürülebilirlik stratejisi', duration: '4-6 hafta', price: '28.000 ₺' },
    { id: 3, name: 'Enerji verimliliği danışmanlığı', duration: '3 hafta', price: '12.500 ₺' },
    { id: 4, name: 'Emisyon azaltım planı', duration: '6 hafta', price: '35.000 ₺' },
  ],
  documents: [
    { id: 1, name: 'Karbon Raporu 2026 Q1.pdf', date: '15.04.2026', size: '2.4 MB', description: '2026 ilk çeyrek karbon envanteri ve uzman değerlendirmesi.' },
    { id: 2, name: 'Danışmanlık Sözleşmesi.pdf', date: '01.05.2026', size: '890 KB', description: 'Danışmanlık hizmet kapsamı ve çalışma koşulları.' },
    { id: 3, name: 'Emisyon Azaltım Taslağı.docx', date: '22.05.2026', size: '1.1 MB', description: 'Önerilen azaltım aksiyonları ve uygulama takvimi taslağı.' },
  ],
  appointments: [
    { id: 1, expert: 'Dr. Ahmet Yılmaz', service: 'Karbon ayak izi analizi', datetime: '12.06.2026, 10:00', scheduledAt: '2026-06-12T10:00:00+03:00', meetingUrl: 'https://meet.jit.si/EcoByte-Consultancy-1', avatar: 'AY' },
    { id: 2, expert: 'Dr. Elif Kaya', service: 'Sürdürülebilirlik stratejisi', datetime: '15.06.2026, 14:30', scheduledAt: '2026-06-15T14:30:00+03:00', meetingUrl: 'https://meet.jit.si/EcoByte-Consultancy-2', avatar: 'EK' },
    { id: 3, expert: 'Mehmet Demir', service: 'Enerji verimliliği', datetime: '18.06.2026, 11:00', scheduledAt: '2026-06-18T11:00:00+03:00', meetingUrl: 'https://meet.jit.si/EcoByte-Consultancy-3', avatar: 'MD' },
  ],
});
consultancy.documents.forEach((document) => {
  document.description ??= `${document.name} için danışmanlık belge özeti.`;
});
consultancy.appointments.forEach((appointment, index) => {
  appointment.id ??= index + 1;
  appointment.meetingUrl ??= `https://meet.jit.si/EcoByte-Consultancy-${appointment.id}`;
  const date = new Date(appointment.scheduledAt);
  if (!appointment.scheduledAt || Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
    const nextDate = new Date(Date.now() + (index + 3) * 24 * 60 * 60 * 1000);
    appointment.scheduledAt = nextDate.toISOString();
    appointment.datetime = nextDate.toLocaleString('tr-TR', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'Europe/Istanbul',
    });
  }
});

export const notifications = loadRuntimeSection('notifications', {
  items: [
    { id: 0, category: 'duyuru', type: 'announcement', title: 'Raporlama dönemi açıldı', description: '2026 Q2 raporlama süreci başlatıldı.', time: '30.05.2026', unread: true, actionLabel: 'Raporlara git', actionRoute: 'reporting' },
    { id: 1, category: 'uyari', type: 'warning', title: 'Emisyon artışı', description: 'Mayıs emisyon değeri geçen aya göre yükseldi.', time: '30.05.2026 10:30', unread: true },
    { id: 2, category: 'hatirlatma', type: 'reminder', title: '2024-2025 kotaları', description: '2024 ve 2025 kurumsal kotaları tanımlandı; yıllık ölçümler tamamlandıkça kullanım oranı hesaplanacak.', time: '29.05.2026', unread: false },
  ],
});

const defaultSettings = {
  profile: {
    companyName: 'Hasan Kalyoncu Üniversitesi',
    sector: 'Eğitim',
    employees: 250,
    country: 'Türkiye',
    currency: 'TRY',
  },
  system: {
    version: '2.1.0',
    lastUpdate: '30.05.2026',
    database: 'Hazır',
    license: 'Premium',
  },
  brandLogoDataUrl: null,
  preferences: {
    kullanici: { defaultRole: 'Analist', requireInviteApproval: true },
    rol: { analystCanExport: true, auditorReadOnly: true },
    bildirim: { emailNotifications: true, criticalAlerts: true, weeklySummary: true },
    entegrasyon: { reportService: true, fileStorage: true, syncIntervalMinutes: 30 },
    veri: { autoSync: true, retentionDays: 365, qualityWarnings: true },
    guvenlik: { twoFactorRequired: true, sessionMinutes: 30, ipRestriction: false },
    yedekleme: { enabled: true, frequency: 'Günlük', retentionDays: 90 },
  },
};

export const settings = loadRuntimeSection('settings', defaultSettings);
const storedPreferences = settings.preferences ?? {};
settings.preferences = Object.fromEntries(
  Object.entries(defaultSettings.preferences).map(([section, defaults]) => [
    section,
    { ...defaults, ...(storedPreferences[section] ?? {}) },
  ])
);

company.name = settings.profile.companyName;
company.sector = settings.profile.sector;
