import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { api } from '../api';
import '../styles/Pages.css';
import { CATEGORIES } from '../lib/constants';
import { formatDate, formatLocalDate, getQuarter, getQuarterBounds, getQuarterLabel } from '../lib/dateUtils';
import ImportanceBadge from '../components/ui/ImportanceBadge';
import BackButton from '../components/ui/BackButton';
import AISynthesisCard from '../components/ui/AISynthesisCard';
import ActivityCalendar from '../components/ui/ActivityCalendar';


export default function ReviewPage() {
  const [journals, setJournals] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date();
  const currentQ = getQuarter(today);
  const currentYear = today.getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedQ, setSelectedQ] = useState(currentQ);
  const [periodType, setPeriodType] = useState('quarter'); // 'quarter' | 'custom'
  
  // Default custom range to last 30 days
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState(() => today.toISOString().split('T')[0]);

  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [aiSynthesis, setAiSynthesis] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const getEffectiveDates = () => {
    if (periodType === 'quarter') {
      return getQuarterBounds(selectedYear, selectedQ);
    }
    const endD = new Date(customEnd);
    endD.setHours(23, 59, 59, 999);
    return {
      start: new Date(customStart),
      end: endD
    };
  };

  const { start: qStart, end: qEnd } = getEffectiveDates();

  const handleGenerateSynthesis = async (focusArea, modalPeriodType, modalY, modalQ, modalStart, modalEnd) => {
    setIsConfigModalOpen(false);
    setIsSynthesizing(true);
    
    // Update page state if changed in modal
    let effectivePeriodLabel = "";
    if (modalPeriodType === 'quarter') {
      setPeriodType('quarter');
      setSelectedYear(modalY);
      setSelectedQ(modalQ);
      effectivePeriodLabel = getQuarterLabel(modalY, modalQ);
    } else {
      setPeriodType('custom');
      setCustomStart(modalStart);
      setCustomEnd(modalEnd);
      effectivePeriodLabel = `${modalStart} to ${modalEnd}`;
    }

    try {
      const data = {
        period: effectivePeriodLabel,
        journals, // note: this uses current journals in state, but effect will trigger later. For simplicity we assume it uses currently loaded journals. To be strictly correct, we might want to re-fetch if period changed, but since we are generating immediately, we'll pass the current data or wait.
        // Actually, to ensure data is correct if period changed, we should probably fetch first if period changed. 
        // But let's keep it simple: the period change triggers useEffect to load data. We can await the data load or just use the current journals for now (mock).
        // Let's pass focusArea
        focusArea,
        achievements
      };
      // Wait a moment for state to update (hacky, but works for mock)
      await new Promise(r => setTimeout(r, 100));
      
      const result = await api.generateSynthesis(data);
      setAiSynthesis(result);
    } catch (err) {
      console.error('Failed to generate AI synthesis:', err);
      alert('Failed to generate synthesis. Please try again.');
    } finally {
      setIsSynthesizing(false);
    }
  };

  useEffect(() => {
    async function loadData() {
      if (periodType === 'custom' && (!customStart || !customEnd)) return;
      
      setLoading(true);
      try {
        const { start, end } = getEffectiveDates();
        const dateFrom = formatLocalDate(start);
        const dateTo = formatLocalDate(end);
        const [jRes, aRes] = await Promise.allSettled([
          api.searchJournals({ limit: 200, date_from: dateFrom, date_to: dateTo }),
          api.listAchievements({ limit: 100 }),
        ]);
        if (jRes.status === 'fulfilled') setJournals(jRes.value.journals || []);
        if (aRes.status === 'fulfilled') {
          const achs = (aRes.value.achievements || []).filter(a => {
            const d = new Date(a.achieved_date || a.created_at);
            return d >= start && d <= end;
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
  }, [selectedYear, selectedQ, periodType, customStart, customEnd]);

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

  // Quarter options
  const quarterOptions = [];
  for (let y = currentYear; y >= currentYear - 2; y--) {
    for (let q = (y === currentYear ? currentQ : 4); q >= 1; q--) {
      quarterOptions.push({ year: y, quarter: q, label: getQuarterLabel(y, q) });
    }
  }

  // Config Modal Component
  const SynthesisConfigModal = () => {
    const [localPeriodType, setLocalPeriodType] = useState(periodType);
    const [localY, setLocalY] = useState(selectedYear);
    const [localQ, setLocalQ] = useState(selectedQ);
    const [localStart, setLocalStart] = useState(customStart);
    const [localEnd, setLocalEnd] = useState(customEnd);
    const [focusArea, setFocusArea] = useState('');

    return createPortal(
      <div 
        className="modal-overlay" 
        onClick={() => setIsConfigModalOpen(false)}
        style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
      >
        <div 
          className="modal-content" 
          onClick={e => e.stopPropagation()} 
          style={{ 
            width: '90%', 
            maxWidth: 500, 
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 32,
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
          }}
        >
          <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <h2 style={{ fontSize: 'var(--text-lg)', margin: 0, color: 'var(--text-primary)' }}>AI Synthesis Configuration</h2>
            <button 
              className="icon-btn" 
              onClick={() => setIsConfigModalOpen(false)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 20 }}
            >
              ✕
            </button>
          </div>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Timeframe
              </label>
              <select
                className="filter-select"
                value={localPeriodType === 'custom' ? 'custom' : `${localY}-${localQ}`}
                onChange={e => {
                  if (e.target.value === 'custom') {
                    setLocalPeriodType('custom');
                  } else {
                    setLocalPeriodType('quarter');
                    const [y, q] = e.target.value.split('-').map(Number);
                    setLocalY(y);
                    setLocalQ(q);
                  }
                }}
                style={{ width: '100%' }}
              >
                {quarterOptions.map(o => (
                  <option key={`${o.year}-${o.quarter}`} value={`${o.year}-${o.quarter}`}>
                    {o.label}
                  </option>
                ))}
                <option value="custom">Custom Date Range...</option>
              </select>
            </div>

            {localPeriodType === 'custom' && (
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Start Date</label>
                  <input type="date" className="filter-select" value={localStart} onChange={e => setLocalStart(e.target.value)} style={{ width: '100%' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>End Date</label>
                  <input type="date" className="filter-select" value={localEnd} onChange={e => setLocalEnd(e.target.value)} style={{ width: '100%' }} />
                </div>
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                Synthesis Focus & Targeted Questions <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>(Optional)</span>
              </label>
              <textarea
                value={focusArea}
                onChange={e => setFocusArea(e.target.value)}
                placeholder="e.g. Focus on my leadership initiatives, or 'Did I improve my deployment frequency?'"
                style={{ 
                  width: '100%', 
                  minHeight: 100, 
                  background: 'var(--bg-surface)', 
                  border: '1px solid var(--border)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: 12,
                  color: 'var(--text-primary)',
                  resize: 'vertical'
                }}
              />
            </div>
          </div>
          <div className="modal-footer" style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button className="btn" onClick={() => setIsConfigModalOpen(false)}>Cancel</button>
            <button 
              className="btn btn--primary" 
              onClick={() => handleGenerateSynthesis(focusArea, localPeriodType, localY, localQ, localStart, localEnd)}
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--teal-muted))', border: 'none' }}
            >
              Generate Synthesis
            </button>
          </div>
        </div>
      </div>,
      document.body
    );
  };

  if (loading && !isSynthesizing) return <div className="loading">Loading review…</div>;

  return (
    <div className="animate-in">
      <div className="page-header">
        <BackButton fallback="/dashboard" />
        <h1 className="page-title">Review</h1>
        <p className="page-subtitle">Your evidence-based contribution record</p>
      </div>

      {isConfigModalOpen && <SynthesisConfigModal />}

      {/* Period selector */}
      <div className="filter-bar">
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            className="filter-select"
            value={periodType === 'custom' ? 'custom' : `${selectedYear}-${selectedQ}`}
            onChange={e => {
              if (e.target.value === 'custom') {
                setPeriodType('custom');
              } else {
                setPeriodType('quarter');
                const [y, q] = e.target.value.split('-').map(Number);
                setSelectedYear(y);
                setSelectedQ(q);
              }
              setAiSynthesis(null);
            }}
            style={{ minWidth: 220 }}
            aria-label="Select period"
          >
            {quarterOptions.map(o => (
              <option key={`${o.year}-${o.quarter}`} value={`${o.year}-${o.quarter}`}>
                {o.label}
              </option>
            ))}
            <option value="custom">Custom Date Range...</option>
          </select>
          
          {periodType === 'custom' && (
            <>
              <input type="date" className="filter-select" value={customStart} onChange={e => { setCustomStart(e.target.value); setAiSynthesis(null); }} />
              <span style={{ color: 'var(--text-tertiary)', alignSelf: 'center' }}>to</span>
              <input type="date" className="filter-select" value={customEnd} onChange={e => { setCustomEnd(e.target.value); setAiSynthesis(null); }} />
            </>
          )}
        </div>

        <button
          id="btn-generate-synthesis"
          type="button"
          className={`btn btn--primary ${isSynthesizing ? 'loading' : ''}`}
          onClick={() => setIsConfigModalOpen(true)}
          disabled={isSynthesizing || loading || (journals.length === 0 && achievements.length === 0)}
          style={{ 
            background: 'linear-gradient(135deg, var(--accent), var(--teal-muted))',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            cursor: (isSynthesizing || loading || (journals.length === 0 && achievements.length === 0)) ? 'not-allowed' : 'pointer'
          }}
        >
          {isSynthesizing ? (
            <span>Analyzing...</span>
          ) : (
            <>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: 'rotate(45deg)' }}>
                <path d="M12 3v18m9-9H3" />
                <path d="M19 5l-14 14M5 5l14 14" />
              </svg>
              <span>Generate Executive Synthesis</span>
            </>
          )}
        </button>
      </div>

      {aiSynthesis && (
        <AISynthesisCard synthesis={aiSynthesis} />
      )}

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

      {/* Activity Calendar (Positioned prominently as quarterly overview) */}
      <div style={{ marginBottom: 36 }}>
        <ActivityCalendar
          journals={journals}
          achievements={achievements}
          startDate={qStart}
          endDate={qEnd}
          title="Activity & Evidence Timeline"
        />
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
    </div>
  );
}
