import { renderLogoImg } from '../utils/ecobyteLogo.js';
import { menuItems } from '../utils/navigation.js';

export function renderSidebar(company, activeRoute = 'dashboard') {
  const menuHtml = menuItems
    .map(
      ({ id, label }) => `
    <button type="button" class="nav-item ${id === activeRoute ? 'nav-item--active' : ''}" data-route="${id}">
      <span class="nav-dot"></span>
      <span>${label}</span>
    </button>`
    )
    .join('');

  return `
    <aside class="sidebar">
      <div class="sidebar__brand">
        ${renderLogoImg('sidebar__logo-img')}
        <p class="sidebar__slogan">${company?.slogan || 'Daha az emisyon, daha iyi gelecek'}</p>
      </div>
      <nav class="sidebar__nav">${menuHtml}</nav>
      <div class="sidebar__profile">
        <p class="sidebar__profile-label">Firma Profili</p>
        <p class="sidebar__profile-name">${company?.name || 'Eco Demo A.Ş.'}</p>
        <p class="sidebar__profile-export">${company?.export_status || 'AB İhracatçı'}</p>
        <p class="sidebar__profile-sector">${company?.sector || 'Kimya'}</p>
      </div>
    </aside>`;
}

export function bindSidebarNavigation(onNavigate) {
  document.querySelectorAll('[data-route]').forEach((btn) => {
    btn.addEventListener('click', () => {
      onNavigate(btn.dataset.route);
    });
  });
}
