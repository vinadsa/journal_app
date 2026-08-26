import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import '../styles/Pages.css';
import { CATEGORIES, CATEGORY_OPTIONS } from '../lib/constants';
import { formatDate } from '../lib/dateUtils';


function highlightKeyword(text, keyword) {
  if (!keyword || !text) return text;
  const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i}>{part}</mark> : part
  );
}

function getSnippet(text, keyword, maxLen = 150) {
  if (!text) return '';
  if (!keyword) return text.slice(0, maxLen);
  const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
  if (idx === -1) return text.slice(0, maxLen);
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + keyword.length + maxLen - 40);
  let snippet = text.slice(start, end);
  if (start > 0) snippet = '…' + snippet;
  if (end < text.length) snippet = snippet + '…';
  return snippet;
}

export default function SearchPage() {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [tag, setTag] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [results, setResults] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [allTags, setAllTags] = useState([]);

  useEffect(() => {
    api.listTags().then(d => setAllTags(d.tags || [])).catch(err => console.error(err));
  }, []);

  const search = useCallback(async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = { limit: 50 };
      if (keyword.trim()) params.keyword = keyword.trim();
      if (category) params.category = category;
      if (tag) params.tag = tag;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const data = await api.searchJournals(params);
      setResults(data.journals || []);
      setCount(data.count || 0);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setLoading(false);
    }
  }, [keyword, category, tag, dateFrom, dateTo]);

  // Debounced search on keyword change
  useEffect(() => {
    if (!keyword.trim() && !category && !tag && !dateFrom && !dateTo) {
      const timer = setTimeout(() => {
        setResults([]);
        setSearched(false);
      }, 0);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(search, 400);
    return () => clearTimeout(timer);
  }, [keyword, category, tag, dateFrom, dateTo, search]);

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Search</h1>
        <p className="page-subtitle">Find evidence across your entire record</p>
      </div>

      {/* Search input */}
      <div className="search-input-wrapper">
        <svg className="search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          className="search-input"
          type="text"
          value={keyword}
          onChange={e => setKeyword(e.target.value)}
          placeholder="Search journals and achievements…"
          aria-label="Search"
          autoFocus
        />
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

        <select
          className="filter-select"
          value={tag}
          onChange={e => setTag(e.target.value)}
          aria-label="Filter by tag"
        >
          <option value="">All Tags</option>
          {allTags.map(t => (
            <option key={t.id || t.name} value={t.name || t}>{t.name || t}</option>
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
      </div>

      {/* Results */}
      {loading ? (
        <div className="loading">Searching…</div>
      ) : searched ? (
        <>
          <div className="search-result-count">
            {count} result{count !== 1 ? 's' : ''} found
          </div>

          {results.length === 0 ? (
            <div className="empty-state" style={{ padding: '48px 16px' }}>
              <div className="empty-state-title">No results</div>
              <div className="empty-state-desc">Try different keywords or adjust your filters.</div>
            </div>
          ) : (
            <div className="animate-stagger">
              {results.map(j => {
                const snippet = getSnippet(j.did_today, keyword) || getSnippet(j.learned_today, keyword);
                return (
                  <Link key={j.id} to={`/journals/${j.id}/edit`} className="entry-row" style={{ gridTemplateColumns: '90px 1fr auto' }}>
                    <span className="entry-date">{formatDate(j.entry_date)}</span>
                    <div className="entry-body">
                      <div className="entry-title">{j.title || 'Untitled'}</div>
                      {snippet && (
                        <div className="search-snippet">
                          {highlightKeyword(snippet, keyword)}
                        </div>
                      )}
                      {j.tags && j.tags.length > 0 && (
                        <div className="entry-tags" style={{ marginTop: 6 }}>
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
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="empty-state" style={{ padding: '64px 16px' }}>
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <div className="empty-state-title">Search your record</div>
          <div className="empty-state-desc">
            Find contributions by keyword, category, tag, or date range. Build your case with evidence.
          </div>
        </div>
      )}
    </div>
  );
}
