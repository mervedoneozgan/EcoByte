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
  const { summary, trend, plans = [], methodology = {} } = pageData;
  const used = summary.quotaEmission ?? summary.quotaLimit - summary.remaining;
  const monthlyAllowance = summary.quotaLimit / 12;
  const sourceLinks = (methodology.sources ?? [])
    .map((source) => `<a class="source-link" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.label)}</a>`)
    .join(' · ');

  return `
    <div class="page" id="page-quota">
      <div class="page-toolbar">
        <div>
          <h2 class="page-title page-title--left">Kota Yönetimi</h2>
          <p class="page-header__subtitle">Kota limiti, kullanım, aşım ve azaltım planlarının yönetimi</p>
        </div>
        <button type="button" class="btn btn--primary" id="btn-quota-plan">Azaltım Planı</button>
      </div>

      <div class="summary-grid summary-grid--4">
        <div class="summary-card summary-card--accent"><p class="summary-card__label">${summary.quotaYear} kota limiti</p><p class="summary-card__value">${formatNumber(summary.quotaLimit)} <span class="summary-card__unit">tCO2e</span></p></div>
        <div class="summary-card"><p class="summary-card__label">Kullanılan (baz yıl)</p><p class="summary-card__value">${formatNumber(used)} <span class="summary-card__unit">tCO2e</span></p></div>
        <div class="summary-card"><p class="summary-card__label">${summary.quotaExceeded ? 'Aşım' : 'Kalan'}</p><p class="summary-card__value">${formatNumber(summary.quotaExceeded ? summary.overage : summary.remaining)} <span class="summary-card__unit">tCO2e</span></p></div>
        <div class="summary-card"><p class="summary-card__label">Kota kullanımı</p><p class="summary-card__value">%${summary.usedPercent}</p></div>
      </div>

      <section class="card trading-guide">
        <div class="trading-guide__intro">
          <span class="trading-guide__eyebrow">Kota nasıl hesaplandı?</span>
          <h3 class="card__heading">${escapeHtml(methodology.title ?? 'Kurumsal emisyon kotası')}</h3>
          <p>${escapeHtml(methodology.legalNature ?? summary.quotaNote)}</p>
          <p>${escapeHtml(methodology.calculation ?? '')}</p>
          <p class="trading-guide__note"><strong>ETS durumu:</strong> ${escapeHtml(summary.etsStatus)}</p>
          <p class="trade-card-note">${sourceLinks}</p>
        </div>
      </section>

      <div class="grid grid--2">
        <section class="card">
          <h3 class="card__heading">Kota durumu</h3>
          <div class="quota-meter"><div class="quota-meter__bar ${summary.quotaExceeded ? 'quota-meter__bar--danger' : ''}" style="width:${summary.usedPercent}%"></div></div>
          <dl class="data-list">
            <div class="data-list__row"><dt>Durum</dt><dd class="${summary.quotaExceeded ? 'text-danger' : 'text-accent'}">${escapeHtml(summary.quotaStatus)}</dd></div>
            <div class="data-list__row"><dt>Kapsam</dt><dd>${escapeHtml(summary.quotaScope)}</dd></div>
            <div class="data-list__row"><dt>Aylık ortalama kota</dt><dd>${formatNumber(monthlyAllowance)} tCO2e</dd></div>
            <div class="data-list__row"><dt>Azaltım hedefi</dt><dd>${formatNumber(summary.quotaReductionTarget)} tCO2e · %${summary.quotaReductionPercent}</dd></div>
          </dl>
        </section>

        <section class="card">
          <h3 class="card__heading">Finansal etki</h3>
          <dl class="data-list">
            <div class="data-list__row"><dt>Satılabilir kota</dt><dd>${formatNumber(summary.sellableSurplus)} tCO2e</dd></div>
            <div class="data-list__row"><dt>Piyasa fiyatı</dt><dd>${summary.marketPrice.toFixed(2)} €/tCO2e</dd></div>
            <div class="data-list__row data-list__row--total"><dt>Tahmini gelir</dt><dd class="text-accent">${formatEuro(summary.estimatedTradingProfit)}</dd></div>
          </dl>
          <p class="trade-card-note">Satılabilir kota şu an 0'dır; kurum için belgelenmiş resmî ETS tahsisi bulunmamaktadır.</p>
        </section>
      </div>

      <section class="card card--table">
        <h3 class="card__heading">Aylık kota karşılaştırması</h3>
        <p class="card__description">${summary.quotaBaselineYear} ölçümleri, ${summary.quotaYear} kurumsal kotasının aylık ortalamasıyla karşılaştırılır.</p>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Ay</th><th>Emisyon</th><th>Aylık kota</th><th>Kullanım</th><th>Durum</th></tr></thead>
            <tbody>
              ${trend.map((row) => {
                const rate = ((row.actual / monthlyAllowance) * 100).toFixed(1);
                const exceeded = row.actual > monthlyAllowance;
                return `<tr><td>${row.monthName ?? row.month}</td><td>${formatNumber(row.actual)} tCO2e</td><td>${formatNumber(monthlyAllowance)} tCO2e</td><td>${rate}%</td><td><span class="pill ${exceeded ? 'pill--yellow' : 'pill--green'}">${exceeded ? 'Aşım' : 'Uygun'}</span></td></tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </section>

      <section class="card">
        <h3 class="card__heading">Kota kapsamı ve mevzuat notları</h3>
        <dl class="data-list">
          ${(methodology.regulatoryNotes ?? []).map((note, index) => `<div class="data-list__row"><dt>Not ${index + 1}</dt><dd>${escapeHtml(note)}</dd></div>`).join('')}
          ${(methodology.exclusions ?? []).map((note, index) => `<div class="data-list__row"><dt>Kapsam notu ${index + 1}</dt><dd>${escapeHtml(note)}</dd></div>`).join('')}
          <div class="data-list__row data-list__row--total"><dt>ETS tarama eşiği</dt><dd>${formatNumber(summary.etsScreeningThresholdTco2e)} tCO2e</dd></div>
        </dl>
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
