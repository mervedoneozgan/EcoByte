export const EMISSION_FACTORS = {
  electricityKgCo2ePerKwh: 0.469,
  naturalGasKgCo2ePerM3: 2.06672,
};

export function calculateElectricityEmission(kwh, factor = EMISSION_FACTORS.electricityKgCo2ePerKwh) {
  return (Number(kwh) * factor) / 1000;
}

export function calculateNaturalGasEmission(m3, factor = EMISSION_FACTORS.naturalGasKgCo2ePerM3) {
  return (Number(m3) * factor) / 1000;
}

export function calculateQuotaUsage(totalEmission, quotaLimit) {
  const usedPercent = quotaLimit ? (totalEmission / quotaLimit) * 100 : 0;
  const remaining = quotaLimit - totalEmission;
  return {
    usedPercent: Math.min(100, Number(usedPercent.toFixed(1))),
    remaining: Math.max(0, Number(remaining.toFixed(2))),
    overage: remaining < 0 ? Number(Math.abs(remaining).toFixed(2)) : 0,
    quotaExceeded: remaining < 0,
  };
}
