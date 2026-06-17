import { Link, useSearchParams } from 'react-router-dom';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function PaymentSuccess() {
  const [params] = useSearchParams();
  const orderNumber = params.get('order');

  const confirmPayment = async () => {
    if (orderNumber) {
      await orderAPI.confirmPayment({
        order_number: orderNumber,
        transaction_id: `TXN-${Date.now()}`,
        success: true,
      });
      toast.success('Payment confirmed!');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <img src="/logo.png" alt="The Show Man" className="auth-logo" />
        <h1>Payment Successful</h1>
        <p>Your payment has been processed successfully.</p>
        {orderNumber && <p>Order: <strong>{orderNumber}</strong></p>}
        <button onClick={confirmPayment} className="btn btn-primary">Confirm Payment</button>
        <Link to={`/order-confirmation/${orderNumber}`} className="btn btn-outline" style={{ marginTop: '1rem' }}>View Order</Link>
      </div>
    </div>
  );
}
