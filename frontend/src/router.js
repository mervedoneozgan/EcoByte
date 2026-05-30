import { api, loadDashboard } from './api/client.js';
import { MOCK_DASHBOARD } from './data/mock.js';
import { MOCK_CONSULTANCY } from './data/mockConsultancy.js';
import { MOCK_NOTIFICATIONS } from './data/mockNotifications.js';
import { MOCK_SETTINGS } from './data/mockSettings.js';
import { renderSidebar, bindSidebarNavigation } from './render/sidebar.js';
import { getRouteFromHash, navigateTo } from './utils/navigation.js';
import { renderDashboardContent, mountDashboardCharts } from './pages/dashboard.js';
import { renderConsultancyPage, initConsultancyPage } from './pages/consultancy.js';
import { renderNotificationsPage, initNotificationsPage } from './pages/notifications.js';
import { renderReportingPage, initReportingPage } from './pages/reporting.js';
import { renderSettingsPage, initSettingsPage } from './pages/settings.js';
import { renderPlaceholderPage } from './pages/placeholder.js';

let appState = {
  company: MOCK_DASHBOARD.company,
  useMock: true,
};

async function loadPageData(routeId) {
  try {
    switch (routeId) {
      case 'dashboard': {
        const data = await loadDashboard();
        appState.useMock = false;
        appState.company = data.company;
        return { type: 'dashboard', data };
      }
      case 'consultancy': {
        const data = await api.getConsultancy();
        appState.useMock = false;
        return { type: 'consultancy', data };
      }
      case 'notifications': {
        const data = await api.getNotifications();
        appState.useMock = false;
        return { type: 'notifications', data };
      }
      case 'settings': {
        const data = await api.getSettings();
        appState.useMock = false;
        return { type: 'settings', data };
      }
      case 'reporting':
        return { type: 'reporting' };
      default:
        return { type: 'placeholder', routeId };
    }
  } catch {
    appState.useMock = true;
    switch (routeId) {
      case 'dashboard':
        return { type: 'dashboard', data: MOCK_DASHBOARD };
      case 'consultancy':
        return { type: 'consultancy', data: MOCK_CONSULTANCY };
      case 'notifications':
        return { type: 'notifications', data: MOCK_NOTIFICATIONS };
      case 'settings':
        return { type: 'settings', data: MOCK_SETTINGS };
      case 'reporting':
        return { type: 'reporting' };
      default:
        return { type: 'placeholder', routeId };
    }
  }
}

function renderPageContent(routeId, pageResult) {
  switch (pageResult.type) {
    case 'dashboard':
      return renderDashboardContent(pageResult.data, appState.useMock);
    case 'consultancy':
      return renderConsultancyPage(pageResult.data);
    case 'notifications':
      return renderNotificationsPage(pageResult.data);
    case 'settings':
      return renderSettingsPage(pageResult.data);
    case 'reporting':
      return renderReportingPage();
    default: {
      const labels = {
        emission: 'Emisyon Ölçümü',
        reporting: 'Raporlama',
        quota: 'Emisyon Kota Yönetimi',
        trading: 'Emisyon Ticaret Sistemi',
        scenarios: 'Finansal Senaryolar',
        ai: 'AI Destekli Analiz',
      };
      return renderPlaceholderPage('Sayfa', labels[routeId] || routeId);
    }
  }
}

export async function renderRoute(routeId) {
  const root = document.getElementById('app');
  if (!root) return;

  const pageResult = await loadPageData(routeId);
  const content = renderPageContent(routeId, pageResult);

  root.innerHTML = `
    ${renderSidebar(appState.company, routeId)}
    <main class="main">${content}</main>`;

  bindSidebarNavigation((id) => navigateTo(id));

  if (pageResult.type === 'dashboard') {
    mountDashboardCharts(pageResult.data);
    window.ecobyteData = pageResult.data;
  }
  if (pageResult.type === 'consultancy') initConsultancyPage();
  if (pageResult.type === 'notifications') initNotificationsPage();
  if (pageResult.type === 'reporting') initReportingPage();
  if (pageResult.type === 'settings') initSettingsPage();

  window.ecobyteUseMock = appState.useMock;
  window.ecobyteRoute = routeId;
}

export function initRouter() {
  const handleRoute = () => renderRoute(getRouteFromHash());
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}
