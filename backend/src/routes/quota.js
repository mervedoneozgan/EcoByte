import { Router } from 'express';
import { annualQuotas, dashboard } from '../data/platformData.js';
import { quotaPlans } from '../data/operationalData.js';
import { requireRole } from '../auth/middleware.js';
import { readNumber, readText } from '../http/validation.js';
import { persistRuntimeSections } from '../data/runtimeStore.js';

const router = Router();

router.get('/', (_req, res) => res.json({
  summary: dashboard.summary,
  trend: dashboard.trend,
  annualQuotas,
  plans: quotaPlans,
  methodology: {
    title: '2024-2025 Kurumsal Emisyon Kotaları',
    legalNature: 'EcoByte içinde azaltım performansını yönetmek için kullanılan kurumsal kotalardır; resmî ETS tahsisi değildir.',
    calculation: '2024 için 1.397,003 × 0,95 = 1.327,153 tCO2e; 2025 için 2.160,351 × 0,95 = 2.052,333 tCO2e.',
    exclusions: [
      'Dönemi doğrulanmamış yakıt emisyonları kota kullanımına dahil edilmez.',
      'GES kaynaklı kaçınılan emisyon pozitif etki olarak ayrı izlenir; brüt emisyonlardan düşülmez.',
    ],
    regulatoryNotes: [
      '2024 ve 2025 için kurumsal azaltım kotaları tanımlandı; bunlar resmî ETS tahsisi değildir.',
      '50.000 tCO2e değeri kuruma verilecek kota değil, ETS kapsam değerlendirmesinde kullanılan bir eşiktir.',
      'Gerçek bir ETS tahsisi belgelenene kadar kalan kota satılabilir karbon hakkı olarak değerlendirilemez.',
    ],
    sources: [
      {
        label: 'Türkiye ETS Yönetmeliği taslağı ve pilot dönem bilgileri',
        url: 'https://iklim.gov.tr/turkiye-emisyon-ticaret-sistemi-yonetmeligi-taslagi-yayimlandi-haber-4519',
      },
      {
        label: 'İklim Değişikliği Başkanlığı güncel taslaklar',
        url: 'https://iklim.gov.tr/taslaklar-i-2124',
      },
      {
        label: 'Kamu binalarında enerji tasarrufu hedefi',
        url: 'https://enerji.gov.tr/evced-enerji-verimliligi-kamu-binalarinda-tasarruf-hedefi',
      },
    ],
  },
}));
router.post('/plans', requireRole('admin'), (req, res) => {
  const targetTco2e = readNumber(req.body?.targetTco2e, 'Azaltım hedefi', { min: 0.001, max: 1_000_000 });
  const plan = {
    id: Date.now(),
    title: readText(req.body?.title, 'Plan adı', { required: true, maxLength: 160 }),
    targetTco2e,
    owner: readText(req.body?.owner, 'Sorumlu', { defaultValue: 'Enerji Yönetimi', maxLength: 100 }),
    dueDate: readText(req.body?.dueDate, 'Termin', {
      defaultValue: '31.12.2026',
      maxLength: 10,
      pattern: /^(?:\d{2}\.\d{2}\.\d{4}|\d{4}-\d{2}-\d{2})$/u,
    }),
    status: 'planned',
  };
  quotaPlans.unshift(plan);
  persistRuntimeSections({ quotaPlans });
  return res.status(201).json(plan);
});

export default router;
