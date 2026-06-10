import { api, loadDashboard } from './api/client.js';
import { renderSidebar, bindSidebarNavigation } from './render/sidebar.js';
import { getRouteFromHash, navigateTo } from './utils/navigation.js';
import { renderDashboardContent, mountDashboardCharts } from './pages/dashboard.js';
import { renderConsultancyPage, initConsultancyPage } from './pages/consultancy.js';
import { renderEmissionPage, initEmissionPage } from './pages/emission.js';
import { renderFinancialScenariosPage, initFinancialScenariosPage } from './pages/financialScenarios.js';
import { renderNotificationsPage, initNotificationsPage } from './pages/notifications.js';
import { renderQuotaPage, initQuotaPage } from './pages/quota.js';
import { renderReportingPage, initReportingPage } from './pages/reporting.js';
import { renderSettingsPage, initSettingsPage } from './pages/settings.js';
import { renderTradingPage, initTradingPage } from './pages/trading.js';
import { renderAiAnalysisPage, initAiAnalysisPage } from './pages/aiAnalysis.js';
import { renderDataCatalogPage, initDataCatalogPage } from './pages/dataCatalog.js';
import { renderPlaceholderPage } from './pages/placeholder.js';
import { hasAuthSession } from './auth/session.js';
import { escapeHtml } from './utils/text.js';

let appState = {
  company: {
    name: 'Hasan Kalyoncu Üniversitesi',
    sector: 'Eğitim',
    export_status: 'Kampüs operasyonları',
    slogan: 'Daha az emisyon, daha güçlü gelecek',
  },
};

async function loadPageData(routeId) {
  switch (routeId) {
    case 'dashboard': {
      const data = await loadDashboard();
      appState.company = data.company;
      return { type: 'dashboard', data };
    }
    case 'consultancy':
      return { type: 'consultancy', data: await api.getConsultancy() };
    case 'notifications':
      return { type: 'notifications', data: await api.getNotifications() };
    case 'settings':
      return { type: 'settings', data: await api.getSettings() };
    case 'reporting':
      return { type: 'reporting', data: await api.getReports() };
    case 'emission':
      return { type: 'emission', data: await api.getEmissionInventory() };
    case 'data':
      return { type: 'data', data: await api.getDataCatalog() };
    case 'quota':
      return { type: 'quota', data: await api.getQuota() };
    case 'trading': {
      const data = await loadDashboard();
      data.trading = await api.getTrading();
      appState.company = data.company;
      return { type: 'trading', data };
    }
    case 'scenarios': {
      const data = await loadDashboard();
      data.scenarioData = await api.getScenarioData();
      return { type: 'scenarios', data };
    }
    case 'ai':
      return { type: 'ai', data: await api.getAiAnalysis() };
    default:
      return { type: 'placeholder', routeId };
  }
}

function renderPageContent(routeId, pageResult) {
  switch (pageResult.type) {
    case 'dashboard':
      return renderDashboardContent(pageResult.data);
    case 'consultancy':
      return renderConsultancyPage(pageResult.data);
    case 'notifications':
      return renderNotificationsPage(pageResult.data);
    case 'settings':
      return renderSettingsPage(pageResult.data);
    case 'reporting':
      return renderReportingPage(pageResult.data);
    case 'emission':
      return renderEmissionPage(pageResult.data);
    case 'data':
      return renderDataCatalogPage(pageResult.data);
    case 'quota':
      return renderQuotaPage(pageResult.data);
    case 'trading':
      return renderTradingPage(pageResult.data);
    case 'scenarios':
      return renderFinancialScenariosPage(pageResult.data);
    case 'ai':
      return renderAiAnalysisPage(pageResult.data);
    default:
      return renderPlaceholderPage('Sayfa', routeId);
  }
}

function renderDataError(error) {
  return `
    <div class="page">
      <section class="card api-error-card">
        <p class="card__label">Gerçek veri bağlantısı</p>
        <h2 class="page-title page-title--left">Veriler yüklenemedi</h2>
        <p class="page-header__subtitle">${escapeHtml(error.message)}</p>
        <p class="card__meta">Yerel örnek veri gösterilmedi. Backend bağlantısı düzeldiğinde gerçek veriler yeniden yüklenebilir.</p>
        <button type="button" class="btn btn--primary" id="btn-retry-api">Yeniden Dene</button>
      </section>
    </div>`;
}

export async function renderRoute(routeId) {
  if (!hasAuthSession()) {
    window.dispatchEvent(new CustomEvent('ecobyte:unauthorized'));
    return;
  }
  const root = document.getElementById('app');
  if (!root) return;

  let pageResult;
  try {
    pageResult = await loadPageData(routeId);
  } catch (error) {
    if (!hasAuthSession()) return;
    root.innerHTML = `
      ${renderSidebar(appState.company, routeId)}
      <main class="main">${renderDataError(error)}</main>`;
    bindSidebarNavigation((id) => navigateTo(id));
    document.getElementById('btn-retry-api')?.addEventListener('click', () => renderRoute(routeId));
    return;
  }

  root.innerHTML = `
    ${renderSidebar(appState.company, routeId)}
    <main class="main">${renderPageContent(routeId, pageResult)}</main>`;

  bindSidebarNavigation((id) => navigateTo(id));

  if (pageResult.type === 'dashboard') {
    mountDashboardCharts(pageResult.data);
    window.ecobyteData = pageResult.data;
  }
  if (pageResult.type === 'consultancy') initConsultancyPage();
  if (pageResult.type === 'notifications') initNotificationsPage();
  if (pageResult.type === 'emission') initEmissionPage();
  if (pageResult.type === 'data') initDataCatalogPage();
  if (pageResult.type === 'quota') initQuotaPage();
  if (pageResult.type === 'reporting') initReportingPage();
  if (pageResult.type === 'trading') initTradingPage();
  if (pageResult.type === 'scenarios') initFinancialScenariosPage();
  if (pageResult.type === 'ai') initAiAnalysisPage();
  if (pageResult.type === 'settings') initSettingsPage();

  window.ecobyteRoute = routeId;
}

export function initRouter() {
  const handleRoute = () => renderRoute(getRouteFromHash());
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}
