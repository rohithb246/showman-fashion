import './LoadingSpinner.css';

export default function LoadingSpinner({ fullPage = false }) {
  return (
    <div className={`loading-spinner-wrap ${fullPage ? 'full-page' : ''}`}>
      <div className="spinner" />
    </div>
  );
}
