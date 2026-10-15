// pages/Products.jsx — full implementation in Milestone 3
import { useState, useEffect, useCallback, useRef } from "react";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import Loader from "../components/Loader";
import ErrorMessage from "../components/ErrorMessage";
import EmptyState from "../components/EmptyState";

const CATEGORIES = ["All", "Electronics", "Fashion", "Books", "Home"];

export default function Products() {
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [search, setSearch]       = useState("");
  const [category, setCategory]   = useState("All");
  const [sort, setSort]           = useState("");
  const debounceRef               = useRef(null);

  const fetchProducts = useCallback(async (q, cat, srt) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q)   params.set("search", q);
      if (cat && cat !== "All") params.set("category", cat);
      if (srt) params.set("sort", srt);
      const { data } = await api.get(`/products?${params}`);
      setProducts(data.products || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { fetchProducts("", "All", ""); }, [fetchProducts]);

  // Debounced search
  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchProducts(val, category, sort), 400);
  };

  const handleCategory = (e) => {
    const cat = e.target.value;
    setCategory(cat);
    fetchProducts(search, cat, sort);
  };

  const handleSort = (e) => {
    const srt = e.target.value;
    setSort(srt);
    fetchProducts(search, category, srt);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>🏪 Products</h1>
        <p>Discover our curated collection</p>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            id="product-search"
            type="text"
            className="form-input search-input"
            placeholder="Search products…"
            value={search}
            onChange={handleSearch}
          />
        </div>

        <select className="form-select" style={{ width: "auto", minWidth: 160 }} value={category} onChange={handleCategory} id="category-filter">
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select className="form-select" style={{ width: "auto", minWidth: 160 }} value={sort} onChange={handleSort} id="sort-filter">
          <option value="">Sort: Default</option>
          <option value="price_asc">Price: Low → High</option>
          <option value="price_desc">Price: High → Low</option>
        </select>
      </div>

      {/* States */}
      {loading && <Loader text="Loading products…" />}
      {!loading && error && <ErrorMessage message={error} onRetry={() => fetchProducts(search, category, sort)} />}
      {!loading && !error && products.length === 0 && (
        <EmptyState icon="🔍" title="No products found" description="Try a different search or category." actionLabel="View All" actionTo="/products" />
      )}
      {!loading && !error && products.length > 0 && (
        <>
          <p className="text-muted text-sm mb-md">{products.length} product{products.length !== 1 ? "s" : ""} found</p>
          <div className="products-grid">
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </>
      )}
    </div>
  );
}
