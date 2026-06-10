import { Router } from 'express';
import { dashboard } from '../data/platformData.js';
import { quotaPlans } from '../data/operationalData.js';
import { requireRole } from '../auth/middleware.js';
import { readNumber, readText } from '../http/validation.js';
import { persistRuntimeSections } from '../data/runtimeStore.js';

const router = Router();

router.get('/', (_req, res) => res.json({ summary: dashboard.summary, trend: dashboard.trend, plans: quotaPlans }));
router.post('/plans', requireRole('admin'), (req, res) => {
  const targetTco2e = readNumber(req.body?.targetTco2e, 'Azaltım hedefi', { min: 0.001, max: 1_000_000 });
  const plan = {
    id: Date.now(),
    title: readText(req.body?.title, 'Plan adı', { required: true, maxLength: 160 }),
    targetTco2e,
    owner: readText(req.body?.owner, 'Sorumlu', { defaultValue: 'Enerji Yönetimi', maxLength: 100 }),
    dueDate: readText(req.body?.dueDate, 'Termin', {
      defaultValue: '31.12.2026',
      maxLength: 10,
      pattern: /^(?:\d{2}\.\d{2}\.\d{4}|\d{4}-\d{2}-\d{2})$/u,
    }),
    status: 'planned',
  };
  quotaPlans.unshift(plan);
  persistRuntimeSections({ quotaPlans });
  return res.status(201).json(plan);
});

export default router;
