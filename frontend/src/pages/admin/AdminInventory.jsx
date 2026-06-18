import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { productAPI } from '../../services/api';

export default function AdminInventory() {
  const [items, setItems] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [cleaning, setCleaning] = useState(false);

  const visibleItems = useMemo(() => {
    const seen = new Set();
    return items.filter((item) => {
      const key = item.variant_sku || item.variant || item.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [items]);

  const loadInventory = async () => {
    const { data } = await productAPI.inventory();
    const rows = data.results || data;
    setItems(rows);
    setDrafts(Object.fromEntries(rows.map((item) => [
      item.id,
      {
        quantity: item.quantity,
        low_stock_threshold: item.low_stock_threshold,
      },
    ])));
  };

  useEffect(() => {
    loadInventory();
  }, []);

  const updateDraft = (id, field, value) => {
    setDrafts((current) => ({
      ...current,
      [id]: { ...current[id], [field]: value },
    }));
  };

  const saveItem = async (item) => {
    setSavingId(item.id);
    try {
      await productAPI.updateInventory(item.id, {
        quantity: Number(drafts[item.id]?.quantity || 0),
        low_stock_threshold: Number(drafts[item.id]?.low_stock_threshold || 0),
      });
      await loadInventory();
      toast.success('Stock updated');
    } catch {
      toast.error('Could not update stock');
    } finally {
      setSavingId(null);
    }
  };

  const cleanupInventory = async () => {
    setCleaning(true);
    try {
      const { data } = await productAPI.cleanupInventory();
      await loadInventory();
      toast.success(`Cleaned: ${data.created_missing_inventory} missing, ${data.deduplicated_variant_groups} duplicate groups`);
    } catch {
      toast.error('Could not clean inventory');
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Stock Management</h1>
          <p className="admin-page-subtitle">Update stock counts and clean missing or duplicate inventory records.</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={cleanupInventory} disabled={cleaning}>
          {cleaning ? 'Cleaning...' : 'Clean Stock Data'}
        </button>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>SKU</th><th>Product</th><th>Quantity</th><th>Threshold</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {visibleItems.map((item) => (
              <tr key={item.id}>
                <td><strong>{item.variant_sku || 'N/A'}</strong></td>
                <td>{item.product_name}</td>
                <td>
                  <input
                    className="admin-input admin-number-input"
                    type="number"
                    min="0"
                    value={drafts[item.id]?.quantity ?? item.quantity}
                    onChange={(e) => updateDraft(item.id, 'quantity', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    className="admin-input admin-number-input"
                    type="number"
                    min="0"
                    value={drafts[item.id]?.low_stock_threshold ?? item.low_stock_threshold}
                    onChange={(e) => updateDraft(item.id, 'low_stock_threshold', e.target.value)}
                  />
                </td>
                <td>
                  {Number(drafts[item.id]?.quantity ?? item.quantity) <= Number(drafts[item.id]?.low_stock_threshold ?? item.low_stock_threshold) ? (
                    <span className="badge badge-sale">Low Stock</span>
                  ) : (
                    <span className="badge badge-gold">In Stock</span>
                  )}
                </td>
                <td>
                  <button className="btn btn-sm btn-outline" onClick={() => saveItem(item)} disabled={savingId === item.id}>
                    {savingId === item.id ? 'Saving...' : 'Save'}
                  </button>
                </td>
              </tr>
            ))}
            {!visibleItems.length && (
              <tr><td colSpan="6">No stock records found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
