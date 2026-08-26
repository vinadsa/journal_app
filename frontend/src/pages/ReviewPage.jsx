import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import '../styles/Pages.css';
import { CATEGORIES } from '../lib/constants';
import { formatDate, getQuarter, getQuarterBounds, getQuarterLabel } from '../lib/dateUtils';
import ImportanceBadge from '../components/ui/ImportanceBadge';


export default function ReviewPage() {
  const [journals, setJournals] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const currentQ = getQuarter(today);
  const currentYear = today.getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedQ, setSelectedQ] = useState(currentQ);

  const { start: qStart, end: qEnd } = getQuarterBounds(selectedYear, selectedQ);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { start: qStart, end: qEnd } = getQuarterBounds(selectedYear, selectedQ);
        const dateFrom = qStart.toISOString().split('T')[0];
        const dateTo = qEnd.toISOString().split('T')[0];
        const [jRes, aRes] = await Promise.allSettled([
          api.searchJournals({ limit: 200, date_from: dateFrom, date_to: dateTo }),
          api.listAchievements({ limit: 100 }),
        ]);
        if (jRes.status === 'fulfilled') setJournals(jRes.value.journals || []);
        if (aRes.status === 'fulfilled') {
          // Filter achievements to quarter
          const achs = (aRes.value.achievements || []).filter(a => {
            const d = new Date(a.achieved_date || a.created_at);
            return d >= qStart && d <= qEnd;
          });
          setAchievements(achs);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [selectedYear, selectedQ]);

  // Stats
  const activeDays = useMemo(() => {
    const dates = new Set(journals.map(j => j.entry_date?.split('T')[0]));
    return dates.size;
  }, [journals]);

  const totalEntries = journals.length;
  const totalAchievements = achievements.length;

  // Category distribution
  const catDist = useMemo(() => {
    const counts = {};
    journals.forEach(j => {
      const cat = j.category || 'general';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const total = journals.length || 1;
    return Object.entries(counts)
      .map(([cat, count]) => ({ cat, count, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [journals]);

  const topCategory = catDist[0]?.cat || 'N/A';

  // Timeline — group achievements by month
  const timeline = useMemo(() => {
    const months = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    achievements.forEach(a => {
      const d = new Date(a.achieved_date || a.created_at);
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      if (!months[key]) months[key] = [];
      months[key].push(a);
    });
    return Object.entries(months);
  }, [achievements]);

  // Heatmap for quarter
  const heatmapCells = useMemo(() => {
    const cells = [];
    const countMap = {};
    journals.forEach(j => {
      const d = j.entry_date?.split('T')[0];
      if (d) countMap[d] = (countMap[d] || 0) + 1;
    });
    const d = new Date(qStart);
    while (d <= qEnd) {
      const key = d.toISOString().split('T')[0];
      const count = countMap[key] || 0;
      let level = '';
      if (count === 1) level = 'l1';
      else if (count === 2) level = 'l2';
      else if (count === 3) level = 'l3';
      else if (count >= 4) level = 'l4';
      cells.push({ key, count, level });
      d.setDate(d.getDate() + 1);
    }
    return cells;
  }, [journals, qStart, qEnd]);

  // Quarter options
  const quarterOptions = [];
  for (let y = currentYear; y >= currentYear - 2; y--) {
    for (let q = (y === currentYear ? currentQ : 4); q >= 1; q--) {
      quarterOptions.push({ year: y, quarter: q, label: getQuarterLabel(y, q) });
    }
  }

  if (loading) return <div className="loading">Loading review…</div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Review</h1>
        <p className="page-subtitle">Your evidence-based contribution record</p>
      </div>

      {/* Period selector */}
      <div className="filter-bar">
        <select
          className="filter-select"
          value={`${selectedYear}-${selectedQ}`}
          onChange={e => {
            const [y, q] = e.target.value.split('-').map(Number);
            setSelectedYear(y);
            setSelectedQ(q);
          }}
          style={{ minWidth: 220 }}
          aria-label="Select period"
        >
          {quarterOptions.map(o => (
            <option key={`${o.year}-${o.quarter}`} value={`${o.year}-${o.quarter}`}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Hero Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }} className="animate-stagger">
        <div className="stat-card">
          <div className="stat-number">{activeDays}</div>
          <div className="stat-label">Active Days</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{totalEntries}</div>
          <div className="stat-label">Journal Entries</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{totalAchievements}</div>
          <div className="stat-label">Achievements</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ fontSize: 'var(--text-sm)', lineHeight: '2.2' }}>
            {CATEGORIES[topCategory] || topCategory}
          </div>
          <div className="stat-label">Top Category</div>
        </div>
      </div>

      {/* Achievement Timeline */}
      {timeline.length > 0 && (
        <>
          <div className="section-header">
            <span className="section-title">Achievement Timeline</span>
          </div>
          <div className="timeline" style={{ marginBottom: 32 }}>
            {timeline.map(([month, achs]) => (
              <div key={month} className="timeline-month">
                <div className="timeline-month-label">{month}</div>
                {achs.map(a => (
                  <div key={a.id} className="timeline-item">
                    <span className="timeline-dot" />
                    <span className="timeline-item-title">{a.title}</span>
                    <ImportanceBadge level={a.importance} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Category Distribution */}
      {catDist.length > 0 && (
        <>
          <div className="section-header">
            <span className="section-title">Category Distribution</span>
          </div>
          <div style={{ marginBottom: 32 }}>
            {catDist.map(({ cat, pct }) => (
              <div key={cat} className="dist-row">
                <span className="dist-label">{CATEGORIES[cat] || cat}</span>
                <div className="dist-bar-track">
                  <div
                    className={`dist-bar-fill dist-bar-fill--${cat}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="dist-pct">{pct}%</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Key Achievements */}
      {achievements.length > 0 && (
        <>
          <div className="section-header">
            <span className="section-title">Key Achievements</span>
            <Link to="/achievements" className="section-link">View all →</Link>
          </div>
          <div className="animate-stagger">
            {achievements
              .sort((a, b) => {
                const order = { critical: 0, high: 1, medium: 2, low: 3 };
                return (order[a.importance] ?? 2) - (order[b.importance] ?? 2);
              })
              .slice(0, 5)
              .map(a => (
                <div key={a.id} className={`achievement-card achievement-card--${a.importance || 'medium'}`}>
                  <div className="achievement-header">
                    <ImportanceBadge level={a.importance || 'medium'} />
                    <span className="achievement-date">{formatDate(a.achieved_date || a.created_at)}</span>
                  </div>
                  <h3 className="achievement-title">{a.title}</h3>
                  {a.description && <p className="achievement-desc">{a.description}</p>}
                  {a.impact && (
                    <div className="achievement-impact">
                      <div className="achievement-impact-label">Impact</div>
                      {a.impact}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </>
      )}

      {/* Activity Calendar */}
      <div style={{ marginTop: 32 }}>
        <div className="section-header">
          <span className="section-title">Activity Calendar</span>
        </div>
        <div className="heatmap" role="img" aria-label="Activity calendar for selected period">
          {heatmapCells.map(c => (
            <div
              key={c.key}
              className={`heatmap-cell ${c.level ? `heatmap-cell--${c.level}` : ''}`}
              title={`${c.key}: ${c.count} entries`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
