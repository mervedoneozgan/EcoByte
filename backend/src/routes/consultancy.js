import { Router } from 'express';
import { consultancy } from '../data/mockData.js';

const router = Router();

router.get('/', (_req, res) => res.json(consultancy));

export default router;
