import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { formatDate } from '../../lib/dateUtils';
import { CATEGORIES } from '../../lib/constants';
import ImportanceBadge from './ImportanceBadge';
import ActivityCalendar from './ActivityCalendar';
import {
  generateReviewPackMarkdown,
  calculateContributionBreakdown,
  copyToClipboard,
  downloadFile,
} from '../../lib/reviewPackUtils';

export default function ReviewPackModal({
  isOpen,
  onClose,
  user,
  periodLabel,
  startDate,
  endDate,
  journals = [],
  achievements = [],
  aiSynthesis = null,
}) {
  const [includeSynthesisOverride, setIncludeSynthesisOverride] = useState(null);
  const includeSynthesis = includeSynthesisOverride !== null ? includeSynthesisOverride : Boolean(aiSynthesis);
  const [includeCalendar, setIncludeCalendar] = useState(true);
  const [includeAchievements, setIncludeAchievements] = useState(true);
  const [includeCategories, setIncludeCategories] = useState(true);
  const [includeJournals, setIncludeJournals] = useState(true);
  const [copied, setCopied] = useState(false);

  // Handle ESC key to dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const breakdown = useMemo(
    () => calculateContributionBreakdown(journals),
    [journals]
  );

  const activeDays = useMemo(() => {
    const dates = new Set(journals.map((j) => j.entry_date?.split('T')[0]));
    return dates.size;
  }, [journals]);

  const sortedAchievements = useMemo(() => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...achievements].sort(
      (a, b) => (order[a.importance] ?? 2) - (order[b.importance] ?? 2)
    );
  }, [achievements]);

  if (!isOpen) return null;

  const currentOptions = {
    includeSynthesis,
    includeCalendar,
    includeAchievements,
    includeCategories,
    includeJournals,
  };

  const handleCopyMarkdown = async () => {
    const md = generateReviewPackMarkdown({
      user,
      periodLabel,
      startDate,
      endDate,
      journals,
      achievements,
      aiSynthesis,
      options: currentOptions,
    });
    const success = await copyToClipboard(md);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownloadMarkdown = () => {
    const md = generateReviewPackMarkdown({
      user,
      periodLabel,
      startDate,
      endDate,
      journals,
      achievements,
      aiSynthesis,
      options: currentOptions,
    });
    const cleanPeriod = (periodLabel || 'Review')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_');
    const cleanName = (user?.name || 'User')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_');
    const filename = `TRACE_Review_Pack_${cleanPeriod}_${cleanName}.md`;
    downloadFile(md, filename);
  };

  const handlePrint = () => {
    const oldTitle = document.title;
    const oldTheme = document.documentElement.getAttribute('data-theme');
    const cleanPeriod = (periodLabel || 'Review')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_');
    const cleanName = (user?.name || 'Professional')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .replace(/_+/g, '_');
    document.title = `TRACE_Review_Pack_${cleanPeriod}_${cleanName}`;

    // Force light parchment theme for clean paper print rendering
    document.documentElement.setAttribute('data-theme', 'light');
    document.body.classList.add('is-printing-review-pack');

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      document.body.classList.remove('is-printing-review-pack');
      if (oldTheme) {
        document.documentElement.setAttribute('data-theme', oldTheme);
      }
      document.title = oldTitle;
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup, { once: true });

    window.print();

    // Fallback timeout cleanup
    setTimeout(cleanup, 2500);
  };

  let sectionCount = 1;
  const synthesisNum = includeSynthesis ? sectionCount++ : null;
  const calendarNum = includeCalendar ? sectionCount++ : null;
  const achievementsNum = includeAchievements && achievements.length > 0 ? sectionCount++ : null;
  const categoriesNum = includeCategories && breakdown.items.length > 0 ? sectionCount++ : null;
  const journalsNum = includeJournals && journals.length > 0 ? sectionCount++ : null;

  return createPortal(
    <div
      className="review-pack-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Review Pack Exporter"
    >
      <div
        className="review-pack-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="review-pack-header">
          <div className="review-pack-title-group">
            <div className="review-pack-title">
              Review Pack Exporter
            </div>
            <div className="review-pack-subtitle">
              Export a structured performance summary for reviews, appraisals, and 1-on-1s.
            </div>
          </div>
          <button
            type="button"
            className="review-pack-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Section Inclusion Chips */}
        <div className="review-pack-options-bar">
          <span className="review-pack-options-label">Include Sections:</span>

          <label
            className={`review-pack-chip ${includeSynthesis ? 'review-pack-chip--active' : ''}`}
          >
            <input
              type="checkbox"
              checked={includeSynthesis}
              onChange={(e) => setIncludeSynthesisOverride(e.target.checked)}
              disabled={!aiSynthesis}
            />
            <span>Review Summary {aiSynthesis ? '' : '(No AI Draft)'}</span>
          </label>

          <label
            className={`review-pack-chip ${includeCalendar ? 'review-pack-chip--active' : ''}`}
          >
            <input
              type="checkbox"
              checked={includeCalendar}
              onChange={(e) => setIncludeCalendar(e.target.checked)}
            />
            <span>Activity & Contribution Timeline ({activeDays}d)</span>
          </label>

          <label
            className={`review-pack-chip ${includeAchievements ? 'review-pack-chip--active' : ''}`}
          >
            <input
              type="checkbox"
              checked={includeAchievements}
              onChange={(e) => setIncludeAchievements(e.target.checked)}
            />
            <span>Milestones & Supporting Evidence ({achievements.length})</span>
          </label>

          <label
            className={`review-pack-chip ${includeCategories ? 'review-pack-chip--active' : ''}`}
          >
            <input
              type="checkbox"
              checked={includeCategories}
              onChange={(e) => setIncludeCategories(e.target.checked)}
            />
            <span>Contribution Breakdown & Foundation Work ({breakdown.shadowWorkPct}%)</span>
          </label>

          <label
            className={`review-pack-chip ${includeJournals ? 'review-pack-chip--active' : ''}`}
          >
            <input
              type="checkbox"
              checked={includeJournals}
              onChange={(e) => setIncludeJournals(e.target.checked)}
            />
            <span>Journal Entries Archive ({journals.length})</span>
          </label>
        </div>

        {/* Live Editorial Sheet Preview */}
        <div className="review-pack-body">
          <div className="dossier-sheet" id="review-pack-dossier-sheet">
            {/* Meta Header */}
            <div className="dossier-meta-header">
              <div className="dossier-meta-top">
                <h1 className="dossier-title">Performance Review Pack</h1>
                <div className="dossier-period-tag">{periodLabel}</div>
              </div>

              <div className="dossier-meta-grid">
                <div className="dossier-meta-item">
                  <span className="dossier-meta-label">Candidate</span>
                  <span className="dossier-meta-value">
                    {user?.name || 'Professional Contributor'}
                  </span>
                </div>
                <div className="dossier-meta-item">
                  <span className="dossier-meta-label">Role / Team</span>
                  <span className="dossier-meta-value">
                    {user?.role ? user.role.toUpperCase() : 'CORE TEAM'}
                  </span>
                </div>
                <div className="dossier-meta-item">
                  <span className="dossier-meta-label">Appraisal Period</span>
                  <span className="dossier-meta-value">
                    {formatDate(startDate)} – {formatDate(endDate)}
                  </span>
                </div>
                <div className="dossier-meta-item">
                  <span className="dossier-meta-label">Documented Entries</span>
                  <span className="dossier-meta-value">
                    {journals.length} Entries · {activeDays} Active Days
                  </span>
                </div>
              </div>
            </div>

            {/* Section: Executive AI Synthesis */}
            {includeSynthesis && (
              <section className="dossier-section">
                <h2 className="dossier-section-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                  {synthesisNum}. Review Summary & Strategic Alignment
                </h2>
                {aiSynthesis ? (
                  <div className="dossier-synthesis-box">
                    <p className="dossier-summary-text">{aiSynthesis.summary}</p>
                    {aiSynthesis.strategicAlignment && (
                      <div>
                        <strong style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                          Strategic Business Alignment:
                        </strong>
                        <p style={{ marginTop: 4, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                          {aiSynthesis.strategicAlignment}
                        </p>
                      </div>
                    )}

                    <div className="dossier-subgrid">
                      {aiSynthesis.topImpacts && aiSynthesis.topImpacts.length > 0 && (
                        <div className="dossier-subitem">
                          <div className="dossier-subitem-title">Top Business Deliveries</div>
                          <div className="dossier-subitem-list">
                            {aiSynthesis.topImpacts.map((imp, idx) => (
                              <div key={idx}>
                                <strong>{imp.title}:</strong> {imp.description}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {aiSynthesis.metricHighlights && aiSynthesis.metricHighlights.length > 0 && (
                        <div className="dossier-subitem">
                          <div className="dossier-subitem-title">Metric Highlights</div>
                          <div className="dossier-subitem-list">
                            {aiSynthesis.metricHighlights.map((m, idx) => (
                              <div key={idx}>• {m}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="dossier-synthesis-box">
                    <p className="dossier-summary-text">
                      Over this period, {journals.length} contributions were recorded across {activeDays} active days with {achievements.length} milestones. Consistent technical execution and proactive alignment supported team objectives.
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* Section: Activity & Evidence Cadence */}
            {includeCalendar && (
              <section className="dossier-section dossier-calendar-section">
                <h2 className="dossier-section-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  {calendarNum}. Activity & Contribution Cadence
                </h2>
                <div className="dossier-section-subtitle">
                  Quarterly rhythm of daily journal captures and anchored milestone achievements.
                </div>
                <div className="dossier-calendar-box">
                  <ActivityCalendar
                    journals={journals}
                    achievements={achievements}
                    startDate={startDate}
                    endDate={endDate}
                    title="Contribution & Milestone Cadence"
                    compact={false}
                  />
                </div>
              </section>
            )}

            {/* Section: Milestones & Evidence Dossiers */}
            {includeAchievements && achievements.length > 0 && (
              <section className="dossier-section">
                <h2 className="dossier-section-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                    <path d="M4 22h16"></path>
                    <path d="M10 14.66V17c0 .55-.45 1-1 1H7"></path>
                    <path d="M14 14.66V17c0 .55.45 1 1 1h2"></path>
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                  </svg>
                  {achievementsNum}. Key Milestones & Supporting Evidence
                </h2>
                <div className="dossier-section-subtitle">
                  Significant accomplishments with documented impact and linked journals.
                </div>

                <div>
                  {sortedAchievements.map((a) => {
                    const linked = a.linked_journals || [];
                    return (
                      <div
                        key={a.id}
                        className={`dossier-achievement-card dossier-achievement-card--${a.importance || 'medium'}`}
                      >
                        <div className="dossier-achievement-header">
                          <div className="dossier-achievement-title">{a.title}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                              {formatDate(a.achieved_date || a.created_at)}
                            </span>
                            <ImportanceBadge level={a.importance || 'medium'} />
                          </div>
                        </div>

                        {a.description && (
                          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', margin: 0 }}>
                            {a.description}
                          </p>
                        )}

                        {a.impact && (
                          <div className="dossier-achievement-impact">
                            <strong>Business Impact:</strong> {a.impact}
                          </div>
                        )}

                        {linked.length > 0 && (
                          <div>
                            <div style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>
                              Supporting Evidence ({linked.length} linked {linked.length === 1 ? 'entry' : 'entries'}):
                            </div>
                            <div className="dossier-evidence-pills">
                              {linked.map((j) => (
                                <span key={j.id} className="dossier-evidence-pill">
                                  <span>📄</span>
                                  <span>{formatDate(j.entry_date)}</span>
                                  <strong>{j.title || `Entry #${j.id}`}</strong>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Section: Contribution Spectrum & Invisible Work */}
            {includeCategories && breakdown.items.length > 0 && (
              <section className="dossier-section">
                <h2 className="dossier-section-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                    <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                  </svg>
                  {categoriesNum}. Contribution Breakdown & Foundation Work Share
                </h2>
                <div className="dossier-section-subtitle">
                  Balanced breakdown across direct product features, architectural maintenance, and team enablement.
                </div>

                <table className="dossier-table">
                  <thead>
                    <tr>
                      <th>Contribution Category</th>
                      <th style={{ textAlign: 'center' }}>Total Entries</th>
                      <th style={{ textAlign: 'center' }}>Share</th>
                      <th>Work Classification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.items.map((item) => (
                      <tr key={item.cat}>
                        <td>
                          <strong>{item.label}</strong>
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                          {item.count}
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>
                          {item.pct}%
                        </td>
                        <td style={{ color: item.isShadowWork ? 'var(--amber)' : 'var(--text-secondary)' }}>
                          {item.isShadowWork ? 'Foundation / Maintenance / Enablement' : 'Direct Feature Delivery'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="dossier-shadow-callout">
                  <strong>Foundation Work ({breakdown.shadowWorkPct}%):</strong> {breakdown.shadowWorkCount} entries represent essential operational work, maintenance, and colleague support. Recognizing this foundational work provides a complete, fair record of your contributions.
                </div>
              </section>
            )}

            {/* Section: Evidence Logs */}
            {includeJournals && journals.length > 0 && (
              <section className="dossier-section">
                <h2 className="dossier-section-title">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                  </svg>
                  {journalsNum}. Journal Entries Archive ({journals.length} Entries)
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {journals.slice(0, 15).map((j) => (
                    <div key={j.id} className="dossier-log-item">
                      <div className="dossier-log-header">
                        <span className="dossier-log-date">{formatDate(j.entry_date)}</span>
                        <span className={`cat-pill cat-pill--${j.category || 'general'}`}>
                          {CATEGORIES[j.category] || j.category}
                        </span>
                        <span className="dossier-log-title">{j.title || 'Untitled'}</span>
                      </div>
                      {j.did_today && (
                        <div className="dossier-log-did">{j.did_today}</div>
                      )}
                    </div>
                  ))}
                  {journals.length > 15 && (
                    <div style={{ padding: '8px 0', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                      + {journals.length - 15} additional chronological entries in record.
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="review-pack-footer">
          <div className="review-pack-format-info">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            Print uses native browser formatting. Markdown ready for Notion, Lattice, or Google Docs.
          </div>

          <div className="review-pack-actions-right">
            <button
              id="btn-copy-markdown"
              type="button"
              className="btn btn--secondary"
              onClick={handleCopyMarkdown}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Copied Markdown!</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <span>Copy Markdown</span>
                </>
              )}
            </button>

            <button
              id="btn-download-markdown"
              type="button"
              className="btn btn--secondary"
              onClick={handleDownloadMarkdown}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span>Download .md</span>
            </button>

            <button
              id="btn-print-pdf"
              type="button"
              className="btn btn--primary"
              onClick={handlePrint}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              <span>Print / Save PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
