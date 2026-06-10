import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

let sessionDurationMs = 12 * 60 * 60 * 1000;
const REMEMBERED_SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_DURATION_MS = 15 * 60 * 1000;

const sessions = new Map();
const loginAttempts = new Map();
const USER_STORE_PATH = process.env.AUTH_USER_STORE_PATH
  || (process.env.VERCEL ? '/tmp/ecobyte/auth-users.json' : null)
  || fileURLToPath(new URL('../../.runtime/auth-users.json', import.meta.url));
const SESSION_STORE_PATH = process.env.AUTH_SESSION_STORE_PATH
  || `${USER_STORE_PATH}.sessions.json`;

function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedValue) {
  const [salt, expectedHex] = String(storedValue).split(':');
  if (!salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = scryptSync(String(password), salt, expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function createInitialUsers() {
  if (!process.env.AUTH_ADMIN_PASSWORD) {
    throw new Error('AUTH_ADMIN_PASSWORD tanımlanmalıdır. backend/.env.example dosyasını kullanın.');
  }
  return [{
    id: 1,
    email: String(process.env.AUTH_ADMIN_EMAIL || 'admin@ecobyte.com').toLocaleLowerCase('tr-TR'),
    passwordHash: hashPassword(process.env.AUTH_ADMIN_PASSWORD),
    name: process.env.AUTH_ADMIN_NAME || 'EcoByte Yöneticisi',
    role: 'admin',
    company: 'Hasan Kalyoncu Üniversitesi',
    avatar: 'EY',
    active: true,
  }];
}

function persistUsers(usersToPersist) {
  mkdirSync(dirname(USER_STORE_PATH), { recursive: true });
  const temporaryPath = `${USER_STORE_PATH}.tmp`;
  writeFileSync(temporaryPath, JSON.stringify(usersToPersist, null, 2), { encoding: 'utf8', mode: 0o600 });
  renameSync(temporaryPath, USER_STORE_PATH);
}

function persistSessions() {
  mkdirSync(dirname(SESSION_STORE_PATH), { recursive: true });
  const temporaryPath = `${SESSION_STORE_PATH}.tmp`;
  writeFileSync(temporaryPath, JSON.stringify([...sessions.entries()], null, 2), {
    encoding: 'utf8',
    mode: 0o600,
  });
  renameSync(temporaryPath, SESSION_STORE_PATH);
}

function loadSessions() {
  if (!existsSync(SESSION_STORE_PATH)) return;
  const storedSessions = JSON.parse(readFileSync(SESSION_STORE_PATH, 'utf8'));
  if (!Array.isArray(storedSessions)) return;
  const now = Date.now();
  storedSessions.forEach(([key, session]) => {
    if (session?.expiresAt > now) sessions.set(key, session);
  });
}

function loadUsers() {
  if (existsSync(USER_STORE_PATH)) {
    const storedUsers = JSON.parse(readFileSync(USER_STORE_PATH, 'utf8'));
    if (Array.isArray(storedUsers) && storedUsers.length) return storedUsers;
  }
  const initialUsers = createInitialUsers();
  persistUsers(initialUsers);
  return initialUsers;
}

const users = loadUsers();
loadSessions();

function publicUser(user) {
  const { passwordHash, active, ...safeUser } = user;
  return safeUser;
}

function tokenHash(token) {
  return createHash('sha256').update(token).digest('hex');
}

function portableTokenSecret() {
  return String(process.env.AUTH_TOKEN_SECRET || process.env.AUTH_ADMIN_PASSWORD);
}

function createPortableToken(session) {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = createHmac('sha256', portableTokenSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function authenticatePortableToken(token) {
  const [payload, providedSignature] = String(token).split('.');
  if (!payload || !providedSignature) return null;
  const expectedSignature = createHmac('sha256', portableTokenSecret()).update(payload).digest();
  const actualSignature = Buffer.from(providedSignature, 'base64url');
  if (expectedSignature.length !== actualSignature.length || !timingSafeEqual(expectedSignature, actualSignature)) {
    return null;
  }
  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return session?.userId && session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

function cleanupSessions() {
  const now = Date.now();
  let changed = false;
  for (const [key, session] of sessions) {
    if (session.expiresAt <= now) {
      sessions.delete(key);
      changed = true;
    }
  }
  if (changed) persistSessions();
}

function loginAttemptKey(email, ip) {
  return `${String(email).toLocaleLowerCase('tr-TR')}|${ip}`;
}

function registerFailedLogin(key) {
  const now = Date.now();
  const current = loginAttempts.get(key);
  const attempts = current && current.lockedUntil > now ? current.attempts + 1 : 1;
  const lockedUntil =
    attempts >= MAX_LOGIN_ATTEMPTS ? now + LOGIN_LOCK_DURATION_MS : now + LOGIN_LOCK_DURATION_MS;
  loginAttempts.set(key, { attempts, lockedUntil });
}

function getLoginLock(key) {
  const attempt = loginAttempts.get(key);
  if (!attempt) return null;
  if (attempt.lockedUntil <= Date.now()) {
    loginAttempts.delete(key);
    return null;
  }
  return attempt.attempts >= MAX_LOGIN_ATTEMPTS ? attempt : null;
}

export function login({ email, password, rememberMe = false, ip = 'unknown' }) {
  cleanupSessions();
  const normalizedEmail = String(email ?? '').trim().toLocaleLowerCase('tr-TR');
  const attemptKey = loginAttemptKey(normalizedEmail, ip);
  const lock = getLoginLock(attemptKey);
  if (lock) {
    const retryAfterSeconds = Math.ceil((lock.lockedUntil - Date.now()) / 1000);
    return { error: 'Çok fazla başarısız deneme. Lütfen daha sonra tekrar deneyin.', status: 429, retryAfterSeconds };
  }

  const user = users.find((item) => item.email === normalizedEmail && item.active);
  if (!user || !verifyPassword(password, user.passwordHash)) {
    registerFailedLogin(attemptKey);
    return { error: 'E-posta veya parola hatalı.', status: 401 };
  }

  loginAttempts.delete(attemptKey);
  const duration = rememberMe ? REMEMBERED_SESSION_DURATION_MS : sessionDurationMs;
  const expiresAt = Date.now() + duration;
  const session = {
    userId: user.id,
    createdAt: Date.now(),
    expiresAt,
    rememberMe: Boolean(rememberMe),
  };
  const token = process.env.VERCEL
    ? createPortableToken(session)
    : randomBytes(48).toString('base64url');
  if (!process.env.VERCEL) {
    sessions.set(tokenHash(token), session);
    persistSessions();
  }

  return {
    token,
    expiresAt: new Date(expiresAt).toISOString(),
    user: publicUser(user),
  };
}

export function configureSessionDuration(minutes) {
  const value = Number(minutes);
  if (Number.isInteger(value) && value >= 5 && value <= 1440) {
    sessionDurationMs = value * 60 * 1000;
  }
}

export function authenticateToken(token) {
  if (process.env.VERCEL) {
    const session = authenticatePortableToken(token);
    if (!session) return null;
    const user = users.find((item) => item.id === session.userId && item.active);
    if (!user) return null;
    return {
      user: publicUser(user),
      session: {
        expiresAt: new Date(session.expiresAt).toISOString(),
        rememberMe: session.rememberMe,
      },
    };
  }

  cleanupSessions();
  if (!token) return null;
  const session = sessions.get(tokenHash(token));
  if (!session || session.expiresAt <= Date.now()) return null;
  const user = users.find((item) => item.id === session.userId && item.active);
  if (!user) return null;
  return {
    user: publicUser(user),
    session: {
      expiresAt: new Date(session.expiresAt).toISOString(),
      rememberMe: session.rememberMe,
    },
  };
}

export function logout(token) {
  if (process.env.VERCEL) return Boolean(authenticatePortableToken(token));
  if (!token) return false;
  const deleted = sessions.delete(tokenHash(token));
  if (deleted) persistSessions();
  return deleted;
}

export function changePassword(userId, currentPassword, newPassword) {
  const user = users.find((item) => item.id === userId && item.active);
  if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
    return { error: 'Mevcut parola hatalı.', status: 400 };
  }
  if (String(newPassword).length < 10) {
    return { error: 'Yeni parola en az 10 karakter olmalıdır.', status: 400 };
  }
  user.passwordHash = hashPassword(newPassword);
  persistUsers(users);
  for (const [key, session] of sessions) {
    if (session.userId === userId) sessions.delete(key);
  }
  persistSessions();
  return { changed: true };
}

export function getBearerToken(req) {
  const authorization = String(req.headers.authorization ?? '');
  return authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
}

export function getAuthStats() {
  cleanupSessions();
  return { activeSessions: sessions.size, users: users.length };
}
