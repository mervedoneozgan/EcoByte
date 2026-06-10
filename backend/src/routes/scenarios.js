import { Router } from 'express';
import { dashboard } from '../data/platformData.js';
import { scenarioExports } from '../data/operationalData.js';
import { requireRole } from '../auth/middleware.js';
import { readPlainObject, readText } from '../http/validation.js';
import { persistRuntimeSections } from '../data/runtimeStore.js';

const router = Router();

router.get('/', (_req, res) => res.json({ scenarios: dashboard.scenarios, exports: scenarioExports }));
router.post('/exports', requireRole('admin'), (req, res) => {
  const item = {
    id: Date.now(),
    name: readText(req.body?.name, 'Senaryo adı', { defaultValue: 'Finansal senaryo analizi', maxLength: 160 }),
    createdAt: new Date().toISOString(),
    assumptions: readPlainObject(req.body?.assumptions, 'Varsayımlar', { maxKeys: 20 }),
  };
  scenarioExports.unshift(item);
  persistRuntimeSections({ scenarioExports });
  res.status(201).json(item);
});

export default router;
