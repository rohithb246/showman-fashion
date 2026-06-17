import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function AdminDashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    adminAPI.dashboard().then((r) => setData(r.data));
  }, []);

  if (!data) return <LoadingSpinner fullPage />;

  return (
    <div>
      <h1 className="admin-page-title">Dashboard</h1>
      <div className="admin-stats">
        <div className="admin-stat-card"><h3>Total Users</h3><div className="value">{data.total_users}</div></div>
        <div className="admin-stat-card"><h3>Total Orders</h3><div className="value">{data.total_orders}</div></div>
        <div className="admin-stat-card"><h3>Total Products</h3><div className="value">{data.total_products}</div></div>
        <div className="admin-stat-card"><h3>Revenue</h3><div className="value">₹{data.total_revenue.toLocaleString()}</div></div>
        <div className="admin-stat-card"><h3>Low Stock</h3><div className="value">{data.low_stock_count}</div></div>
        <div className="admin-stat-card"><h3>Pending Contacts</h3><div className="value">{data.pending_contacts}</div></div>
      </div>

      <h2 style={{ color: 'var(--purple)', marginBottom: '1rem' }}>Recent Orders</h2>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr>
          </thead>
          <tbody>
            {data.recent_orders.map((o) => (
              <tr key={o.id}>
                <td>{o.order_number}</td>
                <td>{o.user}</td>
                <td>₹{Number(o.total).toLocaleString()}</td>
                <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.sales_analytics?.length > 0 && (
        <>
          <h2 style={{ color: 'var(--purple)', margin: '2rem 0 1rem' }}>Sales Analytics</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Month</th><th>Revenue</th><th>Orders</th></tr></thead>
              <tbody>
                {data.sales_analytics.map((s) => (
                  <tr key={s.month}><td>{s.month}</td><td>₹{s.revenue.toLocaleString()}</td><td>{s.orders}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
