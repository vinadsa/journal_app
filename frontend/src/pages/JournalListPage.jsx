import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import '../styles/Pages.css';
import { CATEGORIES, CATEGORY_OPTIONS } from '../lib/constants';
import { formatDate, getMonthYear } from '../lib/dateUtils';


/* ─────────────────────────────────────────────
   SVG Icons (inline to avoid external deps)
   ───────────────────────────────────────────── */
const icons = {
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3" y2="6" />
      <line x1="3" y1="12" x2="3" y2="12" />
      <line x1="3" y1="18" x2="3" y2="18" />
    </svg>
  ),
  star: (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  paperclip: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  book: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

const CATEGORY_COLORS = {
  development: 'var(--teal-muted)',
  maintenance: 'var(--amber)',
  meeting: 'var(--slate)',
  request: 'var(--rose-dusty)',
  business_trip: 'var(--sage)',
  general: 'var(--gold-muted)',
  other: 'var(--text-tertiary)',
};

const visibilityIcon = (vis) => {
  switch (vis) {
    case 'public': return icons.globe;
    case 'team': return icons.users;
    case 'manager_only': return icons.lock;
    default: return icons.lock;
  }
};


/* ─────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────── */
function formatTimestamp(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function truncate(str, len = 120) {
  if (!str) return '';
  if (str.length <= len) return str;
  return str.slice(0, len).trimEnd() + '…';
}


/* ─────────────────────────────────────────────
   JournalCard — Gallery View
   ───────────────────────────────────────────── */
function JournalCard({ journal, enrichment, style }) {
  const cat = journal.category || 'general';
  const tags = enrichment?.tags || [];
  const achievements = enrichment?.achievements || [];
  const hasAchievements = achievements.length > 0;

  return (
    <Link
      to={`/journals/${journal.id}/edit`}
      className={`journal-card journal-card--${cat}`}
      style={style}
    >
      <div className="journal-card__header">
        <div className="journal-card__title">
          {journal.title || 'Untitled'}
        </div>
        <span className={`cat-pill cat-pill--${cat}`}>
          {CATEGORIES[cat] || cat || 'General'}
        </span>
      </div>

      <div className="journal-card__meta">
        <span className="journal-card__date">{formatDate(journal.entry_date)}</span>
        {journal.created_at && (
          <span className="journal-card__time">{formatTimestamp(journal.created_at)}</span>
        )}
        {journal.visibility && journal.visibility !== 'private' && (
          <span className="journal-card__visibility">
            {visibilityIcon(journal.visibility)}
            {journal.visibility}
          </span>
        )}
      </div>

      {journal.did_today && (
        <div className="journal-card__preview">
          {truncate(journal.did_today, 140)}
        </div>
      )}

      <div className="journal-card__footer">
        <div className="journal-card__tags">
          {tags.slice(0, 4).map(t => (
            <span key={t.id || t.name || t} className="tag">{t.name || t}</span>
          ))}
          {tags.length > 4 && (
            <span className="tag" style={{ opacity: 0.5 }}>+{tags.length - 4}</span>
          )}
        </div>
        <div className="journal-card__indicators">
          {hasAchievements && (
            <span className="journal-card__indicator journal-card__indicator--achievement" title={`${achievements.length} achievement${achievements.length > 1 ? 's' : ''}`}>
              {icons.star}
              {achievements.length}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}


/* ─────────────────────────────────────────────
   JournalListRow — Revamped List View
   ───────────────────────────────────────────── */
function JournalListRow({ journal, enrichment, style }) {
  const cat = journal.category || 'general';
  const tags = enrichment?.tags || [];
  const achievements = enrichment?.achievements || [];
  const hasAchievements = achievements.length > 0;

  return (
    <Link
      to={`/journals/${journal.id}/edit`}
      className={`journal-list-row journal-list-row--${cat}`}
      style={style}
    >
      <div className="journal-list-row__date-col">
        <span className="journal-list-row__date">{formatDate(journal.entry_date)}</span>
        {journal.created_at && (
          <span className="journal-list-row__time">{formatTimestamp(journal.created_at)}</span>
        )}
      </div>

      <div className="journal-list-row__body">
        <div className="journal-list-row__title">{journal.title || 'Untitled'}</div>
        {journal.did_today && (
          <div className="journal-list-row__preview">{truncate(journal.did_today, 100)}</div>
        )}
        <div className="journal-list-row__bottom">
          {tags.slice(0, 3).map(t => (
            <span key={t.id || t.name || t} className="tag">{t.name || t}</span>
          ))}
          {tags.length > 3 && (
            <span className="tag" style={{ opacity: 0.5 }}>+{tags.length - 3}</span>
          )}
        </div>
      </div>

      <div className="journal-list-row__right">
        <span className={`cat-pill cat-pill--${cat}`}>
          {CATEGORIES[cat] || cat || 'General'}
        </span>
        <div className="journal-list-row__indicators">
          {hasAchievements && (
            <span className="journal-card__indicator journal-card__indicator--achievement" title={`${achievements.length} achievement${achievements.length > 1 ? 's' : ''}`}>
              {icons.star}
              {achievements.length}
            </span>
          )}
          {journal.visibility && journal.visibility !== 'private' && (
            <span className="journal-card__indicator" title={journal.visibility}>
              {visibilityIcon(journal.visibility)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}


/* ─────────────────────────────────────────────
   StatsStrip
   ───────────────────────────────────────────── */
function StatsStrip({ journals }) {
  const stats = useMemo(() => {
    const catCounts = {};
    journals.forEach(j => {
      const cat = j.category || 'general';
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });

    // Unique categories used
    const catsUsed = Object.entries(catCounts)
      .sort((a, b) => b[1] - a[1]);

    // Date range
    let earliest = null;
    let latest = null;
    journals.forEach(j => {
      if (j.entry_date) {
        const d = new Date(j.entry_date);
        if (!earliest || d < earliest) earliest = d;
        if (!latest || d > latest) latest = d;
      }
    });

    return { total: journals.length, catsUsed, earliest, latest };
  }, [journals]);

  if (stats.total === 0) return null;

  return (
    <div className="journal-stats-strip">
      <div className="journal-stat">
        <span className="journal-stat__icon">{icons.book}</span>
        <span className="journal-stat__value">{stats.total}</span>
        <span>entries</span>
      </div>

      {stats.catsUsed.length > 0 && (
        <div className="journal-stat">
          <div className="journal-cat-dots">
            {stats.catsUsed.map(([cat, count]) => (
              <span
                key={cat}
                className={`journal-cat-dot journal-cat-dot--${cat}`}
                title={`${CATEGORIES[cat] || cat}: ${count}`}
                style={{ width: Math.max(6, Math.min(14, 6 + count * 2)), height: Math.max(6, Math.min(14, 6 + count * 2)) }}
              />
            ))}
          </div>
          <span>{stats.catsUsed.length} categories</span>
        </div>
      )}

      {stats.earliest && stats.latest && (
        <div className="journal-stat">
          <span className="journal-stat__icon">{icons.calendar}</span>
          <span>
            {stats.earliest.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            {stats.earliest.getMonth() !== stats.latest.getMonth() || stats.earliest.getFullYear() !== stats.latest.getFullYear()
              ? ` — ${stats.latest.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
              : ''
            }
          </span>
        </div>
      )}
    </div>
  );
}


/* ═══════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════ */
export default function JournalListPage() {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('journal-view-mode') || 'gallery';
  });

  // Enrichment data: tags and achievements per journal
  const [enrichment, setEnrichment] = useState({});

  // Persist view mode
  useEffect(() => {
    localStorage.setItem('journal-view-mode', viewMode);
  }, [viewMode]);

  // Load journals
  useEffect(() => {
    async function loadJournals() {
      setLoading(true);
      try {
        const params = { limit: 100 };
        if (category) params.category = category;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        const data = await api.searchJournals(params);
        setJournals(data.journals || []);
      } catch (err) {
        console.error('Failed to load journals:', err);
      } finally {
        setLoading(false);
      }
    }
    loadJournals();
  }, [category, dateFrom, dateTo]);

  // Load enrichment data (tags + achievements) for each journal
  const loadEnrichment = useCallback(async (journalsList) => {
    if (!journalsList.length) return;

    const enrichmentMap = {};

    await Promise.all(
      journalsList.map(async (j) => {
        const [tagsResult, achievementsResult] = await Promise.allSettled([
          api.getJournalTags(j.id),
          api.getJournalAchievements(j.id),
        ]);

        enrichmentMap[j.id] = {
          tags: tagsResult.status === 'fulfilled' ? (tagsResult.value.tags || []) : [],
          achievements: achievementsResult.status === 'fulfilled' ? (achievementsResult.value.achievements || []) : [],
        };
      })
    );

    setEnrichment(enrichmentMap);
  }, []);

  useEffect(() => {
    if (journals.length > 0) {
      loadEnrichment(journals);
    }
  }, [journals, loadEnrichment]);

  // Group by month
  const grouped = useMemo(() => {
    const groups = {};
    journals.forEach(j => {
      const key = getMonthYear(j.entry_date);
      if (!groups[key]) groups[key] = [];
      groups[key].push(j);
    });
    return Object.entries(groups);
  }, [journals]);

  const hasFilters = category || dateFrom || dateTo;

  const clearFilters = () => {
    setCategory('');
    setDateFrom('');
    setDateTo('');
  };

  return (
    <div className="animate-in">
      {/* Page Header + View Toggle */}
      <div className="journal-page-header">
        <div className="page-header">
          <h1 className="page-title">Journal</h1>
          <p className="page-subtitle">Your professional work record</p>
        </div>
        <div className="journal-view-toggle">
          <button
            className={`journal-view-btn ${viewMode === 'gallery' ? 'active' : ''}`}
            onClick={() => setViewMode('gallery')}
            title="Gallery view"
            aria-label="Gallery view"
          >
            {icons.grid}
          </button>
          <button
            className={`journal-view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => setViewMode('list')}
            title="List view"
            aria-label="List view"
          >
            {icons.list}
          </button>
        </div>
      </div>

      {/* Stats Strip */}
      {!loading && <StatsStrip journals={journals} />}

      {/* Filter Bar */}
      <div className="journal-filter-bar">
        <div className="journal-filter-pills">
          <button
            className={`journal-filter-pill ${!category ? 'active' : ''}`}
            onClick={() => setCategory('')}
          >
            All
          </button>
          {CATEGORY_OPTIONS.filter(o => o.value).map(o => (
            <button
              key={o.value}
              className={`journal-filter-pill ${category === o.value ? 'active' : ''}`}
              onClick={() => setCategory(category === o.value ? '' : o.value)}
            >
              <span
                className="journal-filter-pill__dot"
                style={{ background: CATEGORY_COLORS[o.value] || 'var(--text-tertiary)' }}
              />
              {o.label}
            </button>
          ))}
        </div>

        <div className="journal-date-filters">
          <input
            className="filter-input"
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            aria-label="From date"
            placeholder="From"
          />
          <input
            className="filter-input"
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            aria-label="To date"
            placeholder="To"
          />
        </div>

        {hasFilters && (
          <button className="journal-clear-btn" onClick={clearFilters}>
            <span style={{ width: 12, height: 12, display: 'inline-flex' }}>{icons.x}</span>
            Clear
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="loading">Loading entries…</div>
      ) : journals.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
            </svg>
          </div>
          <div className="empty-state-title">No entries found</div>
          <div className="empty-state-desc">
            {hasFilters
              ? 'Try adjusting your filters.'
              : 'Start documenting your work by creating your first entry.'}
          </div>
          {!hasFilters && (
            <Link to="/journals/new" className="btn btn--primary" style={{ marginTop: 16 }}>
              Write your first entry
            </Link>
          )}
        </div>
      ) : (
        <div className="animate-stagger">
          {grouped.map(([month, entries]) => (
            <div key={month}>
              {/* Month Divider */}
              <div className="journal-month-divider">
                <span className="journal-month-label">{month}</span>
                <span className="journal-month-count">
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                </span>
                <div className="journal-month-line" />
              </div>

              {/* Gallery View */}
              {viewMode === 'gallery' && (
                <div className="journal-gallery">
                  {entries.map((j, i) => (
                    <JournalCard
                      key={j.id}
                      journal={j}
                      enrichment={enrichment[j.id]}
                      style={{ animationDelay: `${i * 50}ms` }}
                    />
                  ))}
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="journal-list-view">
                  {entries.map((j, i) => (
                    <JournalListRow
                      key={j.id}
                      journal={j}
                      enrichment={enrichment[j.id]}
                      style={{ animationDelay: `${i * 30}ms` }}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
