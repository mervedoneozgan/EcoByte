import { Router } from 'express';
import { notifications } from '../data/mockData.js';

const router = Router();

router.get('/', (_req, res) => res.json(notifications));

export default router;
