import { useState, useEffect } from 'react';
import { productAPI } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productAPI.list({ page_size: 50 }).then((r) => {
      setProducts(r.data.results || r.data);
    }).finally(() => setLoading(false));
  }, []);

  const toggleActive = async (slug, is_active) => {
    await productAPI.update(slug, { is_active: !is_active });
    toast.success('Product updated');
    const { data } = await productAPI.list({ page_size: 50 });
    setProducts(data.results || data);
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div>
      <h1 className="admin-page-title">Product Management</h1>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Name</th><th>Price</th><th>Featured</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>₹{Number(p.effective_price).toLocaleString()}</td>
                <td>{p.is_featured ? 'Yes' : 'No'}</td>
                <td><span className="badge badge-gold">Active</span></td>
                <td>
                  <button className="btn btn-sm btn-outline" onClick={() => toggleActive(p.slug, true)}>
                    Toggle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
