import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { coreAPI, productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import './Home.css';

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
        <div className="hero-bg" aria-hidden="true" />
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

          <motion.div
            className="hero-image-col"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.15 }}
          >
            <picture>
              <source media="(max-width: 600px)" srcSet="/hero-mobile.png" />
              <source media="(max-width: 1024px)" srcSet="/hero-tablet.png" />
              <source media="(min-width: 1600px)" srcSet="/hero-desktop-xl.png" />
              <img
                src="/hero-desktop.png"
                alt="The Show Man luxury fashion model"
                className="hero-model"
              />
            </picture>
          </motion.div>
        </div>
      </section>

      <section className="section categories-section">
        <div className="container">
          <h2 className="section-title">Shop by Category</h2>
          <p className="section-subtitle">Curated Collections</p>
          <div className="categories-grid">
            {categories.map((cat, i) => (
              <motion.div key={cat.id} whileHover={{ scale: 1.03 }} transition={{ delay: i * 0.05 }}>
                <Link to={`/shop?category=${cat.slug}`} className="category-card">
                  <div
                    className="category-card-bg"
                    style={cat.display_image ? { backgroundImage: `url(${cat.display_image})` } : undefined}
                  />
                  <div className="category-card-copy">
                    <h3>{cat.name}</h3>
                    <span>{cat.product_count} items</span>
                  </div>
                </Link>
              </motion.div>
            ))}
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
