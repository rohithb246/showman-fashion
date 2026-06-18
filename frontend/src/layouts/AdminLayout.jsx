import { NavLink, Outlet, Link } from 'react-router-dom';
import {
  FiGrid, FiPackage, FiShoppingCart, FiUsers, FiTag,
  FiImage, FiMessageSquare, FiBox, FiLogOut, FiHome,
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

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <img src="/logo.png" alt="The Show Man" />
          <span>Admin Panel</span>
        </div>
        <nav className="admin-nav">
          {visibleNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
            >
              <item.icon />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-nav-link"><FiHome /><span>Store</span></Link>
          <button className="admin-nav-link" onClick={logout}><FiLogOut /><span>Logout</span></button>
        </div>
      </aside>
      <div className="admin-main">
        <Outlet />
      </div>
    </div>
  );
}
