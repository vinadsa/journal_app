import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { api } from '../api';
import '../styles/Pages.css';
import '../styles/SearchPage.css';
import { CATEGORIES, CATEGORY_OPTIONS } from '../lib/constants';
import { formatDate, formatDateFull } from '../lib/dateUtils';
import BackButton from '../components/ui/BackButton';
import ImportanceBadge from '../components/ui/ImportanceBadge';

const FOUNDATION_TAGS = new Set(['mentoring', 'refactor', 'tech-debt', 'incident', 'architecture']);
const FOUNDATION_CATEGORIES = new Set(['maintenance', 'meeting', 'other']);

const TAG_ICONS = {
  incident: '🚨',
  mentoring: '🤝',
  refactor: '⚡',
  architecture: '🏛️',
  performance: '🚀',
  security: '🛡️',
  database: '🗄️',
  backend: '⚙️',
  devops: '🔧',
  'tech-debt': '🧹',
  infrastructure: '☁️',
};

function isFoundationWork(journal) {
  if (!journal) return false;
  if (FOUNDATION_CATEGORIES.has(journal.category)) return true;
  if (Array.isArray(journal.tags) && journal.tags.some(t => FOUNDATION_TAGS.has(t.name || t))) return true;
  return false;
}

function highlightKeyword(text, keyword) {
  if (!keyword || !text) return text;
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i}>{part}</mark> : part
  );
}

function getContextSnippet(item, keyword, maxLen = 150) {
  if (!item) return { field: '', text: '' };
  const lowerKw = (keyword || '').toLowerCase().trim();

  const candidates = [
    { field: 'Impact', text: item.impact },
    { field: 'What I Did', text: item.did_today },
    { field: 'Learnings', text: item.learned_today },
    { field: 'Blockers', text: item.blockers },
    { field: 'Next Plan', text: item.next_plan },
    { field: 'Description', text: item.description },
  ];

  if (lowerKw) {
    for (const c of candidates) {
      if (c.text && c.text.toLowerCase().includes(lowerKw)) {
        const idx = c.text.toLowerCase().indexOf(lowerKw);
        const start = Math.max(0, idx - 35);
        const end = Math.min(c.text.length, idx + lowerKw.length + maxLen - 35);
        let snippet = c.text.slice(start, end);
        if (start > 0) snippet = '…' + snippet;
        if (end < c.text.length) snippet = snippet + '…';
        return { field: c.field, text: snippet };
      }
    }
  }

  // Fallback to first available meaningful text
  for (const c of candidates) {
    if (c.text) {
      const snippet = c.text.slice(0, maxLen) + (c.text.length > maxLen ? '…' : '');
      return { field: c.field, text: snippet };
    }
  }

  return { field: '', text: '' };
}

export default function SearchPage() {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [tag, setTag] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [importance, setImportance] = useState('');
  const [scope, setScope] = useState('all'); // 'all' | 'journals' | 'achievements' | 'foundation'
  const [sortOrder, setSortOrder] = useState('newest'); // 'newest' | 'oldest'

  const [journals, setJournals] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [allTags, setAllTags] = useState([]);
  const [kpiPeriods, setKpiPeriods] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);

  const searchInputRef = useRef(null);
  const selectedItemRef = useRef(selectedItem);
  selectedItemRef.current = selectedItem;

  const hasFilters = Boolean(
    keyword.trim() || category || tag || dateFrom || dateTo || importance
  );
  const hasFiltersRef = useRef(false);
  hasFiltersRef.current = hasFilters;

  // Top tags sorted by journal count (highest first)
  const topTags = useMemo(() => {
    return [...allTags]
      .sort((a, b) => (b.journal_count || 0) - (a.journal_count || 0))
      .slice(0, 5);
  }, [allTags]);

  // Load tags and KPI periods once
  useEffect(() => {
    Promise.allSettled([
      api.listTags(),
      api.listKPIPeriods(),
    ]).then(([tagsRes, kpiRes]) => {
      if (tagsRes.status === 'fulfilled') setAllTags(tagsRes.value.tags || []);
      if (kpiRes.status === 'fulfilled') setKpiPeriods(kpiRes.value.kpi_periods || []);
    });
  }, []);

  const resetFilters = useCallback(() => {
    setKeyword('');
    setCategory('');
    setTag('');
    setDateFrom('');
    setDateTo('');
    setImportance('');
    setScope('all');
    setJournals([]);
    setAchievements([]);
    setSearched(false);
    searchInputRef.current?.focus();
  }, []);

  // Keyboard shortcut listener: Cmd+K / Ctrl+K / '/' to focus, Esc to close drawer or clear
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '/' && document.activeElement !== searchInputRef.current && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (selectedItemRef.current) {
          setSelectedItem(null);
        } else if (hasFiltersRef.current) {
          resetFilters();
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetFilters]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (selectedItem) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [selectedItem]);



  // Unified Search Execution
  const performSearch = useCallback(async () => {
    setLoading(true);
    setSearched(true);
    try {
      const journalParams = { limit: 100 };
      if (keyword.trim()) journalParams.keyword = keyword.trim();
      if (category) journalParams.category = category;
      if (tag) journalParams.tag = tag;
      if (importance) journalParams.importance = importance;
      if (dateFrom) journalParams.date_from = dateFrom;
      if (dateTo) journalParams.date_to = dateTo;

      const achievementParams = { limit: 50 };
      if (keyword.trim()) achievementParams.keyword = keyword.trim();
      if (importance) achievementParams.importance = importance;
      if (category) achievementParams.category = category;
      if (tag) achievementParams.tag = tag;
      if (dateFrom) achievementParams.date_from = dateFrom;
      if (dateTo) achievementParams.date_to = dateTo;

      const [jRes, aRes] = await Promise.allSettled([
        api.searchJournals(journalParams),
        api.searchAchievements(achievementParams),
      ]);

      setJournals(jRes.status === 'fulfilled' ? (jRes.value.journals || []) : []);
      setAchievements(aRes.status === 'fulfilled' ? (aRes.value.achievements || []) : []);
    } catch (err) {
      console.error('Unified search failed:', err);
    } finally {
      setLoading(false);
    }
  }, [keyword, category, tag, dateFrom, dateTo, importance]);

  // Debounced search on criteria change
  useEffect(() => {
    const hasActiveFilters = Boolean(
      keyword.trim() || category || tag || dateFrom || dateTo || importance
    );

    if (!hasActiveFilters) {
      const timer = setTimeout(() => {
        setJournals([]);
        setAchievements([]);
        setSearched(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(performSearch, 350);
    return () => clearTimeout(timer);
  }, [keyword, category, tag, dateFrom, dateTo, importance, performSearch]);


  // Scope Filtering
  const foundationJournals = useMemo(() => {
    return journals.filter(isFoundationWork);
  }, [journals]);

  const displayedJournals = useMemo(() => {
    if (scope === 'achievements') return [];
    if (scope === 'foundation') return foundationJournals;
    return journals;
  }, [journals, foundationJournals, scope]);

  const displayedAchievements = useMemo(() => {
    if (scope === 'journals' || scope === 'foundation') return [];
    return achievements;
  }, [achievements, scope]);

  // Merged & Sorted Traces
  const combinedEntries = useMemo(() => {
    const combined = [
      ...displayedJournals.map(j => ({
        ...j,
        entityType: 'journal',
        sortDate: new Date(j.entry_date || j.created_at),
      })),
      ...displayedAchievements.map(a => ({
        ...a,
        entityType: 'achievement',
        sortDate: new Date(a.achieved_date || a.created_at),
      })),
    ];

    return combined.sort((a, b) => {
      if (sortOrder === 'oldest') {
        return a.sortDate - b.sortDate;
      }
      return b.sortDate - a.sortDate;
    });
  }, [displayedJournals, displayedAchievements, sortOrder]);

  const totalCount = combinedEntries.length;

  // Active KPI cycle map for easy lookup
  const kpiPeriodMap = useMemo(() => {
    const map = new Map();
    kpiPeriods.forEach(p => map.set(p.id, p));
    return map;
  }, [kpiPeriods]);

  // Quick Action Chips handlers
  const handleQuickTag = (tagName) => {
    setTag(tagName === tag ? '' : tagName);
  };

  const handleQuickCycle = (cycle) => {
    if (!cycle) {
      setDateFrom('');
      setDateTo('');
      return;
    }
    setDateFrom(cycle.start_date || '');
    setDateTo(cycle.end_date || '');
  };

  const handleQuickImpact = () => {
    if (scope === 'achievements' && importance === 'critical') {
      setScope('all');
      setImportance('');
    } else {
      setScope('achievements');
      setImportance('critical');
    }
  };

  return (
    <div className="search-page animate-in">
      {/* Editorial Page Header */}
      <div className="page-header" style={{ marginBottom: 'var(--space-2)' }}>
        <BackButton fallback="/dashboard" />
        <h1 className="page-title">Search</h1>
        <p className="page-subtitle">
          Find journal entries, achievements, and foundation work across cycles
        </p>
      </div>

      {/* Hero Search Box */}
      <div className="search-hero">
        <div className="search-hero-input-wrap">
          <svg className="search-hero-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={searchInputRef}
            className="search-hero-input"
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="Search entries, achievements, tags, or keywords…"
            aria-label="Search journals and achievements"
            autoFocus
          />
          <div className="search-hero-actions">
            {keyword && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setKeyword('')}
                title="Clear query (Esc)"
                aria-label="Clear query"
              >
                ✕
              </button>
            )}
            <span className="search-kbd-hint">⌘K</span>
          </div>
        </div>
      </div>

      {/* Quick Discovery Chips */}
      <div className="search-chips-bar">
        <span className="search-chips-label">Quick filters:</span>
        {topTags.map(t => {
          const tagName = t.name || t;
          const isSelected = tag === tagName;
          const isFoundation = FOUNDATION_TAGS.has(tagName);
          const icon = TAG_ICONS[tagName];
          const count = t.journal_count;
          return (
            <button
              key={t.id || tagName}
              type="button"
              className={`search-chip ${isSelected ? 'search-chip--active' : isFoundation ? 'search-chip--foundation' : ''}`}
              onClick={() => handleQuickTag(tagName)}
              title={`Filter by #${tagName} (${count || 0} journals)`}
            >
              {icon && <span>{icon} </span>}
              #{tagName}
              {typeof count === 'number' && count > 0 && (
                <span className="search-chip-count">{count}</span>
              )}
            </button>
          );
        })}
        {kpiPeriods.slice(0, 2).map(kp => {
          const isActiveCycle = dateFrom === kp.start_date && dateTo === kp.end_date;
          return (
            <button
              key={kp.id}
              type="button"
              className={`search-chip ${isActiveCycle ? 'search-chip--active' : ''}`}
              onClick={() => handleQuickCycle(isActiveCycle ? null : kp)}
            >
              📅 {kp.title || `Cycle #${kp.id}`}
            </button>
          );
        })}
        <button
          type="button"
          className={`search-chip ${scope === 'achievements' && importance === 'critical' ? 'search-chip--active' : 'search-chip--gold'}`}
          onClick={handleQuickImpact}
        >
          ★ Critical Achievements
        </button>
      </div>

      {/* Granular Filter Toolbar */}
      <div className="search-filter-grid">
        <select
          className="search-select"
          value={category}
          onChange={e => setCategory(e.target.value)}
          aria-label="Filter by category"
        >
          {CATEGORY_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          className="search-select"
          value={tag}
          onChange={e => setTag(e.target.value)}
          aria-label="Filter by tag"
        >
          <option value="">All Tags</option>
          {allTags.map(t => (
            <option key={t.id || t.name} value={t.name || t}>
              #{t.name || t} {typeof t.journal_count === 'number' && t.journal_count > 0 ? `(${t.journal_count})` : ''}
            </option>
          ))}
        </select>

        <select
          className="search-select"
          value={importance}
          onChange={e => setImportance(e.target.value)}
          aria-label="Filter by milestone importance"
        >
          <option value="">All Importance Levels</option>
          <option value="critical">Critical Impact</option>
          <option value="high">High Impact</option>
          <option value="medium">Medium Impact</option>
          <option value="low">Low Impact</option>
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            className="search-date-input"
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            title="Start date"
            aria-label="Start date"
          />
          <span style={{ color: 'var(--text-tertiary)', fontSize: '11px' }}>to</span>
          <input
            className="search-date-input"
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            title="End date"
            aria-label="End date"
          />
        </div>

        {hasFilters && (
          <button
            type="button"
            className="search-reset-btn"
            onClick={resetFilters}
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Active Filter Badges Strip */}
      {hasFilters && (
        <div className="search-active-filters">
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>Active:</span>
          {keyword && (
            <span className="search-active-pill">
              Keyword: "{keyword}"
              <button type="button" onClick={() => setKeyword('')}>✕</button>
            </span>
          )}
          {category && (
            <span className="search-active-pill">
              Category: {CATEGORIES[category] || category}
              <button type="button" onClick={() => setCategory('')}>✕</button>
            </span>
          )}
          {tag && (
            <span className="search-active-pill">
              Tag: #{tag}
              <button type="button" onClick={() => setTag('')}>✕</button>
            </span>
          )}
          {importance && (
            <span className="search-active-pill">
              Importance: {importance}
              <button
                type="button"
                onClick={() => {
                  setImportance('');
                  if (scope === 'achievements') setScope('all');
                }}
              >
                ✕
              </button>
            </span>
          )}
          {(dateFrom || dateTo) && (
            <span className="search-active-pill">
              Range: {dateFrom || '…'} to {dateTo || '…'}
              <button type="button" onClick={() => { setDateFrom(''); setDateTo(''); }}>✕</button>
            </span>
          )}
          <button
            type="button"
            className="search-active-clear-all"
            onClick={resetFilters}
            title="Clear all filters"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Scope Tabs & Sort Order */}
      {searched && (
        <div className="search-scope-tabs">
          <button
            type="button"
            className={`search-scope-tab ${scope === 'all' ? 'search-scope-tab--active' : ''}`}
            onClick={() => setScope('all')}
          >
            All
            <span className="search-scope-badge">{journals.length + achievements.length}</span>
          </button>
          <button
            type="button"
            className={`search-scope-tab ${scope === 'journals' ? 'search-scope-tab--active' : ''}`}
            onClick={() => setScope('journals')}
          >
            Journals
            <span className="search-scope-badge">{journals.length}</span>
          </button>
          <button
            type="button"
            className={`search-scope-tab ${scope === 'achievements' ? 'search-scope-tab--active' : ''}`}
            onClick={() => setScope('achievements')}
          >
            Achievements
            <span className="search-scope-badge">{achievements.length}</span>
          </button>
          <button
            type="button"
            className={`search-scope-tab ${scope === 'foundation' ? 'search-scope-tab--active' : ''}`}
            onClick={() => setScope('foundation')}
          >
            Foundation Work
            <span className="search-scope-badge">{foundationJournals.length}</span>
          </button>
        </div>
      )}

      {/* Results View */}
      {loading ? (
        <div className="loading" style={{ padding: '64px 0', textAlign: 'center' }}>
          Searching…
        </div>
      ) : searched ? (
        <>
          <div className="search-stats-header">
            <span className="search-stats-text">
              {totalCount} result{totalCount !== 1 ? 's' : ''} found
              {displayedJournals.length > 0 && ` • ${displayedJournals.length} journal${displayedJournals.length !== 1 ? 's' : ''}`}
              {displayedAchievements.length > 0 && ` • ${displayedAchievements.length} achievement${displayedAchievements.length !== 1 ? 's' : ''}`}
            </span>
            <div className="search-sort-control">
              <label htmlFor="search-sort-select" style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>Sort:</label>
              <select
                id="search-sort-select"
                className="search-select search-sort-select"
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
                aria-label="Sort results order"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </div>
          </div>

          {combinedEntries.length === 0 ? (
            <div className="empty-state" style={{ padding: '56px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-xl)' }}>
              <div className="empty-state-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <div className="empty-state-title">No results found</div>
              <div className="empty-state-desc" style={{ maxWidth: 460 }}>
                No journals or achievements match your current search and filters.
                Try adjusting your search terms or clearing active filters.
              </div>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                style={{ marginTop: 'var(--space-4)' }}
                onClick={resetFilters}
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="search-results-list animate-stagger">
              {combinedEntries.map(item => {
                const isAch = item.entityType === 'achievement';
                const isFoundation = !isAch && isFoundationWork(item);
                const snippetObj = getContextSnippet(item, keyword);
                const kpi = item.kpi_period_id ? kpiPeriodMap.get(item.kpi_period_id) : null;

                return (
                  <div
                    key={`${item.entityType}-${item.id}`}
                    className={`search-card ${isAch ? 'search-card--achievement' : ''} ${isFoundation ? 'search-card--foundation' : ''}`}
                    onClick={() => setSelectedItem(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter') setSelectedItem(item); }}
                  >
                    <div className="search-card-top">
                      <div className="search-card-meta">
                        <span className="search-card-date">
                          {formatDate(isAch ? (item.achieved_date || item.created_at) : item.entry_date)}
                        </span>
                        {kpi && (
                          <span className="search-cycle-badge">
                            {kpi.title}
                          </span>
                        )}
                        {isFoundation && (
                          <span className="search-foundation-flag" title="Foundation work (maintenance, mentoring, refactoring)">
                            Foundation Work
                          </span>
                        )}
                      </div>

                      {isAch ? (
                        <ImportanceBadge level={item.importance || 'medium'} />
                      ) : (
                        <span className={`cat-pill cat-pill--${item.category || 'general'}`}>
                          {CATEGORIES[item.category] || item.category || 'General'}
                        </span>
                      )}
                    </div>

                    <div className="search-card-title">
                      {highlightKeyword(item.title || (isAch ? 'Untitled Milestone' : 'Untitled Entry'), keyword)}
                    </div>

                    {snippetObj.text && (
                      <div className="search-snippet">
                        {snippetObj.field && (
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-tertiary)', marginRight: 6 }}>
                            [{snippetObj.field}]:
                          </span>
                        )}
                        {highlightKeyword(snippetObj.text, keyword)}
                      </div>
                    )}

                    <div className="search-card-bottom">
                      {/* Journal Tags */}
                      {!isAch && Array.isArray(item.tags) && item.tags.length > 0 && (
                        <div className="search-card-tags">
                          {item.tags.map(t => (
                            <span
                              key={t.id || t.name || t}
                              className={`tag ${FOUNDATION_TAGS.has(t.name || t) ? 'tag--foundation' : ''}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setTag(t.name || t);
                              }}
                              title={`Filter by #${t.name || t}`}
                            >
                              {t.name || t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Supporting Evidence Anchor */}
                      {!isAch && Array.isArray(item.achievements) && item.achievements.length > 0 && (
                        <span className="search-anchor-badge" title="Linked to achievement">
                          ★ Linked to: {item.achievements[0].title}
                        </span>
                      )}

                      {/* Linked journals count for achievement */}
                      {isAch && Array.isArray(item.linked_journals) && item.linked_journals.length > 0 && (
                        <span className="search-anchor-badge">
                          ★ {item.linked_journals.length} linked journal{item.linked_journals.length !== 1 ? 's' : ''}
                        </span>
                      )}

                      <span className="search-card-peek-hint">
                        View details →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Minimalist Clean Slate */
        <div className="search-clean-slate">
          <p className="search-clean-slate-hint">
            Type keywords, pick quick tags, or adjust filters to search across journal entries and achievements.
          </p>
          <div className="search-clean-slate-keys">
            <span><kbd>⌘K</kbd> or <kbd>/</kbd> to focus</span>
            <span className="search-clean-slate-sep">•</span>
            <span><kbd>Esc</kbd> to clear filters</span>
          </div>
        </div>
      )}

      {/* Slide-Over Detail Drawer */}
      {selectedItem && typeof document !== 'undefined' && createPortal(
        <div className="search-drawer-overlay" onClick={() => { document.body.style.overflow = ''; setSelectedItem(null); }}>
          <div
            className="search-drawer-panel"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="drawer-title"
          >
            <div className="search-drawer-header">
              <div className="search-drawer-title-wrap">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {selectedItem.entityType === 'achievement' ? (
                    <ImportanceBadge level={selectedItem.importance || 'medium'} />
                  ) : (
                    <span className={`cat-pill cat-pill--${selectedItem.category || 'general'}`}>
                      {CATEGORIES[selectedItem.category] || selectedItem.category || 'General'}
                    </span>
                  )}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    {formatDateFull(selectedItem.entry_date || selectedItem.achieved_date || selectedItem.created_at)}
                  </span>
                  {selectedItem.kpi_period_id && kpiPeriodMap.get(selectedItem.kpi_period_id) && (
                    <span className="search-cycle-badge">
                      {kpiPeriodMap.get(selectedItem.kpi_period_id).title}
                    </span>
                  )}
                </div>
                <h2 id="drawer-title" className="search-drawer-title">
                  {selectedItem.title || 'Untitled Entry'}
                </h2>
              </div>
              <button
                type="button"
                className="search-drawer-close"
                onClick={() => { document.body.style.overflow = ''; setSelectedItem(null); }}
                aria-label="Close drawer"
              >
                ✕
              </button>
            </div>

            <div className="search-drawer-content">
              {selectedItem.entityType === 'achievement' ? (
                <>
                  {/* Achievement Sections */}
                  {selectedItem.impact && (
                    <div className="search-drawer-section">
                      <div className="search-drawer-section-label">Business Impact</div>
                      <div className="search-drawer-impact-box">
                        {selectedItem.impact}
                      </div>
                    </div>
                  )}

                  {selectedItem.description && (
                    <div className="search-drawer-section">
                      <div className="search-drawer-section-label">Description</div>
                      <div className="search-drawer-section-body">
                        {selectedItem.description}
                      </div>
                    </div>
                  )}

                  {Array.isArray(selectedItem.linked_journals) && selectedItem.linked_journals.length > 0 && (
                    <div className="search-drawer-section">
                      <div className="search-drawer-section-label">
                        Linked Journal Entries ({selectedItem.linked_journals.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {selectedItem.linked_journals.map(j => (
                          <Link
                            key={j.id}
                            to={`/journals/${j.id}`}
                            className="entry-row"
                            style={{ padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }}
                          >
                            <span className="entry-date">{formatDate(j.entry_date)}</span>
                            <span className="entry-title" style={{ fontSize: 'var(--text-sm)' }}>{j.title}</span>
                            <span className={`cat-pill cat-pill--${j.category || 'general'}`} style={{ marginLeft: 'auto' }}>
                              {CATEGORIES[j.category] || j.category}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Journal Sections */}
                  {selectedItem.did_today && (
                    <div className="search-drawer-section">
                      <div className="search-drawer-section-label">Work Completed</div>
                      <div className="search-drawer-section-body">
                        {selectedItem.did_today}
                      </div>
                    </div>
                  )}

                  {selectedItem.learned_today && (
                    <div className="search-drawer-section">
                      <div className="search-drawer-section-label">Learnings & Insights</div>
                      <div className="search-drawer-section-body">
                        {selectedItem.learned_today}
                      </div>
                    </div>
                  )}

                  {selectedItem.blockers && (
                    <div className="search-drawer-section">
                      <div className="search-drawer-section-label">Blockers & Challenges</div>
                      <div className="search-drawer-section-body" style={{ borderColor: 'hsl(350 40% 50% / 0.4)' }}>
                        {selectedItem.blockers}
                      </div>
                    </div>
                  )}

                  {selectedItem.next_plan && (
                    <div className="search-drawer-section">
                      <div className="search-drawer-section-label">Next Steps</div>
                      <div className="search-drawer-section-body">
                        {selectedItem.next_plan}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {Array.isArray(selectedItem.tags) && selectedItem.tags.length > 0 && (
                    <div className="search-drawer-section">
                      <div className="search-drawer-section-label">Tags</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {selectedItem.tags.map(t => (
                          <span
                            key={t.id || t.name || t}
                            className={`tag ${FOUNDATION_TAGS.has(t.name || t) ? 'tag--foundation' : ''}`}
                          >
                            {t.name || t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Linked Achievements */}
                  {Array.isArray(selectedItem.achievements) && selectedItem.achievements.length > 0 && (
                    <div className="search-drawer-section">
                      <div className="search-drawer-section-label">Linked Achievements</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {selectedItem.achievements.map(a => (
                          <div
                            key={a.id}
                            style={{
                              padding: '12px 16px',
                              background: 'hsl(42 50% 50% / 0.08)',
                              border: '1px solid hsl(42 50% 50% / 0.3)',
                              borderRadius: 'var(--radius-md)',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 4
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</span>
                              <ImportanceBadge level={a.importance || 'medium'} />
                            </div>
                            {a.impact && (
                              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', margin: 0 }}>
                                {a.impact}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="search-drawer-footer">
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => { document.body.style.overflow = ''; setSelectedItem(null); }}
              >
                Close Drawer
              </button>

              {selectedItem.entityType === 'journal' ? (
                <Link
                  to={`/journals/${selectedItem.id}`}
                  className="btn btn--primary btn--sm"
                >
                  View Full Entry →
                </Link>
              ) : (
                <Link
                  to="/achievements"
                  className="btn btn--primary btn--sm"
                >
                  Go to Achievements →
                </Link>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
