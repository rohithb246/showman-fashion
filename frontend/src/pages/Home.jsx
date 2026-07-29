import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaChild, FaGem, FaPersonRunning, FaShoePrints, FaShirt, FaSnowflake, FaVest } from 'react-icons/fa6';
import { coreAPI, productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import './Home.css';

const categoryPresentation = {
  accessories: { icon: FaGem, image: 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=1200&q=85' },
  'ethnic-wear': { icon: FaVest, image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?auto=format&fit=crop&w=1200&q=85' },
  'kids-wear': { icon: FaChild, image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&w=1200&q=85' },
  'mens-wear': { icon: FaShirt, image: 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1200&q=85' },
  shoes: { icon: FaShoePrints, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=85' },
  sportswear: { icon: FaPersonRunning, image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=85' },
  'winter-wear': { icon: FaSnowflake, image: 'https://images.unsplash.com/photo-1548883354-7622d03aca27?auto=format&fit=crop&w=1200&q=85' },
  'womens-wear': { icon: FaShirt, image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85' },
};

const getCategoryPresentation = (category) => {
  const key = category.slug?.toLowerCase() || category.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return categoryPresentation[key] || { icon: FaShirt, image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1200&q=85' };
};

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [trending, setTrending] = useState([]);
  const [categories, setCategories] = useState([]);
  const [coupon, setCoupon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    Promise.all([
      productAPI.featured(),
      productAPI.newArrivals(),
      productAPI.trending(),
      productAPI.categories(),
      productAPI.currentCoupon(),
    ]).then(([f, n, t, c, couponResponse]) => {
      setFeatured(f.data.results || f.data);
      setNewArrivals(n.data.results || n.data);
      setTrending(t.data.results || t.data);
      setCategories(c.data.results || c.data);
      setCoupon(couponResponse.data || null);
    }).finally(() => setLoading(false));
  }, []);

  const handleNewsletter = async (e) => {
    e.preventDefault();
    try {
      const { data } = await coreAPI.subscribe(email);
      toast.success(data.detail);
      setEmail('');
    } catch (err) {
      toast.error(err.response?.data?.email?.[0] || 'Unable to subscribe. Please try again.');
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-media" aria-hidden="true">
          <video
            className="hero-video"
            autoPlay
            loop
            muted
            playsInline
            preload="metadata"
          >
            <source src="/theshowman.mp4" type="video/mp4" />
          </video>
        </div>
        <div className="hero-scrim" aria-hidden="true" />
        <div className="hero-grid">
          <motion.div
            className="hero-copy"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="hero-tag">The Signature Collection · 2026</span>
            <h1>Dress for the<br /><span>moment that matters.</span></h1>
            <p>
              Precision tailoring, rich textures, and unmistakable presence—
              designed for men who never blend into the background.
            </p>
            <div className="hero-actions">
              <Link to="/shop" className="btn btn-primary btn-lg">Shop Collection</Link>
              <Link to="/shop?is_new_arrival=true" className="btn btn-outline btn-lg hero-outline">New Arrivals</Link>
            </div>
            <div className="hero-proof" aria-label="Store benefits">
              <span><b>Premium</b> fabrics</span><i />
              <span><b>Curated</b> collections</span><i />
              <span><b>Secure</b> checkout</span>
            </div>
          </motion.div>

        </div>
      </section>

      <section className="section categories-section">
        <div className="container">
          <h2 className="section-title">Shop by Category</h2>
          <p className="section-subtitle">Curated Collections</p>
          <div className="categories-grid">
            {categories.filter((cat) => Number(cat.product_count) > 0).map((cat, i) => {
              const presentation = getCategoryPresentation(cat);
              const CategoryIcon = presentation.icon;
              const image = cat.display_image || presentation.image;
              return (
              <motion.div
                key={cat.id}
                className="category-card-motion"
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: Math.min(i * 0.06, 0.36) }}
              >
                <Link to={`/shop?category=${cat.slug}`} className="category-card">
                  <img
                    className="category-card-image"
                    src={image}
                    alt=""
                    loading="lazy"
                  />
                  <div className="category-card-overlay" aria-hidden="true" />
                  <div className="category-card-copy">
                    <span className="category-icon" aria-hidden="true"><CategoryIcon /></span>
                    <div className="category-card-details">
                      <h3>{cat.name}</h3>
                      <span className="category-count">{cat.product_count} {cat.product_count === 1 ? 'item' : 'items'}</span>
                    </div>
                    <span className="category-shop-link">Shop Now <span aria-hidden="true">→</span></span>
                  </div>
                </Link>
              </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {coupon && (
        <section className="section promo-banner">
          <div className="container glass-card promo-inner">
            <div>
              <span className="badge badge-gold">Limited Offer</span>
              <h2>
                {coupon.discount_type === 'percentage'
                  ? `${Number(coupon.discount_value)}% off`
                  : `₹${Number(coupon.discount_value).toLocaleString()} off`}
                {' '}with {coupon.code}
              </h2>
              <p>
                {coupon.description || `Valid on orders above ₹${Number(coupon.min_order_amount).toLocaleString()}`}
              </p>
            </div>
            <Link to="/shop" className="btn btn-secondary">Shop Now</Link>
          </div>
        </section>
      )}

      <ProductSection title="New Arrivals" subtitle="Just Landed" products={newArrivals} link="/shop?is_new_arrival=true" />
      <ProductSection title="Featured Collection" subtitle="Handpicked Luxury" products={featured} link="/shop?is_featured=true" />
      <ProductSection title="Trending Now" subtitle="Most Loved" products={trending} link="/shop?is_trending=true" />

      <section className="section testimonials">
        <div className="container">
          <h2 className="section-title">What Our Showmen Say</h2>
          <p className="section-subtitle">Testimonials</p>
          <div className="testimonials-grid">
            {[
              { name: 'Rahul S.', text: 'The velvet blazer is absolutely stunning. True luxury craftsmanship.', rating: 5 },
              { name: 'Priya M.', text: 'The sequined gown made me feel like royalty at the gala. Exquisite!', rating: 5 },
              { name: 'Arjun K.', text: 'Premium quality and fast delivery. The Show Man never disappoints.', rating: 5 },
            ].map((t, i) => (
              <motion.div key={i} className="testimonial-card glass-card" whileHover={{ y: -4 }}>
                <div className="stars">{'★'.repeat(t.rating)}</div>
                <p>"{t.text}"</p>
                <span className="author">— {t.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section newsletter">
        <div className="container">
          <div className="newsletter-inner glass-card">
            <h2>Join The Show</h2>
            <p>Subscribe for exclusive offers and early access to new collections</p>
            <form onSubmit={handleNewsletter}>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input"
              />
              <button type="submit" className="btn btn-primary">Subscribe</button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

function ProductSection({ title, subtitle, products, link }) {
  if (!products?.length) return null;
  return (
    <section className="section">
      <div className="container">
        <h2 className="section-title">{title}</h2>
        <p className="section-subtitle">{subtitle}</p>
        <div className="grid-products">
          {products.slice(0, 4).map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
        <div className="section-cta">
          <Link to={link} className="btn btn-outline">View All</Link>
        </div>
      </div>
    </section>
  );
}
