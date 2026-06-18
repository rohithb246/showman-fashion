import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productAPI } from '../services/api';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import './Shop.css';

export default function Shop() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const params = Object.fromEntries(searchParams.entries());
  const queryKey = searchParams.toString();

  useEffect(() => {
    productAPI.categories().then((r) => setCategories(r.data.results || r.data));
    productAPI.sizes().then((r) => setSizes(r.data.results || r.data));
    productAPI.colors().then((r) => setColors(r.data.results || r.data));
  }, []);

  useEffect(() => {
    const requestParams = Object.fromEntries(new URLSearchParams(queryKey).entries());
    setLoading(true);
    productAPI.list({
      search: requestParams.search,
      category: requestParams.category,
      size: requestParams.size,
      color: requestParams.color,
      min_price: requestParams.min_price,
      max_price: requestParams.max_price,
      is_featured: requestParams.is_featured,
      is_new_arrival: requestParams.is_new_arrival,
      is_trending: requestParams.is_trending,
      ordering: requestParams.ordering || '-created_at',
      page: requestParams.page || 1,
    }).then((r) => {
      setProducts(r.data.results || r.data);
      setTotalCount(r.data.count || (r.data.results || r.data).length);
    }).finally(() => setLoading(false));
  }, [queryKey]);

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    newParams.delete('page');
    setSearchParams(newParams);
  };

  const clearFilters = () => setSearchParams({});

  return (
    <div className="shop-page">
      <div className="page-header">
        <h1>Shop Collection</h1>
        <p>{totalCount} products found</p>
      </div>

      <div className="container shop-layout">
        <aside className={`shop-filters ${filtersOpen ? 'open' : ''}`}>
          <div className="filters-header">
            <h3>Filters</h3>
            <button onClick={clearFilters} className="btn btn-ghost btn-sm">Clear All</button>
          </div>

          <div className="filter-group">
            <h4>Category</h4>
            {categories.map((c) => (
              <label key={c.id} className="filter-option">
                <input
                  type="radio"
                  name="category"
                  checked={params.category === c.slug}
                  onChange={() => updateFilter('category', params.category === c.slug ? '' : c.slug)}
                />
                {c.name}
              </label>
            ))}
          </div>

          <div className="filter-group">
            <h4>Size</h4>
            <div className="filter-chips">
              {sizes.map((s) => (
                <button
                  key={s.id}
                  className={`chip ${params.size === s.name ? 'active' : ''}`}
                  onClick={() => updateFilter('size', params.size === s.name ? '' : s.name)}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <h4>Color</h4>
            <div className="filter-chips">
              {colors.map((c) => (
                <button
                  key={c.id}
                  className={`chip color-chip ${params.color === c.name ? 'active' : ''}`}
                  style={{ '--chip-color': c.hex_code }}
                  onClick={() => updateFilter('color', params.color === c.name ? '' : c.name)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <h4>Price Range</h4>
            <div className="price-inputs">
              <input
                type="number"
                placeholder="Min"
                className="form-input"
                value={params.min_price || ''}
                onChange={(e) => updateFilter('min_price', e.target.value)}
              />
              <span>—</span>
              <input
                type="number"
                placeholder="Max"
                className="form-input"
                value={params.max_price || ''}
                onChange={(e) => updateFilter('max_price', e.target.value)}
              />
            </div>
          </div>
        </aside>

        <div className="shop-main">
          <div className="shop-toolbar">
            <button className="btn btn-outline btn-sm filter-toggle" onClick={() => setFiltersOpen(!filtersOpen)}>
              Filters
            </button>
            <select
              className="form-input sort-select"
              value={params.ordering || '-created_at'}
              onChange={(e) => updateFilter('ordering', e.target.value)}
            >
              <option value="-created_at">Newest</option>
              <option value="base_price">Price: Low to High</option>
              <option value="-base_price">Price: High to Low</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : products.length ? (
            <div className="grid-products">
              {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No products found</h3>
              <p>Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
