export function renderPlaceholderPage(title, routeLabel) {
  return `
    <div class="page">
      <h2 class="page-title">${title}</h2>
      <div class="card placeholder-card">
        <p class="placeholder-card__text">
          <strong>${routeLabel}</strong> sayfası henüz tasarlanmadı.
          Bu bölümü <code>src/pages/</code> altında Tailwind + JS ile ekleyebilirsiniz.
        </p>
      </div>
    </div>`;
}
