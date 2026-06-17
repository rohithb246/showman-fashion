import { useState, useEffect } from 'react';
import { orderAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    orderAPI.list().then((r) => setOrders(r.data.results || r.data));
  }, []);

  const updateStatus = async (id, status) => {
    await orderAPI.updateStatus(id, { status });
    toast.success('Order updated');
    const { data } = await orderAPI.list();
    setOrders(data.results || data);
  };

  if (!orders.length) return <LoadingSpinner fullPage />;

  return (
    <div>
      <h1 className="admin-page-title">Order Management</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Order</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.order_number}</td>
                <td>₹{Number(o.total).toLocaleString()}</td>
                <td><span className={`status-badge status-${o.status}`}>{o.status}</span></td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                <td>
                  <select className="form-input" style={{ width: 'auto', padding: '0.25rem' }} value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}>
                    {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
