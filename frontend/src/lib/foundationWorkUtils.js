/**
 * foundationWorkUtils.js
 * 
 * Centralized business logic & classification for the 4 Pillars of Invisible / Foundation Work:
 * 1. System Stewardship & Tech Debt
 * 2. Operational Resilience & Triage
 * 3. People & Team Multiplier
 * 4. Governance & Architecture
 * 
 * Solves Core Problem #3: Invisible Work (ensuring non-feature contributions are measured and acknowledged).
 */

export const FOUNDATION_PILLARS = {
  system_stewardship: {
    id: 'system_stewardship',
    label: 'Refactoring & Tech Debt',
    shortLabel: 'Refactoring & Debt',
    description: 'Refactoring, tech debt clearance, and query optimizations sustaining code health.',
    colorToken: 'var(--color-blue, #2563eb)',
    badgeClass: 'pillar-badge--stewardship',
    tags: ['refactor', 'tech-debt', 'database', 'performance'],
    categories: ['maintenance'],
  },
  operational_resilience: {
    id: 'operational_resilience',
    label: 'Incidents & Reliability',
    shortLabel: 'Incidents & Triage',
    description: 'Incident triage, hotfixes, and infrastructure reliability.',
    colorToken: 'var(--color-gold-500, #d97706)',
    badgeClass: 'pillar-badge--resilience',
    tags: ['incident', 'devops', 'infrastructure', 'monitoring', 'hotfix'],
    categories: ['debugging'],
  },
  people_multiplier: {
    id: 'people_multiplier',
    label: 'Onboarding & Mentorship',
    shortLabel: 'Mentorship & Unblocking',
    description: 'Mentorship, code reviews, unblocking colleagues, and knowledge sharing.',
    colorToken: 'var(--color-green, #16a34a)',
    badgeClass: 'pillar-badge--multiplier',
    tags: ['mentoring', 'onboarding', 'code-review', 'unblocking', 'hiring'],
    categories: ['meeting'],
  },
  governance_architecture: {
    id: 'governance_architecture',
    label: 'Architecture & Documentation',
    shortLabel: 'Architecture & Docs',
    description: 'System design, technical documentation, security reviews, and guidelines.',
    colorToken: 'var(--color-burgundy-800, #80122b)',
    badgeClass: 'pillar-badge--governance',
    tags: ['architecture', 'security', 'compliance', 'audit'],
    categories: ['request'],
  },
};

/**
 * Normalizes tag strings from either raw string or TagSummary object ({ id, name }).
 */
function extractTagNames(journal) {
  if (!journal?.tags || !Array.isArray(journal.tags)) return [];
  return journal.tags.map(t => {
    if (typeof t === 'string') return t.toLowerCase().replace(/^#/, '');
    if (t && typeof t.name === 'string') return t.name.toLowerCase().replace(/^#/, '');
    return '';
  }).filter(Boolean);
}

/**
 * Classifies a single journal entry against the 4 foundation pillars.
 */
export function classifyJournal(journal) {
  if (!journal) return { isFoundation: false, primaryPillar: null, matchedPillars: [] };

  const tagNames = extractTagNames(journal);
  const category = (journal.category || '').toLowerCase();
  const textContent = `${journal.title || ''} ${journal.did_today || ''} ${journal.learned_today || ''}`.toLowerCase();

  const matchedPillars = [];

  // Check each pillar
  for (const [pillarId, config] of Object.entries(FOUNDATION_PILLARS)) {
    let matched = false;

    // 1. Tag match
    if (config.tags.some(tag => tagNames.includes(tag))) {
      matched = true;
    }

    // 2. Explicit Category match
    if (!matched && config.categories.includes(category)) {
      matched = true;
    }

    // 3. Keyword heuristic if category is general/other
    if (!matched && (category === 'other' || category === 'general' || !category)) {
      if (pillarId === 'system_stewardship' && (textContent.includes('refactor') || textContent.includes('tech debt') || textContent.includes('optimization'))) {
        matched = true;
      } else if (pillarId === 'operational_resilience' && (textContent.includes('incident') || textContent.includes('outage') || textContent.includes('hotfix') || textContent.includes('pipeline fix'))) {
        matched = true;
      } else if (pillarId === 'people_multiplier' && (textContent.includes('mentor') || textContent.includes('unblock') || textContent.includes('onboarding') || textContent.includes('pair program'))) {
        matched = true;
      } else if (pillarId === 'governance_architecture' && (textContent.includes('architecture') || textContent.includes('security review') || textContent.includes('rfc') || textContent.includes('adr'))) {
        matched = true;
      }
    }

    if (matched) {
      matchedPillars.push(pillarId);
    }
  }

  // Also catch generic 'maintenance', 'meeting', 'other' if not caught above
  const isFallbackFoundation = ['maintenance', 'meeting', 'other'].includes(category);
  if (matchedPillars.length === 0 && isFallbackFoundation) {
    if (category === 'maintenance') matchedPillars.push('system_stewardship');
    else if (category === 'meeting') matchedPillars.push('people_multiplier');
    else matchedPillars.push('operational_resilience');
  }

  return {
    isFoundation: matchedPillars.length > 0,
    primaryPillar: matchedPillars[0] || null,
    matchedPillars,
  };
}

/**
 * Calculates complete 4-pillar foundation statistics across a list of journals.
 */
export function calculateFoundationMetrics(journals = []) {
  const total = journals.length;
  if (total === 0) {
    return {
      totalEntries: 0,
      foundationCount: 0,
      featureCount: 0,
      iwqPercentage: 0,
      pillars: {
        system_stewardship: { count: 0, pct: 0, entries: [] },
        operational_resilience: { count: 0, pct: 0, entries: [] },
        people_multiplier: { count: 0, pct: 0, entries: [] },
        governance_architecture: { count: 0, pct: 0, entries: [] },
      },
      topPillar: null,
      editorialNarrative: 'No entries recorded for this period.',
    };
  }

  const pillarStats = {
    system_stewardship: { count: 0, pct: 0, entries: [] },
    operational_resilience: { count: 0, pct: 0, entries: [] },
    people_multiplier: { count: 0, pct: 0, entries: [] },
    governance_architecture: { count: 0, pct: 0, entries: [] },
  };

  const foundationJournalIds = new Set();

  journals.forEach(journal => {
    const classification = classifyJournal(journal);
    if (classification.isFoundation) {
      foundationJournalIds.add(journal.id);
      const pId = classification.primaryPillar;
      if (pId && pillarStats[pId]) {
        pillarStats[pId].count += 1;
        pillarStats[pId].entries.push(journal);
      }
    }
  });

  const foundationCount = foundationJournalIds.size;
  const featureCount = total - foundationCount;
  const iwqPercentage = Math.round((foundationCount / total) * 100);

  // Calculate percentages per pillar relative to foundation work (or total entries)
  for (const pId of Object.keys(pillarStats)) {
    pillarStats[pId].pct = Math.round((pillarStats[pId].count / total) * 100);
  }

  // Identify top pillar
  let topPillar = null;
  let maxCount = -1;
  for (const [pId, stat] of Object.entries(pillarStats)) {
    if (stat.count > maxCount && stat.count > 0) {
      maxCount = stat.count;
      topPillar = pId;
    }
  }

  // Generate grounded, non-pretentious editorial narrative
  let editorialNarrative = '';
  if (foundationCount === 0) {
    editorialNarrative = 'Contributions during this period were focused exclusively on direct feature development and customer deliverables.';
  } else {
    const topConfig = topPillar ? FOUNDATION_PILLARS[topPillar] : null;
    const topDetail = topConfig
      ? `${topConfig.label} (${pillarStats[topPillar].count} entries)`
      : 'various operational areas';

    editorialNarrative = `${iwqPercentage}% of documented efforts (${foundationCount} of ${total} entries) sustained long-term engineering foundation, led primarily by ${topDetail}. This foundational work prevented technical debt accumulation and fortified system resilience without stalling business deliverables.`;
  }

  return {
    totalEntries: total,
    foundationCount,
    featureCount,
    iwqPercentage,
    pillars: pillarStats,
    topPillar,
    editorialNarrative,
  };
}
