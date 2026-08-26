import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import '../styles/Pages.css';
import { CATEGORY_OPTIONS, VISIBILITY_OPTIONS, IMPORTANCE_OPTIONS } from '../lib/constants';


export default function JournalFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: '',
    did_today: '',
    learned_today: '',
    category: 'general',
    blockers: '',
    next_plan: '',
    visibility: 'private',
    entry_date: new Date().toISOString().split('T')[0],
  });

  const [tags, setTags] = useState([]);
  const [originalTags, setOriginalTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [allTags, setAllTags] = useState([]);
  const [showAchievement, setShowAchievement] = useState(false);
  const [achievement, setAchievement] = useState({
    title: '',
    description: '',
    impact: '',
    importance: 'medium',
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);

  // Load existing journal for edit
  useEffect(() => {
    async function loadJournal() {
      setLoading(true);
      try {
        // Use search to find the journal by date range or just load all and find by id
        // Since we don't have a GET /journals/:id endpoint, we'll use search
        const data = await api.searchJournals({ limit: 100 });
        const journal = (data.journals || []).find(j => j.id === parseInt(id));
        if (journal) {
          setForm({
            title: journal.title || '',
            did_today: journal.did_today || '',
            learned_today: journal.learned_today || '',
            category: journal.category || 'general',
            blockers: journal.blockers || '',
            next_plan: journal.next_plan || '',
            visibility: journal.visibility || 'private',
            entry_date: journal.entry_date ? journal.entry_date.split('T')[0] : new Date().toISOString().split('T')[0],
          });
        }
        // Load journal tags
        try {
          const tagData = await api.getJournalTags(id);
          const fetchedTags = tagData.tags || [];
          setTags(fetchedTags.map(t => t.name || t));
          setOriginalTags(fetchedTags);
        } catch (err) {
          console.error(err);
        }
      } catch {
        setError('Failed to load journal entry');
      } finally {
        setLoading(false);
      }
    }

    async function loadTags() {
      try {
        const data = await api.listTags();
        setAllTags((data.tags || []).map(t => t.name || t));
      } catch (err) {
        console.error(err);
      }
    }

    if (isEdit) {
      loadJournal();
    }
    loadTags();
  }, [id, isEdit]);

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase().replace(/[,#]/g, '');
      if (tag && !tags.includes(tag)) {
        setTags(prev => [...prev, tag]);
      }
      setTagInput('');
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(prev => prev.slice(0, -1));
    }
  };

  const removeTag = (tag) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let finalTags = [...tags];
    const pendingTag = tagInput.trim().toLowerCase().replace(/[,#]/g, '');
    if (pendingTag && !tags.includes(pendingTag)) {
      finalTags.push(pendingTag);
      setTags(finalTags);
      setTagInput('');
    }

    setError('');
    setSaving(true);

    try {
      let journal;
      if (isEdit) {
        const data = await api.updateJournal(id, form);
        journal = data.journal;
      } else {
        const data = await api.createJournal(form);
        journal = data.journal;
      }

      const journalId = journal?.id || id;

      // Handle tags
      let allTagsData;
      try {
        allTagsData = await api.listTags();
      } catch (err) {
        console.error(err);
      }
      const existingAllTags = allTagsData?.tags || [];

      const tagsToAdd = finalTags.filter(tagName => !originalTags.find(t => (t.name || t) === tagName));
      const tagsToRemove = originalTags.filter(t => !finalTags.includes(t.name || t));

      for (const tagToRemove of tagsToRemove) {
        try {
          if (tagToRemove.id && journalId) {
            await api.removeTagFromJournal(journalId, tagToRemove.id);
          }
        } catch (err) {
          console.error('Failed to remove tag:', err);
        }
      }

      for (const tagName of tagsToAdd) {
        try {
          let tagId = existingAllTags.find(t => (t.name || t) === tagName)?.id;
          
          if (!tagId) {
            try {
              const newTagData = await api.createTag(tagName);
              tagId = newTagData?.tag?.id;
            } catch (err) {
              console.error(err);
              const freshTagsData = await api.listTags();
              tagId = (freshTagsData.tags || []).find(t => (t.name || t) === tagName)?.id;
            }
          }

          if (tagId && journalId) {
            try {
              await api.addTagToJournal(journalId, tagId);
            } catch (err) {
              console.error(err);
            }
          }
        } catch (err) {
          console.error('Failed to add tag:', err);
        }
      }

      // Handle achievement
      if (showAchievement && achievement.title.trim()) {
        try {
          await api.createAchievement({
            journal_id: parseInt(journalId),
            title: achievement.title,
            description: achievement.description,
            impact: achievement.impact,
            importance: achievement.importance,
            achieved_date: new Date().toISOString().split('T')[0],
          });
        } catch (err) {
          console.error('Failed to create achievement:', err);
        }
      }

      navigate('/journals');
    } catch (err) {
      setError(err.message || 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this entry? This action cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.deleteJournal(id);
      navigate('/journals');
    } catch (err) {
      setError(err.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="loading">Loading entry…</div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Edit Entry' : 'New Entry'}</h1>
        <p className="page-subtitle">
          {isEdit ? 'Update your work record' : 'Document what you worked on today'}
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="auth-error" style={{ marginBottom: 24 }}>{error}</div>
        )}

        {/* Title */}
        <div className="form-section">
          <label className="form-label" htmlFor="journal-title">Title</label>
          <input
            id="journal-title"
            type="text"
            value={form.title}
            onChange={handleChange('title')}
            placeholder="What did you work on today?"
            required
          />
        </div>

        {/* Did Today */}
        <div className="form-section">
          <label className="form-label" htmlFor="journal-did">What I Did</label>
          <textarea
            id="journal-did"
            value={form.did_today}
            onChange={handleChange('did_today')}
            placeholder="Describe your work and contributions…"
            rows={6}
            required
          />
        </div>

        {/* Learned Today */}
        <div className="form-section">
          <label className="form-label" htmlFor="journal-learned">What I Learned</label>
          <textarea
            id="journal-learned"
            value={form.learned_today}
            onChange={handleChange('learned_today')}
            placeholder="New knowledge, insights, or skills gained…"
            rows={3}
          />
        </div>

        {/* Blockers & Next Plan */}
        <div className="form-row">
          <div className="form-section">
            <label className="form-label" htmlFor="journal-blockers">Blockers</label>
            <textarea
              id="journal-blockers"
              value={form.blockers}
              onChange={handleChange('blockers')}
              placeholder="Any impediments?"
              rows={3}
            />
          </div>
          <div className="form-section">
            <label className="form-label" htmlFor="journal-plan">Next Plan</label>
            <textarea
              id="journal-plan"
              value={form.next_plan}
              onChange={handleChange('next_plan')}
              placeholder="What's next?"
              rows={3}
            />
          </div>
        </div>

        {/* Category, Visibility & Entry Date */}
        <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          <div className="form-section">
            <label className="form-label" htmlFor="journal-category">Category</label>
            <select
              id="journal-category"
              value={form.category}
              onChange={handleChange('category')}
            >
              {CATEGORY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="form-section">
            <label className="form-label" htmlFor="journal-visibility">Visibility</label>
            <select
              id="journal-visibility"
              value={form.visibility}
              onChange={handleChange('visibility')}
            >
              {VISIBILITY_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="form-section">
            <label className="form-label" htmlFor="journal-date">Entry Date</label>
            <input
              id="journal-date"
              type="date"
              value={form.entry_date}
              onChange={handleChange('entry_date')}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Tags */}
        <div className="form-section">
          <label className="form-label">Tags</label>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              alignItems: 'center',
              padding: '8px 12px',
              background: 'var(--bg-input)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              minHeight: 42,
            }}
          >
            {tags.map(t => (
              <span key={t} className="tag" style={{ cursor: 'pointer' }} onClick={() => removeTag(t)}>
                {t} ×
              </span>
            ))}
            <input
              className="form-tag-input"
              type="text"
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder={tags.length === 0 ? 'Add tags (press Enter)' : ''}
              list="tag-suggestions"
            />
            <datalist id="tag-suggestions">
              {allTags.filter(t => !tags.includes(t)).map(t => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
        </div>

        {/* Achievement prompt */}
        {!showAchievement ? (
          <div className="achievement-inline" style={{ cursor: 'pointer' }} onClick={() => setShowAchievement(true)}>
            <div className="achievement-inline-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Did something noteworthy today? Mark an achievement.
            </div>
          </div>
        ) : (
          <div className="achievement-inline animate-in-scale">
            <div className="achievement-inline-header">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              New Achievement
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                style={{ marginLeft: 'auto' }}
                onClick={() => setShowAchievement(false)}
              >
                Cancel
              </button>
            </div>

            <div className="form-section">
              <label className="form-label" htmlFor="ach-title">Achievement Title</label>
              <input
                id="ach-title"
                type="text"
                value={achievement.title}
                onChange={e => setAchievement(prev => ({ ...prev, title: e.target.value }))}
                placeholder="What did you achieve?"
              />
            </div>

            <div className="form-section">
              <label className="form-label" htmlFor="ach-desc">Description</label>
              <textarea
                id="ach-desc"
                value={achievement.description}
                onChange={e => setAchievement(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what happened…"
                rows={2}
              />
            </div>

            <div className="form-section">
              <label className="form-label" htmlFor="ach-impact">Impact</label>
              <textarea
                id="ach-impact"
                value={achievement.impact}
                onChange={e => setAchievement(prev => ({ ...prev, impact: e.target.value }))}
                placeholder="What was the business impact?"
                rows={2}
              />
            </div>

            <div className="form-section">
              <label className="form-label" htmlFor="ach-importance">Importance</label>
              <select
                id="ach-importance"
                value={achievement.importance}
                onChange={e => setAchievement(prev => ({ ...prev, importance: e.target.value }))}
              >
                {IMPORTANCE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="form-actions">
          {isEdit && (
            <button
              type="button"
              className="btn btn--danger"
              onClick={handleDelete}
              disabled={deleting}
              style={{ marginRight: 'auto' }}
            >
              {deleting ? 'Deleting…' : 'Delete Entry'}
            </button>
          )}
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={saving}
          >
            {saving ? 'Saving…' : (isEdit ? 'Update Entry' : 'Save Entry')}
          </button>
        </div>
      </form>
    </div>
  );
}
