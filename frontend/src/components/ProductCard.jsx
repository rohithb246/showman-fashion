import { Link } from 'react-router-dom';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingBag } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

export default function ProductCard({ product, index = 0 }) {
  const [imageFailed, setImageFailed] = useState(false);
  const { user } = useAuth();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const variants = product.variants || [];
  const availableVariants = variants.filter((variant) => variant.inventory?.in_stock);
  const colors = [...new Map(availableVariants.map((variant) => [
    variant.color?.id,
    variant.color,
  ])).values()].filter(Boolean);
  const hasDiscount = product.sale_price && product.sale_price < product.base_price;
  const discount = hasDiscount
    ? Math.round((1 - product.sale_price / product.base_price) * 100)
    : 0;

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/login';
      return;
    }
    await toggleWishlist(product.id);
    toast.success(isInWishlist(product.id) ? 'Removed from wishlist' : 'Saved to wishlist');
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!user) {
      window.location.href = '/login';
      return;
    }
    const variant = availableVariants[0];
    if (!variant) {
      toast.error('This product is out of stock');
      return;
    }
    await addToCart(variant.id, 1);
    toast.success('Added to cart');
  };

  return (
    <motion.div
      className="product-card"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -6 }}
    >
      <Link to={`/product/${product.slug}`} className="product-card-link">
        <div className="product-image-wrap">
          {product.primary_image && !imageFailed ? (
            <img
              src={product.primary_image}
              alt={product.name}
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="product-placeholder">
              <span>Image coming soon</span>
            </div>
          )}
          {hasDiscount && <span className="badge badge-sale">-{discount}%</span>}
          {product.is_new_arrival && <span className="badge badge-gold new-badge">New</span>}
          <button
            className={`wishlist-btn ${isInWishlist(product.id) ? 'active' : ''}`}
            onClick={handleWishlist}
            aria-label="Add to wishlist"
          >
            <FiHeart />
          </button>
        </div>
        <div className="product-info">
          <p className="product-category">{product.brand_name || product.category_name}</p>
          <h3 className="product-name">{product.name}</h3>
          <div className="product-price">
            <span className="current-price">₹{Number(product.effective_price).toLocaleString()}</span>
            {hasDiscount && (
              <span className="original-price">₹{Number(product.base_price).toLocaleString()}</span>
            )}
          </div>
          {colors.length > 0 && (
            <div className="card-colors" aria-label="Available colors">
              {colors.slice(0, 5).map((color) => (
                <span
                  key={color.id}
                  className="card-color"
                  style={{ backgroundColor: color.hex_code }}
                  title={color.name}
                  aria-label={color.name}
                />
              ))}
              {colors.length > 5 && <span className="more-colors">+{colors.length - 5}</span>}
            </div>
          )}
          {product.average_rating > 0 && (
            <div className="product-rating">
              {'★'.repeat(Math.round(product.average_rating))}
              <span>({product.review_count})</span>
            </div>
          )}
          <button
            className="quick-add-btn"
            onClick={handleQuickAdd}
            disabled={!availableVariants.length}
          >
            <FiShoppingBag />
            {availableVariants.length ? 'Add to cart' : 'Out of stock'}
          </button>
        </div>
      </Link>
    </motion.div>
  );
}
