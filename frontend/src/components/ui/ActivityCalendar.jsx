import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/ActivityCalendar.css';
import { CATEGORIES } from '../../lib/constants';
import { formatDate, formatDateFull, formatLocalDate } from '../../lib/dateUtils';
import ImportanceBadge from './ImportanceBadge';

const DAYS_OF_WEEK = [
  { label: 'Mon', show: true },
  { label: 'Tue', show: false },
  { label: 'Wed', show: true },
  { label: 'Thu', show: false },
  { label: 'Fri', show: true },
  { label: 'Sat', show: false },
  { label: 'Sun', show: false },
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function ActivityCalendar({
  journals = [],
  achievements = [],
  startDate,
  endDate,
  title = "Activity Calendar",
  compact = false,
  kpiPeriod = null,
}) {
  const [lensMode, setLensMode] = useState('volume'); // 'volume' | 'category'
  const [selectedDay, setSelectedDay] = useState(null);

  // Normalize start and end date objects
  const { startNorm, endNorm } = useMemo(() => {
    let s = startDate ? new Date(startDate) : null;
    let e = endDate ? new Date(endDate) : null;

    if (!s && kpiPeriod?.start_date) {
      s = new Date(kpiPeriod.start_date);
    }
    if (!e && kpiPeriod?.end_date) {
      e = new Date(kpiPeriod.end_date);
    }

    // Default fallback: past 90 days
    if (!s) {
      s = new Date();
      s.setDate(s.getDate() - 90);
    }
    if (!e) {
      e = new Date();
    }

    s.setHours(0, 0, 0, 0);
    e.setHours(23, 59, 59, 999);
    return { startNorm: s, endNorm: e };
  }, [startDate, endDate, compact, kpiPeriod]);

  // Index journals and achievements by 'YYYY-MM-DD'
  const { journalMap, achievementMap } = useMemo(() => {
    const jMap = {};
    journals.forEach(j => {
      const raw = j.entry_date;
      const key = raw ? (raw.includes('T') ? formatLocalDate(new Date(raw)) : raw.split(' ')[0]) : null;
      if (key) {
        if (!jMap[key]) jMap[key] = [];
        jMap[key].push(j);
      }
    });

    const aMap = {};
    achievements.forEach(a => {
      const raw = a.achieved_date || a.created_at;
      const key = raw ? (raw.includes('T') ? formatLocalDate(new Date(raw)) : raw.split(' ')[0]) : null;
      if (key) {
        if (!aMap[key]) aMap[key] = [];
        aMap[key].push(a);
      }
    });

    return { journalMap: jMap, achievementMap: aMap };
  }, [journals, achievements]);

  // Build grid of weeks (columns) x 7 days (rows)
  const { weeks, monthHeaders } = useMemo(() => {
    // Determine the Monday before or on startNorm
    const startDayIndex = (startNorm.getDay() + 6) % 7; // Monday = 0, Sunday = 6
    const calStart = new Date(startNorm);
    calStart.setDate(calStart.getDate() - startDayIndex);
    calStart.setHours(0, 0, 0, 0);

    // Determine the Sunday after or on endNorm
    const endDayIndex = (endNorm.getDay() + 6) % 7;
    const calEnd = new Date(endNorm);
    calEnd.setDate(calEnd.getDate() + (6 - endDayIndex));
    calEnd.setHours(23, 59, 59, 999);

    const todayStr = formatLocalDate(new Date());
    const computedWeeks = [];
    const headers = [];
    let currentWeek = [];
    let weekIndex = 0;
    let lastLabeledMonth = -1;

    const curr = new Date(calStart);
    while (curr <= calEnd) {
      const dateStr = formatLocalDate(curr);
      const inRange = curr >= startNorm && curr <= endNorm;
      const dayOfWeek = (curr.getDay() + 6) % 7;
      const isWeekend = dayOfWeek >= 5;
      const isToday = dateStr === todayStr;

      const dayJournals = inRange ? (journalMap[dateStr] || []) : [];
      const dayAchievements = inRange ? (achievementMap[dateStr] || []) : [];
      const count = dayJournals.length;
      const hasAchievement = dayAchievements.length > 0;

      // Determine top importance
      let topImportance = null;
      if (hasAchievement) {
        const order = { critical: 4, high: 3, medium: 2, low: 1 };
        dayAchievements.forEach(a => {
          const imp = a.importance || 'medium';
          if (!topImportance || (order[imp] || 2) > (order[topImportance] || 2)) {
            topImportance = imp;
          }
        });
      }

      // Determine dominant category
      let dominantCategory = 'general';
      if (count > 0) {
        const catCount = {};
        dayJournals.forEach(j => {
          const c = j.category || 'general';
          catCount[c] = (catCount[c] || 0) + 1;
        });
        dominantCategory = Object.keys(catCount).reduce((a, b) => 
          catCount[a] > catCount[b] ? a : b
        );
      }

      // Determine volume level
      let level = '';
      if (count === 1) level = 'l1';
      else if (count === 2) level = 'l2';
      else if (count === 3) level = 'l3';
      else if (count >= 4) level = 'l4';

      currentWeek.push({
        dateStr,
        dateObj: new Date(curr),
        inRange,
        dayOfWeek,
        isWeekend,
        isToday,
        count,
        level,
        hasAchievement,
        topImportance,
        dominantCategory,
        journals: dayJournals,
        achievements: dayAchievements,
      });

      // Check month boundary for headers (first day of month, or start week)
      if (curr.getDate() === 1 || weekIndex === 0 && dayOfWeek === 0) {
        const m = curr.getMonth();
        if (m !== lastLabeledMonth) {
          headers.push({
            weekIndex,
            label: MONTH_NAMES[m],
          });
          lastLabeledMonth = m;
        }
      }

      if (currentWeek.length === 7) {
        computedWeeks.push(currentWeek);
        currentWeek = [];
        weekIndex++;
      }

      curr.setDate(curr.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      computedWeeks.push(currentWeek);
    }

    return { weeks: computedWeeks, monthHeaders: headers };
  }, [startNorm, endNorm, journalMap, achievementMap]);

  // Statistics for header badge
  const totalActiveDays = useMemo(() => {
    return Object.keys(journalMap).length;
  }, [journalMap]);

  const totalAchievementsInPeriod = useMemo(() => {
    return Object.values(achievementMap).reduce((sum, list) => sum + list.length, 0);
  }, [achievementMap]);

  // Handle cell click
  const handleCellClick = (day) => {
    if (!day.inRange) return;
    if (selectedDay?.dateStr === day.dateStr) {
      setSelectedDay(null); // Toggle off
    } else {
      setSelectedDay(day);
    }
  };

  return (
    <div className={`act-calendar ${compact ? 'act-calendar--compact' : ''}`}>
      {/* Header */}
      <div className="act-calendar-header">
        <div className="act-calendar-title-group">
          <span className="act-calendar-title">{title}</span>
          {kpiPeriod && (
            <span
              className="act-calendar-period-pill"
              title={`Target Cycle: ${kpiPeriod.name} (${kpiPeriod.start_date} to ${kpiPeriod.end_date})`}
            >
              <span className={`kpi-indicator-dot ${kpiPeriod.is_active ? 'active' : ''}`} />
              Cycle: <strong>{kpiPeriod.name}</strong>
            </span>
          )}
          <span className="act-calendar-badge">
            {totalActiveDays} active {totalActiveDays === 1 ? 'day' : 'days'}
            {totalAchievementsInPeriod > 0 && ` • ${totalAchievementsInPeriod} milestone${totalAchievementsInPeriod > 1 ? 's' : ''}`}
          </span>
        </div>

        {!compact && (
          <div className="act-lens-toggle">
            <button
              type="button"
              className={`act-lens-btn ${lensMode === 'volume' ? 'active' : ''}`}
              onClick={() => setLensMode('volume')}
            >
              By Volume
            </button>
            <button
              type="button"
              className={`act-lens-btn ${lensMode === 'category' ? 'active' : ''}`}
              onClick={() => setLensMode('category')}
            >
              By Category
            </button>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="act-scroll-wrapper">
        <div className="act-grid-container" role="img" aria-label="Activity calendar timeline">
          {/* Months Header Row */}
          <div className="act-months-row">
            {weeks.map((_, wIdx) => {
              const header = monthHeaders.find(h => h.weekIndex === wIdx);
              return (
                <div
                  key={`month-${wIdx}`}
                  className="act-month-col"
                  style={{ width: compact ? 13.5 : 16 }}
                >
                  {header ? header.label : ''}
                </div>
              );
            })}
          </div>

          {/* Days labels & Weeks Grid */}
          <div className="act-body-row">
            {/* Days of week */}
            <div className="act-day-labels" aria-hidden="true">
              {DAYS_OF_WEEK.map((d, i) => (
                <div key={i} className="act-day-label">
                  {d.show ? d.label : ''}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="act-weeks-track">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="act-week-col">
                  {week.map((day) => {
                    const isSelected = selectedDay?.dateStr === day.dateStr;

                    // Compute class list
                    let cellClasses = ['act-cell'];
                    if (!day.inRange) cellClasses.push('act-cell--empty');
                    if (day.isWeekend) cellClasses.push('act-cell--weekend');
                    if (day.isToday) cellClasses.push('act-cell--today');
                    if (isSelected) cellClasses.push('selected');

                    if (day.inRange && day.count > 0) {
                      if (lensMode === 'volume') {
                        cellClasses.push(`act-cell--${day.level}`);
                      } else {
                        cellClasses.push(`act-cell--cat-${day.dominantCategory}`);
                      }
                    }

                    if (day.inRange && day.hasAchievement) {
                      cellClasses.push('act-cell--has-achievement');
                      if (day.topImportance === 'critical') {
                        cellClasses.push('act-cell--ach-critical');
                      } else if (day.topImportance === 'high') {
                        cellClasses.push('act-cell--ach-high');
                      }
                    }

                    const tooltipText = day.inRange
                      ? `${day.dateStr}: ${day.count} ${day.count === 1 ? 'entry' : 'entries'}${
                          day.hasAchievement ? ` • ${day.achievements.length} milestone(s)` : ''
                        }${lensMode === 'category' && day.count > 0 ? ` (${CATEGORIES[day.dominantCategory] || day.dominantCategory})` : ''}`
                      : '';

                    return (
                      <button
                        key={day.dateStr}
                        type="button"
                        className={cellClasses.join(' ')}
                        onClick={() => handleCellClick(day)}
                        title={tooltipText}
                        aria-label={tooltipText}
                        disabled={!day.inRange}
                      >
                        {day.inRange && day.hasAchievement && (
                          <span className="act-ach-marker" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer & Legend */}
      <div className="act-calendar-footer">
        <div className="act-legend-group">
          {lensMode === 'volume' ? (
            <div className="act-legend-volume">
              <span>Less</span>
              <div className="act-legend-cells">
                <span className="act-legend-cell" style={{ background: 'var(--parchment-deep)' }} />
                <span className="act-legend-cell act-cell--l1" />
                <span className="act-legend-cell act-cell--l2" />
                <span className="act-legend-cell act-cell--l3" />
                <span className="act-legend-cell act-cell--l4" />
              </div>
              <span>More</span>
            </div>
          ) : (
            <div className="act-legend-categories">
              <span className="act-legend-cat-item">
                <span className="act-legend-cat-dot act-cell--cat-development" /> Development
              </span>
              <span className="act-legend-cat-item">
                <span className="act-legend-cat-dot act-cell--cat-maintenance" /> Maintenance
              </span>
              <span className="act-legend-cat-item">
                <span className="act-legend-cat-dot act-cell--cat-meeting" /> Meeting
              </span>
              <span className="act-legend-cat-item">
                <span className="act-legend-cat-dot act-cell--cat-general" /> General
              </span>
            </div>
          )}

          <div className="act-legend-achievement">
            <span className="act-legend-ach-icon" />
            <span>Achievement Milestone</span>
          </div>
        </div>

        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
          Click any date to view entries
        </span>
      </div>

      {/* Interactive Evidence Peek Drawer */}
      {selectedDay && (
        <div className="act-peek-overlay">
          <div className="act-peek-header">
            <div>
              <div className="act-peek-date">{formatDateFull(selectedDay.dateObj)}</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>
                {selectedDay.count} journal {selectedDay.count === 1 ? 'entry' : 'entries'} •{' '}
                {selectedDay.achievements.length} achievement{selectedDay.achievements.length === 1 ? '' : 's'}
              </div>
            </div>
            <button
              type="button"
              className="act-peek-close"
              onClick={() => setSelectedDay(null)}
              aria-label="Close drawer"
            >
              ✕
            </button>
          </div>

          <div className="act-peek-content">
            {/* Achievements first (first-class citizens) */}
            {selectedDay.achievements.length > 0 && (
              <div>
                <div className="act-peek-section-title">Achievements & Milestones</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedDay.achievements.map((ach) => (
                    <div key={ach.id} className="act-peek-item" style={{ borderLeft: '3px solid hsl(42, 100%, 50%)' }}>
                      <div className="act-peek-item-main">
                        <ImportanceBadge level={ach.importance || 'medium'} />
                        <span className="act-peek-item-title">{ach.title}</span>
                      </div>
                      {ach.impact && (
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {ach.impact}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Journals */}
            {selectedDay.journals.length > 0 ? (
              <div>
                <div className="act-peek-section-title">Journal Entries</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedDay.journals.map((j) => (
                    <Link
                      key={j.id}
                      to={`/journals/${j.id}`}
                      className="act-peek-item"
                    >
                      <div className="act-peek-item-main">
                        <span
                          className="badge"
                          style={{ fontSize: '10px', padding: '2px 6px', textTransform: 'capitalize' }}
                        >
                          {CATEGORIES[j.category] || j.category}
                        </span>
                        <span className="act-peek-item-title">{j.title}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {j.kpi_period_id && (
                          <span
                            style={{
                              fontFamily: 'var(--font-mono)',
                              fontSize: '10px',
                              padding: '1px 6px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--bg-input)',
                              color: 'var(--text-secondary)',
                              border: '1px solid var(--border)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            KPI Linked
                          </span>
                        )}
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)' }}>
                          Open →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              selectedDay.achievements.length === 0 && (
                <div className="act-peek-empty">
                  No journals or achievements recorded on this date.
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}
