import { api } from '../api/client.js';
import { saveAuthSession } from '../auth/session.js';
import { renderLogoImg } from '../utils/ecobyteLogo.js';
import { escapeHtml } from '../utils/text.js';

export function renderLoginPage(message = '') {
  return `
    <main class="login-shell">
      <section class="login-showcase">
        <div class="login-showcase__content">
          ${renderLogoImg('login-logo')}
          <p class="login-showcase__eyebrow">Karbon Yönetim Platformu</p>
          <h1>Enerji verisini ölçülebilir iklim aksiyonuna dönüştürün.</h1>
          <p class="login-showcase__text">
            Emisyon envanteri, GES üretimi, kota yönetimi ve azaltım planları tek güvenli çalışma alanında.
          </p>
          <div class="login-feature-grid">
            <article><strong>24 aylık</strong><span>enerji görünümü</span></article>
            <article><strong>Gerçek zamanlı</strong><span>karbon hesaplama</span></article>
            <article><strong>Uçtan uca</strong><span>aksiyon takibi</span></article>
          </div>
        </div>
      </section>

      <section class="login-panel">
        <div class="login-card">
          <div class="login-card__header">
            <span class="login-card__status">Güvenli oturum</span>
            <h2>Tekrar hoş geldiniz</h2>
            <p>EcoByte çalışma alanınıza giriş yapın.</p>
          </div>

          ${message ? `<div class="login-alert" role="alert">${escapeHtml(message)}</div>` : ''}
          <div class="login-alert login-alert--error" id="login-error" role="alert" hidden></div>

          <form class="login-form" id="login-form">
            <label class="form__label">E-posta adresi
              <input class="form__input login-input" name="email" type="email" autocomplete="username" required autofocus />
            </label>
            <label class="form__label">Parola
              <span class="password-field">
                <input class="form__input login-input" name="password" id="login-password" type="password" autocomplete="current-password" required />
                <button type="button" class="password-toggle" id="password-toggle" aria-label="Parolayı göster">Göster</button>
              </span>
            </label>
            <label class="login-check">
              <input type="checkbox" name="rememberMe" />
              <span>Beni hatırla</span>
            </label>
            <button type="submit" class="btn btn--primary login-submit" id="login-submit">
              <span>Giriş Yap</span>
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <aside class="login-credentials" aria-label="Giriş bilgileri">
            <div>
              <span class="login-credentials__label">E-posta</span>
              <code>admin@ecobyte.com</code>
            </div>
            <div>
              <span class="login-credentials__label">Parola</span>
              <code>1234</code>
            </div>
          </aside>
        </div>
        <p class="login-footer">EcoByte · Hasan Kalyoncu Üniversitesi · Güvenli yönetim paneli</p>
      </section>
    </main>`;
}

export function initLoginPage(onAuthenticated) {
  const form = document.getElementById('login-form');
  const errorBox = document.getElementById('login-error');
  const submit = document.getElementById('login-submit');

  document.getElementById('password-toggle')?.addEventListener('click', (event) => {
    const input = document.getElementById('login-password');
    const visible = input.type === 'text';
    input.type = visible ? 'password' : 'text';
    event.currentTarget.textContent = visible ? 'Göster' : 'Gizle';
    event.currentTarget.setAttribute('aria-label', visible ? 'Parolayı göster' : 'Parolayı gizle');
  });

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorBox.hidden = true;
    submit.disabled = true;
    submit.classList.add('btn--loading');
    submit.querySelector('span:first-child').textContent = 'Doğrulanıyor...';

    try {
      const result = await api.login({
        email: form.email.value.trim(),
        password: form.password.value,
        rememberMe: form.rememberMe.checked,
      });
      saveAuthSession(result, form.rememberMe.checked);
      await onAuthenticated(result.user);
    } catch (error) {
      errorBox.textContent = error.message;
      errorBox.hidden = false;
      form.password.select();
    } finally {
      submit.disabled = false;
      submit.classList.remove('btn--loading');
      submit.querySelector('span:first-child').textContent = 'Giriş Yap';
    }
  });
}
