import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import '../styles/Pages.css';
import '../styles/Dashboard.css';
import { CATEGORIES } from '../lib/constants';
import { formatDate, formatDateFull, formatTimestamp } from '../lib/dateUtils';
import ImportanceBadge from '../components/ui/ImportanceBadge';



function Heatmap({ entries = [] }) {
  // Generate last 91 days (13 weeks)
  const cells = useMemo(() => {
    const days = [];
    const today = new Date();
    const countMap = {};

    entries.forEach(e => {
      const d = e.entry_date?.split('T')[0];
      if (d) countMap[d] = (countMap[d] || 0) + 1;
    });

    for (let i = 90; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const count = countMap[key] || 0;
      let level = '';
      if (count === 1) level = 'l1';
      else if (count === 2) level = 'l2';
      else if (count === 3) level = 'l3';
      else if (count >= 4) level = 'l4';
      days.push({ key, count, level });
    }
    return days;
  }, [entries]);

  return (
    <div className="heatmap" role="img" aria-label="Activity heatmap showing journal entries over the last 91 days">
      {cells.map(c => (
        <div
          key={c.key}
          className={`heatmap-cell ${c.level ? `heatmap-cell--${c.level}` : ''}`}
          title={`${c.key}: ${c.count} entries`}
        />
      ))}
    </div>
  );
}



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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [jRes, aRes] = await Promise.allSettled([
          api.searchJournals({ limit: 50 }),
          api.listAchievements({ limit: 20 }),
        ]);
        if (jRes.status === 'fulfilled') setJournals(jRes.value.journals || []);
        if (aRes.status === 'fulfilled') setAchievements(aRes.value.achievements || []);
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

  // Calculate streak
  const streak = useMemo(() => {
    const dates = new Set(journals.map(j => j.entry_date?.split('T')[0]));
    let count = 0;
    const d = new Date(today);
    // Check if today has entry, if not start from yesterday
    const todayKey = d.toISOString().split('T')[0];
    if (!dates.has(todayKey)) {
      d.setDate(d.getDate() - 1);
    }
    while (true) {
      const key = d.toISOString().split('T')[0];
      if (dates.has(key)) {
        count++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return count;
  }, [journals, today]);

  const recentEntries = journals.slice(0, 7);
  const topAchievements = achievements
    .sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      return (order[a.importance] ?? 2) - (order[b.importance] ?? 2);
    })
    .slice(0, 3);

  const totalEntries = journals.length;
  const totalAchievements = achievements.length;

  if (loading) {
    return <div className="loading">Loading your record…</div>;
  }

  return (
    <div className="animate-in">
      {/* Greeting */}
      <div className="dash-greeting">
        <div>
          <div className="dash-greeting-text">{getGreeting()}, {firstName}.</div>
          {totalEntries > 0 && (
            <div className="dash-hero-metric">
              You've documented <strong>{totalEntries}</strong> {totalEntries === 1 ? 'entry' : 'entries'} with{' '}
              <strong>{totalAchievements}</strong> {totalAchievements === 1 ? 'achievement' : 'achievements'}.
            </div>
          )}
        </div>
        <div className="dash-greeting-date">{formatDateFull(today)}</div>
      </div>

      {/* Main grid */}
      <div className="dash-grid">
        {/* Left column */}
        <div>
          {/* Today CTA */}
          <Link to="/journals/new" className="dash-today">
            <div className="dash-today-prompt">Write today's entry</div>
            <div className="dash-today-sub">What did you work on today?</div>
          </Link>

          {/* Recent entries */}
          <div style={{ marginTop: 'var(--space-6)' }}>
            <div className="section-header" style={{ marginTop: 32 }}>
              <span className="section-title">Recent Entries</span>
              <Link to="/journals" className="section-link">View all →</Link>
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
                {recentEntries.map(j => (
                  <Link key={j.id} to={`/journals/${j.id}/edit`} className="dash-recent-item">
                    <span className="dash-recent-date">{formatDate(j.entry_date)}</span>
                    {j.created_at && (
                      <span className="dash-recent-time">{formatTimestamp(j.created_at)}</span>
                    )}
                    <span className="dash-recent-title">{j.title || 'Untitled'}</span>
                    <span className={`cat-pill cat-pill--${j.category || 'general'}`} style={{ marginLeft: 'auto' }}>
                      {CATEGORIES[j.category] || j.category}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div>
          {/* Stats */}
          <div className="dash-sidebar-section">
            <div className="section-header">
              <span className="section-title">Your Record</span>
            </div>
            <div className="dash-record-grid animate-stagger">
              <div className="stat-card">
                <div className="stat-number">{totalEntries}</div>
                <div className="stat-label">Entries</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{totalAchievements}</div>
                <div className="stat-label">Achievements</div>
              </div>
            </div>
            {streak > 0 && (
              <div className="dash-streak">
                <span className="dash-streak-icon">🔥</span>
                {streak}-day active streak
              </div>
            )}
          </div>

          {/* Activity */}
          <div className="dash-sidebar-section">
            <div className="section-header">
              <span className="section-title">Activity</span>
            </div>
            <Heatmap entries={journals} />
          </div>
        </div>
      </div>

      {/* Achievement Highlights */}
      {topAchievements.length > 0 && (
        <div>
          <div className="section-header">
            <span className="section-title">Achievement Highlights</span>
            <Link to="/achievements" className="section-link">View all →</Link>
          </div>
          <div className="dash-achievements-row animate-stagger">
            {topAchievements.map(a => (
              <div key={a.id} className={`dash-achievement-card dash-achievement-card--${a.importance || 'medium'}`}>
                <div className="dash-achievement-imp">
                  <ImportanceBadge level={a.importance || 'medium'} />
                </div>
                <div className="dash-achievement-title">{a.title}</div>
                <div className="dash-achievement-date">{formatDate(a.achieved_date || a.created_at)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
