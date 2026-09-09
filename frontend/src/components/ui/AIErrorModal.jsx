import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Categorizes and extracts actionable diagnostics from AI synthesis errors.
 */
function diagnoseError(errorMsg = '') {
  const msg = String(errorMsg).toLowerCase();

  if (
    msg.includes('invalid custom gemini api key') ||
    msg.includes('api_key_invalid') ||
    msg.includes('api key not valid') ||
    msg.includes('unauthorized') ||
    msg.includes('forbidden') ||
    msg.includes('401') ||
    msg.includes('403')
  ) {
    return {
      type: 'auth',
      badge: 'Authentication Error',
      title: 'Invalid or Unauthorized API Key',
      description: 'The Gemini API rejected the request due to an invalid format or unauthorized credentials.',
      tips: [
        'If you entered a custom Gemini key (BYOK), ensure it starts with AIzaSy... with no spaces or line breaks.',
        'You can clear your custom key in the configuration modal to fall back to the system default key.',
        'Verify that the Google AI Studio project has the Generative Language API enabled.',
      ],
      showConfigAction: true,
    };
  }

  if (
    msg.includes('429') ||
    msg.includes('quota') ||
    msg.includes('exhausted') ||
    msg.includes('rate limit')
  ) {
    return {
      type: 'rate_limit',
      badge: 'Rate Limit / Quota',
      title: 'Gemini Quota Exceeded',
      description: 'The request exceeded the rate limit or quota allowance for the active API key.',
      tips: [
        'Free-tier Gemini API keys are throttled to 15 requests per minute. Wait 60 seconds before retrying.',
        'Consider supplying your own Gemini API key (BYOK) with billing enabled to avoid shared limits.',
      ],
      showConfigAction: true,
    };
  }

  if (
    msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('500') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('failed to fetch')
  ) {
    return {
      type: 'network',
      badge: 'Connection Error',
      title: 'Service Temporarily Unreachable',
      description: 'The AI synthesis service or upstream network connection was temporarily interrupted.',
      tips: [
        'Verify your local internet connectivity and that the backend server is running.',
        'Upstream Google AI endpoints may be experiencing momentary latency. Try again shortly.',
      ],
      showConfigAction: false,
    };
  }

  return {
    type: 'general',
    badge: 'Synthesis Failed',
    title: 'Unable to Generate Review Summary',
    description: 'An unexpected issue occurred while synthesizing your journal entries and achievements.',
    tips: [
      'Ensure there are recorded journal entries or achievements in the selected timeframe.',
      'Try narrowing your review date range or simplifying targeted focus questions.',
    ],
    showConfigAction: true,
  };
}

export default function AIErrorModal({
  isOpen,
  error,
  onClose,
  onRetry,
  onOpenConfig,
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = origOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !error) return null;

  const rawMessage = typeof error === 'string' ? error : error?.message || 'Unknown error occurred';
  const diagnosis = diagnoseError(rawMessage);

  const handleCopyDetails = async () => {
    try {
      await navigator.clipboard.writeText(rawMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return createPortal(
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-error-title"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(10, 14, 20, 0.72)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1100,
        padding: 'var(--space-4)',
      }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--radius-xl)',
          padding: '28px 32px',
          boxShadow: '0 24px 64px -12px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                backgroundColor: 'var(--burgundy-faint)',
                color: 'var(--burgundy)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-xs)',
                    letterSpacing: 'var(--tracking-wide)',
                    color: 'var(--burgundy)',
                    backgroundColor: 'var(--burgundy-faint)',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  {diagnosis.badge}
                </span>
              </div>
              <h2
                id="ai-error-title"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-xl)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  margin: 0,
                  lineHeight: 1.25,
                }}
              >
                {diagnosis.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close error modal"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-tertiary)',
              cursor: 'pointer',
              padding: 4,
              fontSize: 18,
              lineHeight: 1,
              borderRadius: 'var(--radius-sm)',
              transition: 'color var(--duration-fast)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Description */}
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
          {diagnosis.description}
        </p>

        {/* Actionable Guidance / Suggested Steps */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
          }}
        >
          <div
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 'var(--tracking-wide)',
              color: 'var(--text-tertiary)',
              marginBottom: 8,
            }}
          >
            Suggested Actions
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {diagnosis.tips.map((tip, idx) => (
              <li
                key={idx}
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-primary)',
                  lineHeight: 1.45,
                  listStyleType: 'disc',
                }}
              >
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Raw Technical Details Disclosure */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-tertiary)',
                fontSize: 'var(--text-xs)',
                cursor: 'pointer',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                textDecoration: 'underline',
              }}
            >
              <span>{showDetails ? 'Hide technical details' : 'Show technical details'}</span>
              <span style={{ fontSize: 10 }}>{showDetails ? '▲' : '▼'}</span>
            </button>

            {showDetails && (
              <button
                type="button"
                onClick={handleCopyDetails}
                style={{
                  background: 'none',
                  border: 'none',
                  color: copied ? 'var(--sage, #10b981)' : 'var(--text-tertiary)',
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {copied ? 'Copied' : 'Copy details'}
              </button>
            )}
          </div>

          {showDetails && (
            <pre
              style={{
                marginTop: 8,
                padding: 12,
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--text-secondary)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                maxHeight: 120,
                overflowY: 'auto',
                lineHeight: 1.4,
              }}
            >
              {rawMessage}
            </pre>
          )}
        </div>

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 12,
            paddingTop: 8,
            borderTop: '1px solid var(--border)',
          }}
        >
          <button
            type="button"
            className="btn btn--secondary"
            onClick={onClose}
            id="btn-ai-error-dismiss"
          >
            Dismiss
          </button>

          {diagnosis.showConfigAction && onOpenConfig && (
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onOpenConfig}
              id="btn-ai-error-config"
            >
              Configure Key
            </button>
          )}

          {onRetry && (
            <button
              type="button"
              className="btn btn--primary"
              onClick={onRetry}
              id="btn-ai-error-retry"
              style={{
                backgroundColor: 'var(--burgundy)',
                borderColor: 'var(--burgundy)',
              }}
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
