import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI, orderAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import './Dashboard.css';

function DashboardContent() {
  const { user, setUser } = useAuth();
  const [tab, setTab] = useState('orders');
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [profile, setProfile] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.profile?.phone || '',
  });
  const [newAddress, setNewAddress] = useState({
    full_name: '', phone: '', address_line1: '', city: '', state: '', postal_code: '', country: 'India',
  });

  useEffect(() => {
    orderAPI.list().then((r) => setOrders(r.data.results || r.data));
    authAPI.addresses().then((r) => setAddresses(r.data.results || r.data));
  }, []);

  const saveProfile = async () => {
    const { data } = await authAPI.updateProfile(profile);
    setUser(data);
    await authAPI.updateProfileDetails({ phone: profile.phone });
    toast.success('Profile updated');
  };

  const addAddress = async (e) => {
    e.preventDefault();
    await authAPI.createAddress(newAddress);
    const { data } = await authAPI.addresses();
    setAddresses(data.results || data);
    toast.success('Address added');
  };

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar glass-card">
        <h3>My Account</h3>
        {['orders', 'profile', 'addresses', 'settings'].map((t) => (
          <button key={t} className={`dash-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
        <Link to="/wishlist" className="dash-tab">Wishlist</Link>
      </aside>

      <div className="dashboard-main">
        {tab === 'orders' && (
          <div>
            <h2>Order History</h2>
            {orders.length ? orders.map((o) => (
              <div key={o.id} className="order-card glass-card">
                <div className="order-header">
                  <span><strong>{o.order_number}</strong></span>
                  <span className={`status-badge status-${o.status}`}>{o.status}</span>
                </div>
                <p>{new Date(o.created_at).toLocaleDateString()} — ₹{Number(o.total).toLocaleString()}</p>
                <p>{o.items?.length} item(s)</p>
              </div>
            )) : <p className="empty-text">No orders yet</p>}
          </div>
        )}

        {tab === 'profile' && (
          <div>
            <h2>Profile</h2>
            <div className="form-group">
              <label>First Name</label>
              <input className="form-input" value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input className="form-input" value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input className="form-input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </div>
            <button className="btn btn-primary" onClick={saveProfile}>Save Profile</button>
          </div>
        )}

        {tab === 'addresses' && (
          <div>
            <h2>Saved Addresses</h2>
            {addresses.map((a) => (
              <div key={a.id} className="address-card glass-card">
                <strong>{a.full_name}</strong>
                <p>{a.address_line1}, {a.city}, {a.state} {a.postal_code}</p>
                {a.is_default && <span className="badge badge-gold">Default</span>}
              </div>
            ))}
            <form onSubmit={addAddress} className="address-form">
              <h3>Add New Address</h3>
              {Object.keys(newAddress).map((k) => (
                <div key={k} className="form-group">
                  <label>{k.replace('_', ' ')}</label>
                  <input className="form-input" required value={newAddress[k]} onChange={(e) => setNewAddress({ ...newAddress, [k]: e.target.value })} />
                </div>
              ))}
              <button type="submit" className="btn btn-secondary">Add Address</button>
            </form>
          </div>
        )}

        {tab === 'settings' && (
          <div>
            <h2>Account Settings</h2>
            <p>Email: {user?.email}</p>
            <p>Verified: {user?.email_verified ? 'Yes' : 'No'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <div className="dashboard-page">
      <div className="page-header"><h1>My Dashboard</h1></div>
      <div className="container">
        <ProtectedRoute><DashboardContent /></ProtectedRoute>
      </div>
    </div>
  );
}
