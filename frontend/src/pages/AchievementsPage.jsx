import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import '../styles/Pages.css';
import { formatDate } from '../lib/dateUtils';
import ImportanceBadge from '../components/ui/ImportanceBadge';
import BackButton from '../components/ui/BackButton';
import LinkSupportingEvidenceModal from '../components/ui/LinkSupportingEvidenceModal';
import CreateAchievementModal from '../components/ui/CreateAchievementModal';


export default function AchievementsPage() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [linkTargetAchievement, setLinkTargetAchievement] = useState(null);

  const loadAchievements = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listAchievements({ limit: 100 });
      setAchievements(data.achievements || []);
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const handleUnlinkJournal = async (achievementId, journalId) => {
    if (!confirm('Unlink this journal entry from this achievement?')) return;
    try {
      await api.unlinkJournalFromAchievement(achievementId, journalId);
      setAchievements(prev => prev.map(a => {
        if (a.id !== achievementId) return a;
        const nextLinked = (a.linked_journals || []).filter(j => j.id !== journalId);
        return {
          ...a,
          journal_id: a.journal_id === journalId ? null : a.journal_id,
          linked_journals: nextLinked,
        };
      }));
    } catch (err) {
      console.error('Failed to unlink journal:', err);
      alert('Failed to unlink journal: ' + err.message);
    }
  };

  const filtered = filter
    ? achievements.filter(a => a.importance === filter)
    : achievements;

  const sorted = [...filtered].sort((a, b) => {
    const d1 = new Date(b.achieved_date || b.created_at);
    const d2 = new Date(a.achieved_date || a.created_at);
    return d1 - d2;
  });

  const handleDelete = async (id) => {
    if (!confirm('Delete this achievement?')) return;
    try {
      await api.deleteAchievement(id);
      setAchievements(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const startEdit = (a) => {
    setEditingId(a.id);
    setEditForm({
      title: a.title || '',
      description: a.description || '',
      impact: a.impact || '',
      importance: a.importance || 'medium',
    });
  };

  const saveEdit = async (id) => {
    try {
      const data = await api.updateAchievement(id, editForm);
      setAchievements(prev => prev.map(a => a.id === id ? { ...a, ...editForm, ...(data.achievement || {}) } : a));
      setEditingId(null);
    } catch (err) {
      alert('Failed to update: ' + err.message);
    }
  };

  return (
    <div className="animate-in">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <BackButton fallback="/dashboard" />
          <h1 className="page-title">Achievements</h1>
          <p className="page-subtitle">
            {achievements.length} achievement{achievements.length !== 1 ? 's' : ''} documented
          </p>
        </div>
        <button
          type="button"
          id="btn-new-achievement"
          className="btn btn--primary btn--sm"
          onClick={() => setIsCreateOpen(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 4 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Achievement
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <select
          className="filter-select"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          aria-label="Filter by importance"
        >
          <option value="">All Importance</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        {filter && (
          <button className="btn btn--ghost btn--sm" onClick={() => setFilter('')}>
            Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading">Loading achievements…</div>
      ) : sorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className="empty-state-title">No achievements yet</div>
          <div className="empty-state-desc">
            Record significant achievements, launch wins, and business impact backed by your work.
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setIsCreateOpen(true)}
            >
              + Create Achievement
            </button>
            <Link to="/journals/new" className="btn btn--secondary">
              Write an entry
            </Link>
          </div>
        </div>
      ) : (
        <div className="animate-stagger">
          {sorted.map(a => (
            <div key={a.id} className={`achievement-card achievement-card--${a.importance || 'medium'}`}>
              {editingId === a.id ? (
                /* Edit mode */
                <div>
                  <div className="form-section">
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="Title"
                    />
                  </div>
                  <div className="form-section">
                    <textarea
                      value={editForm.description}
                      onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Description"
                      rows={3}
                    />
                  </div>
                  <div className="form-section">
                    <textarea
                      value={editForm.impact}
                      onChange={e => setEditForm(p => ({ ...p, impact: e.target.value }))}
                      placeholder="Impact"
                      rows={2}
                    />
                  </div>
                  <div className="form-section">
                    <select
                      value={editForm.importance}
                      onChange={e => setEditForm(p => ({ ...p, importance: e.target.value }))}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button className="btn btn--ghost btn--sm" onClick={() => setEditingId(null)}>Cancel</button>
                    <button className="btn btn--primary btn--sm" onClick={() => saveEdit(a.id)}>Save</button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <>
                  <div className="achievement-header">
                    <ImportanceBadge level={a.importance || 'medium'} />
                    <div className="achievement-header-meta">
                      <div className="achievement-actions">
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm achievement-action-btn"
                          onClick={() => startEdit(a)}
                          title="Edit achievement"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn--danger btn--sm achievement-action-btn"
                          onClick={() => handleDelete(a.id)}
                          title="Delete achievement"
                        >
                          Delete
                        </button>
                      </div>
                      <span className="achievement-date">{formatDate(a.achieved_date || a.created_at)}</span>
                    </div>
                  </div>

                  <h3 className="achievement-title">{a.title}</h3>

                  {a.description && (
                    <p className="achievement-desc">{a.description}</p>
                  )}

                  {a.impact && (
                    <div className="achievement-impact">
                      <div className="achievement-impact-label">Impact</div>
                      {a.impact}
                    </div>
                  )}

                  {/* Linked Journal Entries Section */}
                  <div className="achievement-entry">
                    <div className="achievement-entry-label">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                      Linked Journal Entries ({a.linked_journals?.length || (a.journal_id ? 1 : 0)})
                      <button
                        type="button"
                        className="achievement-add-evidence-btn"
                        onClick={() => setLinkTargetAchievement(a)}
                        title="Link journal entries"
                      >
                        + Link Entry
                      </button>
                    </div>

                    {((a.linked_journals && a.linked_journals.length > 0) || a.journal_id) ? (
                      <div className="achievement-entry-list">
                        {a.linked_journals && a.linked_journals.length > 0 ? (
                          a.linked_journals.map(j => (
                            <div key={j.id} style={{ position: 'relative', display: 'inline-flex' }}>
                              <Link to={`/journals/${j.id}`} className="achievement-entry-pill" title={`View entry: ${j.title || `Entry #${j.id}`}`}>
                                <span className="achievement-entry-date">{formatDate(j.entry_date)}</span>
                                <span className="achievement-entry-title">{j.title || `Entry #${j.id}`}</span>
                              </Link>
                              <button
                                type="button"
                                className="achievement-entry-unlink-btn"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleUnlinkJournal(a.id, j.id);
                                }}
                                title="Unlink journal entry"
                                aria-label="Unlink journal entry"
                              >
                                ×
                              </button>
                            </div>
                          ))
                        ) : (
                          <div style={{ position: 'relative', display: 'inline-flex' }}>
                            <Link to={`/journals/${a.journal_id}`} className="achievement-entry-pill">
                              <span className="achievement-entry-title">View primary entry #{a.journal_id}</span>
                            </Link>
                            <button
                              type="button"
                              className="achievement-entry-unlink-btn"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleUnlinkJournal(a.id, a.journal_id);
                              }}
                              title="Unlink journal entry"
                              aria-label="Unlink journal entry"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                        No journal entries linked. Click &ldquo;+ Link Entry&rdquo; to connect entries to this achievement.
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <LinkSupportingEvidenceModal
        isOpen={!!linkTargetAchievement}
        onClose={() => setLinkTargetAchievement(null)}
        achievement={linkTargetAchievement}
        onSuccess={loadAchievements}
      />

      <CreateAchievementModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={loadAchievements}
      />
    </div>

  );
}
