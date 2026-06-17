import { useState, useEffect } from 'react';
import { productAPI } from '../../services/api';

export default function AdminInventory() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    productAPI.inventory().then((r) => setItems(r.data.results || r.data));
  }, []);

  return (
    <div>
      <h1 className="admin-page-title">Stock Management</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>SKU</th><th>Product</th><th>Quantity</th><th>Threshold</th><th>Status</th></tr></thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.variant?.id || item.id}>
                <td>{item.variant_sku || 'N/A'}</td>
                <td>{item.product_name}</td>
                <td>{item.quantity}</td>
                <td>{item.low_stock_threshold}</td>
                <td>
                  {item.is_low_stock ? (
                    <span className="badge badge-sale">Low Stock</span>
                  ) : (
                    <span className="badge badge-gold">In Stock</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
