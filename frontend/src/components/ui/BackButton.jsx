import { useNavigate } from 'react-router-dom';

export default function BackButton({ fallback = '/dashboard', label = 'Back', className = '' }) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`page-back-btn ${className}`}
      title={label}
      aria-label={label}
    >
      <svg
        className="page-back-btn__icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      {label && <span className="page-back-btn__label">{label}</span>}
    </button>
  );
}
