import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import dashboardRoutes from './routes/dashboard.js';
import consultancyRoutes from './routes/consultancy.js';
import notificationsRoutes from './routes/notifications.js';
import settingsRoutes from './routes/settings.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (
  process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174'
).split(',');

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) callback(null, true);
      else callback(new Error('CORS engellendi'));
    },
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'EcoByte API — mock veri modu' });
});

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/consultancy', consultancyRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/settings', settingsRoutes);

app.listen(PORT, () => {
  console.log(`EcoByte API http://localhost:${PORT}`);
});
