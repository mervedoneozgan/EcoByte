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

function renderAnnualQuotaRows(annualQuotas) {
  return annualQuotas
    .map((item) => {
      const statusClass = item.quotaExceeded ? 'pill--yellow' : item.hasQuota ? 'pill--green' : 'pill--blue';
      return `
        <tr>
          <td>${item.year}</td>
          <td>${item.hasActual ? `${formatNumber(item.actualEmission)} tCO2e` : 'Ölçüm bekleniyor'}</td>
          <td>${item.hasQuota ? `${formatNumber(item.quotaLimit)} tCO2e` : 'Tanımlı değil'}</td>
          <td>${item.usedPercent === null ? '-' : `%${item.usedPercent}`}</td>
          <td><span class="pill ${statusClass}">${escapeHtml(item.status)}</span></td>
        </tr>`;
    })
    .join('');
}

export function renderQuotaPage(data) {
  pageData = JSON.parse(JSON.stringify(data));
  const { summary, annualQuotas = [], plans = [], methodology = {} } = pageData;
  const selectedQuota = annualQuotas.find((item) => item.year === summary.quotaYear) ?? annualQuotas.at(-1);
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
        <div class="page-header__actions">
          <div class="segmented" aria-label="Kota yılı seçimi">
            ${annualQuotas.map((item) => `
              <button type="button"
                class="segmented__item ${item.year === selectedQuota.year ? 'segmented__item--active' : ''}"
                data-quota-page-year="${item.year}"
                aria-pressed="${item.year === selectedQuota.year ? 'true' : 'false'}">${item.year}</button>`).join('')}
          </div>
          <button type="button" class="btn btn--primary" id="btn-quota-plan">Azaltım Planı</button>
        </div>
      </div>

      <div class="summary-grid summary-grid--4">
        <div class="summary-card summary-card--accent"><p class="summary-card__label" id="quota-page-limit-label">${selectedQuota.year} kota limiti</p><p class="summary-card__value" id="quota-page-limit">${selectedQuota.hasQuota ? `${formatNumber(selectedQuota.quotaLimit)} tCO2e` : 'Tanımlı değil'}</p></div>
        <div class="summary-card"><p class="summary-card__label">Gerçekleşen yıllık emisyon</p><p class="summary-card__value" id="quota-page-actual">${selectedQuota.hasActual ? `${formatNumber(selectedQuota.actualEmission)} tCO2e` : 'Ölçüm bekleniyor'}</p></div>
        <div class="summary-card"><p class="summary-card__label">Yıllık durum</p><p class="summary-card__value" id="quota-page-status">${escapeHtml(selectedQuota.status)}</p></div>
        <div class="summary-card"><p class="summary-card__label">Kota kullanımı</p><p class="summary-card__value" id="quota-page-usage">${selectedQuota.usedPercent === null ? '-' : `%${selectedQuota.usedPercent}`}</p></div>
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
          <div class="quota-meter"><div class="quota-meter__bar ${selectedQuota.quotaExceeded ? 'quota-meter__bar--danger' : ''}" id="quota-page-meter" style="width:${selectedQuota.usedPercent ?? 0}%"></div></div>
          <dl class="data-list">
            <div class="data-list__row"><dt>Seçilen yıl</dt><dd id="quota-page-year">${selectedQuota.year}</dd></div>
            <div class="data-list__row"><dt>Durum</dt><dd id="quota-page-detail-status" class="${selectedQuota.quotaExceeded ? 'text-danger' : 'text-accent'}">${escapeHtml(selectedQuota.status)}</dd></div>
            <div class="data-list__row"><dt>Kapsam</dt><dd>${escapeHtml(summary.quotaScope)}</dd></div>
            <div class="data-list__row"><dt>Baz yıl</dt><dd id="quota-page-baseline">${selectedQuota.baselineYear ?? 'Tanımlı değil'}</dd></div>
            <div class="data-list__row"><dt>Yıllık bakiye</dt><dd id="quota-page-balance">${selectedQuota.hasQuota && selectedQuota.hasActual ? `${formatNumber(selectedQuota.quotaExceeded ? selectedQuota.overage : selectedQuota.remaining)} tCO2e ${selectedQuota.quotaExceeded ? 'aşım' : 'kalan'}` : 'Yıllık karşılaştırma henüz yapılamaz'}</dd></div>
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
        <h3 class="card__heading">Yıllık kota karşılaştırması</h3>
        <p class="card__description">Kota ve gerçekleşen emisyon yalnızca aynı yıl için birlikte mevcutsa aşım veya kalan hesaplanır.</p>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr><th>Yıl</th><th>Gerçekleşen emisyon</th><th>Kota limiti</th><th>Kullanım</th><th>Durum</th></tr></thead>
            <tbody>${renderAnnualQuotaRows(annualQuotas)}</tbody>
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
  document.querySelectorAll('[data-quota-page-year]').forEach((button) => {
    button.addEventListener('click', () => {
      const selected = pageData.annualQuotas.find((item) => item.year === Number(button.dataset.quotaPageYear));
      if (!selected) return;
      document.querySelectorAll('[data-quota-page-year]').forEach((item) => {
        const active = item === button;
        item.classList.toggle('segmented__item--active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      document.getElementById('quota-page-limit-label').textContent = `${selected.year} kota limiti`;
      document.getElementById('quota-page-limit').textContent =
        selected.hasQuota ? `${formatNumber(selected.quotaLimit)} tCO2e` : 'Tanımlı değil';
      document.getElementById('quota-page-actual').textContent =
        selected.hasActual ? `${formatNumber(selected.actualEmission)} tCO2e` : 'Ölçüm bekleniyor';
      document.getElementById('quota-page-status').textContent = selected.status;
      document.getElementById('quota-page-usage').textContent =
        selected.usedPercent === null ? '-' : `%${selected.usedPercent}`;
      const meter = document.getElementById('quota-page-meter');
      meter.style.width = `${Math.min(100, selected.usedPercent ?? 0)}%`;
      meter.classList.toggle('quota-meter__bar--danger', selected.quotaExceeded);
      document.getElementById('quota-page-year').textContent = selected.year;
      const detailStatus = document.getElementById('quota-page-detail-status');
      detailStatus.textContent = selected.status;
      detailStatus.className = selected.quotaExceeded ? 'text-danger' : 'text-accent';
      document.getElementById('quota-page-baseline').textContent = selected.baselineYear ?? 'Tanımlı değil';
      document.getElementById('quota-page-balance').textContent =
        selected.hasQuota && selected.hasActual
          ? `${formatNumber(selected.quotaExceeded ? selected.overage : selected.remaining)} tCO2e ${selected.quotaExceeded ? 'aşım' : 'kalan'}`
          : 'Yıllık karşılaştırma henüz yapılamaz';
    });
  });

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
