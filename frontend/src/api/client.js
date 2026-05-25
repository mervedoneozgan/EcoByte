const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function fetchJson(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`API hatası: ${res.status}`);
  return res.json();
}

export const api = {
  getCompany: () => fetchJson('/dashboard/company'),
  getSummary: () => fetchJson('/dashboard/summary'),
  getTrend: () => fetchJson('/dashboard/trend'),
  getDistribution: () => fetchJson('/dashboard/distribution'),
  getScenarios: () => fetchJson('/dashboard/scenarios'),
  getAiInsights: () => fetchJson('/dashboard/ai-insights'),
  getConsultancy: () => fetchJson('/consultancy'),
  getNotifications: () => fetchJson('/notifications'),
  getSettings: () => fetchJson('/settings'),
};

export async function loadDashboard() {
  const [company, summary, trend, distribution, scenarios, aiInsights] =
    await Promise.all([
      api.getCompany(),
      api.getSummary(),
      api.getTrend(),
      api.getDistribution(),
      api.getScenarios(),
      api.getAiInsights(),
    ]);
  return { company, summary, trend, distribution, scenarios, aiInsights };
}
