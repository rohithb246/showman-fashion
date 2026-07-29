import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { productAPI } from '../../services/api';

const emptyProduct = {
  name: '',
  slug: '',
  brand_name: '',
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
  if (!data) return error.message || 'Could not save product';
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  const firstKey = Object.keys(data)[0];
  const firstValue = data[firstKey];
  if (Array.isArray(firstValue)) return `${firstKey}: ${firstValue.join(', ')}`;
  if (typeof firstValue === 'string') return `${firstKey}: ${firstValue}`;
  return 'Could not save product';
}

function uniqueOptionIds(variants, field) {
  return [...new Set(variants.map((variant) => variant[field]?.id).filter(Boolean))];
}

function sameIds(left, right) {
  if (left.length !== right.length) return false;
  const rightIds = new Set(right.map(String));
  return left.every((id) => rightIds.has(String(id)));
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
  const [inventoryTouched, setInventoryTouched] = useState(false);

  const variants = useMemo(() => selectedProduct?.variants || [], [selectedProduct]);
  const selectedVariant = useMemo(
    () => variants.find((variant) => String(variant.id) === String(stockForm.variant_id)),
    [stockForm.variant_id, variants]
  );
  const currentImages = selectedProduct?.images || [];
  const visibleSubcategories = useMemo(
    () => subcategories.filter((subcategory) => String(subcategory.category) === String(form.category_id)),
    [form.category_id, subcategories]
  );
  const stockFieldsDisabled = Boolean(
    selectedProduct
    && !stockForm.variant_id
    && !(stockForm.size_ids.length && stockForm.color_ids.length)
  );

  const loadData = async () => {
    const [productRes, categoryRes, subcategoryRes, sizeRes, colorRes] = await Promise.all([
      // A timestamp prevents browsers/proxies from showing the pre-save list.
      productAPI.list({ page_size: 100, include_inactive: true, refresh: Date.now() }),
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
    setInventoryTouched(false);
  };

  const editProduct = async (product) => {
    try {
      const { data } = await productAPI.get(product.slug, { include_inactive: true, refresh: product.id });
      setSelectedProduct(data);
      setForm({
        name: data.name,
        slug: data.slug,
        brand_name: data.brand_name || '',
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
      // Keep the option builder empty in edit mode. Existing variants are only
      // changed after explicitly selecting one from the dropdown below.
      setStockForm(emptyStock);
      setImageFile(null);
      setInventoryTouched(false);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  const chooseVariant = (variantId) => {
    const variant = variants.find((item) => String(item.id) === String(variantId));
    if (!variant) {
      // Choosing "Add new" starts with no selected combinations. It must not
      // inherit all existing options, because that makes a standard edit look
      // like a bulk stock update.
      setStockForm(emptyStock);
      setInventoryTouched(false);
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
    setInventoryTouched(false);
  };

  const updateStockForm = (field, value) => {
    setStockForm((current) => ({ ...current, [field]: value }));
    if (['quantity', 'low_stock_threshold'].includes(field)) {
      setInventoryTouched(true);
    }
  };

  const updateForm = (field, value) => {
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === 'category_id' ? { subcategory_id: '' } : {}),
      slug: field === 'name' && !selectedProduct ? slugify(value) : current.slug,
    }));
  };

  const validateProductForm = () => {
    if (form.subcategory_id) {
      const subcategory = subcategories.find((item) => String(item.id) === String(form.subcategory_id));
      if (subcategory && String(subcategory.category) !== String(form.category_id)) {
        throw new Error('Choose a subcategory from the selected category.');
      }
    }
    if (!selectedProduct && (!stockForm.size_ids.length || !stockForm.color_ids.length)) {
      throw new Error('Select at least one size and one color before adding a new product.');
    }
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

  const syncProductOptions = async (productId) => {
    const selectedSizeIds = stockForm.size_ids.map(String);
    const selectedColorIds = stockForm.color_ids.map(String);
    const currentSizeIds = uniqueOptionIds(variants, 'size');
    const currentColorIds = uniqueOptionIds(variants, 'color');

    if ((selectedSizeIds.length && !selectedColorIds.length) || (!selectedSizeIds.length && selectedColorIds.length)) {
      throw new Error('Select at least one size and one color, or unselect both to remove all stock options.');
    }

    const optionsChanged = !sameIds(stockForm.size_ids, currentSizeIds) || !sameIds(stockForm.color_ids, currentColorIds);
    if (!optionsChanged && !inventoryTouched) {
      return;
    }

    const existingByOption = new Map(
      variants.map((variant) => [`${variant.size?.id}:${variant.color?.id}`, variant])
    );
    for (const sizeId of stockForm.size_ids) {
      for (const colorId of stockForm.color_ids) {
        const key = `${sizeId}:${colorId}`;
        const existing = existingByOption.get(key);
        if (existing) {
          if (!existing.is_active) {
            await productAPI.updateVariant(existing.id, { is_active: true });
          }
          if (!existing.inventory?.id) {
            await productAPI.createInventory({
              variant: existing.id,
              quantity: Number(stockForm.quantity || 0),
              low_stock_threshold: Number(stockForm.low_stock_threshold || 0),
            });
          } else if (inventoryTouched) {
            await productAPI.updateInventory(existing.inventory.id, {
              quantity: Number(stockForm.quantity || 0),
              low_stock_threshold: Number(stockForm.low_stock_threshold || 0),
            });
          }
          continue;
        }

        const size = sizes.find((item) => String(item.id) === String(sizeId));
        const color = colors.find((item) => String(item.id) === String(colorId));
        const sku = `${selectedProduct.slug}-${size?.name || 'size'}-${color?.name || 'color'}`
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, '-')
          .slice(0, 50);
        const { data } = await productAPI.createVariant({
          product_id: productId,
          size_id: sizeId,
          color_id: colorId,
          sku,
          price_adjustment: '0.00',
          is_active: true,
        });
        await productAPI.createInventory({
          variant: data.id,
          quantity: Number(stockForm.quantity || 0),
          low_stock_threshold: Number(stockForm.low_stock_threshold || 0),
        });
      }
    }
  };

  const saveStock = async (productId, productSlug) => {
    if (selectedProduct && !stockForm.variant_id) {
      // Editing product information must never alter stock unless the admin
      // intentionally selects at least one new size and one new colour.
      if (stockForm.size_ids.length || stockForm.color_ids.length) {
        await syncProductOptions(productId);
      }
      return;
    }
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
      validateProductForm();
      const payload = productPayload(form);
      const response = selectedProduct
        ? await productAPI.update(selectedProduct.slug, payload)
        : await productAPI.create(payload);
      const product = response.data;
      await saveImage(product.id, product.name);
      await saveStock(product.id, product.slug);
      // Do not rely on the PATCH response or stale component state. Reload the
      // edited object first, then reload the table from the server of record.
      if (selectedProduct) {
        const refreshed = await productAPI.get(product.slug, { include_inactive: true, refresh: product.updated_at || product.id });
        setSelectedProduct(refreshed.data);
      }
      await loadData();
      resetForm();
      toast.success('Product saved');
    } catch (error) {
      toast.error(apiErrorMessage(error));
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
            Brand Name
            <input className="admin-input" value={form.brand_name} onChange={(e) => updateForm('brand_name', e.target.value)} placeholder="e.g. The Show Man" />
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
              {visibleSubcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}
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
            {selectedProduct && (
              <div className="admin-image-strip">
                {currentImages.length ? currentImages.map((image) => (
                  <img key={image.id} src={image.image} alt={image.alt_text || selectedProduct.name} />
                )) : (
                  <span className="admin-muted">No image uploaded yet.</span>
                )}
              </div>
            )}
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
            Edit Existing Size / Colour Stock
            <select className="admin-input" value={stockForm.variant_id} onChange={(e) => chooseVariant(e.target.value)}>
              <option value="">Add new size/color stock</option>
              {variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.size?.name} / {variant.color?.name} / Qty {variant.inventory?.quantity ?? 0} / {variant.sku}
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
              Select sizes and colours only to add new combinations. Existing stock is unchanged unless you choose an existing option above.
            </p>
          </div>
        )}
        <div className="admin-form-grid admin-form-grid-compact">
          {stockForm.variant_id && (
            <>
              <label>
                Size
                <select className="admin-input" value={stockForm.size_id} onChange={(e) => updateStockForm('size_id', e.target.value)}>
                  <option value="">Select size</option>
                  {sizes.map((size) => <option key={size.id} value={size.id}>{size.name}</option>)}
                </select>
              </label>
              <label>
                Color
                <select className="admin-input" value={stockForm.color_id} onChange={(e) => updateStockForm('color_id', e.target.value)}>
                  <option value="">Select color</option>
                  {colors.map((color) => <option key={color.id} value={color.id}>{color.name}</option>)}
                </select>
              </label>
            </>
          )}
          <label>
            SKU
            <input className="admin-input" value={stockForm.sku} onChange={(e) => updateStockForm('sku', e.target.value)} placeholder="Auto-generated" disabled={!stockForm.variant_id} />
          </label>
          <label>
            Quantity
            <input className="admin-input" type="number" min="0" disabled={stockFieldsDisabled} value={stockForm.quantity} onChange={(e) => updateStockForm('quantity', e.target.value)} />
          </label>
          <label>
            Low Stock Alert
            <input className="admin-input" type="number" min="0" disabled={stockFieldsDisabled} value={stockForm.low_stock_threshold} onChange={(e) => updateStockForm('low_stock_threshold', e.target.value)} />
          </label>
          <label className="admin-check-field">
            <input type="checkbox" disabled={stockFieldsDisabled} checked={stockForm.is_active} onChange={(e) => updateStockForm('is_active', e.target.checked)} />
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
            <tr><th>Image</th><th>Name</th><th>Brand</th><th>Price</th><th>Featured</th><th>Visible</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>{product.primary_image ? <img className="admin-thumb" src={product.primary_image} alt={product.name} /> : 'No image'}</td>
                <td><strong>{product.name}</strong><br /><span className="admin-muted">{product.category_name}</span></td>
                <td>{product.brand_name || '-'}</td>
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
