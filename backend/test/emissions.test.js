import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateElectricityEmission,
  calculateEmissionByFactorKey,
} from '../src/domain/emissions.js';
import {
  getDataCatalog,
  getEmissionInventory,
  getLatestEnergyRecords,
} from '../src/services/energyData.js';

test('converts activity data from kgCO2e factor to tCO2e', () => {
  assert.equal(calculateElectricityEmission(1000), 0.469);
  assert.equal(calculateEmissionByFactorKey(1000, 'naturalGas'), 2.067);
});

test('builds the 2025 energy inventory from the imported CSV files', () => {
  const inventory = getEmissionInventory();
  const latest = inventory.summary.latestYear;

  assert.equal(latest.year, 2025);
  assert.equal(latest.electricityKwh, 2487762.9);
  assert.equal(latest.naturalGasM3, 480756.717);
  assert.equal(latest.solarProductionKwh, 2330823);
  assert.equal(latest.grossEnergyEmission, 2160.351);
  assert.equal(latest.avoidedEmission, 1454.9);
});

test('keeps independently verified annual electricity and natural gas totals stable', () => {
  const inventory = getEmissionInventory();
  const [year2024, year2025] = inventory.annual;

  assert.deepEqual(
    {
      electricityKwh: year2024.electricityKwh,
      electricityEmission: year2024.scope2ElectricityEmission,
      naturalGasM3: year2024.naturalGasM3,
      naturalGasEmission: year2024.scope1NaturalGasEmission,
      solarProductionKwh: year2024.solarProductionKwh,
      avoidedEmission: year2024.avoidedEmission,
    },
    {
      electricityKwh: 2135889.751,
      electricityEmission: 1001.732,
      naturalGasM3: 191255,
      naturalGasEmission: 395.271,
      solarProductionKwh: 422047.746,
      avoidedEmission: 263.442,
    }
  );
  assert.deepEqual(
    {
      electricityKwh: year2025.electricityKwh,
      electricityEmission: year2025.scope2ElectricityEmission,
      naturalGasM3: year2025.naturalGasM3,
      naturalGasEmission: year2025.scope1NaturalGasEmission,
      solarProductionKwh: year2025.solarProductionKwh,
      avoidedEmission: year2025.avoidedEmission,
    },
    {
      electricityKwh: 2487762.9,
      electricityEmission: 1166.761,
      naturalGasM3: 480756.717,
      naturalGasEmission: 993.59,
      solarProductionKwh: 2330823,
      avoidedEmission: 1454.9,
    }
  );
  assert.equal(inventory.factors.electricityGrid.value, 0.469);
  assert.equal(inventory.factors.naturalGas.value, 2.06672);
});

test('keeps fuel emissions outside annual totals when reporting period is unknown', () => {
  const inventory = getEmissionInventory();

  assert.equal(inventory.fuel.totalEmission, 702.224);
  assert.match(inventory.fuel.reportingPeriod, /dönem belirtilmemiş/i);
  assert.equal(getLatestEnergyRecords().length, 12);
});

test('reads every source row and preserves the imported source fingerprints', () => {
  const catalog = getDataCatalog();
  const expected = {
    'elektrik2024.csv': [12, '60A5403F30D6CBB5F5FD924BE226A74E625F2FB6DA5B541D99D7A13145594C68'],
    'elektirl2025.csv': [12, '94C4C3AB556891225DAFD6C7F68A6F067B2D29F229665CBEB2633D1BEAA9854E'],
    'dogalgaz2024.csv': [22, '77A255C15D04872AA762A785F996B23624F63EE3A2A85D52918BA088D8B7CDDE'],
    'dogalgaz2025.csv': [23, 'D66B02E504CB3B2D46E1B41C1ACE8FF647D0D6BC36AFDD3449261013027DCB35'],
    'ges.csv': [12, '702B18D33073C974D3204B610BE79C8187A186C446D051158EA33178CD228038'],
    'yakit_tuketimi.csv': [10, 'B9EE3ABEF44B9B8C70366550E1EB37FAA7D0AE98A289EE8F34CA40F7ADB15A43'],
  };

  assert.equal(catalog.metadata.sourceFileCount, 6);
  assert.equal(catalog.metadata.rawRecordCount, 91);
  catalog.datasets.forEach((dataset) => {
    assert.deepEqual([dataset.rowCount, dataset.checksumSha256], expected[dataset.fileName]);
    assert.equal(dataset.audit.rowWidthIssues.length, 0);
    assert.equal(dataset.audit.invalidNumericCells.length, 0);
  });
});

test('reconciles source totals and exposes every calculation', () => {
  const catalog = getDataCatalog();
  const electricity2024 = catalog.datasets.find((dataset) => dataset.id === 'electricity2024');
  const solar2025 = catalog.datasets.find((dataset) => dataset.id === 'solar2025');

  assert.equal(electricity2024.totals.tuketim_kwh, 2135889.751);
  assert.equal(electricity2024.totals.ges_cati_uretim_kwh, 422047.746);
  assert.equal(electricity2024.totals.elk_dagitim_kwh, 2557937.497);
  assert.equal(solar2025.totals.toplam, 2330823);
  assert.equal(catalog.monthlyCalculationLedger.length, 24);
  assert.equal(catalog.fuelCalculationLedger.length, 10);
  assert.equal(catalog.totals.comprehensiveGrossEmission, 2862.575);
  assert.equal(catalog.totals.positiveSolarImpact, 1454.9);
  assert.equal(
    catalog.validationChecks.find((check) => check.key === 'solar-reporting-scope').status,
    'warning'
  );
  assert.equal(
    catalog.validationChecks.find((check) => check.key === 'solar-capacity-plausibility').status,
    'warning'
  );
  const fuel = catalog.datasets.find((dataset) => dataset.id === 'fuelConsumption');
  assert.equal(
    fuel.rows[0].kullanim_alani,
    'Öğrencilerin kişisel araçla okula geliş-gidişinden kaynaklanan emisyon'
  );
  assert.equal(
    fuel.rows.at(-1).kullanim_alani,
    'Kampüs içi çim biçme faaliyetlerinde yakıt tüketimi'
  );
  assert.equal(
    catalog.validationChecks.find((check) => check.key === 'source-text-normalization').status,
    'verified'
  );
});
