import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../api';
import { FOUNDATION_PILLARS } from '../../lib/foundationWorkUtils';
import '../../styles/RecognitionModal.css';

export default function RecognitionModal({
  isOpen,
  onClose,
  member,
  kpiPeriodId,
  onSuccess
}) {
  const [message, setMessage] = useState('');
  const [selectedPillar, setSelectedPillar] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Lock scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !member) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please provide a message.');
      return;
    }
    if (!selectedPillar) {
      setError('Please select a foundation pillar.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await api.createRecognition({
        target_user_id: member.id,
        message: message.trim(),
        pillar: selectedPillar,
        kpi_period_id: kpiPeriodId || undefined
      });
      onSuccess?.();
      onClose();
      setMessage('');
      setSelectedPillar('');
    } catch (err) {
      setError(err.message || 'Failed to send recognition.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div className="recognition-overlay" onClick={onClose}>
      <div className="recognition-modal animate-in fade-in zoom-in" onClick={e => e.stopPropagation()}>
        <div className="recognition-modal-header">
          <h2>Acknowledge Foundation Work</h2>
          <button className="recognition-close" onClick={onClose} aria-label="Close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="recognition-modal-form">
          <p className="recognition-desc">
            Send a private acknowledgment to <strong>{member.name}</strong> for their foundation work. This will appear on their dashboard recognizing their contributions.
          </p>

          {error && <div className="recognition-error">{error}</div>}

          <div className="form-group">
            <label>Foundation Pillar</label>
            <div className="recognition-pillar-select">
              <select
                value={selectedPillar}
                onChange={e => setSelectedPillar(e.target.value)}
                disabled={isSubmitting}
                required
              >
                <option value="" disabled>Select the primary area of impact...</option>
                {Object.entries(FOUNDATION_PILLARS).map(([id, pillar]) => (
                  <option key={id} value={id}>
                    {pillar.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="E.g., Thank you for taking the time to mentor the new hires and clearing out the legacy technical debt in the payment service this month..."
              rows={4}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="recognition-modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Acknowledgment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
