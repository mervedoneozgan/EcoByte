import { Router } from 'express';
import { aiAnalysis, quotaPlans } from '../data/operationalData.js';
import { requireRole } from '../auth/middleware.js';
import { readText } from '../http/validation.js';
import { persistRuntimeSections } from '../data/runtimeStore.js';

const router = Router();

router.get('/', (_req, res) => res.json(aiAnalysis));
router.post('/recommendations/:id/plan', requireRole('admin'), (req, res) => {
  const recommendation = aiAnalysis.recommendations.find((item) => item.id === Number(req.params.id));
  if (!recommendation) return res.status(404).json({ message: 'Öneri bulunamadı.' });
  recommendation.status = 'planned';
  recommendation.owner = readText(req.body?.owner, 'Sorumlu', { defaultValue: 'Enerji Yönetimi', maxLength: 100 });
  if (!quotaPlans.some((plan) => plan.aiRecommendationId === recommendation.id)) {
    quotaPlans.unshift({
      id: Date.now(),
      aiRecommendationId: recommendation.id,
      title: recommendation.title,
      targetTco2e: recommendation.impactTco2e,
      owner: recommendation.owner,
      dueDate: '31.12.2026',
      status: 'planned',
    });
  }
  persistRuntimeSections({ aiAnalysis, quotaPlans });
  return res.json(recommendation);
});

export default router;
