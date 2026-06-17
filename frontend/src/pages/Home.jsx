import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import './Home.css';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [trending, setTrending] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');

  useEffect(() => {
    Promise.all([
      productAPI.featured(),
      productAPI.newArrivals(),
      productAPI.trending(),
      productAPI.categories(),
    ]).then(([f, n, t, c]) => {
      setFeatured(f.data.results || f.data);
      setNewArrivals(n.data.results || n.data);
      setTrending(t.data.results || t.data);
      setCategories(c.data.results || c.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleNewsletter = (e) => {
    e.preventDefault();
    toast.success('Thank you for subscribing!');
    setEmail('');
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div className="home">
      <section className="hero">
        <div className="hero-bg" />
        <div className="container hero-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-copy"
          >
            <span className="hero-tag">New Collection - The Dark Carnival</span>
            <h1>
              Command
              <br />
              Every
              <br />
              <span>Stage.</span>
            </h1>
            <p>
              Theatrical fashion for those who live beyond the ordinary.
              <br />
              Wearable spectacle. Unapologetic presence.
            </p>
            <div className="hero-actions">
              <Link to="/shop" className="btn btn-primary btn-lg">Explore Collection</Link>
              <Link to="/shop?is_new_arrival=true" className="btn btn-outline btn-lg hero-outline">Our Story</Link>
            </div>
          </motion.div>
          <motion.div
            className="hero-emblem-wrap"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <span className="orbit orbit-one" />
            <span className="orbit orbit-two" />
            <span className="orbit-dot" />
            <img src="/logo.png" alt="The Show Man" className="hero-logo" />
            <div className="hero-count">
              <strong>XII</strong>
              <span>Exclusive Pieces</span>
            </div>
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
                  <div className="category-card-bg" />
                  <h3>{cat.name}</h3>
                  <span>{cat.product_count} items</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section promo-banner">
        <div className="container glass-card promo-inner">
          <div>
            <span className="badge badge-gold">Limited Offer</span>
            <h2>Extra 20% Off with SHOWMAN20</h2>
            <p>Use code SHOWMAN20 on orders above ₹2,000</p>
          </div>
          <Link to="/shop" className="btn btn-secondary">Shop Now</Link>
        </div>
      </section>

      <ProductSection title="Featured Collections" subtitle="Handpicked Luxury" products={featured} />
      <ProductSection title="New Arrivals" subtitle="Just Landed" products={newArrivals} />
      <ProductSection title="Trending Now" subtitle="Most Loved" products={trending} />

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

function ProductSection({ title, subtitle, products }) {
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
          <Link to="/shop" className="btn btn-outline">View All</Link>
        </div>
      </div>
    </section>
  );
}
