import { Link, useParams } from 'react-router-dom';

export default function OrderConfirmation() {
  const { orderNumber } = useParams();
  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <img src="/showman-monogram-black.png" alt="The Show Man" className="auth-logo" />
        <h1>Order Confirmed!</h1>
        <p>Thank you for shopping with The Show Man.</p>
        <p><strong>Order: {orderNumber}</strong></p>
        <Link to="/dashboard" className="btn btn-primary">View Orders</Link>
        <Link to="/shop" className="btn btn-outline" style={{ marginTop: '1rem' }}>Continue Shopping</Link>
      </div>
    </div>
  );
}
