export function renderPlaceholderPage(_title, routeLabel) {
  return `
    <div class="page">
      <section class="card api-error-card">
        <p class="card__label">EcoByte</p>
        <h2 class="page-title page-title--left">Sayfa bulunamadı</h2>
        <p class="page-header__subtitle">${routeLabel} için tanımlı bir platform sayfası bulunmuyor.</p>
      </section>
    </div>`;
}
