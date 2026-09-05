import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { api } from '../api';
import '../styles/Pages.css';
import { CATEGORIES } from '../lib/constants';
import { formatDate, formatLocalDate, getQuarter, getQuarterBounds, getQuarterLabel } from '../lib/dateUtils';
import { useAuth } from '../context/AuthContext';
import ImportanceBadge from '../components/ui/ImportanceBadge';
import BackButton from '../components/ui/BackButton';
import AISynthesisCard from '../components/ui/AISynthesisCard';
import AISynthesisLoadingCard from '../components/ui/AISynthesisLoadingCard';
import ActivityCalendar from '../components/ui/ActivityCalendar';
import ReviewPackModal from '../components/ui/ReviewPackModal';


export default function ReviewPage() {
  const { user } = useAuth();
  const [journals, setJournals] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [kpiPeriods, setKpiPeriods] = useState([]);
  const [selectedKPIId, setSelectedKPIId] = useState(null);
  const [loading, setLoading] = useState(true);

  const today = useMemo(() => new Date(), []);
  const currentQ = getQuarter(today);
  const currentYear = today.getFullYear();

  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedQ, setSelectedQ] = useState(currentQ);
  const [periodType, setPeriodType] = useState('kpi'); // 'kpi' | 'quarter' | 'custom'
  
  // Default custom range to last 30 days using dateUtils
  const [customStart, setCustomStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return formatLocalDate(d);
  });
  const [customEnd, setCustomEnd] = useState(() => formatLocalDate(new Date()));

  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [aiSynthesis, setAiSynthesis] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Load KPI periods from backend
  useEffect(() => {
    async function loadKPIPeriods() {
      try {
        const res = await api.listKPIPeriods();
        const periods = res.kpi_periods || [];
        setKpiPeriods(periods);
        if (periods.length > 0) {
          const active = periods.find(p => p.is_active) || periods[0];
          setSelectedKPIId(active.id);
          setPeriodType('kpi');
        } else {
          setPeriodType('quarter');
        }
      } catch (err) {
        console.error('Failed to load KPI periods:', err);
        setPeriodType('quarter');
      }
    }
    loadKPIPeriods();
  }, []);

  const getEffectiveDates = () => {
    if (periodType === 'kpi' && selectedKPIId && kpiPeriods.length > 0) {
      const kp = kpiPeriods.find(p => p.id === selectedKPIId);
      if (kp) {
        const start = new Date(kp.start_date + 'T00:00:00');
        const end = new Date(kp.end_date + 'T23:59:59.999');
        return { start, end, label: kp.name, kpiPeriod: kp };
      }
    }
    if (periodType === 'quarter') {
      const bounds = getQuarterBounds(selectedYear, selectedQ);
      return { ...bounds, label: getQuarterLabel(selectedYear, selectedQ), kpiPeriod: null };
    }
    const endD = new Date(customEnd + 'T23:59:59.999');
    return {
      start: new Date(customStart + 'T00:00:00'),
      end: endD,
      label: `${customStart} to ${customEnd}`,
      kpiPeriod: null,
    };
  };

  const { start: qStart, end: qEnd, label: effectivePeriodLabel, kpiPeriod: currentKPIPeriod } = getEffectiveDates();

  const handleGenerateSynthesis = async (focusArea, modalPeriodType, modalKPIId, modalY, modalQ, modalStart, modalEnd) => {
    setIsConfigModalOpen(false);
    setIsSynthesizing(true);
    
    // Update page state if changed in modal
    let effectiveLabel = "";
    if (modalPeriodType === 'kpi') {
      setPeriodType('kpi');
      setSelectedKPIId(modalKPIId);
      const matched = kpiPeriods.find(p => p.id === modalKPIId);
      effectiveLabel = matched ? matched.name : "KPI Cycle";
    } else if (modalPeriodType === 'quarter') {
      setPeriodType('quarter');
      setSelectedYear(modalY);
      setSelectedQ(modalQ);
      effectiveLabel = getQuarterLabel(modalY, modalQ);
    } else {
      setPeriodType('custom');
      setCustomStart(modalStart);
      setCustomEnd(modalEnd);
      effectiveLabel = `${modalStart} to ${modalEnd}`;
    }

    try {
      const data = {
        period: effectiveLabel,
        journals,
        focusArea,
        achievements
      };
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
      if (periodType === 'kpi' && !selectedKPIId && kpiPeriods.length > 0) return;
      
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
  }, [selectedYear, selectedQ, periodType, selectedKPIId, customStart, customEnd, kpiPeriods]);

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
  // Config Modal Component
  const SynthesisConfigModal = () => {
    const [localPeriodType, setLocalPeriodType] = useState(periodType);
    const [localKPIId, setLocalKPIId] = useState(selectedKPIId);
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
                value={
                  localPeriodType === 'kpi'
                    ? `kpi-${localKPIId}`
                    : localPeriodType === 'custom'
                    ? 'custom'
                    : `quarter-${localY}-${localQ}`
                }
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'custom') {
                    setLocalPeriodType('custom');
                  } else if (val.startsWith('kpi-')) {
                    setLocalPeriodType('kpi');
                    setLocalKPIId(Number(val.replace('kpi-', '')));
                  } else if (val.startsWith('quarter-')) {
                    setLocalPeriodType('quarter');
                    const [_, y, q] = val.split('-');
                    setLocalY(Number(y));
                    setLocalQ(Number(q));
                  }
                }}
                style={{ width: '100%' }}
              >
                {kpiPeriods.length > 0 && (
                  <optgroup label="Organizational Target Cycles">
                    {kpiPeriods.map(kp => (
                      <option key={`modal-kpi-${kp.id}`} value={`kpi-${kp.id}`}>
                        {kp.name} ({kp.start_date} to {kp.end_date}){kp.is_active ? ' • Active' : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Calendar Quarters">
                  {quarterOptions.map(o => (
                    <option key={`modal-quarter-${o.year}-${o.quarter}`} value={`quarter-${o.year}-${o.quarter}`}>
                      {o.label}
                    </option>
                  ))}
                </optgroup>
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
              onClick={() => handleGenerateSynthesis(focusArea, localPeriodType, localKPIId, localY, localQ, localStart, localEnd)}
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

      <ReviewPackModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        user={user}
        periodLabel={effectivePeriodLabel}
        startDate={qStart}
        endDate={qEnd}
        journals={journals}
        achievements={achievements}
        aiSynthesis={aiSynthesis}
      />

      {/* Review Toolbar: Period Filters on Left, Executive Actions on Right */}
      <div className="review-toolbar">
        <div className="review-toolbar-filters">
          <select
            className="filter-select"
            value={
              periodType === 'kpi'
                ? `kpi-${selectedKPIId}`
                : periodType === 'custom'
                ? 'custom'
                : `quarter-${selectedYear}-${selectedQ}`
            }
            onChange={e => {
              const val = e.target.value;
              if (val === 'custom') {
                setPeriodType('custom');
              } else if (val.startsWith('kpi-')) {
                setPeriodType('kpi');
                setSelectedKPIId(Number(val.replace('kpi-', '')));
              } else if (val.startsWith('quarter-')) {
                setPeriodType('quarter');
                const [_, y, q] = val.split('-');
                setSelectedYear(Number(y));
                setSelectedQ(Number(q));
              }
              setAiSynthesis(null);
            }}
            style={{ minWidth: 260 }}
            aria-label="Select period"
          >
            {kpiPeriods.length > 0 && (
              <optgroup label="Organizational Target Cycles">
                {kpiPeriods.map(kp => (
                  <option key={`kpi-${kp.id}`} value={`kpi-${kp.id}`}>
                    {kp.name} ({kp.start_date} to {kp.end_date}){kp.is_active ? ' • Active' : ''}
                  </option>
                ))}
              </optgroup>
            )}
            <optgroup label="Calendar Quarters">
              {quarterOptions.map(o => (
                <option key={`quarter-${o.year}-${o.quarter}`} value={`quarter-${o.year}-${o.quarter}`}>
                  {o.label}
                </option>
              ))}
            </optgroup>
            <option value="custom">Custom Date Range...</option>
          </select>
          
          {periodType === 'custom' && (
            <div className="review-custom-dates">
              <input type="date" className="filter-select" value={customStart} onChange={e => { setCustomStart(e.target.value); setAiSynthesis(null); }} />
              <span style={{ color: 'var(--text-tertiary)' }}>to</span>
              <input type="date" className="filter-select" value={customEnd} onChange={e => { setCustomEnd(e.target.value); setAiSynthesis(null); }} />
            </div>
          )}

          {currentKPIPeriod && periodType !== 'kpi' && (
            <span
              className="act-calendar-period-pill"
              title={`Target Cycle: ${currentKPIPeriod.name} (${currentKPIPeriod.start_date} to ${currentKPIPeriod.end_date})`}
              style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              <span className={`kpi-indicator-dot ${currentKPIPeriod.is_active ? 'active' : ''}`} />
              {currentKPIPeriod.is_active ? 'Active Cycle' : 'Target Cycle'}: <strong>{currentKPIPeriod.name}</strong>
            </span>
          )}
        </div>

        <div className="review-toolbar-actions">
          <button
            id="btn-generate-synthesis"
            type="button"
            className={`btn-synthesis ${isSynthesizing ? 'is-synthesizing' : ''}`}
            onClick={() => setIsConfigModalOpen(true)}
            disabled={isSynthesizing || loading || (journals.length === 0 && achievements.length === 0)}
          >
            {isSynthesizing ? (
              <>
                <span className="btn-synthesis-spinner" aria-hidden="true" />
                <span>Synthesizing Evidence…</span>
              </>
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

          <button
            id="btn-export-review-pack"
            type="button"
            className="btn btn--secondary btn-export-pack"
            onClick={() => setIsExportModalOpen(true)}
            disabled={loading || (journals.length === 0 && achievements.length === 0)}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            <span>Export Review Pack</span>
          </button>
        </div>
      </div>

      {isSynthesizing && (
        <AISynthesisLoadingCard periodLabel={effectivePeriodLabel} />
      )}

      {aiSynthesis && !isSynthesizing && (
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
          kpiPeriod={currentKPIPeriod}
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
