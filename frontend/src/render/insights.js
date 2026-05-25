import { icons } from '../utils/icons.js';

const INSIGHT_CONFIG = {
  suggestion: {
    icon: icons.lightbulb,
    modifier: 'insight--suggestion',
    badge: 'insight__badge--suggestion',
    label: 'Öneri',
  },
  risk: {
    icon: icons.alert,
    modifier: 'insight--risk',
    badge: 'insight__badge--risk',
    label: 'Risk',
  },
  opportunity: {
    icon: icons.sparkles,
    modifier: 'insight--opportunity',
    badge: 'insight__badge--opportunity',
    label: 'Fırsat',
  },
};

export function renderAIInsights(insights) {
  const cards = insights
    .map((insight) => {
      const cfg = INSIGHT_CONFIG[insight.type] || INSIGHT_CONFIG.suggestion;
      return `
        <article class="insight ${cfg.modifier}">
          <div class="insight__header">
            <span class="insight__icon">${cfg.icon}</span>
            <span class="insight__badge ${cfg.badge}">${cfg.label}</span>
          </div>
          <h4 class="insight__title">${insight.title}</h4>
          <p class="insight__text">${insight.description}</p>
          ${insight.impact ? `<p class="insight__impact">${insight.impact}</p>` : ''}
          <button type="button" class="btn btn--outline">Aksiyon Al</button>
        </article>`;
    })
    .join('');

  return `
    <article class="card">
      <div class="card__heading-row">
        <h3 class="card__heading">AI Destekli İçgörüler</h3>
        <span class="icon icon--muted">${icons.brain}</span>
      </div>
      <div class="insight-grid">${cards}</div>
    </article>`;
}
