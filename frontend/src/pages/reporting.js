import { api } from '../api/client.js';
import { formatNumber } from '../utils/format.js';
import { downloadBlob, openModal, showToast } from '../utils/ui.js';
import { escapeHtml } from '../utils/text.js';

let pageData = null;

function renderStatus(report) {
  const className = report.status === 'published' ? 'pill pill--green' : 'pill pill--yellow';
  return `<span class="${className}">${escapeHtml(report.statusLabel)}</span>`;
}

function renderReportRows(reports) {
  if (!reports.length) {
    return `<tr><td colspan="7" class="table-empty">Gerçek verilerden oluşturulmuş rapor bulunamadı.</td></tr>`;
  }

  return reports
    .map(
      (report) => `
    <tr data-report-id="${report.id}">
      <td><strong>${escapeHtml(report.name)}</strong><br><small>Belge no: ECO-${escapeHtml(report.id)}</small></td>
      <td>${escapeHtml(report.type)}</td>
      <td>${escapeHtml(report.period)}</td>
      <td>${escapeHtml(report.date)}</td>
      <td>${escapeHtml(report.format)}</td>
      <td>${renderStatus(report)}</td>
      <td class="table-actions">
        <button type="button" class="icon-btn" data-action="preview-report" data-id="${report.id}" title="Özeti görüntüle">Özet</button>
        <button type="button" class="icon-btn" data-action="download-report" data-id="${report.id}" title="Kurumsal PDF indir">PDF İndir</button>
      </td>
    </tr>`
    )
    .join('');
}

function renderCalendar(items) {
  return items
    .map((item) => `<div class="data-list__row"><dt>${escapeHtml(item.date)}</dt><dd>${escapeHtml(item.title)}</dd></div>`)
    .join('');
}

function reportPreview(report) {
  return `
    <dl class="detail-list">
      <div><dt>Rapor türü</dt><dd>${escapeHtml(report.type)}</dd></div>
      <div><dt>Dönem</dt><dd>${escapeHtml(report.period)}</dd></div>
      <div><dt>PDF motoru</dt><dd>${escapeHtml(report.engine)}</dd></div>
      <div><dt>Enerji + dönem atanmamış yakıt</dt><dd>${formatNumber(report.metrics.grossEmission)} tCO2e</dd></div>
      <div><dt>Elektrik</dt><dd>${formatNumber(report.metrics.electricityEmission)} tCO2e</dd></div>
      <div><dt>Doğalgaz</dt><dd>${formatNumber(report.metrics.naturalGasEmission)} tCO2e</dd></div>
      <div><dt>Dönem atanmamış yakıt</dt><dd>${formatNumber(report.metrics.fuelEmissionUnassigned)} tCO2e</dd></div>
      <div><dt>GES üretimi</dt><dd>${formatNumber(report.metrics.solarProductionKwh)} kWh</dd></div>
      <div><dt>GES pozitif etkisi</dt><dd class="text-accent">+${formatNumber(report.metrics.solarPositiveImpact)} tCO2</dd></div>
    </dl>`;
}

async function downloadReport(report, button) {
  button.disabled = true;
  const originalText = button.textContent;
  button.textContent = 'Hazırlanıyor...';
  try {
    const { blob, filename } = await api.downloadReportPdf(report.id);
    downloadBlob(filename, blob);
    showToast(`${report.name} PDF olarak indirildi`, 'success');
  } catch (error) {
    showToast(error.message, 'error');
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

export function renderReportingPage(data) {
  pageData = JSON.parse(JSON.stringify(data));
  const { summary, items, calendar, source } = pageData;

  return `
    <div class="page" id="page-reporting">
      <div class="page-toolbar">
        <div>
          <h2 class="page-title page-title--left">Kurumsal PDF Raporları</h2>
          <p class="page-header__subtitle">Gerçek enerji envanteri, formüller ve veri kalitesi kontrolleriyle oluşturulur</p>
        </div>
        <button type="button" class="btn btn--primary" id="btn-new-report">Güncel Kurumsal PDF Oluştur</button>
      </div>

      <section class="card methodology-banner">
        <h3 class="card__heading">Rapor veri kapsamı</h3>
        <p>Her PDF Python 3 ile üretildiği anda backend üzerindeki gerçek envanterden hazırlanır; yerel örnek veri kullanılmaz.</p>
        <p><strong>${source.sourceFileCount} kaynak dosya</strong> ve <strong>${source.rawRecordCount} ham kayıt</strong> rapor denetim izine dahildir.</p>
      </section>

      <div class="page-tabs page-tabs--wrap">
        <button type="button" class="page-tab page-tab--active" data-report-filter="all">Tümü</button>
        <button type="button" class="page-tab" data-report-filter="published">PDF Hazır</button>
        <button type="button" class="page-tab" data-report-filter="draft">Taslak</button>
      </div>

      <div class="summary-grid summary-grid--4">
        <div class="summary-card summary-card--accent">
          <p class="summary-card__label">Toplam rapor</p>
          <p class="summary-card__value" id="report-summary-total">${summary.total}</p>
        </div>
        <div class="summary-card summary-card--positive">
          <p class="summary-card__label">PDF hazır</p>
          <p class="summary-card__value" id="report-summary-published">${summary.published}</p>
        </div>
        <div class="summary-card">
          <p class="summary-card__label">Kaynak dosya</p>
          <p class="summary-card__value">${source.sourceFileCount}</p>
        </div>
        <div class="summary-card">
          <p class="summary-card__label">Ham kayıt</p>
          <p class="summary-card__value">${source.rawRecordCount}</p>
        </div>
      </div>

      <section class="card card--table">
        <div class="card__heading-row">
          <div>
            <h3 class="card__heading">Kurumsal rapor arşivi</h3>
            <p class="card__meta">PDF içinde yönetici özeti, aylık tablo, GES, metodoloji, faktörler ve doğrulama sonuçları bulunur.</p>
          </div>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Rapor adı</th>
                <th>Tür</th>
                <th>Dönem</th>
                <th>Oluşturma tarihi</th>
                <th>Format</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody id="report-table-body">${renderReportRows(items)}</tbody>
          </table>
        </div>
      </section>

      <section class="card">
        <h3 class="card__heading">Rapor arşivi takvimi</h3>
        <dl class="data-list">${renderCalendar(calendar || [])}</dl>
      </section>
    </div>`;
}

export function initReportingPage() {
  const page = document.getElementById('page-reporting');
  if (!page || !pageData) return;

  document.getElementById('btn-new-report')?.addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      const savedReport = await api.createReport({
        name: `${Math.max(...pageData.source.reportingYears)} Güncel Kurumsal Karbon Emisyon Raporu`,
        type: 'Kurumsal Karbon Envanteri',
        year: Math.max(...pageData.source.reportingYears),
        status: 'published',
        statusLabel: 'PDF hazır',
      });
      pageData.items.unshift(savedReport);
      pageData.summary.total += 1;
      pageData.summary.published += 1;
      document.getElementById('report-table-body').innerHTML = renderReportRows(pageData.items);
      document.getElementById('report-summary-total').textContent = pageData.summary.total;
      document.getElementById('report-summary-published').textContent = pageData.summary.published;
      await downloadReport(savedReport, button);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      button.disabled = false;
      button.textContent = 'Güncel Kurumsal PDF Oluştur';
    }
  });

  page.querySelectorAll('[data-report-filter]').forEach((tab) => {
    tab.addEventListener('click', () => {
      page.querySelectorAll('[data-report-filter]').forEach((item) => item.classList.remove('page-tab--active'));
      tab.classList.add('page-tab--active');
      const filter = tab.dataset.reportFilter;
      const rows = filter === 'all' ? pageData.items : pageData.items.filter((item) => item.status === filter);
      document.getElementById('report-table-body').innerHTML = renderReportRows(rows);
    });
  });

  page.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]');
    if (!action) return;
    const report = pageData.items.find((item) => item.id === Number(action.dataset.id));
    if (!report) return;

    if (action.dataset.action === 'preview-report') {
      openModal({ title: report.name, bodyHtml: reportPreview(report) });
    }
    if (action.dataset.action === 'download-report') {
      downloadReport(report, action);
    }
  });
}
