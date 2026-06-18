import { Link } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import ProtectedRoute from '../components/ProtectedRoute';
import './Cart.css';

function CartContent() {
  const { cart, updateCartItem, removeFromCart, applyCoupon } = useCart();
  const [couponCode, setCouponCode] = useState('');

  const handleCoupon = async (e) => {
    e.preventDefault();
    try {
      await applyCoupon(couponCode);
      toast.success('Coupon applied!');
    } catch {
      toast.error('Invalid coupon code');
    }
  };

  if (!cart?.items?.length) {
    return (
      <div className="empty-state">
        <h3>Your cart is empty</h3>
        <p>Discover our luxury collection</p>
        <Link to="/shop" className="btn btn-primary">Continue Shopping</Link>
      </div>
    );
  }

  const subtotal = Number(cart.subtotal || 0);
  const discount = Number(cart.discount_amount || 0);
  const discountedSubtotal = Number(cart.total || subtotal - discount);
  const shipping = discountedSubtotal >= 999 ? 0 : 99;
  const tax = discountedSubtotal * 0.18;
  const total = discountedSubtotal + shipping + tax;

  return (
    <div className="cart-layout">
      <div className="cart-items">
        {cart.items.map((item) => (
          <div key={item.id} className="cart-item glass-card">
            <div className="cart-item-info">
              <h3>{item.variant?.product_name || 'Product'}</h3>
              <p>{item.variant?.size?.name} / {item.variant?.color?.name}</p>
              <p className="cart-item-price">₹{Number(item.variant?.price || 0).toLocaleString()}</p>
            </div>
            <div className="cart-item-actions">
              <div className="qty-controls">
                <button onClick={() => updateCartItem(item.id, item.quantity - 1)}>−</button>
                <span>{item.quantity}</span>
                <button onClick={() => updateCartItem(item.id, item.quantity + 1)}>+</button>
              </div>
              <p className="item-total">₹{Number(item.total_price).toLocaleString()}</p>
              <button className="remove-btn" onClick={() => removeFromCart(item.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart-summary glass-card">
        <h3>Order Summary</h3>
        <div className="summary-row"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
        {discount > 0 && (
          <div className="summary-row discount">
            <span>Coupon {cart.coupon?.code ? `(${cart.coupon.code})` : ''}</span>
            <span>-₹{discount.toLocaleString()}</span>
          </div>
        )}
        <div className="summary-row"><span>Shipping</span><span>{shipping ? `₹${shipping}` : 'Free'}</span></div>
        <div className="summary-row"><span>Tax (18%)</span><span>₹{tax.toFixed(0)}</span></div>
        <div className="summary-row total"><span>Total</span><span>₹{total.toFixed(0)}</span></div>

        <form className="coupon-form" onSubmit={handleCoupon}>
          <input className="form-input" placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
          <button type="submit" className="btn btn-secondary btn-sm">Apply</button>
        </form>

        <Link to="/checkout" className="btn btn-primary btn-lg checkout-btn">Proceed to Checkout</Link>
      </div>
    </div>
  );
}

export default function Cart() {
  return (
    <div className="cart-page">
      <div className="page-header"><h1>Shopping Cart</h1></div>
      <div className="container">
        <ProtectedRoute><CartContent /></ProtectedRoute>
      </div>
    </div>
  );
}
