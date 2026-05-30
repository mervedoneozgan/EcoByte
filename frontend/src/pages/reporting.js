import { showToast } from '../utils/ui.js';

const REPORTS = [
  {
    id: 1,
    name: '2024 Surdurulebilirlik Raporu',
    type: 'Surdurulebilirlik',
    period: '2024 Q1',
    date: '15.05.2024',
    status: 'published',
    statusLabel: 'Yayinlandi',
  },
  {
    id: 2,
    name: 'Mayis 2024 Emisyon Raporu',
    type: 'Emisyon',
    period: 'Mayis 2024',
    date: '10.05.2024',
    status: 'published',
    statusLabel: 'Yayinlandi',
  },
  {
    id: 3,
    name: 'Cevresel Uyum Raporu',
    type: 'Uyum',
    period: '2024 Q1',
    date: '05.05.2024',
    status: 'draft',
    statusLabel: 'Taslak',
  },
  {
    id: 4,
    name: 'Performans Degerlendirme',
    type: 'Performans',
    period: '2024 Q1',
    date: '01.05.2024',
    status: 'published',
    statusLabel: 'Yayinlandi',
  },
];

const REPORT_TYPES = [
  { label: 'Surdurulebilirlik Raporu', tone: 'green' },
  { label: 'Emisyon Raporu', tone: 'cyan' },
  { label: 'Uyum Raporu', tone: 'lime' },
  { label: 'Performans Raporlari', tone: 'blue' },
  { label: 'Ozel Rapor', tone: 'muted' },
];

function renderStatus(report) {
  const className = report.status === 'published' ? 'pill pill--green' : 'pill pill--yellow';
  return `<span class="${className}">${report.statusLabel}</span>`;
}

function renderReportRows(reports) {
  return reports
    .map(
      (report) => `
    <tr data-report-id="${report.id}">
      <td>${report.name}</td>
      <td>${report.type}</td>
      <td>${report.period}</td>
      <td>${report.date}</td>
      <td>${renderStatus(report)}</td>
      <td class="table-actions">
        <button type="button" class="icon-btn" data-action="preview-report" data-id="${report.id}" title="Onizle">Gor</button>
        <button type="button" class="icon-btn" data-action="download-report" data-id="${report.id}" title="Indir">Indir</button>
      </td>
    </tr>`
    )
    .join('');
}

export function renderReportingPage() {
  const totals = {
    total: 24,
    draft: 5,
    published: 18,
    planned: 1,
  };

  return `
    <div class="page" id="page-reporting">
      <div class="page-toolbar">
        <div>
          <h2 class="page-title page-title--left">2. Raporlama</h2>
          <p class="page-header__subtitle">Karbon, uyum ve performans raporlarini tek yerden yonetin.</p>
        </div>
        <button type="button" class="btn btn--primary" id="btn-new-report">Yeni Rapor Olustur</button>
      </div>

      <div class="page-tabs page-tabs--wrap">
        <button type="button" class="page-tab page-tab--active" data-report-filter="all">Raporlar</button>
        <button type="button" class="page-tab" data-report-filter="templates">Rapor Sablonlari</button>
        <button type="button" class="page-tab" data-report-filter="compliance">Uyum Raporlari</button>
        <button type="button" class="page-tab" data-report-filter="performance">Performans</button>
        <button type="button" class="page-tab" data-report-filter="custom">Ozel Raporlar</button>
      </div>

      <div class="summary-grid summary-grid--4">
        <div class="summary-card summary-card--accent">
          <p class="summary-card__label">Toplam Rapor</p>
          <p class="summary-card__value">${totals.total}</p>
        </div>
        <div class="summary-card">
          <p class="summary-card__label">Taslak</p>
          <p class="summary-card__value">${totals.draft}</p>
        </div>
        <div class="summary-card">
          <p class="summary-card__label">Yayinlanan</p>
          <p class="summary-card__value">${totals.published}</p>
        </div>
        <div class="summary-card">
          <p class="summary-card__label">Planlanan</p>
          <p class="summary-card__value">${totals.planned}</p>
        </div>
      </div>

      <section class="card">
        <h3 class="card__heading">Rapor Turleri</h3>
        <div class="report-type-grid">
          ${REPORT_TYPES.map(
            (type) => `
              <button type="button" class="report-type report-type--${type.tone}" data-report-type="${type.label}">
                <span class="report-type__mark"></span>
                <span>${type.label}</span>
              </button>`
          ).join('')}
        </div>
      </section>

      <section class="card card--table">
        <div class="card__heading-row">
          <h3 class="card__heading">Son Raporlar</h3>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Rapor Adi</th>
                <th>Tur</th>
                <th>Donem</th>
                <th>Olusturma Tarihi</th>
                <th>Durum</th>
                <th>Islemler</th>
              </tr>
            </thead>
            <tbody>${renderReportRows(REPORTS)}</tbody>
          </table>
        </div>
      </section>

      <section class="card">
        <h3 class="card__heading">Rapor Takvimi</h3>
        <dl class="data-list">
          <div class="data-list__row"><dt>15 Mayis 2024</dt><dd>2024 Surdurulebilirlik Raporu</dd></div>
          <div class="data-list__row"><dt>10 Mayis 2024</dt><dd>Mayis 2024 Emisyon Raporu</dd></div>
          <div class="data-list__row"><dt>01 Haziran 2024</dt><dd>2024 Q2 Performans Raporu</dd></div>
        </dl>
      </section>
    </div>`;
}

export function initReportingPage() {
  const page = document.getElementById('page-reporting');
  if (!page) return;

  document.getElementById('btn-new-report')?.addEventListener('click', () => {
    showToast('Yeni rapor akisi backend baglantisi ile aktif edilecek.', 'info');
  });

  page.querySelectorAll('[data-report-filter]').forEach((tab) => {
    tab.addEventListener('click', () => {
      page.querySelectorAll('[data-report-filter]').forEach((item) => item.classList.remove('page-tab--active'));
      tab.classList.add('page-tab--active');
      showToast(`${tab.textContent.trim()} filtresi secildi`, 'info');
    });
  });

  page.querySelectorAll('[data-report-type]').forEach((type) => {
    type.addEventListener('click', () => {
      showToast(`${type.dataset.reportType} sablonu secildi`, 'info');
    });
  });

  page.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]');
    if (!action) return;
    const report = REPORTS.find((item) => item.id === Number(action.dataset.id));
    if (!report) return;

    if (action.dataset.action === 'preview-report') {
      showToast(`${report.name} onizleme acilacak`, 'info');
    }
    if (action.dataset.action === 'download-report') {
      showToast(`${report.name} indiriliyor`, 'success');
    }
  });
}
