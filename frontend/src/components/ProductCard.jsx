import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

export default function ProductCard({ product, index = 0 }) {
  const { user } = useAuth();
  const { toggleWishlist, isInWishlist } = useCart();
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
          {product.primary_image ? (
            <img src={product.primary_image} alt={product.name} loading="lazy" />
          ) : (
            <div className="product-placeholder">
              <span>{product.name.charAt(0)}</span>
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
          <p className="product-category">{product.category_name}</p>
          <h3 className="product-name">{product.name}</h3>
          <div className="product-price">
            <span className="current-price">₹{Number(product.effective_price).toLocaleString()}</span>
            {hasDiscount && (
              <span className="original-price">₹{Number(product.base_price).toLocaleString()}</span>
            )}
          </div>
          {product.average_rating > 0 && (
            <div className="product-rating">
              {'★'.repeat(Math.round(product.average_rating))}
              <span>({product.review_count})</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
