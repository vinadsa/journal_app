import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import '../styles/Pages.css';
import { CATEGORY_OPTIONS, VISIBILITY_OPTIONS, IMPORTANCE_OPTIONS } from '../lib/constants';
import { formatLocalDate } from '../lib/dateUtils';
import BackButton from '../components/ui/BackButton';


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
    entry_date: formatLocalDate(new Date()),
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
  
  const [attachments, setAttachments] = useState([]);
  const [existingAttachments, setExistingAttachments] = useState([]);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [kpiPeriods, setKpiPeriods] = useState([]);

  const [activeImageIndex, setActiveImageIndex] = useState(null);

  const allImages = useMemo(() => {
    return [
      ...existingAttachments.map(att => ({ 
        ...att, 
        isNew: false, 
        url: `/api/files/${att.file_path}`,
        thumb: `/api/files/${att.thumbnail_path || att.file_path}`,
        name: att.file_name || `attachment_${att.id}.jpg`
      })),
      ...attachments.map(file => ({ 
        file, 
        isNew: true, 
        url: URL.createObjectURL(file), 
        thumb: URL.createObjectURL(file),
        name: file.name 
      }))
    ];
  }, [existingAttachments, attachments]);

  const handlePrevImage = () => {
    setActiveImageIndex(prev => {
      if (prev === null || allImages.length === 0) return null;
      return (prev - 1 + allImages.length) % allImages.length;
    });
  };

  const handleNextImage = () => {
    setActiveImageIndex(prev => {
      if (prev === null || allImages.length === 0) return null;
      return (prev + 1) % allImages.length;
    });
  };

  useEffect(() => {
    if (activeImageIndex === null) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveImageIndex(null);
      else if (e.key === 'ArrowLeft') {
        setActiveImageIndex(prev => (prev === null || allImages.length === 0) ? null : (prev - 1 + allImages.length) % allImages.length);
      } else if (e.key === 'ArrowRight') {
        setActiveImageIndex(prev => (prev === null || allImages.length === 0) ? null : (prev + 1) % allImages.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeImageIndex, allImages.length]);

  useEffect(() => {
    api.listKPIPeriods()
      .then(res => setKpiPeriods(res?.kpi_periods || []))
      .catch(console.error);
  }, []);

  const matchedPeriod = useMemo(() => {
    if (!form.entry_date || kpiPeriods.length === 0) return null;
    return kpiPeriods.find(kp => form.entry_date >= kp.start_date && form.entry_date <= kp.end_date) ||
           kpiPeriods.find(kp => kp.is_active) || null;
  }, [form.entry_date, kpiPeriods]);

  // Load existing journal for edit
  useEffect(() => {
    async function loadJournal() {
      setLoading(true);
      try {
        // Load journal entry directly via dedicated endpoint
        const data = await api.getJournal(id);
        const journal = data.journal;
        if (journal) {
          setForm({
            title: journal.title || '',
            did_today: journal.did_today || '',
            learned_today: journal.learned_today || '',
            category: journal.category || 'general',
            blockers: journal.blockers || '',
            next_plan: journal.next_plan || '',
            visibility: journal.visibility || 'private',
            entry_date: journal.entry_date ? journal.entry_date.split('T')[0] : formatLocalDate(new Date()),
          });
        }
        // Load journal tags & attachments
        try {
          const [tagData, attachmentData] = await Promise.all([
            api.getJournalTags(id),
            api.getJournalAttachments(id)
          ]);
          
          const fetchedTags = tagData.tags || [];
          setTags(fetchedTags.map(t => t.name || t));
          setOriginalTags(fetchedTags);

          if (attachmentData.attachments) {
            setExistingAttachments(attachmentData.attachments);
          }
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

  const processFiles = (files) => {
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image.`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is larger than 10MB.`);
        return false;
      }
      return true;
    });

    const totalCurrent = existingAttachments.length + attachments.length;
    if (totalCurrent + validFiles.length > 5) {
      alert("You can only upload up to 5 images.");
      const allowed = Math.max(0, 5 - totalCurrent);
      validFiles.splice(allowed);
    }

    setAttachments(prev => [...prev, ...validFiles]);
  };

  const handleFileChange = (e) => {
    processFiles(Array.from(e.target.files));
    e.target.value = ''; // reset
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (existingAttachments.length + attachments.length >= 5) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (existingAttachments.length + attachments.length >= 5) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (index, attachmentId) => {
    setExistingAttachments(prev => prev.filter((_, i) => i !== index));
    setDeletedAttachmentIds(prev => [...prev, attachmentId]);
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
      let submitData = form;
      if (attachments.length > 0 || deletedAttachmentIds.length > 0) {
        submitData = new FormData();
        Object.entries(form).forEach(([key, value]) => {
          submitData.append(key, value);
        });
        attachments.forEach(file => {
          submitData.append('attachments', file);
        });
        deletedAttachmentIds.forEach(id => {
          submitData.append('deleted_attachments', id);
        });
      }

      let journal;
      if (isEdit) {
        const data = await api.updateJournal(id, submitData);
        journal = data.journal;
      } else {
        const data = await api.createJournal(submitData);
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
            journal_ids: [parseInt(journalId)],
            title: achievement.title,
            description: achievement.description,
            impact: achievement.impact,
            importance: achievement.importance,
            achieved_date: formatLocalDate(new Date()),
          });
        } catch (err) {
          console.error('Failed to create achievement:', err);
        }
      }

      navigate(isEdit ? `/journals/${journalId}` : '/journals');
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
        <BackButton fallback={isEdit ? `/journals/${id}` : '/journals'} />
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
        <div className="form-row-3">
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
              max={formatLocalDate(new Date())}
            />
            {matchedPeriod && (
              <div style={{ marginTop: 6, fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className={`kpi-indicator-dot ${matchedPeriod.is_active ? 'active' : ''}`} />
                Target Cycle: <strong>{matchedPeriod.name}</strong> ({matchedPeriod.start_date} – {matchedPeriod.end_date})
              </div>
            )}
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

        {/* Image Upload */}
        <div className="form-section">
          <label className="form-label">Attachments (Max 5)</label>
          <div 
            className={`file-upload-container ${isDragging ? 'drag-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="file-upload-dropzone">
              <input
                id="journal-attachments"
                type="file"
                multiple
                accept="image/*"
                className="file-upload-input"
                onChange={handleFileChange}
                disabled={existingAttachments.length + attachments.length >= 5}
              />
              <label 
                className={`file-upload-label ${existingAttachments.length + attachments.length >= 5 ? 'disabled' : ''}`} 
                htmlFor="journal-attachments"
              >
                <div className="file-upload-icon-wrapper">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
                <div className="file-upload-text">
                  <span className="file-upload-title">Click to upload or drag and drop</span>
                  <span className="file-upload-subtitle">SVG, PNG, JPG or GIF (max. 10MB)</span>
                </div>
              </label>
            </div>
            {(existingAttachments.length > 0 || attachments.length > 0) && (
              <div className="image-preview-grid">
                {existingAttachments.map((att, idx) => (
                  <div key={`existing-${att.id}`} className="image-preview-item animate-in-scale">
                    <img 
                      src={`/api/files/${att.file_path}`} 
                      alt={`existing preview ${idx}`} 
                      style={{ cursor: 'pointer' }}
                      onClick={() => setActiveImageIndex(idx)}
                    />
                    <button 
                      type="button" 
                      className="image-preview-remove"
                      onClick={() => removeExistingAttachment(idx, att.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {attachments.map((file, idx) => {
                  const url = URL.createObjectURL(file);
                  const imageIndex = existingAttachments.length + idx;
                  return (
                    <div key={`new-${idx}`} className="image-preview-item animate-in-scale">
                      <img 
                        src={url} 
                        alt={`preview ${idx}`} 
                        style={{ cursor: 'pointer' }}
                        onClick={() => setActiveImageIndex(imageIndex)}
                      />
                      <button 
                        type="button" 
                        className="image-preview-remove"
                        onClick={() => removeAttachment(idx)}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
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

      {/* Lightbox Modal via Portal */}
      {activeImageIndex !== null && allImages[activeImageIndex] && typeof document !== 'undefined' && createPortal(
        <div 
          className="stitch-lightbox-overlay" 
          onClick={() => setActiveImageIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Evidence Lightbox"
        >
          <div 
            className="stitch-lightbox-window" 
            onClick={e => e.stopPropagation()}
          >
            {/* Top Header */}
            <div className="lightbox-topbar">
              <div className="lightbox-title-group">
                <span className="lightbox-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
                  </svg>
                </span>
                <span className="lightbox-filename">
                  {allImages[activeImageIndex].name}
                </span>
                <span className="lightbox-counter-pill">
                  {activeImageIndex + 1} / {allImages.length}
                </span>
              </div>

              <div className="lightbox-actions">
                {!allImages[activeImageIndex].isNew && (
                  <a
                    href={allImages[activeImageIndex].url}
                    target="_blank"
                    rel="noreferrer"
                    className="action-btn-ghost lightbox-btn"
                    download
                    title="Download or view raw file"
                  >
                    <span>Open Original ↗</span>
                  </a>
                )}
                <button
                  type="button"
                  className="lightbox-close-btn"
                  onClick={() => setActiveImageIndex(null)}
                  aria-label="Close modal"
                  title="Close (ESC)"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Center Image Stage */}
            <div className="lightbox-stage">
              {allImages.length > 1 && (
                <button
                  type="button"
                  className="lightbox-nav-btn lightbox-nav-prev"
                  onClick={handlePrevImage}
                  aria-label="Previous image"
                  title="Previous (Left Arrow)"
                >
                  ‹
                </button>
              )}

              <div className="lightbox-image-wrapper">
                <img
                  key={activeImageIndex}
                  src={allImages[activeImageIndex].url}
                  alt={`Evidence attachment ${activeImageIndex + 1}`}
                  className="lightbox-img"
                />
              </div>

              {allImages.length > 1 && (
                <button
                  type="button"
                  className="lightbox-nav-btn lightbox-nav-next"
                  onClick={handleNextImage}
                  aria-label="Next image"
                  title="Next (Right Arrow)"
                >
                  ›
                </button>
              )}
            </div>

            {/* Bottom Filmstrip / Thumbnails & Keyboard Hint */}
            {allImages.length > 1 && (
              <div className="lightbox-filmstrip-bar">
                <div className="lightbox-filmstrip">
                  {allImages.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`lightbox-thumb-btn ${idx === activeImageIndex ? 'active' : ''}`}
                      onClick={() => setActiveImageIndex(idx)}
                      title={`Jump to artifact ${idx + 1}`}
                    >
                      <img
                        src={img.thumb}
                        alt={`Thumbnail ${idx + 1}`}
                      />
                    </button>
                  ))}
                </div>
                <div className="lightbox-hint">
                  <span>Use <strong>←</strong> and <strong>→</strong> keys to navigate, <strong>ESC</strong> to close</span>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
