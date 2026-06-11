import { Router } from 'express';
import { annualQuotas, dashboard } from '../data/platformData.js';
import { scenarioExports } from '../data/operationalData.js';
import { requireRole } from '../auth/middleware.js';
import { readBoolean, readNumber, readPlainObject, readText } from '../http/validation.js';
import { persistRuntimeSections } from '../data/runtimeStore.js';
import {
  buildFinancialScenarioPresets,
  calculateFinancialScenario,
} from '../domain/financialScenarios.js';

const router = Router();

const selectedQuota = annualQuotas.find((item) => item.year === dashboard.summary.quotaYear)
  ?? annualQuotas.at(-1);
const context = {
  year: selectedQuota.year,
  electricityEmission: dashboard.summary.electricityEmission,
  naturalGasEmission: dashboard.summary.naturalGasEmission,
  actualEmission: selectedQuota.actualEmission,
  quotaLimit: selectedQuota.quotaLimit,
  currentQuotaRemaining: selectedQuota.remaining,
  currentQuotaOverage: selectedQuota.overage,
  referenceCarbonPriceEur: dashboard.summary.marketPrice,
};
const presets = buildFinancialScenarioPresets(context.referenceCarbonPriceEur);

function readAssumptions(value) {
  const assumptions = readPlainObject(value, 'Varsayımlar', { maxKeys: 12 });
  return {
    electricityReductionPercent: readNumber(
      assumptions.electricityReductionPercent,
      'Elektrik azaltım oranı',
      { min: 0, max: 100 }
    ),
    naturalGasReductionPercent: readNumber(
      assumptions.naturalGasReductionPercent,
      'Doğalgaz azaltım oranı',
      { min: 0, max: 100 }
    ),
    investmentEur: readNumber(assumptions.investmentEur, 'Yatırım', { min: 0, max: 1_000_000_000 }),
    annualOperationalSavingsEur: readNumber(
      assumptions.annualOperationalSavingsEur,
      'Yıllık operasyonel tasarruf',
      { min: 0, max: 1_000_000_000 }
    ),
    analysisYears: readNumber(assumptions.analysisYears, 'Analiz süresi', { integer: true, min: 1, max: 50 }),
    discountRatePercent: readNumber(assumptions.discountRatePercent, 'İskonto oranı', { min: 0, max: 100 }),
    carbonPriceEur: readNumber(assumptions.carbonPriceEur, 'Karbon fiyatı', { min: 0, max: 1_000_000 }),
    includeCarbonValueInReturn: readBoolean(
      assumptions.includeCarbonValueInReturn,
      'Karbon referans değerini getiriye dahil et'
    ),
  };
}

router.get('/', (_req, res) => res.json({
  context,
  presets,
  exports: scenarioExports.filter((item) =>
    item.results && item.assumptions?.electricityReductionPercent !== undefined
  ),
}));
router.post('/calculate', (req, res) => {
  const assumptions = readAssumptions(req.body?.assumptions);
  res.json({ context, assumptions, results: calculateFinancialScenario(context, assumptions) });
});
router.post('/exports', requireRole('admin'), (req, res) => {
  const assumptions = readAssumptions(req.body?.assumptions);
  const item = {
    id: Date.now(),
    name: readText(req.body?.name, 'Senaryo adı', { defaultValue: 'Finansal senaryo analizi', maxLength: 160 }),
    createdAt: new Date().toISOString(),
    context,
    assumptions,
    results: calculateFinancialScenario(context, assumptions),
  };
  scenarioExports.unshift(item);
  persistRuntimeSections({ scenarioExports });
  res.status(201).json(item);
});

export default router;
