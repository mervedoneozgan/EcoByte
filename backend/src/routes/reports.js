import { Router } from 'express';
import { createCorporateReportPdf } from '../services/pdfReport.js';
import { createReport, getReport, getReports } from '../services/reportService.js';
import { requireRole } from '../auth/middleware.js';
import { badRequest, readBoolean, readNumber, readText, requireOneOf } from '../http/validation.js';

const router = Router();

router.get('/', (_req, res) => res.json(getReports()));

router.get('/:id/pdf', async (req, res, next) => {
  try {
    const report = getReport(req.params.id);
    if (!report) return res.status(404).json({ message: 'Rapor bulunamadı.' });
    const pdf = await createCorporateReportPdf(report);
    const asciiName = `ecobyte-karbon-raporu-${report.year}.pdf`;
    res
      .status(200)
      .set({
        'Content-Type': 'application/pdf',
        'Content-Length': pdf.length,
        'Content-Disposition': `attachment; filename="${asciiName}"`,
        'Cache-Control': 'no-store',
      })
      .send(pdf);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', (req, res) => {
  const report = getReport(req.params.id);
  if (!report) return res.status(404).json({ message: 'Rapor bulunamadı.' });
  return res.json(report);
});

router.post('/', requireRole('admin'), (req, res) => {
  const payload = req.body ?? {};
  const year = readNumber(payload.year ?? payload.period, 'Rapor yılı', { integer: true, min: 2000, max: 2100 });
  if (!getReports().source.reportingYears.includes(year)) {
    throw badRequest(`Rapor yılı kaynak verilerde bulunmuyor: ${year}`);
  }
  const values = {
    name: readText(payload.name, 'Rapor adı', { defaultValue: undefined, maxLength: 180 }),
    type: readText(payload.type, 'Rapor türü', { defaultValue: 'Kurumsal Karbon Envanteri', maxLength: 100 }),
    year,
    status: requireOneOf(readText(payload.status, 'Rapor durumu', { defaultValue: 'published', maxLength: 20 }), 'Rapor durumu', ['published', 'draft', 'planned']),
    statusLabel: readText(payload.statusLabel, 'Durum etiketi', { defaultValue: 'PDF hazır', maxLength: 60 }),
  };
  if (payload.includeUnassignedFuel !== undefined) {
    values.includeUnassignedFuel = readBoolean(payload.includeUnassignedFuel, 'Yakıt dahil etme seçimi');
  }
  const report = createReport(values);
  return res.status(201).json(report);
});

export default router;
