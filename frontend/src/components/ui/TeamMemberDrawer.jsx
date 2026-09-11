import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { formatDate } from '../../lib/dateUtils';
import { api } from '../../api';
import ImportanceBadge from './ImportanceBadge';
import '../../styles/TeamMemberDrawer.css';

export default function TeamMemberDrawer({
  member,
  recentAchievements = [],
  recentJournals = [],
  onClose,
  periodLabel = "All Time",
  kpiPeriodId = null,
  initialNote = '',
}) {
  const [noteText, setNoteText] = useState(initialNote);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const saveTimeoutRef = useRef(null);
  const lastSavedRef = useRef(initialNote);

  // Sync initialNote when member/period changes
  useEffect(() => {
    setNoteText(initialNote);
    lastSavedRef.current = initialNote;
    setNoteSaved(false);
  }, [initialNote]);

  // Lock body scroll when drawer is open (AGENTS.md invariant)
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Cleanup pending save timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const saveNote = useCallback(async (text) => {
    if (text === lastSavedRef.current) return;
    if (!text.trim() && !lastSavedRef.current.trim()) return;

    setNoteSaving(true);
    try {
      await api.upsertCalibrationNote({
        target_user_id: member.id,
        kpi_period_id: kpiPeriodId || undefined,
        note: text.trim(),
      });
      lastSavedRef.current = text;
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save calibration note:', err);
    } finally {
      setNoteSaving(false);
    }
  }, [member.id, kpiPeriodId]);

  const handleNoteChange = (e) => {
    const text = e.target.value;
    setNoteText(text);
    setNoteSaved(false);

    // Debounced auto-save (1.5s after last keystroke)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveNote(text), 1500);
  };

  const handleNoteBlur = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveNote(noteText);
  };

  if (!member) return null;

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const memberAchievements = recentAchievements.filter(a => a.user_id === member.id);
  const memberJournals = recentJournals.filter(j => j.user_id === member.id).slice(0, 5);

  const drawerContent = (
    <div className="drawer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="drawer-content animate-slide-in-right" onClick={e => e.stopPropagation()}>
        
        <header className="drawer-header">
          <div className="drawer-header-left">
            <button className="drawer-close-btn" onClick={onClose} aria-label="Close drawer">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <span className="drawer-title">Member Calibration</span>
          </div>
        </header>

        <div className="drawer-body">
          {/* 1. Member Ident */}
          <div className="member-drawer-ident">
            <div className="member-drawer-avatar">{getInitials(member.name)}</div>
            <div className="member-drawer-info">
              <div className="member-drawer-name">{member.name}</div>
              <div className="member-drawer-email">{member.email}</div>
              <div style={{ marginTop: 6 }}>
                <span className={`team-role-pill team-role-pill--${member.role}`}>{member.role}</span>
              </div>
            </div>
          </div>

          <div className="member-drawer-period">
            Showing metrics for: <strong>{periodLabel}</strong>
          </div>

          {/* 2. Stats Grid */}
          <div className="member-drawer-stats">
            <div className="drawer-stat-card">
              <div className="drawer-stat-val">{member.total_journals}</div>
              <div className="drawer-stat-lbl">Entries</div>
            </div>
            <div className="drawer-stat-card">
              <div className="drawer-stat-val">{member.active_days}</div>
              <div className="drawer-stat-lbl">Active Days</div>
            </div>
            <div className="drawer-stat-card">
              <div className="drawer-stat-val">{member.total_achievements}</div>
              <div className="drawer-stat-lbl">Achievements</div>
            </div>
          </div>

          {/* 3. IWQ Section */}
          <div className="member-drawer-section">
            <h3 className="drawer-section-title" style={{ display: 'flex', alignItems: 'center' }}>
              Invisible Work Quotient
              <span
                style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 6 }}
                data-tooltip="Invisible Work Quotient (IWQ):&#10;Percentage of work dedicated to foundation, maintenance, and team enablement (e.g., refactoring, code reviews, incident triage). Ensures invisible work is visible during performance reviews."
              >
                <svg style={{ opacity: 0.7, cursor: 'help' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              </span>
            </h3>
            
            <div className="drawer-iwq-box">
              <div className="drawer-iwq-header">
                <span>{member.foundation_journals} Foundation Entries</span>
                <span className="drawer-iwq-pct">{member.iwq_percentage}%</span>
              </div>
              
              <div className="fw-ratio-track" style={{ height: 10, marginBottom: 8 }} title={`${100 - member.iwq_percentage}% Feature Execution, ${member.iwq_percentage}% Foundation Work`}>
                <div className="fw-ratio-segment fw-ratio-segment--feature" style={{ width: `${Math.max(2, 100 - member.iwq_percentage)}%` }} />
                <div className="fw-ratio-segment fw-ratio-segment--foundation" style={{ width: `${Math.max(2, member.iwq_percentage)}%` }} />
              </div>
              
              <div className="drawer-iwq-legend">
                <div className="drawer-iwq-legend-item">
                  <span className="drawer-iwq-dot" style={{ background: 'var(--color-feature, #3b82f6)' }} />
                  Feature Execution ({100 - member.iwq_percentage}%)
                </div>
                <div className="drawer-iwq-legend-item">
                  <span className="drawer-iwq-dot" style={{ background: 'var(--color-foundation, #fbbf24)' }} />
                  Foundation Work ({member.iwq_percentage}%)
                </div>
              </div>
            </div>
          </div>

          {/* 4. Calibration Note (Manager-Private) */}
          <div className="member-drawer-section">
            <div className="drawer-section-header">
              <h3 className="drawer-section-title" style={{ margin: 0 }}>Calibration Note</h3>
              <span className="drawer-note-status">
                {noteSaving ? (
                  <span className="drawer-note-saving">Saving…</span>
                ) : noteSaved ? (
                  <span className="drawer-note-saved">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    Saved
                  </span>
                ) : null}
              </span>
            </div>
            <textarea
              className="drawer-note-textarea"
              value={noteText}
              onChange={handleNoteChange}
              onBlur={handleNoteBlur}
              placeholder={`Private note about ${member.name}'s performance for this period…`}
              rows={4}
              aria-label={`Calibration note for ${member.name}`}
            />
            <div className="drawer-note-hint">
              Manager-private. Auto-saves after you stop typing. Scoped to the selected period.
            </div>
          </div>

          {/* 5. Achievements */}
          <div className="member-drawer-section">
            <div className="drawer-section-header">
              <h3 className="drawer-section-title">Key Achievements</h3>
            </div>
            
            {memberAchievements.length === 0 ? (
              <div className="drawer-empty">No achievements recorded in this period.</div>
            ) : (
              <div className="drawer-achievements">
                {memberAchievements.map(ach => (
                  <div key={ach.id} className="drawer-achievement-item">
                    <div className="drawer-achievement-top">
                      <ImportanceBadge level={ach.importance || 'medium'} />
                      <span className="drawer-achievement-date">{ach.achieved_date ? formatDate(ach.achieved_date) : ''}</span>
                    </div>
                    <div className="drawer-achievement-title">{ach.title}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 6. Recent Entries */}
          <div className="member-drawer-section">
            <div className="drawer-section-header">
              <h3 className="drawer-section-title">Recent Entries</h3>
            </div>
            
            {memberJournals.length === 0 ? (
              <div className="drawer-empty">No entries documented in this period.</div>
            ) : (
              <div className="drawer-achievements">
                {memberJournals.map(journal => (
                  <div key={journal.id} className="drawer-achievement-item">
                    <div className="drawer-achievement-top">
                      <span className="drawer-achievement-date">{journal.entry_date ? formatDate(journal.entry_date) : ''}</span>
                      {journal.category && (
                        <span className="team-role-pill" style={{ marginLeft: 'auto', opacity: 0.8, fontSize: '10px' }}>
                          {journal.category}
                        </span>
                      )}
                    </div>
                    <div className="drawer-achievement-title">{journal.title}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="member-drawer-footer-meta">
            Last documented: {member.last_entry_date ? formatDate(member.last_entry_date) : 'Never'}
          </div>

        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
