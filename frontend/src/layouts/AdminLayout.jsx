import { useState } from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  FiGrid, FiPackage, FiShoppingCart, FiUsers, FiTag,
  FiImage, FiMessageSquare, FiBox, FiLogOut, FiHome, FiMenu, FiX,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import './AdminLayout.css';

const navItems = [
  { to: '/admin', icon: FiGrid, label: 'Dashboard', end: true },
  { to: '/admin/products', icon: FiPackage, label: 'Products' },
  { to: '/admin/orders', icon: FiShoppingCart, label: 'Orders' },
  { to: '/admin/inventory', icon: FiBox, label: 'Inventory' },
  { to: '/admin/users', icon: FiUsers, label: 'Users', fullAdminOnly: true },
  { to: '/admin/coupons', icon: FiTag, label: 'Coupons', fullAdminOnly: true },
  { to: '/admin/banners', icon: FiImage, label: 'Banners' },
  { to: '/admin/reviews', icon: FiMessageSquare, label: 'Reviews' },
  { to: '/admin/contacts', icon: FiMessageSquare, label: 'Contacts' },
];

export default function AdminLayout() {
  const { logout, isFullAdmin } = useAuth();
  const visibleNavItems = navItems.filter((item) => !item.fullAdminOnly || isFullAdmin);
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="admin-layout">
      <header className="admin-mobile-header">
        <Link to="/admin" className="admin-mobile-brand" onClick={closeMenu}>
          <img src="/navbar-logo.png" alt="The Show Man" />
          <span>Admin Panel</span>
        </Link>
        <button
          type="button"
          className="admin-menu-toggle"
          aria-label={menuOpen ? 'Close admin navigation' : 'Open admin navigation'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      </header>
      {menuOpen && <button type="button" className="admin-menu-backdrop" aria-label="Close admin navigation" onClick={closeMenu} />}
      <aside className={`admin-sidebar ${menuOpen ? 'open' : ''}`}>
        <div className="admin-brand">
          <img src="/navbar-logo.png" alt="The Show Man" />
          <span>Admin Panel</span>
        </div>
        <nav className="admin-nav">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
              onClick={closeMenu}
            >
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-nav-link" onClick={closeMenu}><FiHome /><span>Store</span></Link>
          <button className="admin-nav-link" onClick={() => { closeMenu(); logout(); }}><FiLogOut /><span>Logout</span></button>
        </div>
      </aside>
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
}
