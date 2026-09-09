import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../api';
import { formatDate } from '../../lib/dateUtils';
import { CATEGORIES } from '../../lib/constants';

export default function LinkSupportingEvidenceModal({
  isOpen,
  onClose,
  achievement,
  onSuccess,
}) {
  const [journals, setJournals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Already linked journal IDs from the achievement
  const existingLinkedIds = useMemo(() => {
    if (!achievement) return new Set();
    const set = new Set();
    if (achievement.journal_id) set.add(achievement.journal_id);
    if (Array.isArray(achievement.linked_journals)) {
      achievement.linked_journals.forEach(j => set.add(j.id));
    }
    return set;
  }, [achievement]);

  // Load journals when modal opens
  useEffect(() => {
    if (!isOpen) return;
    async function loadJournals() {
      setLoading(true);
      setError('');
      try {
        const data = await api.searchJournals({ limit: 100 });
        setJournals(data?.journals || []);
      } catch (err) {
        console.error('Failed to load journals for evidence linking:', err);
        setError('Failed to load journal archive. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    loadJournals();
    setSelectedIds(new Set());
    setSearchQuery('');
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

  // Filter journals based on query
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
    if (existingLinkedIds.has(id)) return; // Cannot toggle already linked
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0 || !achievement?.id) return;
    setSubmitting(true);
    setError('');

    try {
      // Link each selected journal
      for (const journalId of selectedIds) {
        await api.linkJournalToAchievement(achievement.id, journalId);
      }
      if (onSuccess) {
        onSuccess(Array.from(selectedIds));
      }
      onClose();
    } catch (err) {
      console.error('Failed to link journal entries:', err);
      setError(err.message || 'Failed to link selected entries.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !achievement) return null;

  return createPortal(
    <div
      className="evidence-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="link-entries-title"
    >
      <div
        className="evidence-modal-dialog"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="evidence-modal-header">
          <div className="evidence-modal-title-group">
            <h2 id="link-entries-title" className="evidence-modal-title">
              Link Journal Entries
              <span className="evidence-modal-badge">Linked Entries</span>
            </h2>
            <p className="evidence-modal-subtitle">
              Connect journal entries to &ldquo;<strong>{achievement.title}</strong>&rdquo;.
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

        {/* Search */}
        <div className="evidence-modal-search">
          <div className="evidence-search-input-wrap">
            <span className="evidence-search-icon">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </span>
            <input
              type="text"
              className="evidence-search-input"
              placeholder="Search by title, work completed, or category…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div style={{ padding: '8px 24px', background: 'rgba(220, 38, 38, 0.1)', color: '#e11d48', fontSize: 'var(--text-xs)' }}>
            {error}
          </div>
        )}

        {/* Body List */}
        <div className="evidence-modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              Loading journal archive…
            </div>
          ) : filteredJournals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
              {searchQuery ? 'No journal entries match your search.' : 'No journal entries found in archive.'}
            </div>
          ) : (
            filteredJournals.map(j => {
              const isAlreadyLinked = existingLinkedIds.has(j.id);
              const isSelected = selectedIds.has(j.id);

              return (
                <div
                  key={j.id}
                  className={`evidence-item ${isSelected ? 'evidence-item--selected' : ''} ${isAlreadyLinked ? 'evidence-item--disabled' : ''}`}
                  onClick={() => toggleSelect(j.id)}
                >
                  <div className="evidence-checkbox-wrap">
                    <input
                      type="checkbox"
                      className="evidence-checkbox"
                      checked={isAlreadyLinked || isSelected}
                      disabled={isAlreadyLinked}
                      onChange={() => toggleSelect(j.id)}
                      onClick={e => e.stopPropagation()}
                      aria-label={`Select ${j.title || 'entry'}`}
                    />
                  </div>

                  <div className="evidence-item-content">
                    <div className="evidence-item-header">
                      <span className="evidence-item-date">{formatDate(j.entry_date)}</span>
                      <span className="evidence-item-title">{j.title || 'Untitled Entry'}</span>
                      <span className={`cat-pill cat-pill--${j.category || 'general'}`} style={{ marginLeft: 'auto' }}>
                        {CATEGORIES[j.category] || j.category}
                      </span>
                      {isAlreadyLinked && (
                        <span className="evidence-item-badge-linked">Already Linked</span>
                      )}
                    </div>
                    {j.did_today && (
                      <div className="evidence-item-snippet">
                        {j.did_today}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="evidence-modal-footer">
          <div className="evidence-modal-status">
            {selectedIds.size} {selectedIds.size === 1 ? 'entry' : 'entries'} selected
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
              type="button"
              className="btn btn--primary btn--sm"
              onClick={handleSubmit}
              disabled={submitting || selectedIds.size === 0}
            >
              {submitting ? 'Linking…' : `Link ${selectedIds.size > 0 ? selectedIds.size : ''} Entries`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
