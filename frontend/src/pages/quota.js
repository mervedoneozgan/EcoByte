import { api } from '../api/client.js';
import { formatEuro, formatNumber } from '../utils/format.js';
import { closeModal, openModal, showToast } from '../utils/ui.js';
import { escapeHtml } from '../utils/text.js';

let pageData = null;

function renderPlanRows(plans) {
  return plans
    .map(
      (plan) => `
      <tr>
        <td>${escapeHtml(plan.title)}</td>
        <td>${escapeHtml(plan.owner)}</td>
        <td>${formatNumber(plan.targetTco2e)} tCO2e</td>
        <td>${escapeHtml(plan.dueDate)}</td>
        <td><span class="pill ${plan.status === 'active' ? 'pill--green' : 'pill--blue'}">${plan.status === 'active' ? 'Aktif' : 'Planlandı'}</span></td>
      </tr>`
    )
    .join('');
}

export function renderQuotaPage(data) {
  pageData = JSON.parse(JSON.stringify(data));
  const { summary, trend, plans = [] } = pageData;
  const used = summary.quotaExceeded ? summary.quotaLimit : summary.quotaLimit - summary.remaining;
  const monthlyAllowance = summary.quotaLimit / 12;
  const projectedYearEnd = (trend.reduce((sum, row) => sum + row.actual, 0) / trend.length) * 12;
  const projectedGap = summary.quotaLimit - projectedYearEnd;

  return `
    <div class="page" id="page-quota">
      <div class="page-toolbar">
        <div>
          <h2 class="page-title page-title--left">Kota Yönetimi</h2>
          <p class="page-header__subtitle">Limit, kullanım, aşım ve azaltım planlarının yönetimi</p>
        </div>
        <button type="button" class="btn btn--primary" id="btn-quota-plan">Azaltım Planı</button>
      </div>

      <div class="summary-grid summary-grid--4">
        <div class="summary-card summary-card--accent"><p class="summary-card__label">Kota limiti</p><p class="summary-card__value">${formatNumber(summary.quotaLimit)}</p></div>
        <div class="summary-card"><p class="summary-card__label">Kullanılan</p><p class="summary-card__value">${formatNumber(used)}</p></div>
        <div class="summary-card"><p class="summary-card__label">${summary.quotaExceeded ? 'Aşım' : 'Kalan'}</p><p class="summary-card__value">${formatNumber(summary.quotaExceeded ? summary.overage : summary.remaining)}</p></div>
        <div class="summary-card"><p class="summary-card__label">Kullanım</p><p class="summary-card__value">${summary.usedPercent}%</p></div>
      </div>

      <div class="grid grid--2">
        <section class="card">
          <h3 class="card__heading">Kota durumu</h3>
          <div class="quota-meter"><div class="quota-meter__bar ${summary.quotaExceeded ? 'quota-meter__bar--danger' : ''}" style="width:${summary.usedPercent}%"></div></div>
          <dl class="data-list">
            <div class="data-list__row"><dt>Durum</dt><dd class="${summary.quotaExceeded ? 'text-danger' : 'text-accent'}">${summary.quotaStatus}</dd></div>
            <div class="data-list__row"><dt>Aylık ortalama hak</dt><dd>${formatNumber(monthlyAllowance)} tCO2e</dd></div>
            <div class="data-list__row"><dt>Yıl sonu projeksiyonu</dt><dd>${formatNumber(projectedYearEnd)} tCO2e</dd></div>
            <div class="data-list__row"><dt>Projeksiyon farkı</dt><dd class="${projectedGap < 0 ? 'text-danger' : 'text-accent'}">${formatNumber(projectedGap)} tCO2e</dd></div>
          </dl>
        </section>

        <section class="card">
          <h3 class="card__heading">Finansal etki</h3>
          <dl class="data-list">
            <div class="data-list__row"><dt>Satılabilir kota</dt><dd>${formatNumber(summary.sellableSurplus)} tCO2e</dd></div>
            <div class="data-list__row"><dt>Piyasa fiyatı</dt><dd>${summary.marketPrice.toFixed(2)} €/tCO2e</dd></div>
            <div class="data-list__row data-list__row--total"><dt>Tahmini gelir</dt><dd class="text-accent">${formatEuro(summary.estimatedTradingProfit)}</dd></div>
          </dl>
        </section>
      </div>

      <section class="card card--table">
        <h3 class="card__heading">Aylık kota karşılaştırması</h3>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Ay</th><th>Emisyon</th><th>Aylık hak</th><th>Kullanım</th><th>Durum</th></tr></thead>
            <tbody>
              ${trend.map((row) => {
                const rate = ((row.actual / monthlyAllowance) * 100).toFixed(1);
                const exceeded = row.actual > monthlyAllowance;
                return `<tr><td>${row.month}</td><td>${formatNumber(row.actual)}</td><td>${formatNumber(monthlyAllowance)}</td><td>${rate}%</td><td><span class="pill ${exceeded ? 'pill--yellow' : 'pill--green'}">${exceeded ? 'Aşım' : 'Uygun'}</span></td></tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </section>

      <section class="card card--table">
        <h3 class="card__heading">Azaltım planları</h3>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Plan</th><th>Sorumlu</th><th>Hedef</th><th>Termin</th><th>Durum</th></tr></thead>
            <tbody id="quota-plan-table">${renderPlanRows(plans)}</tbody>
          </table>
        </div>
      </section>
    </div>`;
}

export function initQuotaPage() {
  document.getElementById('btn-quota-plan')?.addEventListener('click', () => {
    openModal({
      title: 'Yeni Azaltım Planı',
      bodyHtml: `
        <form id="quota-plan-form" class="form">
          <label class="form__label">Plan adı<input class="form__input" name="title" required /></label>
          <label class="form__label">Azaltım hedefi (tCO2e)<input class="form__input" name="targetTco2e" type="number" min="1" required /></label>
          <label class="form__label">Sorumlu<input class="form__input" name="owner" value="Enerji Yönetimi" /></label>
          <label class="form__label">Termin<input class="form__input" name="dueDate" type="date" value="2026-12-31" /></label>
        </form>`,
      footerHtml: `
        <button type="button" class="btn btn--ghost" data-modal-close>İptal</button>
        <button type="button" class="btn btn--primary" id="save-quota-plan">Planı Kaydet</button>`,
    });

    document.getElementById('save-quota-plan')?.addEventListener('click', async () => {
      const form = document.getElementById('quota-plan-form');
      try {
        const plan = await api.createQuotaPlan({
          title: form.title.value,
          targetTco2e: Number(form.targetTco2e.value),
          owner: form.owner.value,
          dueDate: form.dueDate.value,
        });
        pageData.plans.unshift(plan);
        document.getElementById('quota-plan-table').innerHTML = renderPlanRows(pageData.plans);
        closeModal();
        showToast('Azaltım planı kaydedildi', 'success');
      } catch (error) {
        showToast(error.message, 'error');
      }
    });
  });
}
