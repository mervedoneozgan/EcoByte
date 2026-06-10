import { Router } from 'express';
import { getDataCatalog } from '../services/energyData.js';

const router = Router();

router.get('/', (_req, res) => res.json(getDataCatalog()));

export default router;
