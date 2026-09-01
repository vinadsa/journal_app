import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import '../styles/Pages.css';
import { formatDate } from '../lib/dateUtils';
import ImportanceBadge from '../components/ui/ImportanceBadge';
import BackButton from '../components/ui/BackButton';


export default function AchievementsPage() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    async function loadAchievements() {
      setLoading(true);
      try {
        const data = await api.listAchievements({ limit: 100 });
        setAchievements(data.achievements || []);
      } catch (err) {
        console.error('Failed to load achievements:', err);
      } finally {
        setLoading(false);
      }
    }
    loadAchievements();
  }, []);

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
      <div className="page-header">
        <BackButton fallback="/dashboard" />
        <h1 className="page-title">Achievements</h1>
        <p className="page-subtitle">
          {achievements.length} achievement{achievements.length !== 1 ? 's' : ''} documented
        </p>
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
            Achievements emerge from your daily work. Create a journal entry and mark something noteworthy.
          </div>
          <Link to="/journals/new" className="btn btn--primary" style={{ marginTop: 16 }}>
            Write an entry
          </Link>
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
                  <div className="achievement-actions">
                    <button className="btn btn--ghost btn--sm" onClick={() => startEdit(a)}>Edit</button>
                    <button className="btn btn--danger btn--sm" onClick={() => handleDelete(a.id)}>Delete</button>
                  </div>

                  <div className="achievement-header">
                    <ImportanceBadge level={a.importance || 'medium'} />
                    <span className="achievement-date">{formatDate(a.achieved_date || a.created_at)}</span>
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

                  {a.journal_id && (
                    <div className="achievement-link">
                      Linked journal: <Link to={`/journals/${a.journal_id}`}>View entry →</Link>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
