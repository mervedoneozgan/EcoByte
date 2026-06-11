import { icons } from '../utils/icons.js';
import { formatEuro, formatNumber } from '../utils/format.js';

export function renderTradingCard(summary) {
  const selectedQuota = summary.annualQuotas?.find((item) => item.year === summary.quotaYear)
    ?? summary.annualQuotas?.at(-1);
  const candidateSellableQuota = selectedQuota?.hasActual && !selectedQuota.quotaExceeded
    ? selectedQuota.remaining
    : 0;
  const referenceValue = selectedQuota?.referenceValueEur
    ?? candidateSellableQuota * summary.marketPrice;

  return `
    <article class="card">
      <h3 class="card__heading card__heading--icon">${icons.swap} Emisyon Ticaret Sistemi</h3>
      <dl class="data-list">
        <div class="data-list__row">
          <dt>Satılabilir kota adayı</dt>
          <dd>${formatNumber(candidateSellableQuota)} tCO2e</dd>
        </div>
        <div class="data-list__row">
          <dt>Tahmini piyasa fiyatı</dt>
          <dd>${summary.marketPrice.toFixed(2)} €/tCO2e</dd>
        </div>
        <div class="data-list__row data-list__row--total">
          <dt>Kota bakiyesi referans değeri</dt>
          <dd class="text-accent">${formatEuro(referenceValue)}</dd>
        </div>
      </dl>
      <p class="trade-card-note">
        Kota bakiyesi satılabilir kota adayı olarak gösterilir. Resmî ETS tahsisi olmadığı için emir verilebilir kapasite şu an 0'dır.
      </p>
      <button type="button" class="btn btn--primary btn--block" data-open-trading>Emisyon Ticaretini İncele</button>
    </article>`;
}
