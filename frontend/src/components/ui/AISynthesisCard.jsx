import { useState } from 'react';

const icons = {
  sparkle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18m9-9H3" />
      <path d="M19 5l-14 14M5 5l14 14" />
    </svg>
  ),
  copy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  target: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  chart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  plant: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22V12" />
      <path d="M12 12C12 7.58172 15.5817 4 20 4C20 4 20 8.41828 20 12C15.5817 12 12 12 12 12Z" />
      <path d="M12 12C12 7.58172 8.41828 4 4 4C4 4 4 8.41828 4 12C8.41828 12 12 12 12 12Z" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  arrow: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  lightbulb: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2v1" />
      <path d="M12 7v1" />
      <path d="M15 18a4 4 0 0 0-4-4V7a4 4 0 0 0-4 4" />
      <path d="M12 7a5 5 0 1 1-5 5" />
    </svg>
  )
};

export default function AISynthesisCard({ synthesis }) {
  const [copied, setCopied] = useState(false);

  if (!synthesis) return null;

  const handleCopy = () => {
    const textToCopy = synthesis.rawMarkdown || synthesis.summary;
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(textToCopy).catch(() => {});
      }
    } catch {
      // ignore
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const BentoBox = ({ title, icon, color, children, style = {} }) => (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '20px',
      ...style
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ width: 16, height: 16, color: `var(--${color})`, display: 'inline-flex' }}>
          {icons[icon]}
        </span>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
          {title}
        </h3>
      </div>
      <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: '1.6' }}>
        {children}
      </div>
    </div>
  );

  return (
    <div className="ai-synthesis-card animate-in" style={{
      background: 'linear-gradient(to bottom right, var(--bg-elevated), var(--bg-surface))',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
      marginBottom: '32px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255,255,255,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, var(--accent), var(--teal-muted))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white',
            boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
          }}>
            <span style={{ width: 16, height: 16, display: 'inline-flex', transform: 'rotate(45deg)' }}>
              {icons.sparkle}
            </span>
          </div>
          <div>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              AI Review Summary
            </h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', margin: '2px 0 0 0', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Performance Review Auto-Draft
            </p>
          </div>
        </div>

        <button 
          type="button" 
          className="action-btn-ghost" 
          onClick={handleCopy}
          title="Copy Markdown to Clipboard"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        >
          <span style={{ width: 14, height: 14, display: 'inline-flex' }}>
            {copied ? icons.check : icons.copy}
          </span>
          <span>{copied ? 'Copied Markdown!' : 'Copy to Clipboard'}</span>
        </button>
      </div>

      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Top Section: Overview & Alignment */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }}>
          <div>
            <h3 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, fontWeight: 600 }}>
              Executive Summary
            </h3>
            <p style={{ fontSize: 'var(--text-base)', lineHeight: '1.7', color: 'var(--text-primary)', margin: 0 }}>
              {synthesis.summary}
            </p>
          </div>
          
          {synthesis.strategicAlignment && (
            <BentoBox title="Strategic Alignment" icon="target" color="accent" style={{ background: 'rgba(56, 189, 248, 0.03)' }}>
              {synthesis.strategicAlignment}
            </BentoBox>
          )}
        </div>

        {/* Bento Grid layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          
          <BentoBox title="Top Business Impacts" icon="bolt" color="amber">
            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {synthesis.topImpacts?.map((impact, idx) => (
                <li key={idx}><strong>{impact.title}</strong>: {impact.description}</li>
              ))}
            </ul>
          </BentoBox>

          <BentoBox title="Metric Highlights" icon="chart" color="emerald">
            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {synthesis.metricHighlights?.map((metric, idx) => (
                <li key={idx}>{metric}</li>
              ))}
            </ul>
          </BentoBox>

          <BentoBox title="Key Blockers & Friction" icon="warning" color="rose-dusty">
            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {synthesis.recurringBlockers?.length > 0 ? (
                synthesis.recurringBlockers.map((blocker, idx) => (
                  <li key={idx}>{blocker}</li>
                ))
              ) : (
                <span style={{ fontStyle: 'italic', color: 'var(--text-tertiary)' }}>No significant recurring blockers.</span>
              )}
            </ul>
          </BentoBox>

          <BentoBox title="Growth Areas" icon="plant" color="lime">
            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {synthesis.growthAreas?.map((growth, idx) => (
                <li key={idx}>{growth}</li>
              ))}
            </ul>
          </BentoBox>

        </div>

        {/* Bottom span section */}
        {(synthesis.keyCollaborators || synthesis.nextQuarterFocus) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
            {synthesis.keyCollaborators && (
              <BentoBox title="Key Collaborators" icon="users" color="indigo">
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {synthesis.keyCollaborators.map((collab, idx) => (
                    <span key={idx} style={{ 
                      background: 'var(--bg-surface)', 
                      padding: '4px 10px', 
                      borderRadius: '100px', 
                      fontSize: '12px',
                      border: '1px solid var(--border)'
                    }}>
                      {collab}
                    </span>
                  ))}
                </div>
              </BentoBox>
            )}

            {synthesis.nextQuarterFocus && (
              <BentoBox title="Next Quarter Focus" icon="arrow" color="violet">
                {synthesis.nextQuarterFocus}
              </BentoBox>
            )}
          </div>
        )}

        {/* Targeted Insights Section */}
        {synthesis.targetedInsights && (
          <BentoBox title="Targeted Insights" icon="lightbulb" color="amber" style={{ background: 'linear-gradient(to right, rgba(251, 191, 36, 0.05), transparent)' }}>
            <div style={{ whiteSpace: 'pre-line' }}>
              {synthesis.targetedInsights}
            </div>
          </BentoBox>
        )}

      </div>
    </div>
  );
}
