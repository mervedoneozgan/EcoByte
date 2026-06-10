import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import dashboardRoutes from './routes/dashboard.js';
import consultancyRoutes from './routes/consultancy.js';
import notificationsRoutes from './routes/notifications.js';
import reportsRoutes from './routes/reports.js';
import settingsRoutes from './routes/settings.js';
import emissionsRoutes from './routes/emissions.js';
import tradingRoutes from './routes/trading.js';
import quotaRoutes from './routes/quota.js';
import scenariosRoutes from './routes/scenarios.js';
import aiAnalysisRoutes from './routes/aiAnalysis.js';
import authRoutes from './routes/auth.js';
import dataCatalogRoutes from './routes/dataCatalog.js';
import { requireAuth } from './auth/middleware.js';

const app = express();
const PORT = process.env.PORT || 5002;

app.disable('x-powered-by');

const allowedOrigins = (
  process.env.CORS_ORIGIN
  || 'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174'
)
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''));

app.use(
  cors({
    origin(origin, callback) {
      const normalizedOrigin = origin?.replace(/\/$/, '');
      if (!origin || allowedOrigins.includes(normalizedOrigin)) callback(null, true);
      else callback(new Error('CORS engellendi'));
    },
  })
);
app.use((_req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  });
  next();
});
app.use(express.json({ limit: '100kb' }));
app.use('/api', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

app.get('/', (_req, res) => {
  res.json({
    name: 'EcoByte API',
    status: 'ok',
    health: '/api/health',
    platform: 'http://127.0.0.1:5173',
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'EcoByte API hazır' });
});

app.use('/api/auth', authRoutes);
app.use('/api', requireAuth);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/consultancy', consultancyRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/emissions', emissionsRoutes);
app.use('/api/trading', tradingRoutes);
app.use('/api/quota', quotaRoutes);
app.use('/api/scenarios', scenariosRoutes);
app.use('/api/ai-analysis', aiAnalysisRoutes);
app.use('/api/data-catalog', dataCatalogRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'API uç noktası bulunamadı.' });
});

app.use((err, _req, res, _next) => {
  const status = Number(err.status || (err.type === 'entity.parse.failed' ? 400 : 500));
  if (status >= 500) console.error(err);
  const message = status < 500 || err.expose ? err.message : 'Beklenmeyen bir sunucu hatası oluştu.';
  res.status(status).json({ message });
});

export { app };

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  app.listen(PORT, () => {
    console.log(`EcoByte API http://localhost:${PORT}`);
  });
}
