import { useState, useEffect } from 'react';
import { productAPI } from '../../services/api';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    productAPI.coupons().then((r) => setCoupons(r.data.results || r.data));
  }, []);

  return (
    <div>
      <h1 className="admin-page-title">Coupon Management</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Used</th><th>Status</th></tr></thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id}>
                <td><strong>{c.code}</strong></td>
                <td>{c.discount_type}</td>
                <td>{c.discount_value}{c.discount_type === 'percentage' ? '%' : '₹'}</td>
                <td>{c.used_count}/{c.max_uses || '∞'}</td>
                <td>{c.is_active ? 'Active' : 'Inactive'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
