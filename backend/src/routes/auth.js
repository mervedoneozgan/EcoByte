import { Router } from 'express';
import {
  authenticateToken,
  changePassword,
  getBearerToken,
  login,
  logout,
} from '../auth/authService.js';
import { requireAuth } from '../auth/middleware.js';
import { readBoolean, readText } from '../http/validation.js';

const router = Router();

router.post('/login', (req, res) => {
  const { email, password, rememberMe } = req.body ?? {};
  const normalizedEmail = readText(email, 'E-posta', {
    required: true,
    maxLength: 254,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/u,
  });
  const normalizedPassword = readText(password, 'Parola', { required: true, maxLength: 256, trim: false });
  const result = login({
    email: normalizedEmail,
    password: normalizedPassword,
    rememberMe: readBoolean(rememberMe, 'Beni hatırla', { defaultValue: false }),
    ip: req.ip,
  });
  if (result.error) {
    if (result.retryAfterSeconds) res.setHeader('Retry-After', result.retryAfterSeconds);
    return res.status(result.status).json({ message: result.error });
  }
  return res.json(result);
});

router.get('/me', requireAuth, (req, res) => {
  const auth = authenticateToken(getBearerToken(req));
  res.json(auth);
});

router.post('/logout', requireAuth, (req, res) => {
  logout(getBearerToken(req));
  res.status(204).end();
});

router.post('/change-password', requireAuth, (req, res) => {
  const currentPassword = readText(req.body?.currentPassword, 'Mevcut parola', { required: true, maxLength: 256, trim: false });
  const newPassword = readText(req.body?.newPassword, 'Yeni parola', {
    required: true,
    minLength: 10,
    maxLength: 128,
    trim: false,
  });
  const result = changePassword(req.user.id, currentPassword, newPassword);
  if (result.error) return res.status(result.status).json({ message: result.error });
  return res.json({ changed: true, message: 'Parola değiştirildi. Lütfen yeniden giriş yapın.' });
});

export default router;
