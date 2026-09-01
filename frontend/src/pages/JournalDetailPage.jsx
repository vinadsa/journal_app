import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import '../styles/Pages.css';
import '../styles/JournalDetail.css';
import { CATEGORIES } from '../lib/constants';
import { formatDate, formatDateFull, formatTimestamp } from '../lib/dateUtils';
import BackButton from '../components/ui/BackButton';
import ImportanceBadge from '../components/ui/ImportanceBadge';

/* ─────────────────────────────────────────────
   SVG Icons (Inline to preserve fidelity)
   ───────────────────────────────────────────── */
const icons = {
  star: (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  lightbulb: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  rocket: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  ),
  folder: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  zoom: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  ),
};

const visibilityIcon = (vis) => {
  switch (vis) {
    case 'public': return icons.globe;
    case 'team': return icons.users;
    case 'manager_only': return icons.shield;
    default: return icons.lock;
  }
};

function getRelativeTimeString(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffTime = now - date;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export default function JournalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [journal, setJournal] = useState(null);
  const [allJournals, setAllJournals] = useState([]);
  const [tags, setTags] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [copied, setCopied] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const data = await api.searchJournals({ limit: 100 });
        const list = data.journals || [];
        setAllJournals(list);
        
        const found = list.find(j => j.id === parseInt(id));
        if (!found) {
          setError('Journal entry not found in your executive archive.');
          setLoading(false);
          return;
        }
        
        setJournal(found);

        // Fetch enrichments concurrently
        const [tagsRes, achRes, attRes] = await Promise.allSettled([
          api.getJournalTags(id),
          api.getJournalAchievements(id),
          api.getJournalAttachments(id)
        ]);

        if (tagsRes.status === 'fulfilled') setTags(tagsRes.value.tags || []);
        if (achRes.status === 'fulfilled') setAchievements(achRes.value.achievements || []);
        if (attRes.status === 'fulfilled') setAttachments(attRes.value.attachments || []);

      } catch (err) {
        setError(err.message || 'Failed to load journal details.');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const handlePrevImage = () => {
    setActiveImageIndex(prev => {
      if (prev === null || attachments.length === 0) return null;
      return (prev - 1 + attachments.length) % attachments.length;
    });
  };

  const handleNextImage = () => {
    setActiveImageIndex(prev => {
      if (prev === null || attachments.length === 0) return null;
      return (prev + 1) % attachments.length;
    });
  };

  // Keyboard navigation and body scroll lock for lightbox
  useEffect(() => {
    if (activeImageIndex === null) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setActiveImageIndex(null);
      else if (e.key === 'ArrowLeft') {
        setActiveImageIndex(prev => (prev === null || attachments.length === 0) ? null : (prev - 1 + attachments.length) % attachments.length);
      } else if (e.key === 'ArrowRight') {
        setActiveImageIndex(prev => (prev === null || attachments.length === 0) ? null : (prev + 1) % attachments.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeImageIndex, attachments.length]);

  // Compute Adjacent Journals for chronological navigation rail
  const { prevJournal, nextJournal } = useMemo(() => {
    if (!allJournals.length || !journal) return { prevJournal: null, nextJournal: null };
    const currentIndex = allJournals.findIndex(j => j.id === parseInt(id));
    if (currentIndex === -1) return { prevJournal: null, nextJournal: null };
    
    return {
      prevJournal: currentIndex < allJournals.length - 1 ? allJournals[currentIndex + 1] : null,
      nextJournal: currentIndex > 0 ? allJournals[currentIndex - 1] : null
    };
  }, [allJournals, journal, id]);

  // Word count & read time metrics
  const metrics = useMemo(() => {
    if (!journal) return { words: 0, readTime: 1 };
    const fullText = [journal.did_today, journal.learned_today, journal.blockers, journal.next_plan].filter(Boolean).join(' ');
    const words = fullText.trim().split(/\s+/).filter(Boolean).length;
    const readTime = Math.max(1, Math.ceil(words / 150));
    return { words, readTime };
  }, [journal]);

  // Formatted standup / review markdown snippet
  const formattedSnippet = useMemo(() => {
    if (!journal) return '';
    const dateFormatted = formatDateFull(journal.entry_date);
    const lines = [
      `### 📌 Work Record: ${journal.title || 'Untitled'} (${dateFormatted})`,
      `**Category:** ${CATEGORIES[journal.category] || journal.category || 'General'}`,
      '',
      `**🚀 What Was Accomplished:**`,
      `${journal.did_today || 'N/A'}`,
    ];

    if (journal.learned_today) {
      lines.push('', `**💡 Key Learnings & Growth:**`, `${journal.learned_today}`);
    }
    if (journal.blockers) {
      lines.push('', `**⚠️ Impediments & Friction:**`, `${journal.blockers}`);
    }
    if (journal.next_plan) {
      lines.push('', `**🎯 Forward Horizon & Plan:**`, `${journal.next_plan}`);
    }
    if (achievements.length > 0) {
      lines.push('', `**🏆 Career Milestones & Achievements:**`);
      achievements.forEach(a => {
        lines.push(`- **${a.title}** (${a.importance} impact): ${a.impact || a.description || ''}`);
      });
    }
    if (tags.length > 0) {
      lines.push('', `**Tags:** ${tags.map(t => `#${t.name || t}`).join(' ')}`);
    }

    return lines.join('\n');
  }, [journal, achievements, tags]);

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(formattedSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.deleteJournal(journal.id);
      navigate('/journals');
    } catch (err) {
      console.error('Failed to delete journal:', err);
      // Fallback close modal if delete fails
      setShowDeleteConfirm(false);
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-in" style={{ padding: '80px 0', textAlign: 'center' }}>
        <div className="loading">Retrieving Executive Memory Dossier…</div>
      </div>
    );
  }

  if (error || !journal) {
    return (
      <div className="animate-in empty-state" style={{ maxWidth: 520, margin: '60px auto' }}>
        <div className="empty-state-title">Record Not Found</div>
        <div className="empty-state-desc">{error || 'This journal entry could not be located in the archive.'}</div>
        <Link to="/journals" className="btn btn--primary" style={{ marginTop: 20 }}>
          ← Return to Archive
        </Link>
      </div>
    );
  }

  const cat = journal.category || 'general';

  return (
    <div className="journal-detail-page animate-in">
      {/* Top Header Bar */}
      <div className="detail-topbar-wrapper">
        <div className="detail-breadcrumb-trail">
          <BackButton fallback="/journals" />
          <span>/</span>
          <Link to="/journals">Archive</Link>
          <span>/</span>
          <span className="detail-breadcrumb-active">{CATEGORIES[cat] || cat}</span>
        </div>

        <div className="detail-action-buttons">
          <button 
            type="button" 
            className="action-btn-ghost" 
            onClick={handleCopySnippet}
            title="Copy structured summary for 1-on-1 or standup"
          >
            <span style={{ width: 14, height: 14, display: 'inline-flex' }}>
              {copied ? icons.check : icons.copy}
            </span>
            <span>{copied ? 'Copied to Clipboard' : 'Copy 1-on-1 Snippet'}</span>
          </button>

          <button 
            type="button" 
            className="action-btn-danger-ghost" 
            onClick={() => setShowDeleteConfirm(true)}
            title="Delete this work record"
          >
            <span style={{ width: 14, height: 14, display: 'inline-flex' }}>{icons.trash}</span>
            <span>Delete Entry</span>
          </button>

          <Link 
            to={`/journals/${journal.id}/edit`} 
            className="action-btn-primary"
            title="Edit work record"
          >
            <span style={{ width: 14, height: 14, display: 'inline-flex' }}>{icons.edit}</span>
            <span>Edit Entry</span>
          </Link>
        </div>
      </div>

      {/* Hero Section & Metadata Strip */}
      <div className="detail-hero-section">
        <div className="detail-badge-cluster">
          <span className={`cat-pill cat-pill--${cat}`}>
            {CATEGORIES[cat] || cat}
          </span>

          {journal.visibility && (
            <span className="dossier-pill">
              <span style={{ width: 12, height: 12, display: 'inline-flex' }}>
                {visibilityIcon(journal.visibility)}
              </span>
              <span style={{ textTransform: 'capitalize' }}>{journal.visibility.replace('_', ' ')}</span>
            </span>
          )}

          <span className="dossier-pill">
            KPI: Q2 2026
          </span>

          {tags.map(t => (
            <span key={t.id || t.name || t} className="dossier-pill" style={{ opacity: 0.85 }}>
              #{t.name || t}
            </span>
          ))}
        </div>

        <h1 className="detail-editorial-headline">
          {journal.title || 'Untitled Work Contribution'}
        </h1>

        <div className="detail-meta-banner">
          <div className="detail-meta-left">
            <div className="author-chip">
              <div className="author-avatar">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                {user?.name}
              </span>
              {user?.role && (
                <>
                  <span style={{ color: 'var(--text-tertiary)' }}>•</span>
                  <span style={{ textTransform: 'capitalize', color: 'var(--text-secondary)' }}>
                    {user.role}
                  </span>
                </>
              )}
            </div>

            <span style={{ color: 'var(--text-tertiary)' }}>|</span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 14, height: 14, display: 'inline-flex', color: 'var(--text-tertiary)' }}>
                {icons.calendar}
              </span>
              <span>{formatDateFull(journal.entry_date)}</span>
              <span style={{ color: 'var(--text-tertiary)' }}>•</span>
              <span style={{ color: 'var(--accent)' }}>{getRelativeTimeString(journal.entry_date)}</span>
              {journal.created_at && (
                <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>
                  ({formatTimestamp(journal.created_at)})
                </span>
              )}
            </div>
          </div>

          <div className="detail-meta-right">
            <span className="detail-meta-stat" title="Word count">
              <span style={{ width: 13, height: 13, display: 'inline-flex' }}>{icons.folder}</span>
              {metrics.words}w
            </span>
            <span className="detail-meta-stat" title="Estimated reading time">
              ⏱ {metrics.readTime}m read
            </span>
            <span className="detail-meta-stat" title="Attached artifacts">
              📎 {attachments.length} items
            </span>
          </div>
        </div>
      </div>

      {/* First-Class Career Achievement Spotlight */}
      {achievements.length > 0 && (
        <div className="achievement-spotlight-card animate-in">
          <div className="achievement-spotlight-inner">
            <div>
              <div className="achievement-badge-pill">
                <span style={{ width: 14, height: 14, display: 'inline-flex' }}>{icons.star}</span>
                {achievements[0].importance ? `${achievements[0].importance.toUpperCase()} IMPACT` : 'CAREER MILESTONE'}
              </div>

              <h2 className="achievement-title-text">{achievements[0].title}</h2>

              {achievements[0].description && (
                <p className="achievement-desc-text">{achievements[0].description}</p>
              )}

              {achievements[0].impact && (
                <div style={{
                  background: 'var(--bg-elevated)',
                  borderLeft: '3px solid var(--amber)',
                  borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                  padding: '10px 16px',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-primary)',
                  maxWidth: 680,
                  marginTop: 12
                }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--amber)', textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)', fontWeight: 700, marginBottom: 2 }}>
                    Documented Business & Team Impact
                  </div>
                  <div>{achievements[0].impact}</div>
                </div>
              )}
            </div>

            <div className="achievement-metrics-grid">
              <div className="achievement-metric-tile">
                <span className="metric-val-highlight">100%</span>
                <span className="metric-label-mono">Verified</span>
              </div>
              <div className="achievement-metric-tile">
                <span className="metric-val-highlight" style={{ color: 'var(--amber)' }}>
                  {achievements[0].importance ? achievements[0].importance.toUpperCase() : 'HIGH'}
                </span>
                <span className="metric-label-mono">Priority</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bento Grid: Contribution Breakdown */}
      <div className="bento-contribution-grid">
        {/* Execution Details (8-col) */}
        <div className="bento-card bento-execution" style={{ borderLeft: '4px solid var(--burgundy)' }}>
          <div className="bento-card-header">
            <span className="bento-header-title">
              <span style={{ color: 'var(--burgundy)', width: 16, height: 16, display: 'inline-flex' }}>
                {icons.bolt}
              </span>
              Execution & Contributions
            </span>
            <span className="bento-header-tag">Core Work</span>
          </div>

          <div className="execution-content">
            {journal.did_today || (
              <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                No execution details provided for this entry.
              </span>
            )}
          </div>
        </div>

        {/* Column for Growth (Learnings) & Friction (Blockers) (4-col) */}
        <div className="bento-sidebar-col">
          {/* Key Learnings */}
          <div className="bento-card growth-card">
            <div className="bento-card-header">
              <span className="bento-header-title">
                <span style={{ color: 'var(--teal-muted)', width: 16, height: 16, display: 'inline-flex' }}>
                  {icons.lightbulb}
                </span>
                Growth & Learnings
              </span>
              <span className="bento-header-tag">Retention</span>
            </div>
            <div style={{ fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)', color: 'var(--text-secondary)' }}>
              {journal.learned_today || 'No new learnings documented for this entry.'}
            </div>
          </div>

          {/* Friction & Impediments */}
          <div className="bento-card friction-card">
            <div className="bento-card-header">
              <span className="bento-header-title" style={{ color: 'var(--rose-dusty)' }}>
                <span style={{ color: 'var(--rose-dusty)', width: 16, height: 16, display: 'inline-flex' }}>
                  {icons.warning}
                </span>
                Friction & Blockers
              </span>
              <span className="bento-header-tag">Impediments</span>
            </div>
            <div style={{ fontSize: 'var(--text-sm)', lineHeight: 'var(--leading-relaxed)', color: 'var(--text-secondary)' }}>
              {journal.blockers || 'Zero blockers recorded. Smooth execution.'}
            </div>
          </div>
        </div>

        {/* Forward Horizon & Momentum (12-col Full Width) */}
        <div className="bento-card bento-momentum">
          <div className="bento-card-header">
            <span className="bento-header-title" style={{ color: 'var(--sage)' }}>
              <span style={{ color: 'var(--sage)', width: 16, height: 16, display: 'inline-flex' }}>
                {icons.rocket}
              </span>
              Momentum & Forward Horizon
            </span>
            <span className="bento-header-tag">Next Trajectory</span>
          </div>
          <div style={{ fontSize: 'var(--text-base)', lineHeight: 'var(--leading-relaxed)', color: 'var(--text-primary)' }}>
            {journal.next_plan || 'Ready for next sprint priorities.'}
          </div>
        </div>
      </div>

      {/* Evidence Vault */}
      {attachments.length > 0 && (
        <div className="evidence-vault-section">
          <div className="evidence-vault-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 18, height: 18, display: 'inline-flex', color: 'var(--accent)' }}>
                {icons.folder}
              </span>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text-primary)' }}>
                Evidence Vault
              </h3>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-secondary)' }}>
              {attachments.length} Verified Artifacts
            </span>
          </div>

          <div className="evidence-grid">
            {attachments.map((att, idx) => (
              <button 
                type="button" 
                key={att.id || idx}
                className="evidence-tile-btn"
                onClick={() => setActiveImageIndex(idx)}
                title="Click to view full size"
                aria-label={`View full size evidence attachment ${idx + 1}`}
              >
                <img 
                  src={`/api/files/${att.thumbnail_path || att.storage_key}`} 
                  onError={(e) => {
                    if (att.storage_key && !e.currentTarget.dataset.retried) {
                      e.currentTarget.dataset.retried = 'true';
                      e.currentTarget.src = `/api/files/${encodeURIComponent(att.storage_key).replace(/%2F/g, '/')}`;
                    }
                  }}
                  alt={`Evidence attachment ${idx + 1}`}
                  loading="lazy" 
                />
                <div className="evidence-tile-caption">
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {att.file_name || `artifact_${idx + 1}.jpg`}
                  </span>
                  <span style={{ width: 14, height: 14, display: 'inline-flex' }}>
                    {icons.zoom}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ready-to-use Standup & Performance Review Snippet */}
      <div className="standup-quote-dossier">
        <div className="standup-quote-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 16, height: 16, display: 'inline-flex', color: 'var(--text-secondary)' }}>
              {icons.copy}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 'var(--tracking-wider)', color: 'var(--text-primary)' }}>
              Ready-to-use Standup & Performance Review Snippet
            </span>
          </div>

          <button 
            type="button" 
            className="action-btn-ghost" 
            onClick={handleCopySnippet}
            title="Copy formatted markdown to clipboard"
          >
            <span style={{ width: 12, height: 12, display: 'inline-flex' }}>
              {copied ? icons.check : icons.copy}
            </span>
            <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
          </button>
        </div>

        <div className="standup-quote-body">
          {formattedSnippet}
        </div>
      </div>

      {/* Chronological Navigation Rail */}
      <div className="chronological-rail">
        {prevJournal ? (
          <Link to={`/journals/${prevJournal.id}`} className="rail-card">
            <span className="rail-dir-label">← PREVIOUS ENTRY</span>
            <span className="rail-title-text">{prevJournal.title || 'Untitled Entry'}</span>
          </Link>
        ) : (
          <div style={{ flex: 1 }} />
        )}

        <Link to="/journals" className="action-btn-ghost" style={{ alignSelf: 'center' }}>
          View All Archive Entries
        </Link>

        {nextJournal ? (
          <Link to={`/journals/${nextJournal.id}`} className="rail-card" style={{ textAlign: 'right', marginLeft: 'auto' }}>
            <span className="rail-dir-label">NEXT ENTRY →</span>
            <span className="rail-title-text">{nextJournal.title || 'Untitled Entry'}</span>
          </Link>
        ) : (
          <div style={{ flex: 1 }} />
        )}
      </div>

      {/* Lightbox Modal via Portal */}
      {activeImageIndex !== null && attachments[activeImageIndex] && typeof document !== 'undefined' && createPortal(
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
                <span className="lightbox-icon">{icons.folder}</span>
                <span className="lightbox-filename">
                  {attachments[activeImageIndex].file_name || `artifact_${activeImageIndex + 1}.jpg`}
                </span>
                <span className="lightbox-counter-pill">
                  {activeImageIndex + 1} / {attachments.length}
                </span>
              </div>

              <div className="lightbox-actions">
                <a
                  href={`/api/files/${attachments[activeImageIndex].storage_key}`}
                  target="_blank"
                  rel="noreferrer"
                  className="action-btn-ghost lightbox-btn"
                  download
                  title="Download or view raw file"
                >
                  <span>Open Original ↗</span>
                </a>
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
              {attachments.length > 1 && (
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
                  key={attachments[activeImageIndex].id || activeImageIndex}
                  src={`/api/files/${attachments[activeImageIndex].storage_key}`}
                  onError={(e) => {
                    if (attachments[activeImageIndex]?.storage_key && !e.currentTarget.dataset.retried) {
                      e.currentTarget.dataset.retried = 'true';
                      e.currentTarget.src = `/api/files/${encodeURIComponent(attachments[activeImageIndex].storage_key).replace(/%2F/g, '/')}`;
                    }
                  }}
                  alt={`Evidence attachment ${activeImageIndex + 1}`}
                  className="lightbox-img"
                />
              </div>

              {attachments.length > 1 && (
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
            {attachments.length > 1 && (
              <div className="lightbox-filmstrip-bar">
                <div className="lightbox-filmstrip">
                  {attachments.map((att, idx) => (
                    <button
                      key={att.id || idx}
                      type="button"
                      className={`lightbox-thumb-btn ${idx === activeImageIndex ? 'active' : ''}`}
                      onClick={() => setActiveImageIndex(idx)}
                      title={`Jump to artifact ${idx + 1}`}
                    >
                      <img
                        src={`/api/files/${att.thumbnail_path || att.storage_key}`}
                        onError={(e) => {
                          if (att.storage_key && !e.currentTarget.dataset.retried) {
                            e.currentTarget.dataset.retried = 'true';
                            e.currentTarget.src = `/api/files/${encodeURIComponent(att.storage_key).replace(/%2F/g, '/')}`;
                          }
                        }}
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

      {/* Toast Notification */}
      {copied && (
        <div className="toast-notice">
          <span style={{ width: 16, height: 16, display: 'inline-flex' }}>{icons.check}</span>
          <span>Dossier snippet copied! Ready for standup, 1-on-1, or review notes.</span>
        </div>
      )}

      {/* Delete Confirmation Modal via Portal */}
      {showDeleteConfirm && typeof document !== 'undefined' && createPortal(
        <div 
          className="stitch-lightbox-overlay" 
          onClick={() => !isDeleting && setShowDeleteConfirm(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Confirm Deletion"
        >
          <div 
            className="delete-confirm-window" 
            onClick={e => e.stopPropagation()}
          >
            <div className="delete-confirm-header">
              <span className="delete-confirm-icon">{icons.warning}</span>
              <h3>Delete Work Record?</h3>
            </div>
            
            <div className="delete-confirm-body">
              <p>You are about to permanently remove this entry from your executive archive.</p>
              <div className="delete-confirm-preview">
                <strong>{journal.title || 'Untitled'}</strong>
                <span>{formatDateFull(journal.entry_date)}</span>
              </div>
              <p className="delete-confirm-warn">This action cannot be undone.</p>
            </div>
            
            <div className="delete-confirm-actions">
              <button 
                type="button" 
                className="action-btn-ghost" 
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="action-btn-danger" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete Entry'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
