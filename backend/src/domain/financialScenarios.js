import { round } from './emissions.js';

export function buildFinancialScenarioPresets(referenceCarbonPriceEur) {
  return [
    {
      id: 'conservative',
      label: 'Temkinli',
      assumptions: {
        electricityReductionPercent: 6,
        naturalGasReductionPercent: 5,
        investmentEur: 45000,
        annualOperationalSavingsEur: 15000,
        analysisYears: 5,
        discountRatePercent: 12,
        carbonPriceEur: referenceCarbonPriceEur,
        includeCarbonValueInReturn: false,
      },
    },
    {
      id: 'balanced',
      label: 'Dengeli',
      assumptions: {
        electricityReductionPercent: 12,
        naturalGasReductionPercent: 9,
        investmentEur: 68000,
        annualOperationalSavingsEur: 30000,
        analysisYears: 5,
        discountRatePercent: 10,
        carbonPriceEur: referenceCarbonPriceEur,
        includeCarbonValueInReturn: false,
      },
    },
    {
      id: 'ambitious',
      label: 'İddialı',
      assumptions: {
        electricityReductionPercent: 20,
        naturalGasReductionPercent: 15,
        investmentEur: 120000,
        annualOperationalSavingsEur: 52000,
        analysisYears: 7,
        discountRatePercent: 10,
        carbonPriceEur: referenceCarbonPriceEur,
        includeCarbonValueInReturn: true,
      },
    },
  ];
}

export function calculateFinancialScenario(context, assumptions) {
  const electricityReduction = round(
    context.electricityEmission * assumptions.electricityReductionPercent / 100,
    3
  );
  const naturalGasReduction = round(
    context.naturalGasEmission * assumptions.naturalGasReductionPercent / 100,
    3
  );
  const totalReduction = round(electricityReduction + naturalGasReduction, 3);
  const projectedEmission = round(Math.max(0, context.actualEmission - totalReduction), 3);
  const projectedQuotaRemaining = round(Math.max(0, context.quotaLimit - projectedEmission), 3);
  const projectedQuotaOverage = round(Math.max(0, projectedEmission - context.quotaLimit), 3);
  const additionalQuotaHeadroom = round(
    Math.max(0, projectedQuotaRemaining - context.currentQuotaRemaining),
    3
  );
  const annualCarbonReferenceValueEur = round(totalReduction * assumptions.carbonPriceEur, 2);
  const annualEvaluatedBenefitEur = round(
    assumptions.annualOperationalSavingsEur
      + (assumptions.includeCarbonValueInReturn ? annualCarbonReferenceValueEur : 0),
    2
  );
  const grossBenefitEur = round(annualEvaluatedBenefitEur * assumptions.analysisYears, 2);
  const netBenefitEur = round(grossBenefitEur - assumptions.investmentEur, 2);
  const roiPercent = assumptions.investmentEur > 0
    ? round((netBenefitEur / assumptions.investmentEur) * 100, 1)
    : null;
  const simplePaybackYears = annualEvaluatedBenefitEur > 0
    ? round(assumptions.investmentEur / annualEvaluatedBenefitEur, 2)
    : null;
  const discountRate = assumptions.discountRatePercent / 100;
  let npvEur = -assumptions.investmentEur;
  for (let year = 1; year <= assumptions.analysisYears; year += 1) {
    npvEur += annualEvaluatedBenefitEur / ((1 + discountRate) ** year);
  }

  return {
    electricityReduction,
    naturalGasReduction,
    totalReduction,
    projectedEmission,
    projectedQuotaRemaining,
    projectedQuotaOverage,
    additionalQuotaHeadroom,
    annualCarbonReferenceValueEur,
    annualEvaluatedBenefitEur,
    grossBenefitEur,
    netBenefitEur,
    roiPercent,
    simplePaybackYears,
    npvEur: round(npvEur, 2),
  };
}
