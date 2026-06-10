import { authenticateToken, getBearerToken } from './authService.js';

export function requireAuth(req, res, next) {
  const auth = authenticateToken(getBearerToken(req));
  if (!auth) {
    return res.status(401).json({ message: 'Oturum geçersiz veya süresi dolmuş.' });
  }
  req.user = auth.user;
  req.session = auth.session;
  return next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz bulunmuyor.' });
    }
    return next();
  };
}
