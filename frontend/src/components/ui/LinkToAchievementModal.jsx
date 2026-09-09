import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../api';
import { formatDate, formatLocalDate } from '../../lib/dateUtils';
import { IMPORTANCE_OPTIONS } from '../../lib/constants';
import ImportanceBadge from './ImportanceBadge';

export default function LinkToAchievementModal({
  isOpen,
  onClose,
  journal,
  linkedAchievementIds = new Set(),
  onSuccess,
}) {
  const [activeTab, setActiveTab] = useState('existing'); // 'existing' | 'new'
  const [achievements, setAchievements] = useState([]);
  const [loadingAchievements, setLoadingAchievements] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAchievementId, setSelectedAchievementId] = useState(null);

  // New Achievement Form
  const [newForm, setNewForm] = useState({
    title: '',
    description: '',
    impact: '',
    importance: 'medium',
    achieved_date: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !journal) return;

    async function loadAchievements() {
      setLoadingAchievements(true);
      try {
        const data = await api.listAchievements({ limit: 100 });
        setAchievements(data?.achievements || []);
      } catch (err) {
        console.error('Failed to load achievements:', err);
      } finally {
        setLoadingAchievements(false);
      }
    }

    loadAchievements();
    setActiveTab('existing');
    setSelectedAchievementId(null);
    setSearchQuery('');
    setError('');

    // Pre-populate new form from journal
    setNewForm({
      title: journal.title || '',
      description: journal.did_today || '',
      impact: '',
      importance: 'medium',
      achieved_date: journal.entry_date ? journal.entry_date.split('T')[0] : formatLocalDate(new Date()),
    });
  }, [isOpen, journal]);

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

  const filteredAchievements = useMemo(() => {
    if (!searchQuery.trim()) return achievements;
    const q = searchQuery.toLowerCase().trim();
    return achievements.filter(a => {
      const matchTitle = (a.title || '').toLowerCase().includes(q);
      const matchDesc = (a.description || '').toLowerCase().includes(q);
      const matchImpact = (a.impact || '').toLowerCase().includes(q);
      return matchTitle || matchDesc || matchImpact;
    });
  }, [achievements, searchQuery]);

  // Handle Link to Existing
  const handleLinkExisting = async () => {
    if (!selectedAchievementId || !journal?.id) return;
    setSubmitting(true);
    setError('');

    try {
      await api.linkJournalToAchievement(selectedAchievementId, journal.id);
      if (onSuccess) {
        onSuccess({ mode: 'linked', achievementId: selectedAchievementId });
      }
      onClose();
    } catch (err) {
      console.error('Failed to link journal to achievement:', err);
      setError(err.message || 'Failed to link journal to achievement.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Create New & Link
  const handleCreateNew = async (e) => {
    e.preventDefault();
    if (!newForm.title.trim() || !journal?.id) {
      setError('Achievement title is required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const data = await api.createAchievement({
        title: newForm.title.trim(),
        description: newForm.description.trim(),
        impact: newForm.impact.trim(),
        importance: newForm.importance,
        achieved_date: newForm.achieved_date || formatLocalDate(new Date()),
        journal_id: journal.id,
        journal_ids: [journal.id],
      });

      if (onSuccess) {
        onSuccess({ mode: 'created', achievement: data.achievement });
      }
      onClose();
    } catch (err) {
      console.error('Failed to create achievement:', err);
      setError(err.message || 'Failed to create achievement.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !journal) return null;

  return createPortal(
    <div
      className="evidence-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="link-achievement-title"
    >
      <div
        className="evidence-modal-dialog"
        style={{ maxWidth: 640, maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="evidence-modal-header">
          <div className="evidence-modal-title-group">
            <h2 id="link-achievement-title" className="evidence-modal-title">
              Link to Achievement
              <span className="evidence-modal-badge">Achievement</span>
            </h2>
            <p className="evidence-modal-subtitle">
              Link entry &ldquo;<strong>{journal.title || 'Untitled'}</strong>&rdquo; ({formatDate(journal.entry_date)}) to an achievement.
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

        {/* Tab Bar */}
        <div className="evidence-tab-bar">
          <button
            type="button"
            className={`evidence-tab ${activeTab === 'existing' ? 'evidence-tab--active' : ''}`}
            onClick={() => setActiveTab('existing')}
          >
            Link to Existing Achievement
          </button>
          <button
            type="button"
            className={`evidence-tab ${activeTab === 'new' ? 'evidence-tab--active' : ''}`}
            onClick={() => setActiveTab('new')}
          >
            Create New Achievement
          </button>
        </div>

        {error && (
          <div style={{ padding: '8px 24px', background: 'rgba(220, 38, 38, 0.1)', color: '#e11d48', fontSize: 'var(--text-xs)' }}>
            {error}
          </div>
        )}

        {activeTab === 'existing' ? (
          <>
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
                  placeholder="Search existing achievements…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="evidence-modal-body">
              {loadingAchievements ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                  Loading achievements…
                </div>
              ) : filteredAchievements.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                  {searchQuery ? 'No matching achievements found.' : 'No achievements created yet. Switch to "Create New Achievement" to create one.'}
                </div>
              ) : (
                filteredAchievements.map(a => {
                  const isAlreadyLinked = linkedAchievementIds.has(a.id);
                  const isSelected = selectedAchievementId === a.id;

                  return (
                    <div
                      key={a.id}
                      className={`evidence-item ${isSelected ? 'evidence-item--selected' : ''} ${isAlreadyLinked ? 'evidence-item--disabled' : ''}`}
                      onClick={() => !isAlreadyLinked && setSelectedAchievementId(a.id)}
                    >
                      <div className="evidence-checkbox-wrap">
                        <input
                          type="radio"
                          name="selected_achievement"
                          className="evidence-checkbox"
                          checked={isSelected || isAlreadyLinked}
                          disabled={isAlreadyLinked}
                          onChange={() => setSelectedAchievementId(a.id)}
                          onClick={e => e.stopPropagation()}
                          aria-label={`Select ${a.title}`}
                        />
                      </div>

                      <div className="evidence-item-content">
                        <div className="evidence-item-header">
                          <ImportanceBadge level={a.importance || 'medium'} />
                          <span className="evidence-item-title">{a.title}</span>
                          <span className="evidence-item-date" style={{ marginLeft: 'auto' }}>
                            {formatDate(a.achieved_date || a.created_at)}
                          </span>
                          {isAlreadyLinked && (
                            <span className="evidence-item-badge-linked">Already Linked</span>
                          )}
                        </div>
                        {a.impact && (
                          <div className="evidence-item-snippet" style={{ color: 'var(--accent)', fontWeight: 500 }}>
                            Impact: {a.impact}
                          </div>
                        )}
                        {a.description && (
                          <div className="evidence-item-snippet">
                            {a.description}
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
                {selectedAchievementId ? 'Achievement selected' : 'Choose an achievement to link this entry'}
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
                  onClick={handleLinkExisting}
                  disabled={submitting || !selectedAchievementId}
                >
                  {submitting ? 'Linking…' : 'Link to Selected Achievement'}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Tab 2: Create New Achievement Form */
          <form onSubmit={handleCreateNew} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-section">
                <label className="form-label" htmlFor="elevate-title">
                  Achievement Title <span style={{ color: 'var(--accent)' }}>*</span>
                </label>
                <input
                  id="elevate-title"
                  type="text"
                  placeholder="e.g. Delivered Core Payment Service V2"
                  value={newForm.title}
                  onChange={e => setNewForm(p => ({ ...p, title: e.target.value }))}
                  required
                  autoFocus
                />
              </div>

              <div className="form-section">
                <label className="form-label" htmlFor="elevate-desc">Description & Technical Scope</label>
                <textarea
                  id="elevate-desc"
                  rows={2}
                  placeholder="Summary of work delivered and scope…"
                  value={newForm.description}
                  onChange={e => setNewForm(p => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className="form-section">
                <label className="form-label" htmlFor="elevate-impact">Business Impact & Measurable Deltas</label>
                <textarea
                  id="elevate-impact"
                  rows={2}
                  placeholder="e.g. Cut transaction latency by 45%, 0 incident escalations…"
                  value={newForm.impact}
                  onChange={e => setNewForm(p => ({ ...p, impact: e.target.value }))}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="form-section">
                  <label className="form-label" htmlFor="elevate-importance">Importance</label>
                  <select
                    id="elevate-importance"
                    value={newForm.importance}
                    onChange={e => setNewForm(p => ({ ...p, importance: e.target.value }))}
                  >
                    {IMPORTANCE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-section">
                  <label className="form-label" htmlFor="elevate-date">Achieved Date</label>
                  <input
                    id="elevate-date"
                    type="date"
                    value={newForm.achieved_date}
                    onChange={e => setNewForm(p => ({ ...p, achieved_date: e.target.value }))}
                  />
                </div>
              </div>

              <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                🔗 This journal entry (<strong>#{journal.id}</strong>) will be linked to the new achievement.
              </div>
            </div>

            {/* Footer */}
            <div className="evidence-modal-footer">
              <div className="evidence-modal-status">
                Ready to link
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
                  disabled={submitting || !newForm.title.trim()}
                >
                  {submitting ? 'Creating…' : 'Create & Link Achievement'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
