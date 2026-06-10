import { clearAuthSession, getAuthToken } from '../auth/session.js';
import { normalizeApiPayload, normalizeDisplayText } from '../utils/text.js';

const API_BASE = import.meta.env?.VITE_API_URL || '/api';

async function requestJson(path, options = {}) {
  const token = getAuthToken();
  const { headers = {}, ...fetchOptions } = options;
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...fetchOptions,
  });
  if (res.status === 401 && !path.startsWith('/auth/login') && token && getAuthToken() === token) {
    clearAuthSession();
    window.dispatchEvent(new CustomEvent('ecobyte:unauthorized'));
  }
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(normalizeDisplayText(errorBody?.message || `API hatası: ${res.status}`));
  }
  if (res.status === 204) return null;
  return normalizeApiPayload(await res.json());
}

async function requestBlob(path, fallbackFilename = 'ecobyte-dosyasi') {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (res.status === 401 && token && getAuthToken() === token) {
    clearAuthSession();
    window.dispatchEvent(new CustomEvent('ecobyte:unauthorized'));
  }
  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(normalizeDisplayText(errorBody?.message || `API hatası: ${res.status}`));
  }
  const disposition = res.headers.get('Content-Disposition') || '';
  const filename = disposition.match(/filename="([^"]+)"/)?.[1] || fallbackFilename;
  return { blob: await res.blob(), filename };
}

export const api = {
  login: (payload) =>
    requestJson('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getCurrentUser: () => requestJson('/auth/me'),
  logout: () => requestJson('/auth/logout', { method: 'POST' }),
  changePassword: (payload) =>
    requestJson('/auth/change-password', { method: 'POST', body: JSON.stringify(payload) }),
  getCompany: () => requestJson('/dashboard/company'),
  getSummary: () => requestJson('/dashboard/summary'),
  getTrend: () => requestJson('/dashboard/trend'),
  getDistribution: () => requestJson('/dashboard/distribution'),
  getSolar: () => requestJson('/dashboard/solar'),
  getEmissionFactors: () => requestJson('/dashboard/emission-factors'),
  getScenarios: () => requestJson('/dashboard/scenarios'),
  getAiInsights: () => requestJson('/dashboard/ai-insights'),
  getAiAnalysis: () => requestJson('/ai-analysis'),
  planAiRecommendation: (id, payload = {}) =>
    requestJson(`/ai-analysis/recommendations/${id}/plan`, { method: 'POST', body: JSON.stringify(payload) }),
  getEmissionInventory: () => requestJson('/emissions'),
  getDataCatalog: () => requestJson('/data-catalog'),
  calculateEmission: (payload) =>
    requestJson('/emissions/calculate', { method: 'POST', body: JSON.stringify(payload) }),
  getConsultancy: () => requestJson('/consultancy'),
  getNotifications: () => requestJson('/notifications'),
  getReports: () => requestJson('/reports'),
  getSettings: () => requestJson('/settings'),
  getQuota: () => requestJson('/quota'),
  createQuotaPlan: (payload) =>
    requestJson('/quota/plans', { method: 'POST', body: JSON.stringify(payload) }),
  getTrading: () => requestJson('/trading'),
  createTradingOrder: (payload) =>
    requestJson('/trading/orders', { method: 'POST', body: JSON.stringify(payload) }),
  getScenarioData: () => requestJson('/scenarios'),
  saveScenarioAnalysis: (payload) =>
    requestJson('/scenarios/exports', { method: 'POST', body: JSON.stringify(payload) }),
  createConsultancyRequest: (payload) =>
    requestJson('/consultancy/requests', { method: 'POST', body: JSON.stringify(payload) }),
  sendConsultancyMessage: (id, payload) =>
    requestJson(`/consultancy/requests/${id}/messages`, { method: 'POST', body: JSON.stringify(payload) }),
  previewConsultancyDocument: (id) => requestJson(`/consultancy/documents/${id}/preview`),
  downloadConsultancyDocument: (id) =>
    requestBlob(`/consultancy/documents/${id}/download`, `ecobyte-consultancy-document-${id}.txt`),
  rescheduleConsultancyAppointment: (id, payload) =>
    requestJson(`/consultancy/appointments/${id}/reschedule`, { method: 'PATCH', body: JSON.stringify(payload) }),
  joinConsultancyAppointment: (id) =>
    requestJson(`/consultancy/appointments/${id}/join`, { method: 'POST', body: '{}' }),
  markNotificationRead: (id) =>
    requestJson(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    requestJson('/notifications/read-all', { method: 'PATCH' }),
  updateProfile: (payload) =>
    requestJson('/settings/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  updateBrandLogo: (payload) =>
    requestJson('/settings/logo', { method: 'PUT', body: JSON.stringify(payload) }),
  updateSettingsSection: (section, payload) =>
    requestJson(`/settings/${section}`, { method: 'PUT', body: JSON.stringify(payload) }),
  createReport: (payload) =>
    requestJson('/reports', { method: 'POST', body: JSON.stringify(payload) }),
  downloadReportPdf: (id) => requestBlob(`/reports/${id}/pdf`),
};

export async function loadDashboard() {
  const [company, summary, trend, distribution, solar, factors, scenarios, aiInsights] =
    await Promise.all([
      api.getCompany(),
      api.getSummary(),
      api.getTrend(),
      api.getDistribution(),
      api.getSolar(),
      api.getEmissionFactors(),
      api.getScenarios(),
      api.getAiInsights(),
    ]);
  return { company, summary, trend, distribution, solar, factors, scenarios, aiInsights };
}
