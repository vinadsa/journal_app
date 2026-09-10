import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../api';
import { formatDate, formatLocalDate } from '../../lib/dateUtils';
import { CATEGORIES, IMPORTANCE_OPTIONS } from '../../lib/constants';
import ImportanceBadge from './ImportanceBadge';

export default function CreateAchievementModal({
  isOpen,
  onClose,
  onSuccess,
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    impact: '',
    importance: 'medium',
    achieved_date: formatLocalDate(new Date()),
  });

  const [journals, setJournals] = useState([]);
  const [loadingJournals, setLoadingJournals] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJournalIds, setSelectedJournalIds] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load journals when modal opens
  useEffect(() => {
    if (!isOpen) return;
    async function loadJournals() {
      setLoadingJournals(true);
      try {
        const data = await api.searchJournals({ limit: 100 });
        setJournals(data?.journals || []);
      } catch (err) {
        console.error('Failed to load journals:', err);
      } finally {
        setLoadingJournals(false);
      }
    }
    loadJournals();
    setForm({
      title: '',
      description: '',
      impact: '',
      importance: 'medium',
      achieved_date: formatLocalDate(new Date()),
    });
    setSelectedJournalIds(new Set());
    setSearchQuery('');
    setError('');
  }, [isOpen]);

  // Body scroll lock and Escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const filteredJournals = useMemo(() => {
    if (!searchQuery.trim()) return journals;
    const q = searchQuery.toLowerCase().trim();
    return journals.filter(j => {
      const matchTitle = (j.title || '').toLowerCase().includes(q);
      const matchDid = (j.did_today || '').toLowerCase().includes(q);
      const matchCat = (j.category || '').toLowerCase().includes(q);
      const matchDate = (j.entry_date || '').includes(q);
      return matchTitle || matchDid || matchCat || matchDate;
    });
  }, [journals, searchQuery]);

  const toggleSelect = (id) => {
    setSelectedJournalIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Achievement title is required.');
      return;
    }
    if (selectedJournalIds.size === 0) {
      setError('TRACE requires at least one journal entry to link to an achievement.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const journalIdsArr = Array.from(selectedJournalIds);
      const data = await api.createAchievement({
        title: form.title.trim(),
        description: form.description.trim(),
        impact: form.impact.trim(),
        importance: form.importance,
        achieved_date: form.achieved_date || formatLocalDate(new Date()),
        journal_id: journalIdsArr[0],
        journal_ids: journalIdsArr,
      });

      if (onSuccess) {
        onSuccess(data.achievement);
      }
      onClose();
    } catch (err) {
      console.error('Failed to create achievement:', err);
      setError(err.message || 'Failed to create achievement.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="evidence-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-achievement-title"
    >
      <div
        className="evidence-modal-dialog"
        style={{ maxWidth: 700, maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="evidence-modal-header">
          <div className="evidence-modal-title-group">
            <h2 id="create-achievement-title" className="evidence-modal-title">
              New Achievement
              <span className="evidence-modal-badge">Linked Entries</span>
            </h2>
            <p className="evidence-modal-subtitle">
              Document a significant career achievement backed by your daily journal contributions.
            </p>
          </div>
          <button
            type="button"
            className="evidence-modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {error && (
          <div style={{ padding: '8px 24px', background: 'rgba(220, 38, 38, 0.1)', color: '#e11d48', fontSize: 'var(--text-xs)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Title */}
            <div className="form-section">
              <label className="form-label" htmlFor="new-ach-title">
                Achievement Title <span style={{ color: 'var(--accent)' }}>*</span>
              </label>
              <input
                id="new-ach-title"
                type="text"
                placeholder="e.g. Migrated Auth Worker to Distributed Locking"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                required
                autoFocus
              />
            </div>

            {/* Description & Impact Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-section">
                <label className="form-label" htmlFor="new-ach-desc">Description</label>
                <textarea
                  id="new-ach-desc"
                  rows={2}
                  placeholder="Context, challenges overcome, or technical scope…"
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className="form-section">
                <label className="form-label" htmlFor="new-ach-impact">Business Impact</label>
                <textarea
                  id="new-ach-impact"
                  rows={2}
                  placeholder="e.g. 0% downtime during peak hours, eliminated deadlock errors…"
                  value={form.impact}
                  onChange={e => setForm(p => ({ ...p, impact: e.target.value }))}
                />
              </div>
            </div>

            {/* Importance & Achieved Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-section">
                <label className="form-label" htmlFor="new-ach-importance">Importance Level</label>
                <select
                  id="new-ach-importance"
                  value={form.importance}
                  onChange={e => setForm(p => ({ ...p, importance: e.target.value }))}
                >
                  {IMPORTANCE_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-section">
                <label className="form-label" htmlFor="new-ach-date">Achieved Date</label>
                <input
                  id="new-ach-date"
                  type="date"
                  value={form.achieved_date}
                  onChange={e => setForm(p => ({ ...p, achieved_date: e.target.value }))}
                />
              </div>
            </div>

            {/* Linked Journal Entries Selector */}
            <div className="form-section" style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <label className="form-label" style={{ margin: 0 }}>
                  Linked Journal Entries <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                  {selectedJournalIds.size} selected (at least 1 required)
                </span>
              </div>

              {/* Mini search */}
              <div className="evidence-search-input-wrap" style={{ marginBottom: 10 }}>
                <span className="evidence-search-icon">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </span>
                <input
                  type="text"
                  className="evidence-search-input"
                  style={{ padding: '6px 10px 6px 32px', fontSize: 'var(--text-xs)' }}
                  placeholder="Filter journal entries by title or content…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Mini scrollable list */}
              <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {loadingJournals ? (
                  <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
                    Loading journal archive…
                  </div>
                ) : filteredJournals.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-secondary)', fontSize: 'var(--text-xs)' }}>
                    No journal entries found.
                  </div>
                ) : (
                  filteredJournals.map(j => {
                    const isSelected = selectedJournalIds.has(j.id);
                    return (
                      <div
                        key={j.id}
                        className={`evidence-item ${isSelected ? 'evidence-item--selected' : ''}`}
                        style={{ padding: '8px 12px' }}
                        onClick={() => toggleSelect(j.id)}
                      >
                        <div className="evidence-checkbox-wrap">
                          <input
                            type="checkbox"
                            className="evidence-checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(j.id)}
                            onClick={e => e.stopPropagation()}
                            aria-label={`Select ${j.title}`}
                          />
                        </div>
                        <div className="evidence-item-content">
                          <div className="evidence-item-header">
                            <span className="evidence-item-date">{formatDate(j.entry_date)}</span>
                            <span className="evidence-item-title" style={{ fontSize: 'var(--text-xs)' }}>
                              {j.title || 'Untitled Entry'}
                            </span>
                            <span className={`cat-pill cat-pill--${j.category || 'general'}`} style={{ marginLeft: 'auto', fontSize: '10px' }}>
                              {CATEGORIES[j.category] || j.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="evidence-modal-footer">
            <div className="evidence-modal-status">
              {selectedJournalIds.size > 0 ? (
                <span>🔗 {selectedJournalIds.size} {selectedJournalIds.size === 1 ? 'entry' : 'entries'} will be linked</span>
              ) : (
                <span style={{ color: 'var(--amber)' }}>Please select journal entries to link</span>
              )}
            </div>
            <div className="evidence-modal-actions">
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn--primary btn--sm"
                disabled={submitting || !form.title.trim() || selectedJournalIds.size === 0}
              >
                {submitting ? 'Creating…' : 'Create Achievement'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
