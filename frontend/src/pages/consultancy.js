import { openModal, closeModal, showToast, bindPageTabs } from '../utils/ui.js';
import { navigateTo } from '../utils/navigation.js';

const STATUS_CLASS = {
  ongoing: 'pill pill--yellow',
  open: 'pill pill--blue',
  completed: 'pill pill--green',
};

const TABS = [
  { id: 'talepler', label: 'Danışmanlık Talepleri' },
  { id: 'uzmanlar', label: 'Uzmanlar' },
  { id: 'hizmetler', label: 'Hizmetler' },
  { id: 'randevular', label: 'Randevular' },
  { id: 'belgeler', label: 'Belgelerim' },
];

let pageData = null;
let activeFilter = 'all';

function renderRequestsTable(requests) {
  const filtered =
    activeFilter === 'all'
      ? requests
      : requests.filter((r) => r.status === activeFilter);

  if (!filtered.length) {
    return `<tr><td colspan="5" class="table-empty">Bu filtrede talep yok.</td></tr>`;
  }

  return filtered
    .map(
      (r) => `
    <tr class="table-row" data-request-id="${r.id}">
      <td>${r.title}</td>
      <td>${r.expert}</td>
      <td>${r.date}</td>
      <td><span class="${STATUS_CLASS[r.status] || 'pill'}">${r.statusLabel}</span></td>
      <td class="table-actions">
        <button type="button" class="icon-btn" data-action="detail" data-id="${r.id}" title="Detay">📄</button>
        <button type="button" class="icon-btn" data-action="goto" data-id="${r.id}" title="Uzmana git">→</button>
      </td>
    </tr>`
    )
    .join('');
}

function renderPanels(data) {
  const { requests, appointments, experts, services, documents } = data;

  const appointmentsAll = appointments
    .map(
      (a, i) => `
    <div class="appointment-card appointment-card--clickable" data-appointment-index="${i}" role="button" tabindex="0">
      <div class="appointment-card__avatar">${a.avatar}</div>
      <div>
        <p class="appointment-card__name">${a.expert}</p>
        <p class="appointment-card__service">${a.service}</p>
        <p class="appointment-card__time">${a.datetime}</p>
      </div>
    </div>`
    )
    .join('');

  const expertsHtml = experts
    .map(
      (e) => `
    <article class="expert-card" data-expert-id="${e.id}">
      <div class="expert-card__avatar">${e.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</div>
      <div>
        <h4 class="expert-card__name">${e.name}</h4>
        <p class="expert-card__meta">${e.specialty} · ⭐ ${e.rating}</p>
        <p class="expert-card__meta">${e.requests} tamamlanan talep</p>
      </div>
      <button type="button" class="btn btn--outline btn--sm" data-action="book-expert" data-id="${e.id}">Randevu Al</button>
    </article>`
    )
    .join('');

  const servicesHtml = services
    .map(
      (s) => `
    <article class="service-card" data-service-id="${s.id}">
      <h4 class="service-card__name">${s.name}</h4>
      <p class="service-card__meta">Süre: ${s.duration}</p>
      <p class="service-card__price">${s.price}</p>
      <button type="button" class="btn btn--primary btn--sm" data-action="request-service" data-id="${s.id}">Talep Oluştur</button>
    </article>`
    )
    .join('');

  const docsHtml = documents
    .map(
      (d) => `
    <tr data-doc-id="${d.id}">
      <td>${d.name}</td>
      <td>${d.date}</td>
      <td>${d.size}</td>
      <td class="table-actions">
        <button type="button" class="icon-btn" data-action="download-doc" data-id="${d.id}" title="İndir">⬇</button>
        <button type="button" class="icon-btn" data-action="preview-doc" data-id="${d.id}" title="Önizle">👁</button>
      </td>
    </tr>`
    )
    .join('');

  return `
    <div data-tab-panel="talepler" class="tab-panel">
      <div class="page-split">
        <section class="card card--table">
          <h3 class="card__heading">Taleplerim</h3>
          <div class="table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Talep Başlığı</th>
                  <th>Uzman</th>
                  <th>Oluşturma Tarihi</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody id="requests-tbody">${renderRequestsTable(requests)}</tbody>
            </table>
          </div>
        </section>
        <aside class="card card--aside">
          <h3 class="card__heading">Yaklaşan Randevular</h3>
          <div class="appointment-list">${appointmentsAll}</div>
        </aside>
      </div>
    </div>

    <div data-tab-panel="uzmanlar" class="tab-panel" hidden>
      <div class="expert-grid">${expertsHtml}</div>
    </div>

    <div data-tab-panel="hizmetler" class="tab-panel" hidden>
      <div class="service-grid">${servicesHtml}</div>
    </div>

    <div data-tab-panel="randevular" class="tab-panel" hidden>
      <div class="appointment-list appointment-list--full">${appointmentsAll}</div>
    </div>

    <div data-tab-panel="belgeler" class="tab-panel" hidden>
      <section class="card card--table">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>Dosya</th><th>Tarih</th><th>Boyut</th><th>İşlem</th></tr>
            </thead>
            <tbody>${docsHtml}</tbody>
          </table>
        </div>
      </section>
    </div>`;
}

export function renderConsultancyPage(data) {
  pageData = JSON.parse(JSON.stringify(data));
  activeFilter = 'all';

  const tabsHtml = TABS.map(
    (t, i) =>
      `<button type="button" class="page-tab ${i === 0 ? 'page-tab--active' : ''}" data-tab="${t.id}">${t.label}</button>`
  ).join('');

  return `
    <div class="page" id="page-consultancy">
      <h2 class="page-title">7. Danışmanlık</h2>

      <div class="page-toolbar">
        <div class="page-tabs" id="consultancy-tabs">${tabsHtml}</div>
        <button type="button" class="btn btn--primary" id="btn-new-request">Yeni Talep Oluştur</button>
      </div>

      <div class="summary-grid summary-grid--4" id="summary-cards">
        <button type="button" class="summary-card summary-card--accent summary-card--clickable" data-filter="all">
          <p class="summary-card__label">Toplam Talep</p>
          <p class="summary-card__value">${data.summary.total}</p>
        </button>
        <button type="button" class="summary-card summary-card--clickable" data-filter="open">
          <p class="summary-card__label">Açık Talep</p>
          <p class="summary-card__value">${data.summary.open}</p>
        </button>
        <button type="button" class="summary-card summary-card--clickable" data-filter="ongoing">
          <p class="summary-card__label">Devam Eden</p>
          <p class="summary-card__value">${data.summary.ongoing}</p>
        </button>
        <button type="button" class="summary-card summary-card--clickable" data-filter="completed">
          <p class="summary-card__label">Tamamlanan</p>
          <p class="summary-card__value">${data.summary.completed}</p>
        </button>
      </div>

      <div id="consultancy-panels">${renderPanels(pageData)}</div>
    </div>`;
}

function openNewRequestModal() {
  const experts = pageData.experts.map((e) => `<option value="${e.id}">${e.name}</option>`).join('');
  openModal({
    title: 'Yeni Danışmanlık Talebi',
    bodyHtml: `
      <form id="form-new-request" class="form">
        <label class="form__label">Talep başlığı
          <input class="form__input" name="title" required placeholder="Örn. Karbon ayak izi analizi" />
        </label>
        <label class="form__label">Uzman
          <select class="form__input" name="expertId">${experts}</select>
        </label>
        <label class="form__label">Açıklama
          <textarea class="form__input form__textarea" name="note" rows="3" placeholder="Talep detayı..."></textarea>
        </label>
      </form>`,
    footerHtml: `
      <button type="button" class="btn btn--ghost" data-modal-close>İptal</button>
      <button type="button" class="btn btn--primary" id="submit-new-request">Talebi Gönder</button>`,
  });

  document.getElementById('submit-new-request')?.addEventListener('click', () => {
    const form = document.getElementById('form-new-request');
    const title = form.title.value.trim();
    if (!title) {
      showToast('Başlık zorunludur', 'error');
      return;
    }
    const expert = pageData.experts.find((e) => String(e.id) === form.expertId.value);
    const newReq = {
      id: Date.now(),
      title,
      expert: expert?.name || 'Atanmadı',
      date: new Date().toLocaleDateString('tr-TR'),
      status: 'open',
      statusLabel: 'Açık',
    };
    pageData.requests.unshift(newReq);
    pageData.summary.total += 1;
    pageData.summary.open += 1;
    document.getElementById('requests-tbody').innerHTML = renderRequestsTable(pageData.requests);
    closeModal();
    showToast('Talep oluşturuldu. Uzman 24 saat içinde dönüş yapacak.', 'success');
  });
}

function openRequestDetail(id) {
  const req = pageData.requests.find((r) => r.id === Number(id));
  if (!req) return;
  openModal({
    title: req.title,
    bodyHtml: `
      <dl class="detail-list">
        <div><dt>Uzman</dt><dd>${req.expert}</dd></div>
        <div><dt>Durum</dt><dd>${req.statusLabel}</dd></div>
        <div><dt>Oluşturma</dt><dd>${req.date}</dd></div>
        <div><dt>Son güncelleme</dt><dd>${req.date}</dd></div>
      </dl>
      <p class="modal-hint">Mesajlaşma ve dosya yükleme backend bağlandığında aktif olacak.</p>`,
    footerHtml: `
      <button type="button" class="btn btn--ghost" data-modal-close>Kapat</button>
      <button type="button" class="btn btn--primary" id="btn-msg-expert">Uzmana Yaz</button>`,
  });
  document.getElementById('btn-msg-expert')?.addEventListener('click', () => {
    showToast(`"${req.expert}" ile mesaj kutusu açılacak (API bekleniyor)`, 'info');
  });
}

function openAppointmentModal(index) {
  const a = pageData.appointments[index];
  if (!a) return;
  openModal({
    title: 'Randevu Detayı',
    bodyHtml: `
      <dl class="detail-list">
        <div><dt>Uzman</dt><dd>${a.expert}</dd></div>
        <div><dt>Hizmet</dt><dd>${a.service}</dd></div>
        <div><dt>Tarih / Saat</dt><dd>${a.datetime}</dd></div>
      </dl>`,
    footerHtml: `
      <button type="button" class="btn btn--ghost" id="btn-reschedule">Yeniden Planla</button>
      <button type="button" class="btn btn--primary" id="btn-join">Toplantıya Katıl</button>`,
  });
  document.getElementById('btn-join')?.addEventListener('click', () => {
    showToast('Video görüşme linki e-posta ile gönderildi (demo)', 'success');
    closeModal();
  });
  document.getElementById('btn-reschedule')?.addEventListener('click', () => {
    showToast('Takvim ekranı açılacak (API bekleniyor)', 'info');
  });
}

export function initConsultancyPage() {
  const page = document.getElementById('page-consultancy');
  if (!page || !pageData) return;

  bindPageTabs(page);

  document.getElementById('btn-new-request')?.addEventListener('click', openNewRequestModal);

  page.querySelectorAll('[data-filter]').forEach((card) => {
    card.addEventListener('click', () => {
      activeFilter = card.dataset.filter;
      page.querySelectorAll('[data-filter]').forEach((c) => c.classList.remove('summary-card--selected'));
      card.classList.add('summary-card--selected');
      document.getElementById('requests-tbody').innerHTML = renderRequestsTable(pageData.requests);
      const labels = { all: 'Tüm', open: 'Açık', ongoing: 'Devam eden', completed: 'Tamamlanan' };
      showToast(`${labels[activeFilter]} talepler listelendi`, 'info');
    });
  });

  page.addEventListener('click', (e) => {
    const detail = e.target.closest('[data-action="detail"]');
    const goto = e.target.closest('[data-action="goto"]');
    const book = e.target.closest('[data-action="book-expert"]');
    const service = e.target.closest('[data-action="request-service"]');
    const dl = e.target.closest('[data-action="download-doc"]');
    const preview = e.target.closest('[data-action="preview-doc"]');
    const apt = e.target.closest('[data-appointment-index]');

    if (detail) openRequestDetail(detail.dataset.id);
    if (goto) {
      const req = pageData.requests.find((r) => r.id === Number(goto.dataset.id));
      showToast(`"${req?.expert}" profiline yönlendiriliyor → Uzmanlar sekmesi`, 'info');
      page.querySelector('[data-tab="uzmanlar"]')?.click();
    }
    if (book) {
      const ex = pageData.experts.find((x) => x.id === Number(book.dataset.id));
      showToast(`${ex?.name} için randevu formu açılacak`, 'info');
      openNewRequestModal();
    }
    if (service) {
      const s = pageData.services.find((x) => x.id === Number(service.dataset.id));
      openNewRequestModal();
      setTimeout(() => {
        const input = document.querySelector('#form-new-request input[name="title"]');
        if (input && s) input.value = s.name;
      }, 50);
    }
    if (dl) showToast('Belge indiriliyor (API bekleniyor)', 'info');
    if (preview) showToast('Belge önizleme açılacak (API bekleniyor)', 'info');
    if (apt) openAppointmentModal(Number(apt.dataset.appointmentIndex));
  });
}
