import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { calculateFoundationMetrics, FOUNDATION_PILLARS } from '../../lib/foundationWorkUtils';
import IWQSparkline from './IWQSparkline';
import './FoundationWorkCard.css';

export default function FoundationWorkCard({
  journals = [],
  variant = 'compact',
  title = 'Work Distribution',
  showNarrative = true,
  trendData = null,
}) {
  const metrics = useMemo(() => calculateFoundationMetrics(journals), [journals]);


  const {
    totalEntries,
    foundationCount,
    featureCount,
    iwqPercentage,
    pillars,
    editorialNarrative,
  } = metrics;

  const featurePct = 100 - iwqPercentage;

  return (
    <div className={`fw-card fw-card--${variant}`}>
      <div className="fw-card-header">
        <div className="fw-card-title-group">
          <span className="fw-card-tag">{title}</span>
        </div>
        <div
          className="fw-card-iwq-badge"
          data-tooltip-align="right"
          data-tooltip="Invisible Work Quotient (IWQ):&#10;Percentage of work dedicated to foundation, maintenance, and team enablement (e.g., refactoring, code reviews, incident triage). Ensures invisible work is visible during performance reviews."
        >
          <span>{iwqPercentage}% Foundation</span>
        </div>
      </div>

      {/* Balance Bar: Feature Delivery vs Foundation Work */}
      <div className="fw-ratio-container">
        <div
          className="fw-ratio-track"
          title={`${featurePct}% Feature Delivery (${featureCount} entries), ${iwqPercentage}% Foundation Work (${foundationCount} entries)`}
        >
          <div
            className="fw-ratio-segment fw-ratio-segment--feature"
            style={{ width: `${Math.max(3, featurePct)}%` }}
          />
          <div
            className="fw-ratio-segment fw-ratio-segment--foundation"
            style={{ width: `${Math.max(3, iwqPercentage)}%` }}
          />
        </div>
        <div className="fw-ratio-labels">
          <div className="fw-ratio-item">
            <span className="fw-ratio-dot fw-ratio-dot--feature" />
            <span>Direct Delivery ({featurePct}%)</span>
          </div>
          <div className="fw-ratio-item">
            <span className="fw-ratio-dot fw-ratio-dot--foundation" />
            <span>Foundation Work ({iwqPercentage}%)</span>
          </div>
        </div>
      </div>

      {/* 4 Pillars Breakdown Grid */}
      <div className="fw-pillars-grid">
        {Object.entries(FOUNDATION_PILLARS).map(([pillarId, config]) => {
          const stat = pillars[pillarId] || { count: 0, pct: 0 };
          const firstTag = config.tags[0];

          return (
            <Link
              key={pillarId}
              to={`/search?tag=${firstTag}`}
              className="fw-pillar-item"
              title={`View ${stat.count} entries in ${config.label} (#${firstTag})`}
            >
              <div className="fw-pillar-item-top">
                <span
                  className="fw-pillar-icon-indicator"
                  style={{ background: config.colorToken }}
                />
                <span className="fw-pillar-count">{stat.count}</span>
              </div>
              <div className="fw-pillar-label">{config.shortLabel}</div>
              <div className="fw-pillar-desc">
                {stat.count} {stat.count === 1 ? 'entry' : 'entries'} · {config.tags.slice(0, 2).map(t => `#${t}`).join(' ')}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Sparkline Trend (if provided) */}
      {trendData && trendData.length > 0 && (
        <IWQSparkline data={trendData} />
      )}

      {/* Grounded Editorial Narrative */}
      {showNarrative && totalEntries > 0 && (
        <div className="fw-narrative-box">
          <div className="fw-narrative-title">Impact Assessment</div>
          <p style={{ margin: 0 }}>{editorialNarrative}</p>
        </div>
      )}
    </div>
  );
}
