const TOKEN_KEY = 'ecobyte-auth-token';
const USER_KEY = 'ecobyte-auth-user';
const EXPIRY_KEY = 'ecobyte-auth-expiry';

function storages() {
  return [localStorage, sessionStorage];
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || '';
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveAuthSession({ token, user, expiresAt }, rememberMe) {
  clearAuthSession();
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify(user));
  storage.setItem(EXPIRY_KEY, expiresAt);
}

export function updateStoredUser(user) {
  const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
  storage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  storages().forEach((storage) => {
    storage.removeItem(TOKEN_KEY);
    storage.removeItem(USER_KEY);
    storage.removeItem(EXPIRY_KEY);
  });
}

export function hasAuthSession() {
  const token = getAuthToken();
  const expiry = localStorage.getItem(EXPIRY_KEY) || sessionStorage.getItem(EXPIRY_KEY);
  if (!token || !expiry || new Date(expiry).getTime() <= Date.now()) {
    clearAuthSession();
    return false;
  }
  return true;
}
