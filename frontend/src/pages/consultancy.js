import { openModal, closeModal, showToast, bindPageTabs, downloadBlob } from '../utils/ui.js';
import { api } from '../api/client.js';
import { escapeHtml } from '../utils/text.js';

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
      <td>${escapeHtml(r.title)}</td>
      <td>${escapeHtml(r.expert)}</td>
      <td>${escapeHtml(r.date)}</td>
      <td><span class="${STATUS_CLASS[r.status] || 'pill'}">${escapeHtml(r.statusLabel)}</span></td>
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
      (a) => `
    <div class="appointment-card appointment-card--clickable" data-appointment-id="${a.id}" role="button" tabindex="0">
      <div class="appointment-card__avatar">${escapeHtml(a.avatar)}</div>
      <div>
        <p class="appointment-card__name">${escapeHtml(a.expert)}</p>
        <p class="appointment-card__service">${escapeHtml(a.service)}</p>
        <p class="appointment-card__time">${escapeHtml(a.datetime)}</p>
      </div>
    </div>`
    )
    .join('');

  const expertsHtml = experts
    .map(
      (e) => `
    <article class="expert-card" data-expert-id="${e.id}">
      <div class="expert-card__avatar">${escapeHtml(e.name.split(' ').map((n) => n[0]).join('').slice(0, 2))}</div>
      <div>
        <h4 class="expert-card__name">${escapeHtml(e.name)}</h4>
        <p class="expert-card__meta">${escapeHtml(e.specialty)} · ⭐ ${escapeHtml(e.rating)}</p>
        <p class="expert-card__meta">${escapeHtml(e.requests)} tamamlanan talep</p>
      </div>
      <button type="button" class="btn btn--outline btn--sm" data-action="book-expert" data-id="${e.id}">Randevu Al</button>
    </article>`
    )
    .join('');

  const servicesHtml = services
    .map(
      (s) => `
    <article class="service-card" data-service-id="${s.id}">
      <h4 class="service-card__name">${escapeHtml(s.name)}</h4>
      <p class="service-card__meta">Süre: ${escapeHtml(s.duration)}</p>
      <p class="service-card__price">${escapeHtml(s.price)}</p>
      <button type="button" class="btn btn--primary btn--sm" data-action="request-service" data-id="${s.id}">Talep Oluştur</button>
    </article>`
    )
    .join('');

  const docsHtml = documents
    .map(
      (d) => `
    <tr data-doc-id="${d.id}">
      <td>${escapeHtml(d.name)}</td>
      <td>${escapeHtml(d.date)}</td>
      <td>${escapeHtml(d.size)}</td>
      <td class="table-actions">
        <button type="button" class="icon-btn" data-action="download-doc" data-id="${d.id}" title="Belge özetini indir">⬇</button>
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
      <div>
        <h2 class="page-title page-title--left">Danışmanlık</h2>
        <p class="page-header__subtitle">Uzman, hizmet, talep ve randevu süreçlerini tek ekrandan yönetin</p>
      </div>

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

function openNewRequestModal({ expertId = '', title = '' } = {}) {
  const experts = pageData.experts.map((e) => `<option value="${e.id}">${escapeHtml(e.name)}</option>`).join('');
  openModal({
    title: 'Yeni Danışmanlık Talebi',
    bodyHtml: `
      <form id="form-new-request" class="form">
        <label class="form__label">Talep başlığı
          <input class="form__input" name="title" value="${escapeHtml(title)}" required placeholder="Örn. Karbon ayak izi analizi" />
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
  if (expertId) document.getElementById('form-new-request').expertId.value = String(expertId);

  document.getElementById('submit-new-request')?.addEventListener('click', async () => {
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
    try {
      const savedRequest = await api.createConsultancyRequest({ ...newReq, note: form.note.value });
      pageData.requests.unshift(savedRequest);
      pageData.summary.total += 1;
      pageData.summary.open += 1;
      document.getElementById('requests-tbody').innerHTML = renderRequestsTable(pageData.requests);
      closeModal();
      showToast('Talep oluşturuldu. Uzman 24 saat içinde dönüş yapacak.', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

function openRequestDetail(id) {
  const req = pageData.requests.find((r) => r.id === Number(id));
  if (!req) return;
  openModal({
    title: req.title,
    bodyHtml: `
      <dl class="detail-list">
        <div><dt>Uzman</dt><dd>${escapeHtml(req.expert)}</dd></div>
        <div><dt>Durum</dt><dd>${escapeHtml(req.statusLabel)}</dd></div>
        <div><dt>Oluşturma</dt><dd>${escapeHtml(req.date)}</dd></div>
        <div><dt>Mesaj</dt><dd>${escapeHtml(req.note || 'Açıklama eklenmedi')}</dd></div>
        <div><dt>Gönderilen mesaj</dt><dd>${req.messages?.length ?? 0}</dd></div>
      </dl>
      <p class="modal-hint">Talep akışı güncel.</p>`,
    footerHtml: `
      <button type="button" class="btn btn--ghost" data-modal-close>Kapat</button>
      <button type="button" class="btn btn--primary" id="btn-msg-expert">Uzmana Yaz</button>`,
  });
  document.getElementById('btn-msg-expert')?.addEventListener('click', () => {
    openMessageModal(req);
  });
}

function openMessageModal(request) {
  openModal({
    title: `${request.expert} ile mesajlaş`,
    bodyHtml: `
      <form id="form-consultancy-message" class="form">
        <label class="form__label">Mesaj
          <textarea class="form__input form__textarea" name="message" rows="4" maxlength="2000" required></textarea>
        </label>
      </form>`,
    footerHtml: `
      <button type="button" class="btn btn--ghost" data-modal-close>İptal</button>
      <button type="button" class="btn btn--primary" id="send-consultancy-message">Gönder</button>`,
  });
  document.getElementById('send-consultancy-message')?.addEventListener('click', async () => {
    const form = document.getElementById('form-consultancy-message');
    try {
      const message = await api.sendConsultancyMessage(request.id, { message: form.message.value });
      request.messages ??= [];
      request.messages.push(message);
      closeModal();
      showToast('Mesaj uzmana gönderildi', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

function localDateTimeValue(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function openRescheduleModal(appointment) {
  openModal({
    title: 'Randevuyu Yeniden Planla',
    bodyHtml: `
      <form id="form-reschedule" class="form">
        <label class="form__label">Yeni tarih ve saat
          <input class="form__input" name="scheduledAt" type="datetime-local" value="${localDateTimeValue(appointment.scheduledAt)}" required />
        </label>
      </form>`,
    footerHtml: `
      <button type="button" class="btn btn--ghost" data-modal-close>İptal</button>
      <button type="button" class="btn btn--primary" id="save-reschedule">Kaydet</button>`,
  });
  document.getElementById('save-reschedule')?.addEventListener('click', async () => {
    const form = document.getElementById('form-reschedule');
    try {
      const updated = await api.rescheduleConsultancyAppointment(appointment.id, {
        scheduledAt: new Date(form.scheduledAt.value).toISOString(),
      });
      Object.assign(appointment, updated);
      document.querySelectorAll(`[data-appointment-id="${appointment.id}"] .appointment-card__time`)
        .forEach((element) => { element.textContent = appointment.datetime; });
      closeModal();
      showToast('Randevu yeniden planlandı', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

function openAppointmentModal(id) {
  const a = pageData.appointments.find((appointment) => appointment.id === Number(id));
  if (!a) return;
  openModal({
    title: 'Randevu Detayı',
    bodyHtml: `
      <dl class="detail-list">
        <div><dt>Uzman</dt><dd>${escapeHtml(a.expert)}</dd></div>
        <div><dt>Hizmet</dt><dd>${escapeHtml(a.service)}</dd></div>
        <div><dt>Tarih / Saat</dt><dd>${escapeHtml(a.datetime)}</dd></div>
      </dl>`,
    footerHtml: `
      <button type="button" class="btn btn--ghost" id="btn-reschedule">Yeniden Planla</button>
      <button type="button" class="btn btn--primary" id="btn-join">Toplantıya Katıl</button>`,
  });
  document.getElementById('btn-join')?.addEventListener('click', async () => {
    try {
      const result = await api.joinConsultancyAppointment(a.id);
      window.open(result.joinUrl, '_blank', 'noopener,noreferrer');
      closeModal();
      showToast('Görüşme bağlantısı açıldı', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
  document.getElementById('btn-reschedule')?.addEventListener('click', () => {
    openRescheduleModal(a);
  });
}

async function previewDocument(id) {
  try {
    const document = await api.previewConsultancyDocument(id);
    openModal({
      title: document.name,
      bodyHtml: `
        <dl class="detail-list">
          <div><dt>Tarih</dt><dd>${escapeHtml(document.date)}</dd></div>
          <div><dt>Kaynak boyut</dt><dd>${escapeHtml(document.size)}</dd></div>
          <div><dt>Açıklama</dt><dd>${escapeHtml(document.description)}</dd></div>
        </dl>`,
    });
  } catch (error) {
    showToast(error.message, 'error');
  }
}

async function downloadDocument(id) {
  try {
    const { blob, filename } = await api.downloadConsultancyDocument(id);
    downloadBlob(filename, blob);
    showToast('Belge özeti indirildi', 'success');
  } catch (error) {
    showToast(error.message, 'error');
  }
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
    const apt = e.target.closest('[data-appointment-id]');

    if (detail) openRequestDetail(detail.dataset.id);
    if (goto) {
      const req = pageData.requests.find((r) => r.id === Number(goto.dataset.id));
      showToast(`"${req?.expert}" profiline yönlendiriliyor → Uzmanlar sekmesi`, 'info');
      page.querySelector('[data-tab="uzmanlar"]')?.click();
    }
    if (book) {
      const ex = pageData.experts.find((x) => x.id === Number(book.dataset.id));
      showToast(`${ex?.name} seçildi`, 'info');
      openNewRequestModal({ expertId: ex?.id });
    }
    if (service) {
      const s = pageData.services.find((x) => x.id === Number(service.dataset.id));
      openNewRequestModal({ title: s?.name });
    }
    if (dl) downloadDocument(dl.dataset.id);
    if (preview) previewDocument(preview.dataset.id);
    if (apt) openAppointmentModal(apt.dataset.appointmentId);
  });
  page.addEventListener('keydown', (event) => {
    const appointment = event.target.closest('[data-appointment-id]');
    if (appointment && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      openAppointmentModal(appointment.dataset.appointmentId);
    }
  });
}
