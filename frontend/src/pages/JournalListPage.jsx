import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import '../styles/Pages.css';
import { CATEGORIES, CATEGORY_OPTIONS } from '../lib/constants';
import { formatDate, getMonthYear } from '../lib/dateUtils';


export default function JournalListPage() {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Journal</h1>
        <p className="page-subtitle">Your professional work record</p>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <select
          className="filter-select"
          value={category}
          onChange={e => setCategory(e.target.value)}
          aria-label="Filter by category"
        >
          {CATEGORY_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <input
          className="filter-input"
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          aria-label="From date"
        />
        <input
          className="filter-input"
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          aria-label="To date"
        />
        {(category || dateFrom || dateTo) && (
          <button
            className="btn btn--ghost btn--sm"
            onClick={() => { setCategory(''); setDateFrom(''); setDateTo(''); }}
          >
            Clear filters
          </button>
        )}
      </div>

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
            {category || dateFrom || dateTo
              ? 'Try adjusting your filters.'
              : 'Start documenting your work by creating your first entry.'}
          </div>
          {!(category || dateFrom || dateTo) && (
            <Link to="/journals/new" className="btn btn--primary" style={{ marginTop: 16 }}>
              Write your first entry
            </Link>
          )}
        </div>
      ) : (
        <div className="animate-stagger">
          {grouped.map(([month, entries]) => (
            <div key={month} className="month-group">
              <div className="month-label">{month}</div>
              {entries.map(j => (
                <Link
                  key={j.id}
                  to={`/journals/${j.id}/edit`}
                  className="entry-row"
                >
                  <span className="entry-date">{formatDate(j.entry_date)}</span>
                  <div className="entry-body">
                    <div className="entry-title">{j.title || 'Untitled'}</div>
                    {j.tags && j.tags.length > 0 && (
                      <div className="entry-tags">
                        {j.tags.map(t => (
                          <span key={t.id || t} className="tag">{t.name || t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`cat-pill cat-pill--${j.category || 'general'}`}>
                    {CATEGORIES[j.category] || j.category || 'General'}
                  </span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
