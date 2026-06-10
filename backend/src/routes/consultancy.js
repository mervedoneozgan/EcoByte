import { Router } from 'express';
import { consultancy } from '../data/platformData.js';
import { requireRole } from '../auth/middleware.js';
import { badRequest, readText } from '../http/validation.js';
import { persistRuntimeSections } from '../data/runtimeStore.js';

const router = Router();

router.get('/', (_req, res) => res.json(consultancy));
router.post('/requests', requireRole('admin'), (req, res) => {
  const { title, expert = 'Atanmadı', note = '' } = req.body ?? {};

  const request = {
    id: Date.now(),
    title: readText(title, 'Talep başlığı', { required: true, maxLength: 160 }),
    expert: readText(expert, 'Uzman', { defaultValue: 'Atanmadı', maxLength: 100 }),
    note: readText(note, 'Açıklama', { defaultValue: '', maxLength: 2000 }),
    date: new Date().toLocaleDateString('tr-TR'),
    status: 'open',
    statusLabel: 'Açık',
  };
  consultancy.requests.unshift(request);
  consultancy.summary.total += 1;
  consultancy.summary.open += 1;
  persistRuntimeSections({ consultancy });
  return res.status(201).json(request);
});
router.post('/requests/:id/messages', requireRole('admin'), (req, res) => {
  const request = consultancy.requests.find((item) => item.id === Number(req.params.id));
  if (!request) return res.status(404).json({ message: 'Danışmanlık talebi bulunamadı.' });
  const message = {
    id: Date.now(),
    text: readText(req.body?.message, 'Mesaj', { required: true, maxLength: 2000 }),
    sender: req.user.name,
    createdAt: new Date().toISOString(),
  };
  request.messages ??= [];
  request.messages.push(message);
  request.lastUpdatedAt = message.createdAt;
  persistRuntimeSections({ consultancy });
  return res.status(201).json(message);
});
router.get('/documents/:id/preview', (req, res) => {
  const document = consultancy.documents.find((item) => item.id === Number(req.params.id));
  if (!document) return res.status(404).json({ message: 'Belge bulunamadı.' });
  res.json(document);
});
router.get('/documents/:id/download', (req, res) => {
  const document = consultancy.documents.find((item) => item.id === Number(req.params.id));
  if (!document) return res.status(404).json({ message: 'Belge bulunamadı.' });
  const content = [
    'EcoByte Danışmanlık Belge Özeti',
    '',
    `Belge: ${document.name}`,
    `Tarih: ${document.date}`,
    `Kaynak boyut: ${document.size}`,
    `Açıklama: ${document.description}`,
  ].join('\n');
  res.set({
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Disposition': `attachment; filename="ecobyte-consultancy-document-${document.id}.txt"`,
  });
  res.send(content);
});
router.patch('/appointments/:id/reschedule', requireRole('admin'), (req, res) => {
  const appointment = consultancy.appointments.find((item) => item.id === Number(req.params.id));
  if (!appointment) return res.status(404).json({ message: 'Randevu bulunamadı.' });
  const scheduledAt = readText(req.body?.scheduledAt, 'Randevu zamanı', { required: true, maxLength: 40 });
  const date = new Date(scheduledAt);
  if (Number.isNaN(date.getTime())) throw badRequest('Randevu zamanı geçerli bir tarih olmalıdır.');
  if (date.getTime() <= Date.now()) throw badRequest('Randevu zamanı gelecekte olmalıdır.');
  appointment.scheduledAt = date.toISOString();
  appointment.datetime = date.toLocaleString('tr-TR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Europe/Istanbul',
  });
  persistRuntimeSections({ consultancy });
  res.json(appointment);
});
router.post('/appointments/:id/join', requireRole('admin'), (req, res) => {
  const appointment = consultancy.appointments.find((item) => item.id === Number(req.params.id));
  if (!appointment) return res.status(404).json({ message: 'Randevu bulunamadı.' });
  appointment.lastJoinedAt = new Date().toISOString();
  persistRuntimeSections({ consultancy });
  res.json({ joinedAt: appointment.lastJoinedAt, joinUrl: appointment.meetingUrl });
});

export default router;
