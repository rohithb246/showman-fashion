import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { productAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import './ProductDetail.css';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [zoomed, setZoomed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewEligibility, setReviewEligibility] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });

  useEffect(() => {
    setLoading(true);
    productAPI.get(slug).then((r) => {
      setProduct(r.data);
      const variants = r.data.variants || [];
      const firstAvailable = variants.find((variant) => (
        variant.inventory?.in_stock
        && variant.size?.name?.trim()
        && variant.color?.name?.trim()
      ));
      if (firstAvailable) {
        setSelectedSize(firstAvailable.size?.id);
        setSelectedColor(firstAvailable.color?.id);
      } else {
        setSelectedSize(null);
        setSelectedColor(null);
      }
    });
    productAPI.related(slug).then((r) => setRelated(r.data)).finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (product?.id) {
      productAPI.reviews({ product: product.id }).then((r) => setReviews(r.data.results || r.data));
      if (user) {
        productAPI.reviewEligibility(slug)
          .then((r) => setReviewEligibility(r.data))
          .catch(() => setReviewEligibility(null));
      } else {
        setReviewEligibility(null);
      }
    }
  }, [product?.id, slug, user]);

  if (loading || !product) return <LoadingSpinner fullPage />;

  const images = product.images?.length
    ? product.images
    : [{ image: null, alt_text: product.name }];

  const availableVariants = (product.variants || []).filter((variant) => (
    variant.inventory?.in_stock
    && variant.size?.name?.trim()
    && variant.color?.name?.trim()
  ));
  const hasStock = availableVariants.length > 0;
  const selectedVariant = availableVariants.find(
    (v) => v.size?.id === selectedSize && v.color?.id === selectedColor
  );

  const sizes = [...new Map(availableVariants
    .filter((variant) => !selectedColor || variant.color?.id === selectedColor)
    .map((v) => [v.size?.id, v.size])).values()].filter(Boolean);
  const colors = [...new Map(availableVariants
    .filter((variant) => !selectedSize || variant.size?.id === selectedSize)
    .map((v) => [v.color?.id, v.color])).values()].filter(Boolean);
  const sizeIsAvailable = (sizeId) => availableVariants.some(
    (variant) => variant.size?.id === sizeId && (!selectedColor || variant.color?.id === selectedColor)
  );
  const colorIsAvailable = (colorId) => availableVariants.some(
    (variant) => variant.color?.id === colorId && (!selectedSize || variant.size?.id === selectedSize)
  );

  const selectSize = (sizeId) => {
    setSelectedSize(sizeId);
    const matching = availableVariants.find(
      (variant) => variant.size?.id === sizeId
        && variant.color?.id === selectedColor
    ) || availableVariants.find(
      (variant) => variant.size?.id === sizeId
    );
    if (matching) setSelectedColor(matching.color?.id);
  };

  const selectColor = (colorId) => {
    setSelectedColor(colorId);
    const matching = availableVariants.find(
      (variant) => variant.color?.id === colorId
        && variant.size?.id === selectedSize
    ) || availableVariants.find(
      (variant) => variant.color?.id === colorId
    );
    if (matching) setSelectedSize(matching.size?.id);
  };

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return; }
    if (!selectedVariant) { toast.error('Please select size and color'); return; }
    if (!selectedVariant.inventory?.in_stock) { toast.error('Out of stock'); return; }
    await addToCart(selectedVariant.id, quantity);
    toast.success('Added to cart!');
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    try {
      await productAPI.createReview({ product: product.id, ...reviewForm });
      toast.success('Review submitted for approval');
      setReviewForm({ rating: 5, title: '', comment: '' });
      setReviewEligibility({ purchased: true, already_reviewed: true, eligible: false });
    } catch (error) {
      toast.error(error.response?.data?.product?.[0] || error.response?.data?.detail || 'Could not submit review');
    }
  };

  return (
    <div className="product-detail">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/">Home</Link> / <Link to="/shop">Shop</Link> / <span>{product.name}</span>
        </div>

        <div className="product-detail-grid">
          <div className="product-gallery">
            <div
              className={`main-image ${zoomed ? 'zoomed' : ''}`}
              onClick={() => setZoomed(!zoomed)}
            >
              {images[selectedImage]?.image ? (
                <img src={images[selectedImage].image} alt={product.name} />
              ) : (
                <div className="product-placeholder"><span>{product.name.charAt(0)}</span></div>
              )}
            </div>
            <div className="thumbnail-list">
              {images.map((img, i) => (
                <button
                  key={i}
                  className={`thumb ${selectedImage === i ? 'active' : ''}`}
                  onClick={() => setSelectedImage(i)}
                >
                  {img.image ? <img src={img.image} alt="" /> : <span>{i + 1}</span>}
                </button>
              ))}
            </div>
          </div>

          <motion.div className="product-details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <p className="product-category">{product.brand_name || product.category?.name}</p>
            <h1>{product.name}</h1>
            <div className="product-rating-header">
              {'★'.repeat(Math.round(product.average_rating || 0))}
              <span>({product.review_count} reviews)</span>
            </div>
            <div className="product-price-large">
              ₹{Number(product.effective_price).toLocaleString()}
              {product.sale_price && (
                <span className="original">₹{Number(product.base_price).toLocaleString()}</span>
              )}
            </div>
            <p className="product-desc">{product.description}</p>

            {hasStock ? (
              <>
            <div className="variant-selectors">
              <div className="selector-group">
                <label>Size{selectedVariant?.size?.name ? `: ${selectedVariant.size.name}` : ''}</label>
                <div className="size-options">
                  {sizes.map((s) => (
                    <button
                      key={s.id}
                      className={`size-btn ${selectedSize === s.id ? 'active' : ''}`}
                      onClick={() => selectSize(s.id)}
                      disabled={!sizeIsAvailable(s.id)}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="selector-group">
                <label>Color{selectedVariant?.color?.name ? `: ${selectedVariant.color.name}` : ''}</label>
                <div className="color-options">
                  {colors.map((c) => (
                    <button
                      key={c.id}
                      className={`color-choice ${selectedColor === c.id ? 'active' : ''}`}
                      onClick={() => selectColor(c.id)}
                      disabled={!colorIsAvailable(c.id)}
                      title={c.name}
                    >
                      <span className="color-btn" style={{ background: c.hex_code }} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="quantity-selector">
              <label>Quantity</label>
              <div className="qty-controls">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>
              {selectedVariant && (
                <span className={`stock-status ${selectedVariant.inventory?.in_stock ? 'in-stock' : 'out-stock'}`}>
                  {selectedVariant.inventory?.in_stock ? 'In Stock' : 'Out of Stock'}
                </span>
              )}
            </div>

            <div className="product-actions">
              <button type="button" className="btn btn-primary btn-lg add-to-cart-btn" onClick={handleAddToCart}>Add to Cart</button>
                <button
                  type="button"
                className={`btn btn-outline btn-lg ${isInWishlist(product.id) ? 'active' : ''}`}
                onClick={() => toggleWishlist(product.id)}
              >
                Wishlist
              </button>
            </div>
              </>
            ) : (
              <>
                <p className="sold-out-message">Out of stock</p>
                <div className="product-actions">
                  <button
                    className={`btn btn-outline btn-lg ${isInWishlist(product.id) ? 'active' : ''}`}
                    onClick={() => toggleWishlist(product.id)}
                  >
                    Wishlist
                  </button>
                </div>
              </>
            )}

            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="specifications">
                <h3>Specifications</h3>
                <table>
                  <tbody>
                    {Object.entries(product.specifications).map(([key, val]) => (
                      <tr key={key}><td>{key}</td><td>{val}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </div>

        <section className="reviews-section">
          <h2>Customer Reviews</h2>
          {reviews.length ? reviews.map((r) => (
            <div key={r.id} className="review-card glass-card">
              <div className="review-header">
                <strong>{r.user_name}</strong>
                <span>{'★'.repeat(r.rating)}</span>
              </div>
              {r.title && <h4>{r.title}</h4>}
              <p>{r.comment}</p>
            </div>
          )) : <p className="no-reviews">No reviews yet. Be the first!</p>}

          {user && reviewEligibility?.eligible && (
            <form className="review-form glass-card" onSubmit={handleReview}>
              <h3>Write a Review</h3>
              <div className="form-group">
                <label>Rating</label>
                <select className="form-input" value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: +e.target.value })}>
                  {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} Stars</option>)}
                </select>
              </div>
              <div className="form-group">
                <input className="form-input" placeholder="Title" value={reviewForm.title} onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })} />
              </div>
              <div className="form-group">
                <textarea className="form-input" rows={4} placeholder="Your review..." required value={reviewForm.comment} onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })} />
              </div>
              <button type="submit" className="btn btn-primary">Submit Review</button>
            </form>
          )}
          {user && reviewEligibility?.already_reviewed && (
            <p className="review-eligibility-note">You have already reviewed this product.</p>
          )}
          {user && reviewEligibility && !reviewEligibility.purchased && (
            <p className="review-eligibility-note">Purchase this product to write a verified customer review.</p>
          )}
        </section>

        {related.length > 0 && (
          <section className="related-section">
            <h2 className="section-title">Related Products</h2>
            <div className="grid-products">
              {related.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
