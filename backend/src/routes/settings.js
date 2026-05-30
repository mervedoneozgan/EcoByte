import { Router } from 'express';
import { settings } from '../data/mockData.js';

const router = Router();

router.get('/', (_req, res) => res.json(settings));

export default router;
