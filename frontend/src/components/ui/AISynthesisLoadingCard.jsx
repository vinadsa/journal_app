import { useState, useEffect } from 'react';

const PHASES = [
  {
    step: 1,
    title: 'Extracting Evidence Traces',
    detail: 'Scanning journal logs, technical artifacts, and milestone achievements…',
  },
  {
    step: 2,
    title: 'Aligning with Target Cycle',
    detail: 'Cross-referencing contribution impact with organizational objectives…',
  },
  {
    step: 3,
    title: 'Composing Executive Synthesis',
    detail: 'Formulating executive-ready summary, strategic alignment, and blockers…',
  },
];

export default function AISynthesisLoadingCard({ periodLabel = 'Current Cycle' }) {
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setPhaseIndex(1), 850);
    const timer2 = setTimeout(() => setPhaseIndex(2), 1750);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const currentPhase = PHASES[phaseIndex];

  return (
    <div
      className="ai-synthesis-card ai-synthesis-loading-container animate-in"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Top Header */}
      <div className="synthesis-loading-header">
        <div className="synthesis-loading-identity">
          <div className="synthesis-loading-icon-badge">
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="synthesis-loading-sparkle"
            >
              <path d="M12 3v18m9-9H3" />
              <path d="M19 5l-14 14M5 5l14 14" />
            </svg>
          </div>
          <div>
            <div className="synthesis-loading-title">
              Synthesizing Executive Evidence
            </div>
            <div className="synthesis-loading-sub">
              TRACE AI Advocate • {periodLabel}
            </div>
          </div>
        </div>

        <div className="synthesis-loading-pill">
          <span className="synthesis-loading-pulse-dot" />
          <span>Analyzing Contributions</span>
        </div>
      </div>

      {/* Analytical Phase Tracker */}
      <div className="synthesis-loading-phases">
        {PHASES.map((p, idx) => {
          const isDone = idx < phaseIndex;
          const isCurrent = idx === phaseIndex;
          return (
            <div
              key={p.step}
              className={`synthesis-phase-step ${isDone ? 'is-done' : ''} ${
                isCurrent ? 'is-current' : ''
              }`}
            >
              <div className="synthesis-phase-marker">
                {isDone ? (
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span>{p.step}</span>
                )}
              </div>
              <div className="synthesis-phase-text">
                <div className="synthesis-phase-label">{p.title}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Phase Status Notice */}
      <div className="synthesis-active-status-bar">
        <span className="synthesis-status-spinner" />
        <span className="synthesis-status-detail">{currentPhase.detail}</span>
      </div>

      {/* Editorial Skeleton Shimmer Body */}
      <div className="synthesis-skeleton-body">
        {/* Paragraph Skeleton */}
        <div className="synthesis-skeleton-section">
          <div className="synthesis-skeleton-label-bar" />
          <div className="synthesis-skeleton-lines">
            <div className="synthesis-skeleton-line" style={{ width: '100%' }} />
            <div className="synthesis-skeleton-line" style={{ width: '92%' }} />
            <div className="synthesis-skeleton-line" style={{ width: '74%' }} />
          </div>
        </div>

        {/* Bento Grid Skeleton */}
        <div className="synthesis-skeleton-grid">
          <div className="synthesis-skeleton-box">
            <div className="synthesis-skeleton-box-title" />
            <div className="synthesis-skeleton-line" style={{ width: '85%' }} />
            <div className="synthesis-skeleton-line" style={{ width: '65%' }} />
          </div>
          <div className="synthesis-skeleton-box">
            <div className="synthesis-skeleton-box-title" />
            <div className="synthesis-skeleton-line" style={{ width: '90%' }} />
            <div className="synthesis-skeleton-line" style={{ width: '70%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
