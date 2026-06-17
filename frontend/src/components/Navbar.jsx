import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { FiSearch, FiShoppingBag, FiHeart, FiUser, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const location = useLocation();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`;
      setSearchOpen(false);
    }
  };

  const navLinks = [
    { to: '/shop?is_featured=true', label: 'Collections' },
    { to: '/shop', label: 'Shop' },
    { to: '/shop?is_new_arrival=true', label: 'Our Craft' },
    { to: '/shop?is_trending=true', label: 'Stories' },
  ];

  return (
    <header className={`navbar ${location.pathname === '/' ? 'navbar-transparent' : ''}`}>
      <div className="container navbar-inner">
        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>

        <Link to="/" className="navbar-logo">
          <img src="/logo.png" alt="The Show Man" />
          <span>
            <strong>The Show Man</strong>
            <small>Dress Like A Showman</small>
          </span>
        </Link>

        <nav className={`navbar-nav ${menuOpen ? 'open' : ''}`}>
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="navbar-actions">
          <button className="icon-btn" onClick={() => setSearchOpen(!searchOpen)} aria-label="Search">
            <FiSearch />
          </button>
          <Link to="/wishlist" className="icon-btn" aria-label="Wishlist">
            <FiHeart />
          </Link>
          <Link to="/cart" className="icon-btn cart-btn" aria-label="Cart">
            <FiShoppingBag />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>
          {user ? (
            <div className="user-menu">
              <Link to={isAdmin ? '/admin' : '/dashboard'} className="icon-btn" aria-label="Account">
                <FiUser />
              </Link>
              <button className="btn btn-sm btn-ghost logout-btn" onClick={logout}>Logout</button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-sm btn-primary enquire-btn">Enquire</Link>
          )}
        </div>
      </div>

      {searchOpen && (
        <div className="search-overlay">
          <form onSubmit={handleSearch} className="search-form container">
            <input
              type="text"
              placeholder="Search luxury fashion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="form-input"
            />
            <button type="submit" className="btn btn-primary">Search</button>
          </form>
        </div>
      )}
    </header>
  );
}
