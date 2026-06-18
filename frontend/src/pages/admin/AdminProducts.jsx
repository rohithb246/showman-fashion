import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { productAPI } from '../../services/api';

const emptyProduct = {
  name: '',
  slug: '',
  description: '',
  category_id: '',
  subcategory_id: '',
  base_price: '',
  sale_price: '',
  is_active: true,
  is_featured: false,
  is_new_arrival: false,
  is_trending: false,
};

const emptyStock = {
  variant_id: '',
  size_id: '',
  color_id: '',
  size_ids: [],
  color_ids: [],
  sku: '',
  quantity: 0,
  low_stock_threshold: 5,
  is_active: true,
};

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function productPayload(form) {
  return {
    ...form,
    sale_price: form.sale_price || null,
    subcategory_id: form.subcategory_id || null,
    base_price: Number(form.base_price || 0).toFixed(2),
  };
}

function apiErrorMessage(error) {
  const data = error.response?.data;
  if (!data) return 'Could not save product';
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  const firstKey = Object.keys(data)[0];
  const firstValue = data[firstKey];
  if (Array.isArray(firstValue)) return `${firstKey}: ${firstValue.join(', ')}`;
  if (typeof firstValue === 'string') return `${firstKey}: ${firstValue}`;
  return 'Could not save product';
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [stockForm, setStockForm] = useState(emptyStock);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const variants = useMemo(() => selectedProduct?.variants || [], [selectedProduct]);
  const selectedVariant = useMemo(
    () => variants.find((variant) => String(variant.id) === String(stockForm.variant_id)),
    [stockForm.variant_id, variants]
  );

  const loadData = async () => {
    const [productRes, categoryRes, subcategoryRes, sizeRes, colorRes] = await Promise.all([
      productAPI.list({ page_size: 100, include_inactive: true }),
      productAPI.categories(),
      productAPI.subcategories(),
      productAPI.sizes(),
      productAPI.colors(),
    ]);
    setProducts(productRes.data.results || productRes.data);
    setCategories(categoryRes.data.results || categoryRes.data);
    setSubcategories(subcategoryRes.data.results || subcategoryRes.data);
    setSizes(sizeRes.data.results || sizeRes.data);
    setColors(colorRes.data.results || colorRes.data);
  };

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setForm(emptyProduct);
    setStockForm(emptyStock);
    setSelectedProduct(null);
    setImageFile(null);
  };

  const editProduct = async (product) => {
    const { data } = await productAPI.get(product.slug, { include_inactive: true });
    setSelectedProduct(data);
    setForm({
      name: data.name,
      slug: data.slug,
      description: data.description,
      category_id: data.category?.id || '',
      subcategory_id: data.subcategory?.id || '',
      base_price: data.base_price,
      sale_price: data.sale_price || '',
      is_active: data.is_active,
      is_featured: data.is_featured,
      is_new_arrival: data.is_new_arrival,
      is_trending: data.is_trending,
    });
    setStockForm(emptyStock);
    setImageFile(null);
  };

  const chooseVariant = (variantId) => {
    const variant = variants.find((item) => String(item.id) === String(variantId));
    if (!variant) {
      setStockForm(emptyStock);
      return;
    }
    setStockForm({
      variant_id: variant.id,
      size_id: variant.size?.id || '',
      color_id: variant.color?.id || '',
      size_ids: [],
      color_ids: [],
      sku: variant.sku,
      quantity: variant.inventory?.quantity ?? 0,
      low_stock_threshold: variant.inventory?.low_stock_threshold ?? 5,
      is_active: variant.is_active,
    });
  };

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      slug: field === 'name' && !selectedProduct ? slugify(value) : current.slug,
    }));
  };

  const saveImage = async (productId, productName) => {
    if (!imageFile) return;
    const imageData = new FormData();
    imageData.append('product_id', productId);
    imageData.append('image', imageFile);
    imageData.append('alt_text', productName);
    imageData.append('is_primary', 'true');
    imageData.append('sort_order', '0');
    await productAPI.createImage(imageData);
  };

  const saveStock = async (productId, productSlug) => {
    if (!stockForm.variant_id && stockForm.size_ids.length && stockForm.color_ids.length) {
      await productAPI.bulkCreateVariants({
        product_id: productId,
        size_ids: stockForm.size_ids,
        color_ids: stockForm.color_ids,
        quantity: Number(stockForm.quantity || 0),
        low_stock_threshold: Number(stockForm.low_stock_threshold || 0),
      });
      return;
    }
    if (!stockForm.variant_id && (!stockForm.size_ids.length || !stockForm.color_ids.length)) {
      throw new Error('Select at least one size and one color.');
    }
    if (!stockForm.size_id || !stockForm.color_id) return;

    const size = sizes.find((item) => String(item.id) === String(stockForm.size_id));
    const color = colors.find((item) => String(item.id) === String(stockForm.color_id));
    const sku = stockForm.sku || `${productSlug}-${size?.name || 'size'}-${color?.name || 'color'}`
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-');

    let variantId = stockForm.variant_id;
    if (variantId) {
      await productAPI.updateVariant(variantId, {
        size_id: stockForm.size_id,
        color_id: stockForm.color_id,
        sku,
        is_active: stockForm.is_active,
      });
    } else {
      const { data } = await productAPI.createVariant({
        product_id: productId,
        size_id: stockForm.size_id,
        color_id: stockForm.color_id,
        sku,
        price_adjustment: '0.00',
        is_active: stockForm.is_active,
      });
      variantId = data.id;
    }

    if (selectedVariant?.inventory?.id) {
      await productAPI.updateInventory(selectedVariant.inventory.id, {
        quantity: Number(stockForm.quantity || 0),
        low_stock_threshold: Number(stockForm.low_stock_threshold || 0),
      });
    } else {
      await productAPI.createInventory({
        variant: variantId,
        quantity: Number(stockForm.quantity || 0),
        low_stock_threshold: Number(stockForm.low_stock_threshold || 0),
      });
    }
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = productPayload(form);
      const response = selectedProduct
        ? await productAPI.update(selectedProduct.slug, payload)
        : await productAPI.create(payload);
      const product = response.data;
      await saveImage(product.id, product.name);
      await saveStock(product.id, product.slug);
      await loadData();
      resetForm();
      toast.success('Product saved');
    } catch (error) {
      toast.error(error.message || apiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const toggleProduct = async (product) => {
    try {
      await productAPI.update(product.slug, { is_active: !product.is_active });
      await loadData();
      toast.success(product.is_active ? 'Product hidden from store' : 'Product is now visible');
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  const deleteProduct = async (product) => {
    if (!window.confirm(`Delete "${product.name}" and all of its size/color stock?`)) return;
    try {
      await productAPI.delete(product.slug);
      if (selectedProduct?.id === product.id) resetForm();
      await loadData();
      toast.success('Product deleted');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Could not delete product. It may be used in an order.');
    }
  };

  const toggleMultiOption = (field, id) => {
    setStockForm((current) => {
      const values = current[field];
      return {
        ...current,
        [field]: values.includes(id)
          ? values.filter((value) => value !== id)
          : [...values, id],
      };
    });
  };

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Product Management</h1>
          <p className="admin-page-subtitle">Add images, sizes, quantity, and show or hide products.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={resetForm}>New Product</button>
      </div>

      <form className="admin-form-panel" onSubmit={saveProduct}>
        <div className="admin-form-grid">
          <label>
            Product Name
            <input className="admin-input" value={form.name} onChange={(e) => updateForm('name', e.target.value)} required />
          </label>
          <label>
            Slug
            <input className="admin-input" value={form.slug} onChange={(e) => updateForm('slug', slugify(e.target.value))} required />
          </label>
          <label>
            Category
            <select className="admin-input" value={form.category_id} onChange={(e) => updateForm('category_id', e.target.value)} required>
              <option value="">Select category</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label>
            Subcategory
            <select className="admin-input" value={form.subcategory_id} onChange={(e) => updateForm('subcategory_id', e.target.value)}>
              <option value="">None</option>
              {subcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}
            </select>
          </label>
          <label>
            Price
            <input className="admin-input" type="number" min="0" step="0.01" value={form.base_price} onChange={(e) => updateForm('base_price', e.target.value)} required />
          </label>
          <label>
            Sale Price
            <input className="admin-input" type="number" min="0" step="0.01" value={form.sale_price} onChange={(e) => updateForm('sale_price', e.target.value)} />
          </label>
          <label className="admin-field-wide">
            Description
            <textarea className="admin-input" rows="4" value={form.description} onChange={(e) => updateForm('description', e.target.value)} required />
          </label>
          <label>
            Upload Image
            <input className="admin-input" type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
          </label>
        </div>

        <div className="admin-toggle-row">
          <label><input type="checkbox" checked={form.is_active} onChange={(e) => updateForm('is_active', e.target.checked)} /> Show Product</label>
          <label><input type="checkbox" checked={form.is_featured} onChange={(e) => updateForm('is_featured', e.target.checked)} /> Featured</label>
          <label><input type="checkbox" checked={form.is_new_arrival} onChange={(e) => updateForm('is_new_arrival', e.target.checked)} /> New Arrival</label>
          <label><input type="checkbox" checked={form.is_trending} onChange={(e) => updateForm('is_trending', e.target.checked)} /> Trending</label>
        </div>

        <div className="admin-section-title">Product Options and Stock</div>
        {selectedProduct && (
          <label className="admin-select-row">
            Edit Existing Size
            <select className="admin-input" value={stockForm.variant_id} onChange={(e) => chooseVariant(e.target.value)}>
              <option value="">Add new size/color stock</option>
              {variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.size?.name} / {variant.color?.name} / {variant.sku}
                </option>
              ))}
            </select>
          </label>
        )}
        {!stockForm.variant_id && (
          <div className="admin-option-builder">
            <div>
              <span className="admin-option-label">Select multiple sizes</span>
              <div className="admin-option-chips">
                {sizes.map((size) => (
                  <button
                    type="button"
                    key={size.id}
                    className={`admin-option-chip ${stockForm.size_ids.includes(size.id) ? 'active' : ''}`}
                    onClick={() => toggleMultiOption('size_ids', size.id)}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="admin-option-label">Select multiple colors</span>
              <div className="admin-option-chips">
                {colors.map((color) => (
                  <button
                    type="button"
                    key={color.id}
                    className={`admin-option-chip color ${stockForm.color_ids.includes(color.id) ? 'active' : ''}`}
                    onClick={() => toggleMultiOption('color_ids', color.id)}
                  >
                    <span style={{ backgroundColor: color.hex_code }} />
                    {color.name}
                  </button>
                ))}
              </div>
            </div>
            <p className="admin-muted">
              Every selected size will be combined with every selected color.
            </p>
          </div>
        )}
        <div className="admin-form-grid admin-form-grid-compact">
          {stockForm.variant_id && (
            <>
              <label>
                Size
                <select className="admin-input" value={stockForm.size_id} onChange={(e) => setStockForm({ ...stockForm, size_id: e.target.value })}>
                  <option value="">Select size</option>
                  {sizes.map((size) => <option key={size.id} value={size.id}>{size.name}</option>)}
                </select>
              </label>
              <label>
                Color
                <select className="admin-input" value={stockForm.color_id} onChange={(e) => setStockForm({ ...stockForm, color_id: e.target.value })}>
                  <option value="">Select color</option>
                  {colors.map((color) => <option key={color.id} value={color.id}>{color.name}</option>)}
                </select>
              </label>
            </>
          )}
          <label>
            SKU
            <input className="admin-input" value={stockForm.sku} onChange={(e) => setStockForm({ ...stockForm, sku: e.target.value })} placeholder="Auto-generated" disabled={!stockForm.variant_id} />
          </label>
          <label>
            Quantity
            <input className="admin-input" type="number" min="0" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: e.target.value })} />
          </label>
          <label>
            Low Stock Alert
            <input className="admin-input" type="number" min="0" value={stockForm.low_stock_threshold} onChange={(e) => setStockForm({ ...stockForm, low_stock_threshold: e.target.value })} />
          </label>
          <label className="admin-check-field">
            <input type="checkbox" checked={stockForm.is_active} onChange={(e) => setStockForm({ ...stockForm, is_active: e.target.checked })} />
            Show Option
          </label>
        </div>

        <div className="admin-actions">
          <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Product'}</button>
          {selectedProduct && <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel Edit</button>}
        </div>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Image</th><th>Name</th><th>Price</th><th>Featured</th><th>Visible</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.primary_image ? <img className="admin-thumb" src={product.primary_image} alt={product.name} /> : 'No image'}</td>
                <td><strong>{product.name}</strong><br /><span className="admin-muted">{product.category_name}</span></td>
                <td>Rs {Number(product.effective_price).toLocaleString()}</td>
                <td>{product.is_featured ? 'Yes' : 'No'}</td>
                <td>{product.is_active ? <span className="badge badge-gold">Shown</span> : <span className="badge badge-sale">Hidden</span>}</td>
                <td>
                  <div className="admin-actions">
                    <button className="btn btn-sm btn-outline" onClick={() => editProduct(product)}>Edit</button>
                    <button className="btn btn-sm btn-secondary" onClick={() => toggleProduct(product)}>
                      {product.is_active ? 'Hide' : 'Show'}
                    </button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteProduct(product)}>
                      Delete
                    </button>
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
