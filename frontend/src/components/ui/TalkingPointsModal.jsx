import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { generateTalkingPointsMarkdown, copyToClipboard } from '../../lib/reviewPackUtils';

export default function TalkingPointsModal({
  isOpen,
  onClose,
  user,
  journals = [],
  achievements = [],
}) {
  const [daysBack, setDaysBack] = useState(7);
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

  const talkingPointsText = useMemo(() => {
    return generateTalkingPointsMarkdown({
      user,
      journals,
      achievements,
      daysBack,
    });
  }, [user, journals, achievements, daysBack]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    const success = await copyToClipboard(talkingPointsText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return createPortal(
    <div
      className="review-pack-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="1-on-1 Talking Points Copier"
    >
      <div
        className="talking-points-dialog"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="review-pack-header">
          <div className="review-pack-title-group">
            <div className="review-pack-title">
              1-on-1 Talking Points
              <span className="review-pack-badge">Sync Ready</span>
            </div>
            <div className="review-pack-subtitle">
              Key accomplishments, foundation work, and blockers formatted for Slack or manager 1-on-1s.
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

        {/* Timeframe Chips */}
        <div className="review-pack-options-bar">
          <span className="review-pack-options-label">Timeframe:</span>
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              type="button"
              className={`review-pack-chip ${daysBack === days ? 'review-pack-chip--active' : ''}`}
              onClick={() => setDaysBack(days)}
            >
              Past {days} Days
            </button>
          ))}
        </div>

        <div className="review-pack-body">
          <div className="talking-points-code-box" id="talking-points-preview">
            {talkingPointsText}
          </div>
        </div>

        <div className="review-pack-footer">
          <div className="review-pack-format-info">
            Formatted for Slack markdown and Google Docs 1-on-1 notes.
          </div>

          <div className="review-pack-actions-right">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onClose}
            >
              Close
            </button>
            <button
              id="btn-copy-talking-points"
              type="button"
              className="btn btn--primary"
              onClick={handleCopy}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {copied ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  <span>Copied for Slack / 1-on-1!</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                  <span>Copy to Clipboard</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
