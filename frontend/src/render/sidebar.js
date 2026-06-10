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
  const activeLabel = menuItems.find((item) => item.id === activeRoute)?.label || 'EcoByte';
  const menuHtml = menuItems
    .map(
      ({ id, label }) => `
    <button type="button" class="nav-item ${id === activeRoute ? 'nav-item--active' : ''}" data-route="${id}" title="${label}" ${id === activeRoute ? 'aria-current="page"' : ''}>
      <span class="nav-dot"></span>
      <span class="nav-label">${label}</span>
    </button>`
    )
    .join('');

  return `
    <header class="mobile-topbar">
      <button type="button" class="mobile-topbar__menu" id="mobile-menu-toggle" aria-controls="sidebar" aria-expanded="false" aria-label="Menüyü aç">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16"></path>
        </svg>
      </button>
      ${renderLogoImg('mobile-topbar__logo')}
      <span class="mobile-topbar__route">${escapeHtml(activeLabel)}</span>
    </header>
    <button type="button" class="sidebar-backdrop" id="sidebar-backdrop" aria-label="Menüyü kapat" tabindex="-1"></button>
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
  const sidebar = document.getElementById('sidebar');
  const mobileToggle = document.getElementById('mobile-menu-toggle');
  const sidebarToggle = document.getElementById('sidebar-toggle');
  const backdrop = document.getElementById('sidebar-backdrop');
  const isMobile = () => window.matchMedia('(max-width: 900px)').matches;
  const setMobileMenu = (open) => {
    const mobileOpen = isMobile() && open;
    sidebar?.classList.toggle('sidebar--mobile-open', mobileOpen);
    if (sidebar) sidebar.inert = isMobile() && !mobileOpen;
    backdrop?.classList.toggle('sidebar-backdrop--open', mobileOpen);
    document.body.classList.toggle('mobile-nav-open', mobileOpen);
    mobileToggle?.setAttribute('aria-expanded', String(mobileOpen));
    mobileToggle?.setAttribute('aria-label', mobileOpen ? 'Menüyü kapat' : 'Menüyü aç');
    if (isMobile()) {
      sidebarToggle?.setAttribute('aria-label', 'Menüyü kapat');
      sidebarToggle?.setAttribute('title', 'Menüyü kapat');
    } else {
      const desktopLabel = sidebar?.classList.contains('sidebar--collapsed') ? 'Menüyü aç' : 'Menüyü daralt';
      sidebarToggle?.setAttribute('aria-label', desktopLabel);
      sidebarToggle?.setAttribute('title', desktopLabel);
    }
  };

  document.querySelectorAll('[data-route]').forEach((btn) => {
    btn.addEventListener('click', () => {
      setMobileMenu(false);
      onNavigate(btn.dataset.route);
    });
  });

  mobileToggle?.addEventListener('click', () => {
    const open = !sidebar?.classList.contains('sidebar--mobile-open');
    setMobileMenu(open);
    if (open) setTimeout(() => sidebar?.querySelector('[aria-current="page"]')?.focus(), 250);
  });
  backdrop?.addEventListener('click', () => {
    setMobileMenu(false);
    mobileToggle?.focus();
  });

  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    if (isMobile()) {
      setMobileMenu(false);
      mobileToggle?.focus();
      return;
    }
    const nextCollapsed = !sidebar?.classList.contains('sidebar--collapsed');
    const label = nextCollapsed ? 'Menüyü aç' : 'Menüyü daralt';
    sidebar?.classList.toggle('sidebar--collapsed', nextCollapsed);
    document.body.classList.toggle('sidebar-collapsed', nextCollapsed);
    sidebarToggle?.setAttribute('aria-expanded', String(!nextCollapsed));
    sidebarToggle?.setAttribute('aria-label', label);
    sidebarToggle?.setAttribute('title', label);
    localStorage.setItem('ecobyte-sidebar', nextCollapsed ? 'collapsed' : 'expanded');
  });
  document.getElementById('sidebar-logout')?.addEventListener('click', () => {
    setMobileMenu(false);
    window.dispatchEvent(new CustomEvent('ecobyte:logout-request'));
  });
  if (window.ecobyteMobileMenuKeyHandler) {
    document.removeEventListener('keydown', window.ecobyteMobileMenuKeyHandler);
  }
  window.ecobyteMobileMenuKeyHandler = (event) => {
    if (event.key === 'Escape' && sidebar?.classList.contains('sidebar--mobile-open')) {
      setMobileMenu(false);
      mobileToggle?.focus();
    }
  };
  document.addEventListener('keydown', window.ecobyteMobileMenuKeyHandler);

  if (window.ecobyteMobileMenuResizeHandler) {
    window.removeEventListener('resize', window.ecobyteMobileMenuResizeHandler);
  }
  window.ecobyteMobileMenuResizeHandler = () => setMobileMenu(false);
  window.addEventListener('resize', window.ecobyteMobileMenuResizeHandler);

  setMobileMenu(false);
  document.body.classList.toggle('sidebar-collapsed', isCollapsed());
}
