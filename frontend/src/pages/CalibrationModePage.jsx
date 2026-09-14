import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../lib/dateUtils';
import { generateCalibrationMarkdown, copyToClipboard, downloadAsFile } from '../lib/calibrationExportUtils';
import ImportanceBadge from '../components/ui/ImportanceBadge';
import IWQSparkline from '../components/ui/IWQSparkline';
import RecognitionModal from '../components/ui/RecognitionModal';
import '../styles/CalibrationMode.css';

export default function CalibrationModePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const periodType = searchParams.get('period') || 'kpi';
  const kpiId = searchParams.get('kpiId');

  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(null);
  const [members, setMembers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [notesMap, setNotesMap] = useState({});
  const [trendMap, setTrendMap] = useState({}); // userId -> trendData
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isRecognitionModalOpen, setIsRecognitionModalOpen] = useState(false);
  
  // Note auto-save state
  const [noteText, setNoteText] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const saveTimeoutRef = useRef(null);
  
  const [exportCopied, setExportCopied] = useState(false);

  // Load Team Overview
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const teamParams = { period: periodType };
        if (periodType === 'kpi' && kpiId) {
          teamParams.kpi_period_id = parseInt(kpiId, 10);
        }

        const [teamRes, notesRes] = await Promise.all([
          api.getTeamOverview(teamParams),
          api.getCalibrationNotes(teamParams.kpi_period_id)
        ]);

        setTeam(teamRes.team);
        setMembers(teamRes.members || []);
        setSummary(teamRes.summary);
        setRecentAchievements(teamRes.recent_achievements || []);

        const notes = {};
        if (notesRes.notes) {
          notesRes.notes.forEach(n => {
            notes[n.target_user_id] = n.note;
          });
        }
        setNotesMap(notes);

      } catch (err) {
        console.error('Failed to load calibration data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [periodType, kpiId]);

  // Load IWQ Trend for current member
  useEffect(() => {
    if (members.length === 0 || currentStep >= members.length) return;
    
    const member = members[currentStep];
    
    // Sync note text
    setNoteText(notesMap[member.id] || '');
    setNoteSaved(false);

    // Fetch trend if not already fetched
    if (!trendMap[member.id]) {
      api.getUserIWQTrend(member.id).then(data => {
        setTrendMap(prev => ({ ...prev, [member.id]: data }));
      }).catch(err => console.error(err));
    }
  }, [currentStep, members, notesMap, trendMap]);

  // Save Note Logic
  const handleNoteChange = (e) => {
    const val = e.target.value;
    setNoteText(val);
    setNoteSaving(true);
    setNoteSaved(false);

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      const member = members[currentStep];
      if (!member) return;
      try {
        await api.upsertCalibrationNote({
          target_user_id: member.id,
          kpi_period_id: (periodType === 'kpi' && kpiId) ? parseInt(kpiId, 10) : undefined,
          note: val
        });
        setNotesMap(prev => ({ ...prev, [member.id]: val }));
        setNoteSaved(true);
      } catch (err) {
        console.error('Failed to save note:', err);
      } finally {
        setNoteSaving(false);
      }
    }, 1000);
  };

  const handleNext = () => {
    if (currentStep < members.length) {
      setCurrentStep(c => c + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(c => c - 1);
    }
  };

  const handleClose = () => {
    navigate('/team');
  };

  const handleExportCopy = async () => {
    const markdown = generateCalibrationMarkdown({
      periodLabel: periodType === 'kpi' ? 'Selected KPI Period' : 'Current Quarter',
      managerName: user?.name || 'Manager',
      teamName: team?.name || 'Engineering Team',
      summary,
      members,
      notesMap,
      recentAchievements
    });
    
    const success = await copyToClipboard(markdown);
    if (success) {
      setExportCopied(true);
      setTimeout(() => setExportCopied(false), 2500);
    }
  };

  const handleExportDownload = () => {
    const markdown = generateCalibrationMarkdown({
      periodLabel: periodType === 'kpi' ? 'Selected KPI Period' : 'Current Quarter',
      managerName: user?.name || 'Manager',
      teamName: team?.name || 'Engineering Team',
      summary,
      members,
      notesMap,
      recentAchievements
    });
    downloadAsFile(markdown, 'calibration-summary.md');
  };

  if (loading) {
    return <div className="calibration-loading">Initializing Calibration Mode...</div>;
  }

  if (members.length === 0) {
    return (
      <div className="calibration-empty">
        <h2>No team members found.</h2>
        <button className="btn btn-primary" onClick={handleClose}>Back to Team Overview</button>
      </div>
    );
  }

  const isSummaryStep = currentStep === members.length;
  const currentMember = isSummaryStep ? null : members[currentStep];
  const progressPct = ((currentStep) / members.length) * 100;

  return (
    <div className="calibration-wizard-container">
      {/* Header & Progress */}
      <header className="calibration-header">
        <div className="calibration-header-top">
          <div className="calibration-title">
            <h2>{team?.name || 'Team'} Calibration</h2>
            <span className="calibration-subtitle">Review Calibration</span>
          </div>
          <button className="calibration-close-btn" onClick={handleClose} title="Exit Calibration">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="calibration-progress-bar">
          <div className="calibration-progress-fill" style={{ width: `${progressPct}%` }} />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="calibration-main">
        {isSummaryStep ? (
          // SUMMARY STEP
          <div className="calibration-step-summary animate-in fade-in">
            <div className="summary-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h2>Calibration Complete</h2>
            <p className="summary-desc">You have reviewed {members.length} team members. Your private calibration notes are saved and ready to be exported for your performance review packet.</p>
            
            <div className="summary-actions">
              <button className="btn btn-secondary" onClick={handleExportCopy}>
                {exportCopied ? 'Copied!' : 'Copy as Markdown'}
              </button>
              <button className="btn btn-secondary" onClick={handleExportDownload}>
                Download .md
              </button>
              <button className="btn btn-primary" onClick={handleClose}>
                Finish & Exit
              </button>
            </div>
          </div>
        ) : (
          // MEMBER STEP
          <div className="calibration-step-member animate-in fade-in" key={currentMember.id}>
            <div className="member-header">
              <div className="member-avatar">{currentMember.name.charAt(0).toUpperCase()}</div>
              <div className="member-meta">
                <h2>{currentMember.name}</h2>
                <div className="member-stats-row">
                  <span>{currentMember.total_journals} entries</span>
                  <span>·</span>
                  <span>{currentMember.active_days} active days</span>
                </div>
              </div>
            </div>

            <div className="member-layout">
              {/* Left Column: Data & Evidence */}
              <div className="member-column-data">
                
                {/* IWQ & Trend */}
                <div className="calibration-card">
                  <h3>Work Distribution</h3>
                  <div className="drawer-iwq-bar">
                    <div 
                       className="drawer-iwq-segment drawer-iwq-feature"
                      style={{ width: `${100 - currentMember.iwq_percentage}%` }}
                    />
                    <div 
                      className="drawer-iwq-segment drawer-iwq-foundation"
                      style={{ width: `${currentMember.iwq_percentage}%` }}
                    />
                  </div>
                  <div className="drawer-iwq-legend" style={{ marginTop: '12px' }}>
                    <div className="drawer-iwq-legend-item">
                      <span className="drawer-iwq-dot" style={{ background: 'var(--color-feature)' }} />
                      Feature Execution ({100 - currentMember.iwq_percentage}%)
                    </div>
                    <div className="drawer-iwq-legend-item">
                      <span className="drawer-iwq-dot" style={{ background: 'var(--color-foundation)' }} />
                      Foundation Work ({currentMember.iwq_percentage}%)
                    </div>
                  </div>
                  
                  {trendMap[currentMember.id]?.length > 0 && (
                    <div style={{ marginTop: '20px' }}>
                      <IWQSparkline data={trendMap[currentMember.id]} height={50} />
                    </div>
                  )}
                </div>

                {/* Key Achievements */}
                <div className="calibration-card">
                  <h3>Key Achievements</h3>
                  {(() => {
                    const memberAchievements = (recentAchievements || []).filter(a => a.user_id === currentMember.id);
                    if (memberAchievements.length === 0) {
                      return <div className="calibration-empty-state">No achievements recorded in this period.</div>;
                    }
                    return (
                      <div className="calibration-list">
                        {memberAchievements.slice(0, 4).map(ach => (
                          <div key={ach.id} className="calibration-list-item">
                            <ImportanceBadge level={ach.importance || 'medium'} />
                            <span className="calibration-item-title">{ach.title}</span>
                            <span className="calibration-item-date">{formatDate(ach.achieved_date)}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Right Column: Evaluation & Action */}
              <div className="member-column-action">
                <div className="calibration-card eval-card">
                  <div className="eval-header">
                    <h3>Calibration Note</h3>
                    <span className="drawer-note-status">
                      {noteSaving ? (
                        <span className="drawer-note-saving">Saving…</span>
                      ) : noteSaved ? (
                        <span className="drawer-note-saved">Saved</span>
                      ) : null}
                    </span>
                  </div>
                  <textarea
                    className="drawer-note-textarea eval-textarea"
                    value={noteText}
                    onChange={handleNoteChange}
                    placeholder={`Summarize ${currentMember.name}'s performance...`}
                    rows={8}
                  />
                  <div className="drawer-note-hint">
                    Private note, auto-saved. Will be included in the final markdown export.
                  </div>
                </div>

                <div className="calibration-card acknowledge-card">
                  <h3>Foundation Acknowledgment</h3>
                  <p>Send a private acknowledgment to {currentMember.name} recognizing their foundation contributions.</p>
                  <button className="btn btn-secondary" onClick={() => setIsRecognitionModalOpen(true)}>
                    Acknowledge Work
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="calibration-footer">
        <button 
          className="btn btn-secondary" 
          onClick={handlePrev} 
          disabled={currentStep === 0}
        >
          ← Previous
        </button>
        
        <div className="calibration-step-indicator">
          {isSummaryStep ? 'Summary' : `Member ${currentStep + 1} of ${members.length}`}
        </div>

        <button 
          className="btn btn-primary" 
          onClick={handleNext}
          disabled={isSummaryStep}
        >
          {currentStep === members.length - 1 ? 'Finish Calibration' : 'Next Member →'}
        </button>
      </footer>

      {currentMember && (
        <RecognitionModal
          isOpen={isRecognitionModalOpen}
          onClose={() => setIsRecognitionModalOpen(false)}
          member={currentMember}
          kpiPeriodId={kpiId ? parseInt(kpiId, 10) : null}
        />
      )}
    </div>
  );
}
