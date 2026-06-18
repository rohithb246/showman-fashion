import { Fragment, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { orderAPI } from '../../services/api';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [tracking, setTracking] = useState({});

  const loadOrders = async () => {
    const { data } = await orderAPI.list();
    setOrders(data.results || data);
  };

  useEffect(() => {
    loadOrders().finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await orderAPI.updateStatus(id, {
        status,
        tracking_number: tracking[id] || undefined,
      });
      await loadOrders();
      toast.success('Order updated');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not update order');
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Order Management</h1>
          <p className="admin-page-subtitle">Manage fulfillment, payment status, and tracking.</p>
        </div>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <Fragment key={order.id}>
                <tr>
                  <td><strong>{order.order_number}</strong></td>
                  <td>{order.shipping_name}<br /><span className="admin-muted">{order.shipping_phone}</span></td>
                  <td>₹{Number(order.total).toLocaleString()}</td>
                  <td>
                    {order.payment?.provider || 'N/A'}<br />
                    <span className={`status-badge status-${order.payment?.status || 'pending'}`}>
                      {order.payment?.status || 'pending'}
                    </span>
                  </td>
                  <td><span className={`status-badge status-${order.status}`}>{order.status}</span></td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="admin-actions">
                      <select className="admin-input" value={order.status} onChange={(event) => updateStatus(order.id, event.target.value)}>
                        {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'].map((status) => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                      <button className="btn btn-sm btn-outline" onClick={() => setExpanded(expanded === order.id ? null : order.id)}>
                        {expanded === order.id ? 'Close' : 'Details'}
                      </button>
                    </div>
                  </td>
                </tr>
                {expanded === order.id && (
                  <tr>
                    <td colSpan="7">
                      <div className="admin-order-details">
                        <div>
                          <strong>Ship to</strong>
                          <p>{order.shipping_address}, {order.shipping_city}, {order.shipping_state} {order.shipping_postal_code}</p>
                        </div>
                        <div>
                          <strong>Items</strong>
                          {order.items.map((item) => (
                            <p key={item.id}>{item.product_name} — {item.size} / {item.color} × {item.quantity}</p>
                          ))}
                        </div>
                        <label>
                          <strong>Tracking number</strong>
                          <div className="admin-actions">
                            <input
                              className="admin-input"
                              value={tracking[order.id] ?? order.tracking_number ?? ''}
                              onChange={(event) => setTracking({ ...tracking, [order.id]: event.target.value })}
                              placeholder="Courier tracking number"
                            />
                            <button className="btn btn-sm btn-secondary" onClick={() => updateStatus(order.id, order.status)}>Save</button>
                          </div>
                        </label>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {!orders.length && <tr><td colSpan="7">No orders found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
