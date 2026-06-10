export const EMISSION_FACTORS = {
  electricityGrid: {
    key: 'electricityGrid',
    label: 'Şebeke elektriği - dağıtım hattı',
    value: 0.469,
    unit: 'kgCO2e/kWh',
    activityUnit: 'kWh',
    scope: 'Scope 2',
    source: 'T.C. Enerji ve Tabii Kaynaklar Bakanlığı',
    sourceYear: 2023,
    publishedAt: '26.12.2025',
    sourceUpdatedAt: '31.12.2025',
    checkedAt: '05.06.2026',
    currencyStatus: '2026 itibarıyla yayımlanmış en güncel resmi ETKB tüketim noktası faktörü',
    sourceUrl:
      'https://enerji.gov.tr/Media/Dizin/EVCED/tr/%C3%87evreVe%C4%B0klim/%C4%B0klimDe%C4%9Fi%C5%9Fikli%C4%9Fi/EmisyonFaktorleri/2023_Turkiye_Elektrik_UretimiveElektrik_Tuketim_Noktasi_Emisyon_Faktorleri.pdf',
  },
  solarAvoided: {
    key: 'solarAvoided',
    label: 'GES kaçınılan emisyon - birleşik marj',
    value: 0.6242,
    unit: 'kgCO2/kWh',
    activityUnit: 'kWh',
    scope: 'Envanter dışı azaltım göstergesi',
    source: 'T.C. Enerji ve Tabii Kaynaklar Bakanlığı',
    sourceYear: 2023,
    checkedAt: '05.06.2026',
    currencyStatus: '2026 itibarıyla erişilebilen en güncel resmi ETKB birleşik marj faktörü',
    sourceUrl:
      'https://enerji.gov.tr/Media/Dizin/EVCED/tr/%C3%87evreVe%C4%B0klim/%C4%B0klimDe%C4%9Fikli%C4%9Fi/TUESEmisyonFktr/Belgeler/Sebeke_EF_Bilgi_Formu_2023.pdf',
  },
  naturalGas: {
    key: 'naturalGas',
    label: 'Doğalgaz',
    value: 2.06672,
    unit: 'kgCO2e/m3',
    activityUnit: 'm3',
    scope: 'Scope 1',
    source: 'UK Government GHG Conversion Factors 2025',
    sourceYear: 2025,
    publishedAt: '10.06.2025',
    checkedAt: '05.06.2026',
    currencyStatus: '2026 faktör seti henüz yayımlanmadığı için en güncel yayımlanmış resmi set',
    sourceUrl:
      'https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025',
  },
  diesel: {
    key: 'diesel',
    label: 'Mazot',
    value: 2.57082,
    unit: 'kgCO2e/litre',
    activityUnit: 'litre',
    scope: 'Scope 1 / Scope 3',
    source: 'UK Government GHG Conversion Factors 2025',
    sourceYear: 2025,
    publishedAt: '10.06.2025',
    checkedAt: '05.06.2026',
    currencyStatus: '2026 faktör seti henüz yayımlanmadığı için en güncel yayımlanmış resmi set',
    sourceUrl:
      'https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025',
  },
  petrol: {
    key: 'petrol',
    label: 'Benzin',
    value: 2.06916,
    unit: 'kgCO2e/litre',
    activityUnit: 'litre',
    scope: 'Scope 1 / Scope 3',
    source: 'UK Government GHG Conversion Factors 2025',
    sourceYear: 2025,
    publishedAt: '10.06.2025',
    checkedAt: '05.06.2026',
    currencyStatus: '2026 faktör seti henüz yayımlanmadığı için en güncel yayımlanmış resmi set',
    sourceUrl:
      'https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025',
  },
  lpg: {
    key: 'lpg',
    label: 'LPG',
    value: 1.55713,
    unit: 'kgCO2e/litre',
    activityUnit: 'litre',
    scope: 'Scope 1 / Scope 3',
    source: 'UK Government GHG Conversion Factors 2025',
    sourceYear: 2025,
    publishedAt: '10.06.2025',
    checkedAt: '05.06.2026',
    currencyStatus: '2026 faktör seti henüz yayımlanmadığı için en güncel yayımlanmış resmi set',
    sourceUrl:
      'https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2025',
  },
};

export const EMISSION_FORMULAS = [
  {
    key: 'electricityEmission',
    label: 'Elektrik kaynaklı emisyon',
    expression: 'Elektrik tCO2e = şebekeden tüketilen elektrik (kWh) × 0,469 kgCO2e/kWh ÷ 1000',
    symbolicExpression: 'E_elektrik = A_elektrik × EF_elektrik ÷ 1000',
    factorKey: 'electricityGrid',
    classification: 'Brüt emisyon · Kapsam 2',
    note: '2024 için tuketim_kwh; 2025 için hku_tuketim_kwh + konuk_evi_yurt_tuketim_kwh kullanılır.',
  },
  {
    key: 'naturalGasEmission',
    label: 'Doğalgaz kaynaklı emisyon',
    expression: 'Doğalgaz tCO2e = tüketilen doğalgaz (m3) × 2,06672 kgCO2e/m3 ÷ 1000',
    symbolicExpression: 'E_doğalgaz = A_doğalgaz × EF_doğalgaz ÷ 1000',
    factorKey: 'naturalGas',
    classification: 'Brüt emisyon · Kapsam 1',
    note: 'Her doğalgaz CSV dosyasındaki tuketim_* kolonları bina bazında toplanır.',
  },
  {
    key: 'fuelEmission',
    label: 'Yakıt kaynaklı emisyon',
    expression: 'Yakıt tCO2e = tüketilen yakıt (litre) × yakıta özel kgCO2e/litre faktörü ÷ 1000',
    symbolicExpression: 'E_yakıt = Σ(A_yakıt,türü × EF_yakıt,türü) ÷ 1000',
    factorKey: 'diesel|petrol|lpg',
    classification: 'Brüt emisyon · Kapsam 1 / Kapsam 3',
    note: 'Mazot, benzin ve LPG ayrı hesaplanır; kaynakta dönem olmadığı için dönem atanmamış olarak işaretlenir.',
  },
  {
    key: 'solarAvoidedEmission',
    label: 'GES kaynaklı kaçınılan emisyon',
    expression: 'kaçınılan tCO2 = GES üretimi (kWh) x güneş birleşik marj faktörü / 1000',
    symbolicExpression: 'P_GES = A_GES × EF_birleşik_marj ÷ 1000',
    factorKey: 'solarAvoided',
    classification: 'Pozitif etki · Envanter dışı azaltım',
    note: 'Pozitif etki olarak gösterilir; brüt kurumsal emisyon toplamından düşülmez.',
  },
  {
    key: 'comprehensiveGrossEmission',
    label: 'Kapsamlı brüt emisyon göstergesi',
    expression: 'Kapsamlı brüt tCO2e = elektrik tCO2e + doğalgaz tCO2e + dönem atanmamış yakıt tCO2e',
    symbolicExpression: 'E_brüt = E_elektrik + E_doğalgaz + E_yakıt',
    classification: 'Brüt emisyon göstergesi',
    note: 'Yakıt kaynağında dönem bulunmadığından bu gösterge veri-kalitesi uyarısıyla sunulur.',
  },
];

export function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
}

export function calculateEmission(activityAmount, factor) {
  return round((Number(activityAmount) * Number(factor)) / 1000, 3);
}

export function calculateEmissionByFactorKey(activityAmount, factorKey) {
  const factor = EMISSION_FACTORS[factorKey];
  if (!factor) throw new Error(`Bilinmeyen emisyon faktörü: ${factorKey}`);
  return calculateEmission(activityAmount, factor.value);
}

export function calculateElectricityEmission(kwh) {
  return calculateEmissionByFactorKey(kwh, 'electricityGrid');
}

export function calculateNaturalGasEmission(m3) {
  return calculateEmissionByFactorKey(m3, 'naturalGas');
}

export function calculateSolarAvoidedEmission(kwh) {
  return calculateEmissionByFactorKey(kwh, 'solarAvoided');
}

export function calculateDashboardFromEnergy(records, config = {}) {
  const quotaLimit = config.quotaLimit ?? 15000;
  const marketPrice = config.marketPrice ?? 25.4;
  const fuelEmission = round(config.fuelEmission ?? 0, 3);
  const solarPositiveImpact = round(config.solarPositiveImpact ?? 0, 3);

  const trend = records.map((record) => {
    const electricityEmission = calculateElectricityEmission(record.electricityKwh);
    const naturalGasEmission = calculateNaturalGasEmission(record.naturalGasM3);
    const avoidedEmission = calculateSolarAvoidedEmission(record.solarProductionKwh ?? 0);
    const logisticsEmission = round(record.logisticsTco2e ?? 0, 3);
    const wasteEmission = round(record.wasteTco2e ?? 0, 3);
    const otherEmission = round(record.otherTco2e ?? 0, 3);
    const actual = round(
      electricityEmission + naturalGasEmission + logisticsEmission + wasteEmission + otherEmission,
      3
    );

    return {
      ...record,
      electricityEmission,
      naturalGasEmission,
      avoidedEmission,
      logisticsEmission,
      wasteEmission,
      otherEmission,
      actual,
      quota: record.quota ?? quotaLimit,
    };
  });

  const current = trend.at(-1);
  const previous = trend.at(-2) ?? current;
  const electricityKwh = trend.reduce((sum, record) => sum + record.electricityKwh, 0);
  const naturalGasM3 = trend.reduce((sum, record) => sum + record.naturalGasM3, 0);
  const electricityEmission = calculateElectricityEmission(electricityKwh);
  const naturalGasEmission = calculateNaturalGasEmission(naturalGasM3);
  const otherEmission = round(
    trend.reduce(
      (sum, record) =>
        sum + record.logisticsEmission + record.wasteEmission + record.otherEmission,
      0
    ),
    3
  );
  const energyEmission = round(electricityEmission + naturalGasEmission + otherEmission, 3);
  const solarProductionKwh = round(
    trend.reduce((sum, record) => sum + (record.solarProductionKwh ?? 0), 0),
    3
  );
  const totalEmission = round(energyEmission + fuelEmission, 3);
  const trendPercent = previous.actual
    ? round(((current.actual - previous.actual) / previous.actual) * 100, 1)
    : 0;
  const remaining = round(quotaLimit - totalEmission, 2);
  const usedPercent = Math.min(100, round((totalEmission / quotaLimit) * 100, 1));
  const quotaExceeded = remaining < 0;
  const sellableSurplus = Math.max(0, remaining);
  const estimatedTradingProfit = round(sellableSurplus * marketPrice, 2);

  const distributionItemsRaw = [
    {
      name: 'Elektrik',
      value: electricityEmission,
      color: '#67D2F5',
    },
    {
      name: 'Doğalgaz',
      value: naturalGasEmission,
      color: '#42B7D6',
    },
    {
      name: 'Yakıt tüketimi',
      value: fuelEmission,
      color: '#F5C76B',
      impactType: 'emission',
      unit: 'tCO2e',
      note: 'Kaynak dosyada dönem belirtilmemiştir.',
    },
  ];
  const distributionItems = distributionItemsRaw.map((item) => ({
    ...item,
    percent: totalEmission ? round((item.value / totalEmission) * 100, 1) : 0,
    impactType: item.impactType ?? 'emission',
    unit: item.unit ?? 'tCO2e',
  }));

  return {
    summary: {
      totalEmission,
      energyEmission,
      electricityEmission,
      naturalGasEmission,
      fuelEmissionUnassigned: fuelEmission,
      solarProductionKwh,
      solarPositiveImpact,
      trendPercent,
      quotaLimit,
      usedPercent,
      remaining: Math.max(0, remaining),
      overage: quotaExceeded ? Math.abs(remaining) : 0,
      quotaStatus: quotaExceeded ? 'Kota aşıldı' : 'Kota aşılmadı',
      quotaExceeded,
      potentialProfit: estimatedTradingProfit,
      marketPrice,
      sellableSurplus,
      estimatedTradingProfit,
    },
    trend,
    distribution: {
      total: totalEmission,
      items: distributionItems,
    },
    solar: {
      totalProductionKwh: solarProductionKwh,
      monthlyAverageKwh: round(solarProductionKwh / Math.max(trend.length, 1), 3),
      peakMonthlyProductionKwh: Math.max(...trend.map((record) => record.solarProductionKwh ?? 0)),
      positiveImpactTco2: solarPositiveImpact,
      facilityCount: config.solarFacilities?.length ?? null,
      facilities: config.solarFacilities ?? [],
      monthly: trend.map((record) => ({
        month: record.month,
        monthName: record.monthName,
        year: record.year,
        productionKwh: record.solarProductionKwh ?? 0,
        positiveImpactTco2: record.avoidedEmission,
      })),
    },
    factors: EMISSION_FACTORS,
  };
}
