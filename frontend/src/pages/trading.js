import { api } from '../api/client.js';
import { formatEuro, formatNumber } from '../utils/format.js';
import { showToast } from '../utils/ui.js';
import { escapeHtml } from '../utils/text.js';

let pageData = null;

function renderOrderRows(orders) {
  if (!orders.length) {
    return '<tr><td colspan="6" class="table-empty">Henüz satış emri oluşturulmadı.</td></tr>';
  }

  return orders
    .map(
      (order) => `
      <tr>
        <td>${escapeHtml(order.id)}</td>
        <td>${escapeHtml(order.type)}</td>
        <td>${formatNumber(order.amount)} tCO2e</td>
        <td>${order.price.toFixed(2)} €</td>
        <td>${formatEuro(order.amount * order.price)}</td>
        <td><span class="pill pill--blue">${escapeHtml(order.status)}</span></td>
      </tr>`
    )
    .join('');
}

export function renderTradingPage(data) {
  pageData = JSON.parse(JSON.stringify(data));
  const { summary } = pageData;
  const orders = pageData.trading?.orders ?? [];
  const reserve = pageData.trading?.safeReserve ?? Math.round(summary.quotaLimit * 0.08);
  const tradable = pageData.trading?.availableCapacity ?? Math.max(0, summary.sellableSurplus - reserve);
  const defaultAmount = Math.min(1000, Math.round(tradable));
  const defaultPrice = summary.marketPrice;
  const canCreateOrder = defaultAmount > 0 && defaultPrice > 0;
  const conservative = tradable * (summary.marketPrice * 0.92);
  const optimistic = tradable * (summary.marketPrice * 1.12);

  return `
    <div class="page" id="page-trading" data-tradable="${tradable}" data-market-price="${summary.marketPrice}">
      <div class="page-toolbar">
        <div>
          <h2 class="page-title page-title--left">Emisyon Ticaret Sistemi</h2>
          <p class="page-header__subtitle">Kota ve resmî ETS tahsis durumuna göre emisyon ticareti yönetimi</p>
        </div>
      </div>

      <section class="card trading-guide" aria-labelledby="trading-guide-title">
        <div class="trading-guide__intro">
          <span class="trading-guide__eyebrow">Kısaca ne işe yarar?</span>
          <h3 class="card__heading" id="trading-guide-title">Emisyon kotasının finansal değerini yönetir</h3>
          <p>EcoByte, kurumsal kota ile resmî satılabilir ETS tahsisini ayrı hesaplar. Kota altında kalmak tek başına satılabilir hak oluşturmaz; satış kapasitesi yalnızca belgelenmiş tahsisten doğar.</p>
          <p class="trading-guide__note"><strong>Durum:</strong> ${escapeHtml(summary.etsStatus)} Bu sürümde emirler dış bir borsaya otomatik iletilmez.</p>
        </div>
        <ol class="trading-steps" aria-label="Emisyon ticareti adımları">
          <li><span>1</span><div><strong>Kota durumunu izle</strong><small>Kota kullanımı ve aşımı görün.</small></div></li>
          <li><span>2</span><div><strong>ETS tahsisini doğrula</strong><small>Belgelenmiş satılabilir hakkı kontrol edin.</small></div></li>
          <li><span>3</span><div><strong>Satış emri oluştur</strong><small>Uygun kapasite varsa miktar ve fiyat belirleyin.</small></div></li>
        </ol>
      </section>

      <div class="summary-grid summary-grid--4">
        <div class="summary-card summary-card--accent"><p class="summary-card__label">Satılabilir kota</p><p class="summary-card__value">${formatNumber(summary.sellableSurplus)} <span class="summary-card__unit">tCO2e</span></p></div>
        <div class="summary-card"><p class="summary-card__label">Güvenli rezerv</p><p class="summary-card__value">${formatNumber(reserve)} <span class="summary-card__unit">tCO2e</span></p></div>
        <div class="summary-card"><p class="summary-card__label">Satışa uygun kapasite</p><p class="summary-card__value"><span id="trading-available-capacity">${formatNumber(tradable)}</span> <span class="summary-card__unit">tCO2e</span></p></div>
        <div class="summary-card"><p class="summary-card__label">Referans piyasa fiyatı</p><p class="summary-card__value">${summary.marketPrice.toFixed(2)} <span class="summary-card__unit">€/tCO2e</span></p></div>
      </div>

      <div class="grid grid--2">
        <section class="card">
          <h3 class="card__heading">Satış emri</h3>
          <form class="trade-order-form" id="trade-order-form">
            <div class="trade-form">
              <label class="form__label">Satış miktarı (tCO2e)<input class="form__input" id="trade-amount" type="number" inputmode="decimal" min="0" max="${tradable}" value="${defaultAmount}" aria-describedby="trade-capacity-hint" /></label>
              <label class="form__label">Birim fiyat (€/tCO2e)<input class="form__input" id="trade-price" type="number" inputmode="decimal" min="0" step="0.01" value="${defaultPrice.toFixed(2)}" /></label>
            </div>
            <p class="form__hint" id="trade-capacity-hint">En fazla ${formatNumber(tradable)} tCO2e için emir oluşturabilirsiniz.</p>
            <dl class="data-list trade-preview">
              <div class="data-list__row"><dt>Beklenen gelir</dt><dd class="text-accent" id="trade-revenue">${formatEuro(defaultAmount * defaultPrice)}</dd></div>
              <div class="data-list__row"><dt>Emir sonrası satış kapasitesi</dt><dd id="trade-reserve">${formatNumber(tradable - defaultAmount)} tCO2e</dd></div>
              <div class="data-list__row"><dt>Kontrol sonucu</dt><dd id="trade-status" class="${canCreateOrder ? 'text-accent' : 'text-danger'}" aria-live="polite">${canCreateOrder ? 'Uygun' : 'Resmî satılabilir tahsis yok'}</dd></div>
            </dl>
            <div class="trade-actions">
              <p>Emir kaydedildiğinde miktar, açık emirler için ayrılır.</p>
              <button type="submit" class="btn btn--primary" id="btn-create-order" ${canCreateOrder ? '' : 'disabled'}>Satış Emrini Kaydet</button>
            </div>
          </form>
        </section>

        <section class="card">
          <h3 class="card__heading">Kapasitenin tahmini piyasa değeri</h3>
          <dl class="data-list">
            <div class="data-list__row"><dt>Temkinli senaryo (-%8)</dt><dd>${formatEuro(conservative)}</dd></div>
            <div class="data-list__row"><dt>Referans piyasa fiyatı</dt><dd class="text-accent">${formatEuro(tradable * summary.marketPrice)}</dd></div>
            <div class="data-list__row"><dt>İyimser senaryo (+%12)</dt><dd>${formatEuro(optimistic)}</dd></div>
            <div class="data-list__row"><dt>Piyasa güncellemesi</dt><dd>${pageData.trading?.market?.updatedAt ?? '-'}</dd></div>
          </dl>
          <p class="trade-card-note">Bu değerler satışa uygun kapasitenin tamamı için tahmini brüt geliri gösterir; gerçekleşen işlem fiyatı farklı olabilir.</p>
        </section>
      </div>

      <section class="card card--table">
        <h3 class="card__heading">Emir defteri</h3>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Emir</th><th>Tür</th><th>Miktar</th><th>Fiyat</th><th>Değer</th><th>Durum</th></tr></thead>
            <tbody id="trading-order-table">${renderOrderRows(orders)}</tbody>
          </table>
        </div>
      </section>
    </div>`;
}

function updateTradePreview() {
  const page = document.getElementById('page-trading');
  const amount = Math.max(0, Number(document.getElementById('trade-amount')?.value || 0));
  const price = Math.max(0, Number(document.getElementById('trade-price')?.value || 0));
  const tradable = Number(page?.dataset.tradable || 0);
  const valid = amount <= tradable && amount > 0 && price > 0;
  document.getElementById('trade-revenue').textContent = formatEuro(amount * price);
  document.getElementById('trade-reserve').textContent = `${formatNumber(Math.max(0, tradable - amount))} tCO2e`;
  const status = document.getElementById('trade-status');
  const submitButton = document.getElementById('btn-create-order');
  status.textContent = valid ? 'Uygun' : 'Miktar veya fiyat kontrolü gerekli';
  status.className = valid ? 'text-accent' : 'text-danger';
  if (submitButton) submitButton.disabled = !valid;
}

export function initTradingPage() {
  document.getElementById('trade-amount')?.addEventListener('input', updateTradePreview);
  document.getElementById('trade-price')?.addEventListener('input', updateTradePreview);
  document.getElementById('trade-order-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    updateTradePreview();
    if (document.getElementById('trade-status')?.textContent !== 'Uygun') {
      showToast('Emir miktarını kontrol edin', 'error');
      return;
    }
    const submitButton = document.getElementById('btn-create-order');
    submitButton.disabled = true;
    submitButton.textContent = 'Kaydediliyor...';
    try {
      const order = await api.createTradingOrder({
        type: 'Limit satış',
        amount: Number(document.getElementById('trade-amount').value),
        price: Number(document.getElementById('trade-price').value),
      });
      pageData.trading.orders.unshift(order);
      if (order.capacity) {
        pageData.trading.availableCapacity = order.capacity.availableCapacity;
        document.getElementById('page-trading').dataset.tradable = order.capacity.availableCapacity;
        document.getElementById('trade-amount').max = order.capacity.availableCapacity;
        document.getElementById('trading-available-capacity').textContent =
          formatNumber(order.capacity.availableCapacity);
        document.getElementById('trade-capacity-hint').textContent =
          `En fazla ${formatNumber(order.capacity.availableCapacity)} tCO2e için emir oluşturabilirsiniz.`;
      }
      document.getElementById('trading-order-table').innerHTML = renderOrderRows(pageData.trading.orders);
      updateTradePreview();
      showToast('Satış emri kaydedildi', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      submitButton.textContent = 'Satış Emrini Kaydet';
      updateTradePreview();
    }
  });
}
