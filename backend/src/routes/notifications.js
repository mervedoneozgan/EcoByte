import { Router } from 'express';
import { notifications } from '../data/platformData.js';
import { requireRole } from '../auth/middleware.js';
import { persistRuntimeSections } from '../data/runtimeStore.js';

const router = Router();

router.get('/', (_req, res) => res.json(notifications));
router.patch('/read-all', requireRole('admin'), (_req, res) => {
  notifications.items.forEach((item) => {
    item.unread = false;
  });
  persistRuntimeSections({ notifications });
  res.json({ updated: notifications.items.length });
});
router.patch('/:id/read', requireRole('admin'), (req, res) => {
  const item = notifications.items.find((notification) => notification.id === Number(req.params.id));
  if (!item) return res.status(404).json({ message: 'Bildirim bulunamadı.' });
  item.unread = false;
  persistRuntimeSections({ notifications });
  return res.json(item);
});

export default router;
