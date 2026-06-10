import { Router } from 'express';
import {
  EMISSION_FACTORS,
  EMISSION_FORMULAS,
  calculateEmissionByFactorKey,
} from '../domain/emissions.js';
import { getEmissionInventory } from '../services/energyData.js';

const router = Router();

router.get('/', (_req, res) => res.json(getEmissionInventory()));
router.get('/factors', (_req, res) => res.json(EMISSION_FACTORS));
router.get('/formulas', (_req, res) => res.json(EMISSION_FORMULAS));

router.post('/calculate', (req, res) => {
  const { factorKey, activityAmount } = req.body ?? {};
  const amount = Number(activityAmount);

  if (!EMISSION_FACTORS[factorKey]) {
    return res.status(400).json({ message: 'Geçerli bir factorKey gönderilmelidir.' });
  }
  if (!Number.isFinite(amount) || amount < 0) {
    return res.status(400).json({ message: 'activityAmount sıfır veya pozitif bir sayı olmalıdır.' });
  }

  return res.json({
    factor: EMISSION_FACTORS[factorKey],
    activityAmount: amount,
    emissionTco2e: calculateEmissionByFactorKey(amount, factorKey),
    formula: EMISSION_FORMULAS[0].expression,
  });
});

export default router;
