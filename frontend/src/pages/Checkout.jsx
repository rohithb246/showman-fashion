import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI, orderAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import ProtectedRoute from '../components/ProtectedRoute';
import './Checkout.css';

function CheckoutContent() {
  const navigate = useNavigate();
  const { cart, fetchCart } = useCart();
  const [addresses, setAddresses] = useState([]);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    shipping_name: '', shipping_phone: '', shipping_address: '',
    shipping_city: '', shipping_state: '', shipping_postal_code: '',
    shipping_country: 'India', payment_provider: 'cod', notes: '',
  });

  useEffect(() => {
    authAPI.addresses().then((r) => {
      setAddresses(r.data.results || r.data);
      const defaultAddr = (r.data.results || r.data).find((a) => a.is_default);
      if (defaultAddr) {
        setForm((f) => ({
          ...f,
          shipping_name: defaultAddr.full_name,
          shipping_phone: defaultAddr.phone,
          shipping_address: `${defaultAddr.address_line1}${defaultAddr.address_line2 ? ', ' + defaultAddr.address_line2 : ''}`,
          shipping_city: defaultAddr.city,
          shipping_state: defaultAddr.state,
          shipping_postal_code: defaultAddr.postal_code,
          shipping_country: defaultAddr.country,
        }));
      }
    });
    orderAPI.paymentConfig().then((r) => setPaymentConfig(r.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await orderAPI.checkout(form);
      await fetchCart();
      if (form.payment_provider === 'cod') {
        navigate(`/order-confirmation/${data.order_number}`);
      } else {
        navigate(`/payment/${form.payment_provider}?order=${data.order_number}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = Number(cart?.subtotal || 0);
  const shipping = subtotal >= 999 ? 0 : 99;
  const tax = subtotal * 0.18;

  return (
    <form className="checkout-layout" onSubmit={handleSubmit}>
      <div className="checkout-form">
        <h2>Shipping Details</h2>
        {['shipping_name', 'shipping_phone', 'shipping_address', 'shipping_city', 'shipping_state', 'shipping_postal_code'].map((field) => (
          <div key={field} className="form-group">
            <label>{field.replace('shipping_', '').replace('_', ' ')}</label>
            <input
              className="form-input"
              required
              value={form[field]}
              onChange={(e) => setForm({ ...form, [field]: e.target.value })}
            />
          </div>
        ))}

        <h2 style={{ marginTop: '2rem' }}>Payment Method</h2>
        <div className="payment-options">
          {['cod', 'razorpay', 'stripe'].map((p) => (
            <label key={p} className={`payment-option ${form.payment_provider === p ? 'active' : ''}`}>
              <input
                type="radio"
                name="payment"
                value={p}
                checked={form.payment_provider === p}
                onChange={(e) => setForm({ ...form, payment_provider: e.target.value })}
              />
              {p === 'cod' ? 'Cash on Delivery' : p.charAt(0).toUpperCase() + p.slice(1)}
            </label>
          ))}
        </div>
        {paymentConfig && form.payment_provider !== 'cod' && (
          <p className="payment-note">Payment gateway integration ready. Configure API keys in backend .env</p>
        )}
      </div>

      <div className="checkout-summary glass-card">
        <h3>Order Summary</h3>
        <div className="summary-row"><span>Items ({cart?.item_count})</span><span>₹{subtotal.toLocaleString()}</span></div>
        <div className="summary-row"><span>Shipping</span><span>{shipping ? `₹${shipping}` : 'Free'}</span></div>
        <div className="summary-row"><span>Tax</span><span>₹{tax.toFixed(0)}</span></div>
        <div className="summary-row total"><span>Total</span><span>₹{(subtotal + shipping + tax).toFixed(0)}</span></div>
        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', marginTop: '1.5rem' }}>
          {loading ? 'Processing...' : 'Place Order'}
        </button>
      </div>
    </form>
  );
}

export default function Checkout() {
  return (
    <div className="checkout-page">
      <div className="page-header"><h1>Checkout</h1></div>
      <div className="container">
        <ProtectedRoute><CheckoutContent /></ProtectedRoute>
      </div>
    </div>
  );
}
