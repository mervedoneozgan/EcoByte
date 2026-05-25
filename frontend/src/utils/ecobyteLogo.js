/**
 * EcoByte logo — ekran görüntüsünden arka plan kaldırılmış (şeffaf PNG)
 * Kaynak: Ekran görüntüsü 2026-05-24 203355 (1).png
 */
export const LOGO_SRC = '/ecobyte-logo-transparent.png';

/** Sadece logo görseli, arka plan yok */
export function renderLogoImg(className = 'brand-logo') {
  return `<img src="${LOGO_SRC}" alt="EcoByte" class="${className}" width="200" height="48" decoding="async" />`;
}
