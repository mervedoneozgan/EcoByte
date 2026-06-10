import { renderLogoImg } from '../utils/ecobyteLogo.js';
import { menuItems } from '../utils/navigation.js';
import { getStoredUser } from '../auth/session.js';
import { escapeHtml } from '../utils/text.js';

function isCollapsed() {
  return localStorage.getItem('ecobyte-sidebar') === 'collapsed';
}

export function renderSidebar(company, activeRoute = 'dashboard') {
  const collapsed = isCollapsed();
  const user = getStoredUser();
  const menuHtml = menuItems
    .map(
      ({ id, label }) => `
    <button type="button" class="nav-item ${id === activeRoute ? 'nav-item--active' : ''}" data-route="${id}" title="${label}">
      <span class="nav-dot"></span>
      <span class="nav-label">${label}</span>
    </button>`
    )
    .join('');

  return `
    <aside class="sidebar ${collapsed ? 'sidebar--collapsed' : ''}" id="sidebar">
      <button type="button" class="sidebar__toggle" id="sidebar-toggle" aria-controls="sidebar-navigation" aria-expanded="${!collapsed}" aria-label="${collapsed ? 'Menüyü aç' : 'Menüyü daralt'}" title="${collapsed ? 'Menüyü aç' : 'Menüyü daralt'}">
        <svg class="sidebar__toggle-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 6l-6 6 6 6"></path>
        </svg>
      </button>
      <div class="sidebar__topbar">
        <div class="sidebar__brand">
          ${renderLogoImg('sidebar__logo-img')}
          <p class="sidebar__slogan">${escapeHtml(company?.slogan || 'Daha az emisyon, daha güçlü gelecek')}</p>
        </div>
      </div>
      <nav class="sidebar__nav" id="sidebar-navigation" aria-label="Ana menü">${menuHtml}</nav>
      <div class="sidebar__profile">
        <div class="sidebar__user">
          <span class="sidebar__user-copy"><strong>${escapeHtml(user?.name || 'EcoByte Yöneticisi')}</strong><small>${escapeHtml(user?.role === 'admin' ? 'Yönetici' : user?.role || 'Kullanıcı')}</small></span>
        </div>
        <div class="sidebar__company">
          <div class="sidebar__profile-heading">
            <p class="sidebar__profile-label">Firma Profili</p>
            <span class="sidebar__profile-badge">Kurumsal</span>
          </div>
          <p class="sidebar__profile-name">${escapeHtml(company?.name || 'Hasan Kalyoncu Üniversitesi')}</p>
          <div class="sidebar__profile-meta">
            <span class="sidebar__profile-export">${escapeHtml(company?.export_status || 'Kampüs operasyonları')}</span>
            <span class="sidebar__profile-sector">${escapeHtml(company?.sector || 'Eğitim')}</span>
          </div>
        </div>
        <button type="button" class="sidebar__logout" id="sidebar-logout">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10 17l5-5-5-5"></path>
            <path d="M15 12H3"></path>
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
          </svg>
          <span>Güvenli Çıkış</span>
        </button>
      </div>
    </aside>`;
}

export function bindSidebarNavigation(onNavigate) {
  document.querySelectorAll('[data-route]').forEach((btn) => {
    btn.addEventListener('click', () => {
      onNavigate(btn.dataset.route);
    });
  });

  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('sidebar-toggle');
    const nextCollapsed = !sidebar?.classList.contains('sidebar--collapsed');
    const label = nextCollapsed ? 'Menüyü aç' : 'Menüyü daralt';
    sidebar?.classList.toggle('sidebar--collapsed', nextCollapsed);
    document.body.classList.toggle('sidebar-collapsed', nextCollapsed);
    toggle?.setAttribute('aria-expanded', String(!nextCollapsed));
    toggle?.setAttribute('aria-label', label);
    toggle?.setAttribute('title', label);
    localStorage.setItem('ecobyte-sidebar', nextCollapsed ? 'collapsed' : 'expanded');
  });
  document.getElementById('sidebar-logout')?.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('ecobyte:logout-request'));
  });

  document.body.classList.toggle('sidebar-collapsed', isCollapsed());
}
