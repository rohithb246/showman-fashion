import { useState, useEffect } from 'react';
import { productAPI } from '../../services/api';

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    productAPI.banners().then((r) => setBanners(r.data.results || r.data));
  }, []);

  return (
    <div>
      <h1 className="admin-page-title">Banner Management</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Title</th><th>Type</th><th>Active</th><th>Order</th></tr></thead>
          <tbody>
            {banners.map((b) => (
              <tr key={b.id}>
                <td>{b.title}</td>
                <td>{b.banner_type}</td>
                <td>{b.is_active ? 'Yes' : 'No'}</td>
                <td>{b.sort_order}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
