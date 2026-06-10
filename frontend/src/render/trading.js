import { icons } from '../utils/icons.js';
import { formatEuro, formatNumber } from '../utils/format.js';

export function renderTradingCard(summary) {
  return `
    <article class="card">
      <h3 class="card__heading card__heading--icon">${icons.swap} Emisyon Ticaret Sistemi</h3>
      <dl class="data-list">
        <div class="data-list__row">
          <dt>Piyasada satılabilir</dt>
          <dd>${formatNumber(summary.sellableSurplus)} tCO2e</dd>
        </div>
        <div class="data-list__row">
          <dt>Tahmini piyasa fiyatı</dt>
          <dd>${summary.marketPrice.toFixed(2)} €/tCO2e</dd>
        </div>
        <div class="data-list__row data-list__row--total">
          <dt>Tahmini toplam kazanç</dt>
          <dd class="text-accent">${formatEuro(Math.round(summary.estimatedTradingProfit))}</dd>
        </div>
      </dl>
      <p class="trade-card-note">
        Kalan emisyon kotasını piyasa fiyatıyla çarparak satılabilir karbon hakkının tahmini gelirini gösterir.
      </p>
      <button type="button" class="btn btn--primary btn--block" data-open-trading>Piyasaya Sat</button>
    </article>`;
}
