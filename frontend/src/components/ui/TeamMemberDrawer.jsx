import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { formatDate } from '../../lib/dateUtils';
import ImportanceBadge from './ImportanceBadge';
import FoundationWorkCard from './FoundationWorkCard';
import '../../styles/TeamMemberDrawer.css';

export default function TeamMemberDrawer({ member, recentAchievements = [], onClose, periodLabel = "All Time" }) {
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

  if (!member) return null;

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  const memberAchievements = recentAchievements.filter(a => a.user_id === member.id);

  // Fake journal entries prop to render FoundationWorkCard in compact mode
  // The actual numbers are passed directly into a mock "metrics" if FoundationWorkCard requires it, 
  // or we can pass a dummy journals array that would yield the right stats.
  // Actually, FoundationWorkCard expects an array of journals to calculate metrics.
  // Since we only have the summary stats here, we will render a custom inline balance bar instead.
  // We'll just build a small visual inline.

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

          {/* 4. Achievements */}
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
          
          <div className="member-drawer-footer-meta">
            Last documented: {member.last_entry_date ? formatDate(member.last_entry_date) : 'Never'}
          </div>

        </div>
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
