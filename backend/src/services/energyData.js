import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import {
  EMISSION_FACTORS,
  EMISSION_FORMULAS,
  calculateElectricityEmission,
  calculateEmissionByFactorKey,
  calculateNaturalGasEmission,
  calculateSolarAvoidedEmission,
  round,
} from '../domain/emissions.js';

const DATA_DIRECTORY = fileURLToPath(new URL('../../data/energy/', import.meta.url));
const MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];
const MONTH_LABELS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
const SOURCE_FILES = [
  'elektrik2024.csv',
  'elektirl2025.csv',
  'dogalgaz2024.csv',
  'dogalgaz2025.csv',
  'ges.csv',
  'yakit_tuketimi.csv',
];
const TEXT_COLUMNS = new Set([
  'ay',
  'aylar',
  'kullanim_alani',
  'yakit_tipi',
  'sozlesme_no',
  'blok',
  'no',
  'daire',
  'isyeri',
]);
const SOURCE_TEXT_CORRECTIONS = new Map([
  [
    'Kişisel araç ile Öğrenci okula geliş-gidiş kaynaklı emisyon',
    'Öğrencilerin kişisel araçla okula geliş-gidişinden kaynaklanan emisyon',
  ],
  [
    'Toplu taşıma Öğrenci okula geliş-gidiş kaynaklı emisyon',
    'Öğrencilerin toplu taşımayla okula geliş-gidişinden kaynaklanan emisyon',
  ],
  ['Çalışanların işe gidiş gelişleri', 'Çalışanların işe geliş-gidişlerinden kaynaklanan emisyon'],
  ['Resmi ve Kiralık Araçların kullanımı', 'Resmi ve kiralık araçların kullanımı'],
  ['Kampüs içi çim biçimi yakıt tükerimi', 'Kampüs içi çim biçme faaliyetlerinde yakıt tüketimi'],
]);
const DATASET_DEFINITIONS = {
  'elektrik2024.csv': {
    id: 'electricity2024',
    label: 'Elektrik 2024',
    description: 'Aylık tüketim, dağıtım hattı, çatı GES üretimi, birim fiyat ve tutar verileri.',
  },
  'elektirl2025.csv': {
    id: 'electricity2025',
    label: 'Elektrik 2025',
    description: 'HKÜ ile konuk evi/yurt elektrik tüketim ve tutar verileri. Kaynak dosya adı aynen korunmuştur.',
  },
  'ges.csv': {
    id: 'solar2025',
    label: 'GES Üretimi 2025',
    description: 'Beş GES tesisinin aylık üretimleri ve doğrulanan toplam üretim.',
  },
  'dogalgaz2024.csv': {
    id: 'naturalGas2024',
    label: 'Doğalgaz 2024',
    description: 'Sözleşme ve bina bazında dönemsel doğalgaz tüketim ve tutar verileri.',
  },
  'dogalgaz2025.csv': {
    id: 'naturalGas2025',
    label: 'Doğalgaz 2025',
    description: 'Sözleşme ve bina bazında dönemsel doğalgaz tüketim ve tutar verileri.',
  },
  'yakit_tuketimi.csv': {
    id: 'fuelConsumption',
    label: 'Yakıt Tüketimi',
    description: 'Kullanım alanı ve yakıt türü bazında litre tüketimleri.',
  },
};

function parseCsvMatrix(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (character === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      row.push(field);
      field = '';
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && next === '\n') index += 1;
      row.push(field);
      if (row.some((value) => value !== '')) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }

  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function parseCsv(text) {
  const rows = parseCsvMatrix(text);
  const headers = rows.shift().map((header) => header.replace(/^\uFEFF/, '').trim());
  return rows.map((values) =>
    Object.fromEntries(headers.map((header, index) => {
      const value = values[index]?.trim() ?? '';
      return [header, TEXT_COLUMNS.has(header) ? normalizeSourceText(value) : value];
    }))
  );
}

function normalizeSourceText(value) {
  return SOURCE_TEXT_CORRECTIONS.get(value) ?? value;
}

function readCsv(fileName) {
  return parseCsv(readFileSync(`${DATA_DIRECTORY}${fileName}`, 'utf8'));
}

function number(value) {
  const parsed = Number(String(value ?? '').trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeMonth(value) {
  const normalized = String(value).trim().toLocaleLowerCase('tr-TR');
  return MONTHS.findIndex((month) => month.toLocaleLowerCase('tr-TR') === normalized) + 1;
}

function normalizeFuel(value) {
  const normalized = String(value).trim().toLocaleLowerCase('tr-TR');
  if (normalized === 'mazot') return 'diesel';
  if (normalized === 'benzin') return 'petrol';
  if (normalized === 'lpg') return 'lpg';
  return normalized;
}

function isNumericColumn(column) {
  return !TEXT_COLUMNS.has(column);
}

function buildSourceCatalog() {
  return SOURCE_FILES.map((fileName) => {
    const text = readFileSync(`${DATA_DIRECTORY}${fileName}`, 'utf8');
    const matrix = parseCsvMatrix(text);
    const columns = matrix[0].map((column) => column.replace(/^\uFEFF/, '').trim());
    const rows = parseCsv(text);
    const rowWidthIssues = matrix
      .slice(1)
      .map((row, index) => ({ row: index + 2, cells: row.length }))
      .filter((item) => item.cells !== columns.length);
    const invalidNumericCells = [];
    const totals = {};
    let blankCells = 0;

    for (const column of columns) {
      if (isNumericColumn(column)) totals[column] = 0;
    }
    rows.forEach((row, rowIndex) => {
      columns.forEach((column) => {
        const value = row[column];
        if (value === '') {
          blankCells += 1;
          return;
        }
        if (isNumericColumn(column)) {
          const parsed = Number(value);
          if (!Number.isFinite(parsed)) {
            invalidNumericCells.push({ row: rowIndex + 2, column, value });
          } else {
            totals[column] += parsed;
          }
        }
      });
    });

    Object.keys(totals).forEach((column) => {
      totals[column] = round(totals[column], 6);
    });

    return {
      fileName,
      ...DATASET_DEFINITIONS[fileName],
      checksumSha256: createHash('sha256').update(text).digest('hex').toUpperCase(),
      rowCount: rows.length,
      columnCount: columns.length,
      columns,
      rows,
      totals,
      audit: {
        status: rowWidthIssues.length || invalidNumericCells.length ? 'warning' : 'verified',
        blankCells,
        rowWidthIssues,
        invalidNumericCells,
      },
    };
  });
}

function aggregateNaturalGas(rows, sourceYear) {
  const totals = new Map();
  const consumptionColumns = Object.keys(rows[0] ?? {}).filter((column) => column.startsWith('tuketim_'));

  for (const column of consumptionColumns) {
    const match = column.match(/^tuketim_\d{4}_(\d{2})_\d{2}$/);
    if (!match) continue;
    const monthNumber = Number(match[1]);
    const total = rows.reduce((sum, row) => sum + number(row[column]), 0);
    totals.set(`${sourceYear}-${monthNumber}`, (totals.get(`${sourceYear}-${monthNumber}`) ?? 0) + total);
  }

  return totals;
}

function buildActivityData() {
  const electricity2024 = readCsv('elektrik2024.csv');
  const electricity2025 = readCsv('elektirl2025.csv');
  const solar2025 = readCsv('ges.csv');
  const gas2024 = aggregateNaturalGas(readCsv('dogalgaz2024.csv'), 2024);
  const gas2025 = aggregateNaturalGas(readCsv('dogalgaz2025.csv'), 2025);

  const solarByMonth = new Map(
    solar2025.map((row) => [normalizeMonth(row.ay), number(row.toplam)])
  );

  const electricityRecords = [
    ...electricity2024.map((row) => ({
      year: 2024,
      monthNumber: normalizeMonth(row.aylar),
      electricityKwh: number(row.tuketim_kwh),
      distributionElectricityKwh: number(row.elk_dagitim_kwh),
      solarProductionKwh: number(row.ges_cati_uretim_kwh),
      electricityCostTry: number(row.odenecek_tutar_tl),
    })),
    ...electricity2025.map((row) => ({
      year: 2025,
      monthNumber: normalizeMonth(row.ay),
      electricityKwh: number(row.hku_tuketim_kwh) + number(row.konuk_evi_yurt_tuketim_kwh),
      distributionElectricityKwh: null,
      solarProductionKwh: solarByMonth.get(normalizeMonth(row.ay)) ?? 0,
      electricityCostTry: number(row.hku_tuketim_tl) + number(row.konuk_evi_yurt_tuketim_tl),
    })),
  ];

  return electricityRecords
    .map((record) => {
      const gasMap = record.year === 2024 ? gas2024 : gas2025;
      const naturalGasM3 = gasMap.get(`${record.year}-${record.monthNumber}`) ?? 0;
      const electricityEmission = calculateElectricityEmission(record.electricityKwh);
      const naturalGasEmission = calculateNaturalGasEmission(naturalGasM3);
      const avoidedEmission = calculateSolarAvoidedEmission(record.solarProductionKwh);

      return {
        ...record,
        month: MONTH_LABELS[record.monthNumber - 1],
        monthName: MONTHS[record.monthNumber - 1],
        naturalGasM3: round(naturalGasM3, 3),
        electricityEmission,
        naturalGasEmission,
        avoidedEmission,
        actual: round(electricityEmission + naturalGasEmission, 3),
      };
    })
    .sort((left, right) => left.year - right.year || left.monthNumber - right.monthNumber);
}

function buildFuelData() {
  const grouped = new Map();

  for (const row of readCsv('yakit_tuketimi.csv')) {
    const factorKey = normalizeFuel(row.yakit_tipi);
    const litres = number(row.yakit_tuketimi_l);
    const factor = EMISSION_FACTORS[factorKey];
    if (!factor) continue;

    const current = grouped.get(factorKey) ?? {
      factorKey,
      fuel: factor.label,
      litres: 0,
      factor: factor.value,
      factorUnit: factor.unit,
      emission: 0,
      uses: [],
    };
    current.litres += litres;
    current.uses.push({
      usageArea: row.kullanim_alani.trim(),
      fuel: factor.label,
      factorKey,
      litres: round(litres, 3),
      factor: factor.value,
      factorUnit: factor.unit,
      emission: calculateEmissionByFactorKey(litres, factorKey),
      numericFormula: `${round(litres, 3)} × ${factor.value} ÷ 1000 = ${calculateEmissionByFactorKey(litres, factorKey)}`,
    });
    grouped.set(factorKey, current);
  }

  const items = [...grouped.values()].map((item) => ({
    ...item,
    litres: round(item.litres, 3),
    emission: calculateEmissionByFactorKey(item.litres, item.factorKey),
  }));

  return {
    reportingPeriod: 'Kaynak dosyada dönem belirtilmemiş',
    items,
    totalLitres: round(items.reduce((sum, item) => sum + item.litres, 0), 3),
    totalEmission: round(items.reduce((sum, item) => sum + item.emission, 0), 3),
  };
}

function buildAnnualData(monthly) {
  return [...new Set(monthly.map((row) => row.year))].map((year) => {
    const records = monthly.filter((row) => row.year === year);
    const electricityKwh = records.reduce((sum, row) => sum + row.electricityKwh, 0);
    const naturalGasM3 = records.reduce((sum, row) => sum + row.naturalGasM3, 0);
    const solarProductionKwh = records.reduce((sum, row) => sum + row.solarProductionKwh, 0);
    const scope2ElectricityEmission = calculateElectricityEmission(electricityKwh);
    const scope1NaturalGasEmission = calculateNaturalGasEmission(naturalGasM3);
    const avoidedEmission = calculateSolarAvoidedEmission(solarProductionKwh);
    const grossEnergyEmission = scope2ElectricityEmission + scope1NaturalGasEmission;

    return {
      year,
      electricityKwh: round(electricityKwh, 3),
      naturalGasM3: round(naturalGasM3, 3),
      solarProductionKwh: round(solarProductionKwh, 3),
      scope2ElectricityEmission: round(scope2ElectricityEmission, 3),
      scope1NaturalGasEmission: round(scope1NaturalGasEmission, 3),
      grossEnergyEmission: round(grossEnergyEmission, 3),
      avoidedEmission: round(avoidedEmission, 3),
    };
  });
}

const monthly = buildActivityData();
const annual = buildAnnualData(monthly);
const fuel = buildFuelData();
const datasets = buildSourceCatalog();

function buildCalculationLedger() {
  const latest = annual.at(-1);
  const electricityFactor = EMISSION_FACTORS.electricityGrid;
  const naturalGasFactor = EMISSION_FACTORS.naturalGas;
  const solarFactor = EMISSION_FACTORS.solarAvoided;
  const fuelItems = fuel.items.map((item) => ({
    key: item.factorKey,
    label: `${item.fuel} kaynaklı emisyon`,
    classification: 'Brüt emisyon · Dönem atanmamış',
    activity: item.litres,
    activityUnit: 'litre',
    factor: item.factor,
    factorUnit: item.factorUnit,
    result: item.emission,
    resultUnit: 'tCO2e',
    numericFormula: `${item.litres} × ${item.factor} ÷ 1000 = ${item.emission}`,
  }));

  return [
    {
      key: 'electricity',
      label: `${latest.year} elektrik kaynaklı emisyon`,
      classification: 'Brüt emisyon · Kapsam 2',
      activity: latest.electricityKwh,
      activityUnit: 'kWh',
      factor: electricityFactor.value,
      factorUnit: electricityFactor.unit,
      result: latest.scope2ElectricityEmission,
      resultUnit: 'tCO2e',
      numericFormula: `${latest.electricityKwh} × ${electricityFactor.value} ÷ 1000 = ${latest.scope2ElectricityEmission}`,
    },
    {
      key: 'naturalGas',
      label: `${latest.year} doğalgaz kaynaklı emisyon`,
      classification: 'Brüt emisyon · Kapsam 1',
      activity: latest.naturalGasM3,
      activityUnit: 'm3',
      factor: naturalGasFactor.value,
      factorUnit: naturalGasFactor.unit,
      result: latest.scope1NaturalGasEmission,
      resultUnit: 'tCO2e',
      numericFormula: `${latest.naturalGasM3} × ${naturalGasFactor.value} ÷ 1000 = ${latest.scope1NaturalGasEmission}`,
    },
    ...fuelItems,
    {
      key: 'solar',
      label: `${latest.year} GES pozitif etkisi`,
      classification: 'Pozitif etki · Kaçınılan emisyon',
      activity: latest.solarProductionKwh,
      activityUnit: 'kWh',
      factor: solarFactor.value,
      factorUnit: solarFactor.unit,
      result: latest.avoidedEmission,
      resultUnit: 'tCO2',
      numericFormula: `${latest.solarProductionKwh} × ${solarFactor.value} ÷ 1000 = ${latest.avoidedEmission}`,
    },
  ];
}

function buildMonthlyCalculationLedger() {
  return monthly.map((row) => ({
    year: row.year,
    month: row.monthName,
    electricity: {
      activity: row.electricityKwh,
      result: row.electricityEmission,
      numericFormula: `${row.electricityKwh} × ${EMISSION_FACTORS.electricityGrid.value} ÷ 1000 = ${row.electricityEmission}`,
    },
    naturalGas: {
      activity: row.naturalGasM3,
      result: row.naturalGasEmission,
      numericFormula: `${row.naturalGasM3} × ${EMISSION_FACTORS.naturalGas.value} ÷ 1000 = ${row.naturalGasEmission}`,
    },
    solar: {
      activity: row.solarProductionKwh,
      result: row.avoidedEmission,
      numericFormula: `${row.solarProductionKwh} × ${EMISSION_FACTORS.solarAvoided.value} ÷ 1000 = ${row.avoidedEmission}`,
    },
  }));
}

const calculationLedger = buildCalculationLedger();
const monthlyCalculationLedger = buildMonthlyCalculationLedger();
const fuelCalculationLedger = fuel.items.flatMap((item) => item.uses);
const latestYear = annual.at(-1);
const comprehensiveGrossEmission = round(latestYear.grossEnergyEmission + fuel.totalEmission, 3);
const electricity2024Source = datasets.find((dataset) => dataset.id === 'electricity2024');
const solar2025Source = datasets.find((dataset) => dataset.id === 'solar2025');
const naturalGas2025Source = datasets.find((dataset) => dataset.id === 'naturalGas2025');
const normalizedSourceTextCount = datasets.reduce(
  (total, dataset) => total + dataset.rows.filter((row) =>
    Object.values(row).some((value) => [...SOURCE_TEXT_CORRECTIONS.values()].includes(value))
  ).length,
  0
);
const solarFacilityColumns = solar2025Source.columns.filter((column) => !['ay', 'toplam'].includes(column));
const solarFacilityLabels = {
  arbim_ges: 'ARBİM GES',
  ftr_ges: 'FTR GES',
  hku_cati_ges: 'HKÜ Çatı GES',
  kkm_cati_ges: 'KKM Çatı GES',
  hkuges1: 'HKÜ GES 1',
};
const solarFacilities = solarFacilityColumns.map((column) => {
  const productionKwh = round(
    solar2025Source.rows.reduce((sum, row) => sum + number(row[column]), 0),
    3
  );
  const monthly = solar2025Source.rows.map((row) => {
    const monthNumber = normalizeMonth(row.ay);
    const monthlyProductionKwh = number(row[column]);
    return {
      month: MONTH_LABELS[monthNumber - 1],
      monthName: MONTHS[monthNumber - 1],
      year: 2025,
      productionKwh: monthlyProductionKwh,
      positiveImpactTco2: calculateSolarAvoidedEmission(monthlyProductionKwh),
    };
  });
  return {
    key: column,
    label: solarFacilityLabels[column] ?? column.replaceAll('_', ' ').toLocaleUpperCase('tr-TR'),
    productionKwh,
    percent: round((productionKwh / latestYear.solarProductionKwh) * 100, 1),
    monthlyAverageKwh: round(productionKwh / monthly.length, 3),
    positiveImpactTco2: calculateSolarAvoidedEmission(productionKwh),
    monthly,
  };
});
const electricityReconciliationDifference = Math.max(
  ...electricity2024Source.rows.map((row) =>
    Math.abs(number(row.tuketim_kwh) + number(row.ges_cati_uretim_kwh) - number(row.elk_dagitim_kwh))
  )
);
const solarReconciliationDifference = Math.max(
  ...solar2025Source.rows.map((row) =>
    Math.abs(
      number(row.arbim_ges)
      + number(row.ftr_ges)
      + number(row.hku_cati_ges)
      + number(row.kkm_cati_ges)
      + number(row.hkuges1)
      - number(row.toplam)
    )
  )
);
const mislabeledNaturalGasColumns = naturalGas2025Source.columns.filter((column) =>
  /^(tuketim|odenecek_tutar)_2024_/.test(column)
);
const validationChecks = [
  {
    key: 'all-source-files',
    label: 'Tüm kaynak dosyaları okundu',
    status: datasets.length === SOURCE_FILES.length ? 'verified' : 'error',
    detail: `${datasets.length}/${SOURCE_FILES.length} dosya, ${datasets.reduce((sum, dataset) => sum + dataset.rowCount, 0)} ham kayıt`,
  },
  {
    key: 'numeric-cells',
    label: 'Sayısal hücre doğrulaması',
    status: datasets.every((dataset) => dataset.audit.invalidNumericCells.length === 0) ? 'verified' : 'error',
    detail: `${datasets.reduce((sum, dataset) => sum + dataset.audit.invalidNumericCells.length, 0)} geçersiz sayısal hücre`,
  },
  {
    key: 'source-checksums',
    label: 'Kaynak dosya parmak izleri',
    status: datasets.every((dataset) => /^[A-F0-9]{64}$/.test(dataset.checksumSha256)) ? 'verified' : 'error',
    detail: 'Her kaynak dosya için SHA-256 üretildi; sayfada dosya bazında gösterilir.',
  },
  {
    key: 'source-text-normalization',
    label: 'Türkçe metin ve yazım normalizasyonu',
    status: 'verified',
    detail: `${normalizedSourceTextCount} kaynak satırının kullanıcıya gösterilen açıklaması UTF-8 ve kurumsal Türkçe için normalize edildi; kaynak dosya parmak izleri değiştirilmedi.`,
  },
  {
    key: 'electricity-2024-reconciliation',
    label: '2024 elektrik eşitliği',
    status: electricityReconciliationDifference < 0.000001 ? 'verified' : 'error',
    detail: `tuketim_kwh + ges_cati_uretim_kwh = elk_dagitim_kwh; maksimum fark ${round(electricityReconciliationDifference, 6)}`,
  },
  {
    key: 'solar-2025-reconciliation',
    label: '2025 GES tesis toplamı',
    status: solarReconciliationDifference < 0.000001 ? 'verified' : 'error',
    detail: `Beş tesis üretimi = toplam; maksimum fark ${round(solarReconciliationDifference, 6)}`,
  },
  {
    key: 'solar-capacity-plausibility',
    label: 'GES fiziksel makullük kontrolü',
    status: 'warning',
    detail: 'Beş tesisin kaynak toplamları doğrulandı; kurulu güç (kWp) ve sayaç belgesi bulunmadığı için üretimin kapasiteye göre fiziksel makullüğü kesin doğrulanamaz.',
  },
  {
    key: 'solar-reporting-scope',
    label: 'GES yıllar arası kapsam karşılaştırması',
    status: 'warning',
    detail: `2024 elektrik dosyası tek ges_cati_uretim_kwh alanında ${electricity2024Source.totals.ges_cati_uretim_kwh} kWh; 2025 GES dosyası beş tesiste ${solar2025Source.totals.toplam} kWh içerir. Kapsamlar eşitlenmeden yıllık performans karşılaştırması yapılmamalıdır.`,
  },
  {
    key: 'natural-gas-2025-year-label',
    label: '2025 doğalgaz yıl etiketi',
    status: mislabeledNaturalGasColumns.length ? 'warning' : 'verified',
    detail: `${mislabeledNaturalGasColumns.length} kolon kaynakta 2024 etiketli; 2025 dosyasına ait oldukları için 2025 olarak işlenir.`,
  },
  {
    key: 'fuel-period',
    label: 'Yakıt raporlama dönemi',
    status: 'warning',
    detail: 'Kaynak dosyada dönem alanı yoktur; emisyon dağılımında dönem atanmamış olarak gösterilir.',
  },
  {
    key: 'natural-gas-unit',
    label: 'Doğalgaz tüketim birimi',
    status: 'warning',
    detail: 'Kaynak kolon adında birim yoktur; tüketim değerleri m3 kabul edilerek hesaplanır.',
  },
  {
    key: 'electricity-2024-basis',
    label: '2024 elektrik hesaplama bazı',
    status: 'warning',
    detail: 'Emisyon hesabında tuketim_kwh kullanılır; elk_dagitim_kwh yalnızca tuketim + GES eşitliğinin doğrulanmasında kullanılır.',
  },
  {
    key: 'sql-draft-coverage',
    label: 'Kaynak SQL taslak kapsamı',
    status: 'warning',
    detail: 'Kaynak SQL taslağında dogalgaz_2025 tablosu yoktur; platform hesapları eksiksiz altı CSV kaynağından yapılır.',
  },
  {
    key: 'factor-currency',
    label: 'Emisyon faktörlerinin güncelliği',
    status: 'verified',
    detail: '05.06.2026 tarihinde kontrol edildi: ETKB tüketim faktörü 26.12.2025 tarihinde yayımlanan en güncel resmi değer; UK 2026 seti henüz yayımlanmadığından 2025 seti kullanılır.',
  },
];

const inventory = {
  metadata: {
    reportingYears: annual.map((item) => item.year),
    sourceFiles: SOURCE_FILES,
    methodology: 'Activity data multiplied by a versioned emission factor.',
    dataQuality: [
      '2025 doğalgaz dosyasındaki Haziran, Temmuz ve Ağustos sütunları 2024 etiketi taşıyor; hesaplamada dosyanın raporlama yılı olan 2025 kullanıldı.',
      'Yakıt tüketimi dosyasında raporlama dönemi bulunmadığı için yakıt emisyonları dönem atanmamış olarak işaretlendi.',
      'GES kaynaklı kaçınılan emisyon, brüt kurumsal emisyon toplamından düşülmeden ayrı gösterge olarak raporlandı.',
      '2024 GES alanı ile 2025 beş tesisli GES dosyası farklı raporlama kapsamındadır; yıllar doğrudan performans karşılaştırması için kullanılmaz.',
      '2024 elektrik hesabında tuketim_kwh alanı kullanıldı; elk_dagitim_kwh alanı karşılaştırma amacıyla korundu.',
      'Doğalgaz CSV kolonlarında birim yazmıyor; fatura tüketim değerleri m3 olarak yorumlandı.',
    ],
  },
  factors: EMISSION_FACTORS,
  formulas: EMISSION_FORMULAS,
  annual,
  monthly,
  fuel,
  solar: {
    facilityCount: solarFacilities.length,
    facilities: solarFacilities,
    annualProductionKwh: latestYear.solarProductionKwh,
    monthlyAverageKwh: round(latestYear.solarProductionKwh / 12, 3),
    peakMonthlyProductionKwh: Math.max(...solar2025Source.rows.map((row) => number(row.toplam))),
    physicalValidation: 'Kurulu güç ve sayaç belgesi gerekli',
  },
  calculationLedger,
  monthlyCalculationLedger,
  fuelCalculationLedger,
  summary: {
    latestYear,
    fuelEmissionUnassigned: fuel.totalEmission,
    comprehensiveGrossEmission,
    positiveSolarImpact: latestYear.avoidedEmission,
  },
};

const dataCatalog = {
  metadata: {
    sourceFileCount: datasets.length,
    rawRecordCount: datasets.reduce((sum, dataset) => sum + dataset.rowCount, 0),
    generatedAt: new Date().toISOString(),
    calculationPolicy:
      'Brüt emisyonlar elektrik, doğalgaz ve dönem atanmamış yakıttan oluşur. GES pozitif etkisi brüt toplamdan düşülmeden ayrı gösterilir.',
  },
  validationChecks,
  formulas: EMISSION_FORMULAS,
  factors: EMISSION_FACTORS,
  calculationLedger,
  monthlyCalculationLedger,
  fuelCalculationLedger,
  datasets,
  totals: {
    latestYear: latestYear.year,
    electricityEmission: latestYear.scope2ElectricityEmission,
    naturalGasEmission: latestYear.scope1NaturalGasEmission,
    fuelEmissionUnassigned: fuel.totalEmission,
    comprehensiveGrossEmission,
    positiveSolarImpact: latestYear.avoidedEmission,
  },
};

export function getEmissionInventory() {
  return inventory;
}

export function getLatestEnergyRecords() {
  const latestYear = annual.at(-1).year;
  return monthly
    .filter((record) => record.year === latestYear)
    .map((record) => ({
      month: record.month,
      monthName: record.monthName,
      year: record.year,
      electricityKwh: record.electricityKwh,
      naturalGasM3: record.naturalGasM3,
      solarProductionKwh: record.solarProductionKwh,
    }));
}

export function getDataCatalog() {
  return dataCatalog;
}
