import { Router } from 'express';
import {
  dashboard,
  dashboardTrend,
  company,
  emissionInventory,
  energyRecords,
} from '../data/platformData.js';

const router = Router();

router.get('/company', (_req, res) => res.json(company));
router.get('/summary', (_req, res) => res.json(dashboard.summary));
router.get('/trend', (_req, res) => res.json(dashboardTrend));
router.get('/distribution', (_req, res) => res.json(dashboard.distribution));
router.get('/solar', (_req, res) => res.json(dashboard.solar));
router.get('/scenarios', (_req, res) => res.json(dashboard.scenarios));
router.get('/ai-insights', (_req, res) => res.json(dashboard.aiInsights));
router.get('/energy-records', (_req, res) => res.json(energyRecords));
router.get('/emission-factors', (_req, res) => res.json(dashboard.factors));
router.get('/emission-inventory', (_req, res) => res.json(emissionInventory));

export default router;
