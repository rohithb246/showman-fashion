import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { productAPI } from '../../services/api';

const emptyCoupon = {
  code: '',
  description: '',
  discount_type: 'percentage',
  discount_value: '',
  min_order_amount: 0,
  max_uses: '',
  is_active: true,
  valid_from: '',
  valid_until: '',
};

function toInputDate(value) {
  if (!value) return '';
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function toApiDate(value) {
  return value ? new Date(value).toISOString() : '';
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(emptyCoupon);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadCoupons = async () => {
    const { data } = await productAPI.coupons();
    setCoupons(data.results || data);
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyCoupon);
  };

  const editCoupon = (coupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      description: coupon.description || '',
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_order_amount: coupon.min_order_amount,
      max_uses: coupon.max_uses || '',
      is_active: coupon.is_active,
      valid_from: toInputDate(coupon.valid_from),
      valid_until: toInputDate(coupon.valid_until),
    });
  };

  const saveCoupon = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase().trim(),
        max_uses: form.max_uses === '' ? null : Number(form.max_uses),
        discount_value: Number(form.discount_value || 0).toFixed(2),
        min_order_amount: Number(form.min_order_amount || 0).toFixed(2),
        valid_from: toApiDate(form.valid_from),
        valid_until: toApiDate(form.valid_until),
      };
      if (editingId) {
        await productAPI.updateCoupon(editingId, payload);
      } else {
        await productAPI.createCoupon(payload);
      }
      await loadCoupons();
      resetForm();
      toast.success('Coupon saved');
    } catch {
      toast.error('Could not save coupon');
    } finally {
      setSaving(false);
    }
  };

  const deleteCoupon = async (coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;
    await productAPI.deleteCoupon(coupon.id);
    await loadCoupons();
    toast.success('Coupon deleted');
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Coupon Management</h1>
          <p className="admin-page-subtitle">Add new coupons or edit existing discounts.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={resetForm}>New Coupon</button>
      </div>

      <form className="admin-form-panel" onSubmit={saveCoupon}>
        <div className="admin-form-grid">
          <label>
            Code
            <input className="admin-input" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
          </label>
          <label>
            Discount Type
            <select className="admin-input" value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })}>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>
          </label>
          <label>
            Discount Value
            <input className="admin-input" type="number" min="0" step="0.01" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} required />
          </label>
          <label>
            Minimum Order
            <input className="admin-input" type="number" min="0" step="0.01" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: e.target.value })} />
          </label>
          <label>
            Max Uses
            <input className="admin-input" type="number" min="0" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: e.target.value })} placeholder="Unlimited" />
          </label>
          <label>
            Valid From
            <input className="admin-input" type="datetime-local" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} required />
          </label>
          <label>
            Valid Until
            <input className="admin-input" type="datetime-local" value={form.valid_until} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} required />
          </label>
          <label className="admin-field-wide">
            Description
            <input className="admin-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <label className="admin-check-field">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>
        </div>
        <div className="admin-actions">
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Coupon'}</button>
          {editingId && <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel Edit</button>}
        </div>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Used</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id}>
                <td><strong>{coupon.code}</strong><br /><span className="admin-muted">{coupon.description}</span></td>
                <td>{coupon.discount_type}</td>
                <td>{coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `Rs ${coupon.discount_value}`}</td>
                <td>{coupon.used_count}/{coupon.max_uses || 'Unlimited'}</td>
                <td>{coupon.is_active ? <span className="badge badge-gold">Active</span> : <span className="badge badge-sale">Inactive</span>}</td>
                <td>
                  <div className="admin-actions">
                    <button className="btn btn-sm btn-outline" onClick={() => editCoupon(coupon)}>Edit</button>
                    <button className="btn btn-sm btn-secondary" onClick={() => deleteCoupon(coupon)}>Delete</button>
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
