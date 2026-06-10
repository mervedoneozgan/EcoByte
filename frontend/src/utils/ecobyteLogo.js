/**
 * EcoByte logo — ekran görüntüsünden arka plan kaldırılmış (şeffaf PNG)
 * Kaynak: Ekran görüntüsü 2026-05-24 203355 (1).png
 */
import { escapeHtml } from './text.js';

export const LOGO_SRC = '/ecobyte-logo-transparent.png';
const LOGO_STORAGE_KEY = 'ecobyte-brand-logo';

export function setLogoSrc(src) {
  if (typeof localStorage === 'undefined') return;
  if (src) localStorage.setItem(LOGO_STORAGE_KEY, src);
  else localStorage.removeItem(LOGO_STORAGE_KEY);
}

export function getLogoSrc() {
  if (typeof localStorage === 'undefined') return LOGO_SRC;
  return localStorage.getItem(LOGO_STORAGE_KEY) || LOGO_SRC;
}

export function renderLogoImg(className = 'brand-logo') {
  return `<img src="${escapeHtml(getLogoSrc())}" alt="EcoByte" class="${escapeHtml(className)}" width="200" height="48" decoding="async" />`;
}
