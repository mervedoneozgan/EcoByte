/** Modal, toast ve ortak UI yardımcıları */

import { escapeHtml } from './text.js';

let modalRoot = null;

export function bindModalCloseActions(root, onClose = closeModal) {
  root.addEventListener('click', (event) => {
    if (event.target.closest?.('[data-modal-close]')) onClose();
  });
}

function ensureModalRoot() {
  if (!modalRoot) {
    modalRoot = document.createElement('div');
    modalRoot.id = 'ui-modal-root';
    modalRoot.className = 'modal-root';
    modalRoot.innerHTML = `
      <div class="modal-backdrop" data-modal-close></div>
      <div class="modal" role="dialog" aria-modal="true">
        <button type="button" class="modal__close" data-modal-close aria-label="Kapat">×</button>
        <div class="modal__body"></div>
      </div>`;
    document.body.appendChild(modalRoot);
    bindModalCloseActions(modalRoot);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });
  }
  return modalRoot;
}

export function openModal({ title, bodyHtml, footerHtml = '' }) {
  const root = ensureModalRoot();
  root.classList.add('modal-root--open');
  root.querySelector('.modal__body').innerHTML = `
    ${title ? `<h3 class="modal__title">${escapeHtml(title)}</h3>` : ''}
    <div class="modal__content">${bodyHtml}</div>
    ${footerHtml ? `<div class="modal__footer">${footerHtml}</div>` : ''}`;
  document.body.style.overflow = 'hidden';
}

export function closeModal() {
  if (modalRoot) {
    modalRoot.classList.remove('modal-root--open');
    document.body.style.overflow = '';
  }
}

export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast--hide');
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

export function bindPageTabs(container, onTabChange) {
  const tabs = container.querySelectorAll('.page-tab');
  const panels = container.querySelectorAll('[data-tab-panel]');

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('page-tab--active'));
      tab.classList.add('page-tab--active');
      const panelId = tab.dataset.tab || String(index);
      panels.forEach((p) => {
        p.hidden = p.dataset.tabPanel !== panelId;
      });
      onTabChange?.(panelId, tab.textContent.trim());
    });
  });
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
