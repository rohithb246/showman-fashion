import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI, orderAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import ProtectedRoute from '../components/ProtectedRoute';
import './Checkout.css';

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function CheckoutContent() {
  const navigate = useNavigate();
  const { cart, fetchCart } = useCart();
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    shipping_name: '', shipping_phone: '', shipping_address: '',
    shipping_city: '', shipping_state: '', shipping_postal_code: '',
    shipping_country: 'India', payment_provider: 'cod', notes: '',
  });

  useEffect(() => {
    authAPI.addresses().then((r) => {
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
    orderAPI.paymentConfig()
      .then((r) => {
        setPaymentConfig(r.data);
        if (!r.data.providers?.includes('razorpay')) {
          setForm((current) => ({ ...current, payment_provider: 'cod' }));
        }
      })
      .catch(() => setPaymentConfig({ providers: ['cod'] }));
  }, []);

  const openRazorpay = async (order) => {
    const loaded = await loadRazorpay();
    if (!loaded) throw new Error('Could not load Razorpay checkout.');

    return new Promise((resolve, reject) => {
      const checkout = new window.Razorpay({
        key: paymentConfig.razorpay_key_id,
        amount: Math.round(Number(order.total) * 100),
        currency: 'INR',
        name: 'The Show Man',
        description: `Order ${order.order_number}`,
        order_id: order.payment.gateway_order_id,
        prefill: {
          name: form.shipping_name,
          contact: form.shipping_phone,
        },
        theme: { color: '#4A0560' },
        handler: async (response) => {
          try {
            await orderAPI.confirmPayment({
              order_number: order.order_number,
              ...response,
            });
            resolve();
          } catch (error) {
            reject(new Error(error.response?.data?.detail || 'Payment verification failed.'));
          }
        },
        modal: {
          ondismiss: () => reject(new Error('Payment was cancelled. Your order is still pending.')),
        },
      });
      checkout.on('payment.failed', (response) => {
        reject(new Error(response.error?.description || 'Payment failed.'));
      });
      checkout.open();
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await orderAPI.checkout(form);
      await fetchCart();
      if (form.payment_provider === 'cod') {
        navigate(`/order-confirmation/${data.order_number}`);
      } else {
        await openRazorpay(data);
        await fetchCart();
        navigate(`/payment/success?order=${data.order_number}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || 'Checkout failed');
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
          {(paymentConfig?.providers || ['cod']).map((p) => (
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
        {paymentConfig && form.payment_provider === 'razorpay' && (
          <p className="payment-note">Secure online payment powered by Razorpay.</p>
        )}
        {paymentConfig && !paymentConfig.providers?.includes('razorpay') && (
          <p className="payment-note">Add Razorpay keys in the backend environment to enable online payment.</p>
        )}
      </div>

      <div className="checkout-summary glass-card">
        <h3>Order Summary</h3>
        <div className="summary-row"><span>Items ({cart?.item_count})</span><span>₹{subtotal.toLocaleString()}</span></div>
        <div className="summary-row"><span>Shipping</span><span>{shipping ? `₹${shipping}` : 'Free'}</span></div>
        <div className="summary-row"><span>Tax</span><span>₹{tax.toFixed(0)}</span></div>
        <div className="summary-row total"><span>Total</span><span>₹{(subtotal + shipping + tax).toFixed(0)}</span></div>
        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', marginTop: '1.5rem' }}>
          {loading ? 'Processing...' : form.payment_provider === 'cod' ? 'Place Order' : 'Pay Securely'}
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
