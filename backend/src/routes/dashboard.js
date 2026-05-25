import { Router } from 'express';
import { dashboard, company } from '../data/mockData.js';

const router = Router();

router.get('/company', (_req, res) => res.json(company));
router.get('/summary', (_req, res) => res.json(dashboard.summary));
router.get('/trend', (_req, res) => res.json(dashboard.trend));
router.get('/distribution', (_req, res) => res.json(dashboard.distribution));
router.get('/scenarios', (_req, res) => res.json(dashboard.scenarios));
router.get('/ai-insights', (_req, res) => res.json(dashboard.aiInsights));

export default router;
