import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import '../styles/Pages.css';
import '../styles/Dashboard.css';
import { CATEGORIES } from '../lib/constants';
import { formatDate, formatDateFull, formatLocalDate } from '../lib/dateUtils';
import ImportanceBadge from '../components/ui/ImportanceBadge';
import ActivityCalendar from '../components/ui/ActivityCalendar';
import TalkingPointsModal from '../components/ui/TalkingPointsModal';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [journals, setJournals] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [activeKPI, setActiveKPI] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTalkingPointsOpen, setIsTalkingPointsOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [jRes, aRes, kpiRes] = await Promise.allSettled([
          api.searchJournals({ limit: 50 }),
          api.listAchievements({ limit: 20 }),
          api.getActiveKPIPeriod(),
        ]);
        if (jRes.status === 'fulfilled') setJournals(jRes.value.journals || []);
        if (aRes.status === 'fulfilled') setAchievements(aRes.value.achievements || []);
        if (kpiRes.status === 'fulfilled' && kpiRes.value?.active_kpi_period) {
          setActiveKPI(kpiRes.value.active_kpi_period);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const today = useMemo(() => new Date(), []);
  const firstName = user?.name?.split(' ')[0] || 'there';

  // Total counts
  const totalEntries = journals.length;
  const totalAchievements = achievements.length;

  // Active KPI specific metrics
  const activeKPIEntriesCount = useMemo(() => {
    if (!activeKPI) return 0;
    return journals.filter(j => {
      if (j.kpi_period_id && j.kpi_period_id === activeKPI.id) return true;
      if (j.entry_date && activeKPI.start_date && activeKPI.end_date) {
        const d = j.entry_date.split('T')[0];
        return d >= activeKPI.start_date && d <= activeKPI.end_date;
      }
      return false;
    }).length;
  }, [journals, activeKPI]);

  const cycleDaysRemaining = useMemo(() => {
    if (!activeKPI?.end_date) return null;
    const end = new Date(activeKPI.end_date);
    const diffMs = end - today;
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [activeKPI, today]);

  // Achievement metrics & sorting
  const criticalCount = useMemo(() => achievements.filter(a => a.importance === 'critical').length, [achievements]);
  const highCount = useMemo(() => achievements.filter(a => a.importance === 'high').length, [achievements]);

  const topAchievements = useMemo(() => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...achievements]
      .sort((a, b) => (order[a.importance] ?? 2) - (order[b.importance] ?? 2))
      .slice(0, 3);
  }, [achievements]);

  // Set of journal IDs that serve as evidence for achievements
  const linkedJournalIds = useMemo(() => {
    const set = new Set();
    achievements.forEach(a => {
      if (a.journal_id) set.add(a.journal_id);
      if (Array.isArray(a.linked_journals)) {
        a.linked_journals.forEach(j => set.add(j.id));
      }
    });
    return set;
  }, [achievements]);

  // Foundation / Invisible Work metrics (Maintenance, Incident triage, Meetings/Postmortems, Debugging)
  const foundationEntriesCount = useMemo(() => {
    return journals.filter(j => ['maintenance', 'meeting', 'other', 'debugging'].includes(j.category)).length;
  }, [journals]);

  const iwqPercentage = useMemo(() => {
    if (totalEntries === 0) return 0;
    return Math.round((foundationEntriesCount / totalEntries) * 100);
  }, [totalEntries, foundationEntriesCount]);

  // Activity & Logging Pace (grounded, non-pretentious terms)
  const activeDaysCount = useMemo(() => {
    const dates = new Set(
      journals
        .map(j => {
          if (!j.entry_date) return null;
          return j.entry_date.includes('T') ? formatLocalDate(new Date(j.entry_date)) : j.entry_date.split(' ')[0];
        })
        .filter(Boolean)
    );
    return dates.size;
  }, [journals]);

  const weeklyPace = useMemo(() => {
    if (journals.length === 0) return '0 / wk';
    const dates = journals
      .map(j => j.entry_date ? new Date(j.entry_date).getTime() : null)
      .filter(Boolean)
      .sort((a, b) => a - b);
    if (dates.length <= 1) return `${journals.length} / wk`;
    const spanWeeks = Math.max(1, (dates[dates.length - 1] - dates[0]) / (7 * 24 * 3600 * 1000));
    const pace = (journals.length / spanWeeks).toFixed(1);
    return `${pace} / wk`;
  }, [journals]);

  const recentEntries = journals.slice(0, 7);

  if (loading) {
    return <div className="loading">Loading your record…</div>;
  }

  return (
    <div className="animate-in dash-container">
      {/* 1. Masthead Header */}
      <header className="dash-masthead">
        <div className="dash-masthead-intro">
          <h1 className="dash-greeting-text">{getGreeting()}, {firstName}.</h1>
          <div className="dash-masthead-meta">
            {activeKPI ? (
              <Link to="/review" className="dash-kpi-badge" title="View active review cycle evidence">
                <span className="dash-kpi-dot active" />
                <span className="dash-kpi-label">Active Cycle: <strong>{activeKPI.name}</strong></span>
                <span className="dash-kpi-dates">({activeKPI.start_date} – {activeKPI.end_date})</span>
                <span className="dash-kpi-action">Review Cycle →</span>
              </Link>
            ) : (
              <span className="dash-masthead-sub">Personal Career Archive & Work Journal</span>
            )}
          </div>
        </div>

        <div className="dash-masthead-actions">
          <div className="dash-masthead-date">{formatDateFull(today)}</div>
          <div className="dash-actions-group">
            <button
              id="btn-open-talking-points"
              type="button"
              className="btn btn--secondary btn--sm dash-action-btn"
              onClick={() => setIsTalkingPointsOpen(true)}
            >
              <span>1-on-1 Talking Points</span>
            </button>
            <Link to="/journals/new" className="btn btn--primary btn--sm dash-action-btn">
              <span>+ New Entry</span>
            </Link>
          </div>
        </div>
      </header>

      <TalkingPointsModal
        isOpen={isTalkingPointsOpen}
        onClose={() => setIsTalkingPointsOpen(false)}
        user={user}
        journals={journals}
        achievements={achievements}
      />

      {/* 2. Executive Pulse Strip (4 Balanced Metric Cards) */}
      <section className="dash-pulse-strip animate-stagger" aria-label="Career Summary Metrics">
        <div className="dash-pulse-card">
          <div className="dash-pulse-val">{totalEntries}</div>
          <div className="dash-pulse-label">Documented Entries</div>
          <div className="dash-pulse-sub">
            {activeKPIEntriesCount > 0 ? `${activeKPIEntriesCount} in ${activeKPI.name}` : 'Across all cycles'}
          </div>
        </div>

        <div className="dash-pulse-card">
          <div className="dash-pulse-val">{totalAchievements}</div>
          <div className="dash-pulse-label">Key Milestones</div>
          <div className="dash-pulse-sub">
            {criticalCount} Critical{highCount > 0 ? ` • ${highCount} High Impact` : ''}
          </div>
        </div>

        <div className="dash-pulse-card">
          <div className="dash-pulse-val">{iwqPercentage}%</div>
          <div className="dash-pulse-label">Foundation Work</div>
          <div className="dash-pulse-sub">
            {foundationEntriesCount} entries in maintenance, triage & debt
          </div>
        </div>

        <div className="dash-pulse-card">
          <div className="dash-pulse-val">{weeklyPace}</div>
          <div className="dash-pulse-label">Logging Pace</div>
          <div className="dash-pulse-sub">
            {activeDaysCount} active days recorded
          </div>
        </div>
      </section>

      {/* 3. Main Split Layout: 65% Main Workstream / 35% Executive Spotlight */}
      <div className="dash-main-layout">
        {/* Left / Primary Workstream */}
        <main className="dash-main-col">
          {/* Activity & Evidence Landscape (Full horizontal breathing room) */}
          <section className="dash-section dash-calendar-box" aria-label="Activity Calendar">
            <ActivityCalendar
              journals={journals}
              achievements={achievements}
              compact={false}
              title="Activity & Contributions"
              kpiPeriod={activeKPI}
            />
          </section>

          {/* Streamlined Quick Capture Prompt */}
          <Link to="/journals/new" className="dash-quick-capture" title="Click to log today's work">
            <div className="dash-quick-capture-content">
              <span className="dash-quick-capture-icon">✍️</span>
              <div className="dash-quick-capture-text">
                <span className="dash-quick-capture-title">Document today's contribution</span>
                <span className="dash-quick-capture-hint">Record what you solved, learned, or unblocked today</span>
              </div>
            </div>
            <span className="dash-quick-capture-btn">+ New Entry</span>
          </Link>

          {/* Recent Evidence Stream */}
          <section className="dash-section">
            <div className="section-header">
              <span className="section-title">Recent Journal Entries</span>
              <Link to="/journals" className="section-link">View all {totalEntries} entries →</Link>
            </div>

            {recentEntries.length === 0 ? (
              <div className="empty-state" style={{ padding: '48px 16px' }}>
                <div className="empty-state-title">No entries yet</div>
                <div className="empty-state-desc">
                  Start documenting your work. Every entry builds your professional record.
                </div>
              </div>
            ) : (
              <div className="dash-recent-list animate-stagger">
                {recentEntries.map(j => {
                  const isLinked = linkedJournalIds.has(j.id);
                  return (
                    <Link key={j.id} to={`/journals/${j.id}`} className="dash-recent-item">
                      <span className="dash-recent-date">{formatDate(j.entry_date)}</span>
                      <span className="dash-recent-title">{j.title || 'Untitled'}</span>
                      {isLinked && (
                        <span className="dash-evidence-anchor" title="Linked as supporting evidence for a milestone achievement">
                          ⚓ Milestone Link
                        </span>
                      )}
                      <span className={`cat-pill cat-pill--${j.category || 'general'}`} style={{ marginLeft: isLinked ? 8 : 'auto' }}>
                        {CATEGORIES[j.category] || j.category}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </main>

        {/* Right / Executive Spotlight Rail */}
        <aside className="dash-side-col">
          {/* Target Cycle Card */}
          {activeKPI && (
            <div className="dash-side-card dash-cycle-card">
              <div className="dash-side-card-header">
                <span className="dash-card-tag">Active Review Cycle</span>
                <span className="dash-kpi-dot active" />
              </div>
              <div className="dash-cycle-name">{activeKPI.name}</div>
              <div className="dash-cycle-dates">{activeKPI.start_date} – {activeKPI.end_date}</div>
              <p className="dash-cycle-desc">
                {cycleDaysRemaining !== null && cycleDaysRemaining > 0
                  ? `${cycleDaysRemaining} days remaining in this cycle.`
                  : 'Active appraisal cycle.'}{' '}
                {activeKPIEntriesCount} contributions linked to this period.
              </p>
              <div className="dash-cycle-actions">
                <Link to="/review" className="btn btn--secondary btn--sm dash-cycle-btn">
                  Open Review Pack →
                </Link>
              </div>
            </div>
          )}

          {/* Milestone Achievements Spotlight */}
          <div className="dash-side-card">
            <div className="dash-side-card-header">
              <span className="dash-card-tag">Milestone Anchors</span>
              <Link to="/achievements" className="section-link" style={{ fontSize: 'var(--text-xs)' }}>
                View all ({totalAchievements}) →
              </Link>
            </div>

            {topAchievements.length === 0 ? (
              <div className="empty-state" style={{ padding: '24px 12px' }}>
                <div className="empty-state-title" style={{ fontSize: 'var(--text-sm)' }}>No milestones yet</div>
                <div className="empty-state-desc" style={{ fontSize: 'var(--text-xs)' }}>
                  Create your first achievement milestone to anchor career evidence.
                </div>
              </div>
            ) : (
              <div className="dash-spotlight-list">
                {topAchievements.map(a => {
                  const linkedCount = (a.linked_journals && a.linked_journals.length) || (a.journal_id ? 1 : 0);
                  return (
                    <Link key={a.id} to="/achievements" className={`dash-spotlight-item dash-spotlight-item--${a.importance || 'medium'}`}>
                      <div className="dash-spotlight-item-header">
                        <ImportanceBadge level={a.importance || 'medium'} />
                        <span className="dash-spotlight-date">{formatDate(a.achieved_date || a.created_at)}</span>
                      </div>
                      <div className="dash-spotlight-title">{a.title}</div>
                      {linkedCount > 0 && (
                        <div className="dash-spotlight-dossier">
                          <span className="dash-dossier-pill">
                            ⚓ {linkedCount} linked {linkedCount === 1 ? 'entry' : 'entries'}
                          </span>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Work Distribution (Visible vs Foundation Work) */}
          <div className="dash-side-card">
            <div className="dash-side-card-header">
              <span className="dash-card-tag">Work Distribution</span>
              <span className="dash-work-ratio">{iwqPercentage}% Foundation</span>
            </div>
            <div className="dash-ratio-bar" title={`${100 - iwqPercentage}% Feature Delivery, ${iwqPercentage}% Foundation Work`}>
              <div
                className="dash-ratio-fill dash-ratio-fill--feature"
                style={{ width: `${Math.max(4, 100 - iwqPercentage)}%` }}
              />
              <div
                className="dash-ratio-fill dash-ratio-fill--foundation"
                style={{ width: `${Math.max(4, iwqPercentage)}%` }}
              />
            </div>
            <div className="dash-ratio-legend">
              <div className="dash-legend-item">
                <span className="dash-legend-dot dash-legend-dot--feature" />
                <span>Feature Delivery ({100 - iwqPercentage}%)</span>
              </div>
              <div className="dash-legend-item">
                <span className="dash-legend-dot dash-legend-dot--foundation" />
                <span>Foundation Work ({iwqPercentage}%)</span>
              </div>
            </div>
            <p className="dash-ratio-note">
              Captures essential refactoring, incident triage, and technical debt clearance alongside product features.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

