import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { productAPI } from '../../services/api';

const emptyBanner = {
  title: '',
  subtitle: '',
  link: '',
  banner_type: 'hero',
  is_active: true,
  sort_order: 0,
};

function bannerFormData(form, imageFile) {
  const data = new FormData();
  Object.entries(form).forEach(([key, value]) => data.append(key, value));
  if (imageFile) data.append('image', imageFile);
  return data;
}

function bannerError(error) {
  const data = error.response?.data;
  if (!data) return 'Could not save banner';
  if (data.detail) return data.detail;
  const key = Object.keys(data)[0];
  return `${key}: ${Array.isArray(data[key]) ? data[key].join(', ') : data[key]}`;
}

export default function AdminBanners() {
  const [banners, setBanners] = useState([]);
  const [form, setForm] = useState(emptyBanner);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadBanners = async () => {
    const { data } = await productAPI.banners();
    setBanners(data.results || data);
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyBanner);
    setImageFile(null);
  };

  const editBanner = (banner) => {
    setEditingId(banner.id);
    setForm({
      title: banner.title,
      subtitle: banner.subtitle || '',
      link: banner.link || '',
      banner_type: banner.banner_type,
      is_active: banner.is_active,
      sort_order: banner.sort_order,
    });
    setImageFile(null);
  };

  const saveBanner = async (event) => {
    event.preventDefault();
    if (!editingId && !imageFile) {
      toast.error('Please upload a banner image');
      return;
    }

    setSaving(true);
    try {
      const data = bannerFormData(form, imageFile);
      if (editingId) {
        await productAPI.updateBanner(editingId, data);
      } else {
        await productAPI.createBanner(data);
      }
      await loadBanners();
      resetForm();
      toast.success('Banner saved');
    } catch (error) {
      toast.error(bannerError(error));
    } finally {
      setSaving(false);
    }
  };

  const deleteBanner = async (banner) => {
    if (!window.confirm(`Delete banner "${banner.title}"?`)) return;
    try {
      await productAPI.deleteBanner(banner.id);
      await loadBanners();
      toast.success('Banner deleted');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not delete banner');
    }
  };

  const toggleBanner = async (banner) => {
    try {
      const data = bannerFormData({
        title: banner.title,
        subtitle: banner.subtitle || '',
        link: banner.link || '',
        banner_type: banner.banner_type,
        is_active: !banner.is_active,
        sort_order: banner.sort_order,
      });
      await productAPI.updateBanner(banner.id, data);
      await loadBanners();
      toast.success(banner.is_active ? 'Banner hidden' : 'Banner shown');
    } catch (error) {
      toast.error(bannerError(error));
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Banner Management</h1>
          <p className="admin-page-subtitle">Create, edit, upload images, and control visible banners.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={resetForm}>New Banner</button>
      </div>

      <form className="admin-form-panel" onSubmit={saveBanner}>
        <div className="admin-form-grid">
          <label>
            Title
            <input className="admin-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </label>
          <label>
            Type
            <select className="admin-input" value={form.banner_type} onChange={(e) => setForm({ ...form, banner_type: e.target.value })}>
              <option value="hero">Hero</option>
              <option value="promo">Promotional</option>
              <option value="collection">Collection</option>
            </select>
          </label>
          <label>
            Link
            <input className="admin-input" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="/shop" />
          </label>
          <label>
            Sort Order
            <input className="admin-input" type="number" min="0" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} />
          </label>
          <label>
            Banner Image
            <input className="admin-input" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          </label>
          <label className="admin-field-wide">
            Subtitle
            <input className="admin-input" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
          </label>
          <label className="admin-check-field">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Show Banner
          </label>
        </div>
        <div className="admin-actions">
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Banner'}</button>
          {editingId && <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel Edit</button>}
        </div>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Image</th><th>Title</th><th>Type</th><th>Active</th><th>Order</th><th>Actions</th></tr></thead>
          <tbody>
            {banners.map((banner) => (
              <tr key={banner.id}>
                <td>{banner.image ? <img className="admin-thumb admin-banner-thumb" src={banner.image} alt={banner.title} /> : 'No image'}</td>
                <td><strong>{banner.title}</strong><br /><span className="admin-muted">{banner.subtitle}</span></td>
                <td>{banner.banner_type}</td>
                <td>{banner.is_active ? <span className="badge badge-gold">Shown</span> : <span className="badge badge-sale">Hidden</span>}</td>
                <td>{banner.sort_order}</td>
                <td>
                  <div className="admin-actions">
                    <button className="btn btn-sm btn-outline" onClick={() => editBanner(banner)}>Edit</button>
                    <button className="btn btn-sm btn-secondary" onClick={() => toggleBanner(banner)}>
                      {banner.is_active ? 'Hide' : 'Show'}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteBanner(banner)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
