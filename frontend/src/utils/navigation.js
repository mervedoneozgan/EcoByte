export const ROUTES = {
  dashboard: { id: 'dashboard', label: 'Genel Bakış', path: '#/' },
  emission: { id: 'emission', label: 'Emisyon Ölçümü', path: '#/emisyon' },
  data: { id: 'data', label: 'Veri ve Formüller', path: '#/veri-formuller' },
  reporting: { id: 'reporting', label: 'Raporlama', path: '#/raporlama' },
  quota: { id: 'quota', label: 'Kota Yönetimi', path: '#/kota' },
  trading: { id: 'trading', label: 'Emisyon Ticareti', path: '#/ticaret' },
  scenarios: { id: 'scenarios', label: 'Finansal Senaryolar', path: '#/senaryolar' },
  ai: { id: 'ai', label: 'Akıllı Analiz', path: '#/ai' },
  consultancy: { id: 'consultancy', label: 'Danışmanlık', path: '#/danismanlik' },
  notifications: { id: 'notifications', label: 'Bildirimler', path: '#/bildirimler' },
  settings: { id: 'settings', label: 'Ayarlar', path: '#/ayarlar' },
};

export const menuItems = Object.values(ROUTES);

export function getRouteFromHash() {
  const hash = window.location.hash || '#/';
  const found = menuItems.find((r) => r.path === hash);
  return found?.id || 'dashboard';
}

export function navigateTo(routeId) {
  const route = menuItems.find((r) => r.id === routeId);
  if (route) {
    window.location.hash = route.path.slice(1);
  }
}
