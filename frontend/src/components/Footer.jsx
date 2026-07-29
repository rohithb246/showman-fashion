import { Link } from 'react-router-dom';
import { FiInstagram, FiFacebook, FiTwitter, FiMail } from 'react-icons/fi';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <img src="/showman-gold-logo.png" alt="The Show Man" className="footer-logo" />
          <p>Dress Like A Showman. Premium luxury fashion for those who command the spotlight.</p>
          <div className="footer-social">
            <a href="#" aria-label="Instagram"><FiInstagram /></a>
            <a href="#" aria-label="Facebook"><FiFacebook /></a>
            <a href="#" aria-label="Twitter"><FiTwitter /></a>
            <a href="#" aria-label="Email"><FiMail /></a>
          </div>
        </div>

        <div className="footer-links">
          <h4>Shop</h4>
          <Link to="/shop">All Products</Link>
          <Link to="/shop?is_new_arrival=true">New Arrivals</Link>
          <Link to="/shop?is_trending=true">Trending</Link>
          <Link to="/shop?is_featured=true">Featured</Link>
        </div>

        <div className="footer-links">
          <h4>Account</h4>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
          <Link to="/dashboard">My Account</Link>
          <Link to="/wishlist">Wishlist</Link>
        </div>

        <div className="footer-links">
          <h4>Support</h4>
          <Link to="/dashboard">Order Tracking</Link>
          <Link to="/dashboard">Returns</Link>
          <a href="mailto:support@theshowman.com">Contact Us</a>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container">
          <p>&copy; {new Date().getFullYear()} The Show Man. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
