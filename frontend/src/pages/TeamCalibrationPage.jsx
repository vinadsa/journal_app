import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { formatDate, formatLocalDate, getQuarter, getQuarterBounds, getQuarterLabel } from '../lib/dateUtils';
import { generateCalibrationMarkdown, copyToClipboard, downloadAsFile } from '../lib/calibrationExportUtils';
import ImportanceBadge from '../components/ui/ImportanceBadge';
import BackButton from '../components/ui/BackButton';
import TeamMemberDrawer from '../components/ui/TeamMemberDrawer';
import '../styles/Pages.css';
import '../styles/TeamCalibrationPage.css';

export default function TeamCalibrationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // KPI Period & Quarter selection state
  const [kpiPeriods, setKpiPeriods] = useState([]);
  const [selectedKPIId, setSelectedKPIId] = useState(null);
  const [periodType, setPeriodType] = useState('kpi'); // 'kpi' | 'quarter' | 'all'

  const today = useMemo(() => new Date(), []);
  const currentQ = getQuarter(today);
  const currentYear = today.getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedQ, setSelectedQ] = useState(currentQ);

  // Selected member for drawer
  const [selectedMember, setSelectedMember] = useState(null);

  // View mode toggle: cards or table
  const [viewMode, setViewMode] = useState('cards');

  // Table sorting
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');

  // Calibration notes state
  const [notesMap, setNotesMap] = useState({}); // { [targetUserId]: noteText }

  // Export state
  const [exportCopied, setExportCopied] = useState(false);

  // Security check: only managers and admins may view team calibration
  useEffect(() => {
    if (user && user.role !== 'manager' && user.role !== 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Load KPI periods
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

  // Compute effective date bounds for the selected period
  const getEffectiveDates = () => {
    if (periodType === 'all') {
      return { startDate: null, endDate: null, label: 'All Time' };
    }
    if (periodType === 'kpi' && selectedKPIId && kpiPeriods.length > 0) {
      const kp = kpiPeriods.find(p => p.id === selectedKPIId);
      if (kp) {
        return { startDate: kp.start_date, endDate: kp.end_date, label: kp.name };
      }
    }
    if (periodType === 'quarter') {
      const bounds = getQuarterBounds(selectedYear, selectedQ);
      return {
        startDate: formatLocalDate(bounds.start),
        endDate: formatLocalDate(bounds.end),
        label: getQuarterLabel(selectedYear, selectedQ),
      };
    }
    return { startDate: null, endDate: null, label: 'All Time' };
  };

  const { startDate: effectiveStart, endDate: effectiveEnd, label: effectivePeriodLabel } = getEffectiveDates();

  // Compute the effective KPI period ID for notes (only when using KPI period type)
  const effectiveKPIId = periodType === 'kpi' ? selectedKPIId : null;

  // Load team data when period changes
  useEffect(() => {
    async function loadTeamData() {
      if (periodType === 'kpi' && !selectedKPIId && kpiPeriods.length > 0) return;

      setLoading(true);
      setError(null);
      try {
        const params = {};
        if (effectiveStart && effectiveEnd) {
          params.startDate = effectiveStart;
          params.endDate = effectiveEnd;
        }
        const data = await api.getTeamOverview(params);
        setOverview(data);
      } catch (err) {
        console.error('Failed to load team overview:', err);
        setError(err.message || 'Failed to retrieve team calibration data');
      } finally {
        setLoading(false);
      }
    }
    loadTeamData();
  }, [periodType, selectedKPIId, selectedYear, selectedQ, kpiPeriods]);

  // Load calibration notes when period changes
  useEffect(() => {
    async function loadNotes() {
      try {
        const res = await api.getCalibrationNotes(effectiveKPIId || undefined);
        const notes = res?.notes || [];
        const map = {};
        for (const n of notes) {
          map[n.target_user_id] = n.note;
        }
        setNotesMap(map);
      } catch (err) {
        console.error('Failed to load calibration notes:', err);
      }
    }
    loadNotes();
  }, [effectiveKPIId]);

  // Callback to update notesMap when drawer saves a note
  const handleNoteUpdated = useCallback((targetUserId, noteText) => {
    setNotesMap(prev => ({ ...prev, [targetUserId]: noteText }));
  }, []);

  const team = overview?.team;
  const summary = overview?.summary;
  const members = overview?.members || [];
  const recentAchievements = overview?.recent_achievements || [];

  // Dynamic "Quiet Heroes": members with IWQ significantly above team average (≥15% above avg)
  const quietHeroes = useMemo(() => {
    const teamAvgIWQ = summary?.team_iwq_percentage || 0;
    const threshold = Math.max(teamAvgIWQ + 15, 30); // At least 30% to qualify
    return members.filter(m => m.iwq_percentage >= threshold && m.role === 'employee');
  }, [members, summary]);

  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  };

  // Quarter options for period selector
  const quarterOptions = [];
  for (let y = currentYear; y >= currentYear - 2; y--) {
    for (let q = (y === currentYear ? currentQ : 4); q >= 1; q--) {
      quarterOptions.push({ year: y, quarter: q, label: getQuarterLabel(y, q) });
    }
  }

  // Sorting for table view
  const sortedMembers = useMemo(() => {
    if (viewMode !== 'table') return members;
    const sorted = [...members];
    sorted.sort((a, b) => {
      let valA, valB;
      switch (sortField) {
        case 'name': valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); break;
        case 'entries': valA = a.total_journals; valB = b.total_journals; break;
        case 'active_days': valA = a.active_days; valB = b.active_days; break;
        case 'achievements': valA = a.total_achievements; valB = b.total_achievements; break;
        case 'iwq': valA = a.iwq_percentage; valB = b.iwq_percentage; break;
        case 'foundation': valA = a.foundation_journals; valB = b.foundation_journals; break;
        default: valA = a.name.toLowerCase(); valB = b.name.toLowerCase();
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [members, viewMode, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // Export handlers
  const handleExportCopy = async () => {
    const markdown = generateCalibrationMarkdown({
      periodLabel: effectivePeriodLabel,
      managerName: user?.name || 'Manager',
      teamName: team?.name || 'Engineering Team',
      summary,
      members,
      quietHeroes,
      notesMap,
      recentAchievements,
    });
    const ok = await copyToClipboard(markdown);
    if (ok) {
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 2500);
    }
  };

  const handleExportDownload = () => {
    const markdown = generateCalibrationMarkdown({
      periodLabel: effectivePeriodLabel,
      managerName: user?.name || 'Manager',
      teamName: team?.name || 'Engineering Team',
      summary,
      members,
      quietHeroes,
      notesMap,
      recentAchievements,
    });
    const safeName = effectivePeriodLabel.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    downloadAsFile(markdown, `calibration_${safeName}.md`);
  };

  const SortHeader = ({ field, children }) => (
    <th
      className={`team-table-th team-table-th--sortable ${sortField === field ? 'team-table-th--active' : ''}`}
      onClick={() => handleSort(field)}
      role="button"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleSort(field); }}
    >
      {children}
      {sortField === field && (
        <span className="team-table-sort-icon">{sortDir === 'asc' ? '↑' : '↓'}</span>
      )}
    </th>
  );

  if (loading) {
    return <div className="loading">Loading team calibration record…</div>;
  }

  if (error) {
    return (
      <div className="animate-in team-container">
        <div className="page-header">
          <BackButton fallback="/dashboard" />
          <h1 className="team-masthead-title">Team</h1>
        </div>
        <div className="empty-state" style={{ padding: '48px 16px' }}>
          <div className="empty-state-title">Unable to load team record</div>
          <div className="empty-state-desc">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in team-container">
      {/* 1. Masthead Header */}
      <header className="team-masthead">
        <div className="page-header" style={{ marginBottom: 12 }}>
          <BackButton fallback="/dashboard" />
          <h1 className="team-masthead-title">Team</h1>
        </div>
        <div className="team-masthead-meta">
          <span className="team-badge">
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-green, #16a34a)' }} />
            {team?.name || 'Engineering Team'}
          </span>
          <span>Lead / Manager: <strong>{user?.name}</strong></span>
          <span>·</span>
          <span>Objective Evidence & Review Calibration</span>
        </div>
      </header>

      {/* Period Selector Toolbar */}
      <div className="team-toolbar">
        <div className="team-toolbar-filters">
          <select
            className="filter-select"
            value={
              periodType === 'all'
                ? 'all'
                : periodType === 'kpi'
                  ? `kpi-${selectedKPIId}`
                  : `quarter-${selectedYear}-${selectedQ}`
            }
            onChange={e => {
              const val = e.target.value;
              if (val === 'all') {
                setPeriodType('all');
              } else if (val.startsWith('kpi-')) {
                setPeriodType('kpi');
                setSelectedKPIId(Number(val.replace('kpi-', '')));
              } else if (val.startsWith('quarter-')) {
                setPeriodType('quarter');
                const [, y, q] = val.split('-');
                setSelectedYear(Number(y));
                setSelectedQ(Number(q));
              }
            }}
            style={{ minWidth: 260 }}
            aria-label="Select calibration period"
          >
            <option value="all">All Time</option>
            {kpiPeriods.length > 0 && (
              <optgroup label="Review Cycles">
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
          </select>
          <span className="team-period-label">{effectivePeriodLabel}</span>
        </div>

        <div className="team-toolbar-actions">
          {/* Export Actions */}
          <div className="team-export-group">
            <button
              className="team-export-btn"
              onClick={handleExportCopy}
              title="Copy calibration summary as Markdown"
            >
              {exportCopied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  Copied
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  Copy
                </>
              )}
            </button>
            <button
              className="team-export-btn"
              onClick={handleExportDownload}
              title="Download calibration summary as .md file"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Export
            </button>
          </div>

          <div className="team-view-toggle" role="tablist" aria-label="View mode">
            <button
              className={`team-view-btn ${viewMode === 'cards' ? 'team-view-btn--active' : ''}`}
              onClick={() => setViewMode('cards')}
              role="tab"
              aria-selected={viewMode === 'cards'}
              title="Card view"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              className={`team-view-btn ${viewMode === 'table' ? 'team-view-btn--active' : ''}`}
              onClick={() => setViewMode('table')}
              role="tab"
              aria-selected={viewMode === 'table'}
              title="Table view"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Team Pulse Strip */}
      <section className="team-pulse-strip animate-stagger" aria-label="Team Collective Metrics">
        <div className="team-pulse-card">
          <div className="team-pulse-val">{summary?.total_members || members.length}</div>
          <div className="team-pulse-label">Team Members</div>
          <div className="team-pulse-sub">Active direct contributors</div>
        </div>

        <div className="team-pulse-card">
          <div className="team-pulse-val">{summary?.total_journals || 0}</div>
          <div className="team-pulse-label">Documented Entries</div>
          <div className="team-pulse-sub">{periodType !== 'all' ? `In ${effectivePeriodLabel}` : 'All time records'}</div>
        </div>

        <div className="team-pulse-card">
          <div className="team-pulse-val">{summary?.total_achievements || 0}</div>
          <div className="team-pulse-label">Key Achievements</div>
          <div className="team-pulse-sub">High-impact achievements verified</div>
        </div>

        <div className="team-pulse-card">
          <div className="team-pulse-val">{summary?.team_iwq_percentage || 0}%</div>
          <div className="team-pulse-label">Team Foundation Ratio</div>
          <div className="team-pulse-sub">{summary?.foundation_journals || 0} maintenance, tech debt & unblocking entries</div>
        </div>
      </section>

      {/* 3. Leadership Calibration Insight Banner */}
      {quietHeroes.length > 0 && (
        <div className="team-insight-card">
          <span className="team-insight-badge">Review Insight</span>
          <p className="team-insight-text">
            <strong>Foundation Contributors Identified:</strong>{' '}
            {quietHeroes.map(h => `${h.name} (${h.iwq_percentage}% Foundation Work)`).join(', ')}{' '}
            contributed significantly above the team average ({summary?.team_iwq_percentage || 0}%) in invisible foundation work
            {periodType !== 'all' ? ` during ${effectivePeriodLabel}` : ''}.
            In upcoming performance calibrations, ensure their contributions are credited with equal weight to direct feature deliveries.
          </p>
        </div>
      )}

      {/* 4. Member Views — Cards or Table */}
      <div className="section-header">
        <span className="section-title">Team Member Records</span>
        <span className="section-link">{members.length} contributors</span>
      </div>

      {viewMode === 'cards' ? (
        /* Card View */
        <div className="team-members-grid animate-stagger">
          {members.map(member => (
            <div 
              key={member.id} 
              className="team-member-card team-member-card--clickable"
              onClick={() => setSelectedMember(member)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedMember(member); }}
            >
              <div>
                <div className="team-member-header">
                  <div className="team-member-ident">
                    <div className="team-member-avatar">{getInitials(member.name)}</div>
                    <div>
                      <div className="team-member-name">{member.name}</div>
                      <div className="team-member-email">{member.email}</div>
                    </div>
                  </div>
                  <span className={`team-role-pill team-role-pill--${member.role}`}>
                    {member.role}
                  </span>
                </div>

                <div className="team-member-stats">
                  <div className="team-member-stat-item">
                    <span className="team-member-stat-val">{member.total_journals}</span>
                    <span className="team-member-stat-lbl">Entries</span>
                  </div>
                  <div className="team-member-stat-item">
                    <span className="team-member-stat-val">{member.active_days}</span>
                    <span className="team-member-stat-lbl">Active Days</span>
                  </div>
                  <div className="team-member-stat-item">
                    <span className="team-member-stat-val">{member.total_achievements}</span>
                    <span className="team-member-stat-lbl">Achievements</span>
                  </div>
                </div>

                {member.last_entry_date && (
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: 12 }}>
                    Last documented: <strong>{formatDate(member.last_entry_date)}</strong>
                  </div>
                )}
              </div>

              {/* Foundation Ratio Meter */}
              <div className="team-member-foundation-box">
                <div className="team-member-foundation-header">
                  <span className="team-member-foundation-lbl" data-tooltip="Invisible Work Quotient (IWQ):&#10;Percentage of work dedicated to foundation, maintenance, and team enablement (e.g., refactoring, code reviews, incident triage). Ensures invisible work is visible during performance reviews.">
                    Invisible Work Quotient (IWQ)
                    <svg style={{ marginLeft: 6, verticalAlign: 'text-bottom', opacity: 0.6 }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                  </span>
                  <span className="team-member-foundation-pct">{member.iwq_percentage}%</span>
                </div>
                <div
                  className="fw-ratio-track"
                  style={{ height: 6, marginBottom: 4 }}
                  title={`${100 - member.iwq_percentage}% Feature Execution, ${member.iwq_percentage}% Foundation Work`}
                >
                  <div
                    className="fw-ratio-segment fw-ratio-segment--feature"
                    style={{ width: `${Math.max(2, 100 - member.iwq_percentage)}%` }}
                  />
                  <div
                    className="fw-ratio-segment fw-ratio-segment--foundation"
                    style={{ width: `${Math.max(2, member.iwq_percentage)}%` }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  <span>{member.foundation_journals} foundation {member.foundation_journals === 1 ? 'entry' : 'entries'}</span>
                  <span>
                    {member.iwq_percentage > (summary?.team_iwq_percentage || 0)
                      ? `↑ Above team avg (${summary?.team_iwq_percentage}%)`
                      : `${member.critical_achievements > 0 ? `${member.critical_achievements} Critical` : `${member.high_achievements} High Impact`}`
                    }
                  </span>
                </div>
              </div>

              {/* Note indicator */}
              {notesMap[member.id] && (
                <div className="team-member-note-indicator">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                  Note saved
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="team-table-container">
          <table className="team-table">
            <thead>
              <tr>
                <SortHeader field="name">Name</SortHeader>
                <th className="team-table-th">Role</th>
                <SortHeader field="entries">Entries</SortHeader>
                <SortHeader field="active_days">Active Days</SortHeader>
                <SortHeader field="achievements">Achievements</SortHeader>
                <SortHeader field="iwq">IWQ %</SortHeader>
                <SortHeader field="foundation">Foundation</SortHeader>
                <th className="team-table-th">Last Documented</th>
                <th className="team-table-th">Note</th>
              </tr>
            </thead>
            <tbody>
              {sortedMembers.map(member => {
                const isAboveAvg = member.iwq_percentage > (summary?.team_iwq_percentage || 0);
                return (
                  <tr
                    key={member.id}
                    className={`team-table-row team-table-row--clickable ${isAboveAvg ? 'team-table-row--highlight' : ''}`}
                    onClick={() => setSelectedMember(member)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSelectedMember(member); }}
                  >
                    <td className="team-table-td">
                      <div className="team-table-name-cell">
                        <div className="team-member-avatar" style={{ width: 28, height: 28, fontSize: '10px' }}>
                          {getInitials(member.name)}
                        </div>
                        <div>
                          <div className="team-table-name">{member.name}</div>
                          <div className="team-table-email">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="team-table-td">
                      <span className={`team-role-pill team-role-pill--${member.role}`}>{member.role}</span>
                    </td>
                    <td className="team-table-td team-table-td--mono">{member.total_journals}</td>
                    <td className="team-table-td team-table-td--mono">{member.active_days}</td>
                    <td className="team-table-td team-table-td--mono">{member.total_achievements}</td>
                    <td className="team-table-td">
                      <div className="team-table-iwq">
                        <span className="team-table-iwq-val">{member.iwq_percentage}%</span>
                        <div className="team-table-iwq-bar">
                          <div
                            className="team-table-iwq-fill"
                            style={{ width: `${Math.max(3, member.iwq_percentage)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="team-table-td team-table-td--mono">{member.foundation_journals}</td>
                    <td className="team-table-td team-table-td--date">
                      {member.last_entry_date ? formatDate(member.last_entry_date) : '—'}
                    </td>
                    <td className="team-table-td">
                      {notesMap[member.id] ? (
                        <span className="team-table-note-icon" title="Calibration note saved">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line></svg>
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-tertiary)' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. Recent High-Impact Team Deliveries */}
      {recentAchievements.length > 0 && (
        <section style={{ marginTop: 40 }}>
          <div className="section-header">
            <span className="section-title">Recent High-Impact Deliveries</span>
            <Link to="/achievements" className="section-link">View all achievements →</Link>
          </div>

          <div className="team-deliveries-list animate-stagger">
            {recentAchievements.map(ach => (
              <div key={ach.id} className="team-delivery-item">
                <div className="team-delivery-left">
                  <div className="team-delivery-top">
                    <ImportanceBadge level={ach.importance || 'medium'} />
                    <span className="team-delivery-author">{ach.user_name}</span>
                    {ach.achieved_date && (
                      <span className="team-delivery-date">{formatDate(ach.achieved_date)}</span>
                    )}
                  </div>
                  <div className="team-delivery-title">{ach.title}</div>
                  {ach.impact && (
                    <div className="team-delivery-impact">{ach.impact}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Member Drawer Portal */}
      {selectedMember && (
        <TeamMemberDrawer
          member={selectedMember}
          recentAchievements={recentAchievements}
          recentJournals={overview?.recent_journals || []}
          onClose={() => setSelectedMember(null)}
          periodLabel={effectivePeriodLabel}
          kpiPeriodId={effectiveKPIId}
          initialNote={notesMap[selectedMember.id] || ''}
        />
      )}
    </div>
  );
}
