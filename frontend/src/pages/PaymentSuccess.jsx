import { Link, useSearchParams } from 'react-router-dom';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const orderNumber = params.get('order');

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <img src="/logo.png" alt="The Show Man" className="auth-logo" />
        <h1>Payment Successful</h1>
        <p>Your payment has been processed successfully.</p>
        {orderNumber && <p>Order: <strong>{orderNumber}</strong></p>}
        <Link to={`/order-confirmation/${orderNumber}`} className="btn btn-primary" style={{ marginTop: '1rem' }}>View Order</Link>
      </div>
    </div>
  );
}
