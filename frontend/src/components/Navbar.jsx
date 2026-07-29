import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { FiChevronDown, FiSearch, FiShoppingBag, FiHeart, FiUser, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './Navbar.css';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
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
    { to: '/', label: 'Home' },
    { to: '/shop', label: 'Shop' },
    { to: '/shop?is_new_arrival=true', label: 'New Arrivals' },
  ];
  const categoryLinks = [
    { to: '/shop?category=mens-wear', label: "Men's Wear" },
    { to: '/shop?category=womens-wear', label: "Women's Wear" },
    { to: '/shop?category=ethnic-wear', label: 'Ethnic Wear' },
    { to: '/shop?category=kids-wear', label: "Kids' Wear" },
    { to: '/shop?category=accessories', label: 'Accessories' },
    { to: '/shop?category=shoes', label: 'Shoes' },
  ];
  const currentPath = `${location.pathname}${location.search}`;

  return (
    <header className="navbar">
      <div className="navbar-topline">
        <span>Premium theatrical fashion</span>
        <span>Free shipping above Rs. 999</span>
      </div>
      <div className="container navbar-inner">
        <button
          className="menu-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>

        <Link to="/" className="navbar-logo">
          <span className="logo-mark" aria-hidden="true">
            <img src="/showman-gold-logo.png" alt="" />
          </span>
        </Link>

        <nav className={`navbar-nav ${menuOpen ? 'open' : ''}`}>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={currentPath === link.to ? 'active' : ''}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="nav-categories" onMouseEnter={() => setCategoriesOpen(true)} onMouseLeave={() => setCategoriesOpen(false)}>
            <button
              className="nav-category-trigger"
              type="button"
              aria-expanded={categoriesOpen}
              onClick={() => setCategoriesOpen(!categoriesOpen)}
            >
              Categories <FiChevronDown aria-hidden="true" />
            </button>
            <div className={`categories-menu ${categoriesOpen ? 'open' : ''}`}>
              <span className="categories-menu-label">Shop collections</span>
              {categoryLinks.map((link) => (
                <Link key={link.to} to={link.to} onClick={() => { setCategoriesOpen(false); setMenuOpen(false); }}>
                  {link.label}<span aria-hidden="true">→</span>
                </Link>
              ))}
            </div>
          </div>
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
              <div className="user-popover" role="tooltip">
                <strong>{user.username || `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Account'}</strong>
                <span>{user.email}</span>
              </div>
              <button className="btn btn-sm btn-ghost logout-btn" onClick={logout}>Logout</button>
            </div>
          ) : (
            <Link to="/login" className="signin-link">
              <FiUser aria-hidden="true" />
              <span>Sign in</span>
            </Link>
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
