import { Link, useSearchParams } from 'react-router-dom';

export default function PaymentFailure() {
  const [params] = useSearchParams();
  const orderNumber = params.get('order');

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <img src="/showman-monogram-black.png" alt="The Show Man" className="auth-logo" />
        <h1>Payment Failed</h1>
        <p>Unfortunately, your payment could not be processed.</p>
        {orderNumber && <p>Order: <strong>{orderNumber}</strong></p>}
        <Link to="/checkout" className="btn btn-primary">Try Again</Link>
        <Link to="/" className="btn btn-outline" style={{ marginTop: '1rem' }}>Go Home</Link>
      </div>
    </div>
  );
}
