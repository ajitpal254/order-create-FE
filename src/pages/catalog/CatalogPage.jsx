import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productApi, attributeApi } from '../../api/client';
import { useOrder } from '../../context/OrderContext';
import { 
  Search, 
  Filter, 
  Layers, 
  ShoppingCart, 
  Check, 
  Info, 
  Sparkles,
  ArrowRight,
  Shield,
  Box
} from 'lucide-react';

export const CatalogPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);

  const { addItem } = useOrder();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [prodRes, attrRes] = await Promise.all([
          productApi.getProducts({
            category: selectedCategory !== 'All' ? selectedCategory : '',
            search: searchTerm,
          }),
          attributeApi.getAll(),
        ]);

        if (prodRes.success) setProducts(prodRes.data);
        if (attrRes.success && attrRes.data.categories) {
          setCategories(attrRes.data.categories);
        }
      } catch (err) {
        console.error('Failed to load catalog:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, searchTerm]);

  const handleConfigureInOrderCreator = (product) => {
    navigate('/order-creator', { state: { preSelectedProduct: product } });
  };

  return (
    <div style={{ padding: '2.5rem 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div className="badge badge-amber" style={{ marginBottom: '0.75rem' }}>
            <Layers size={14} />
            <span>EXPORT TOOLING DIRECTORY</span>
          </div>
          <h1 style={{ fontSize: '2.4rem', color: '#FFFFFF', marginBottom: '0.5rem' }}>
            H.A. Overseas Tools Catalog
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Explore export-grade hand tools, grease guns, wrenches, and workshop hardware available for custom configuration.
          </p>
        </div>

        {/* Filters & Search Bar */}
        <div
          className="glass-card"
          style={{
            marginBottom: '2rem',
            padding: '1.25rem',
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <Search
              size={18}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search by SKU, tool name, or description..."
              className="form-control"
              style={{ paddingLeft: '2.5rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Category Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => setSelectedCategory('All')}
              className={`btn btn-sm ${selectedCategory === 'All' ? 'btn-primary' : 'btn-secondary'}`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c._id}
                onClick={() => setSelectedCategory(c.name)}
                className={`btn btn-sm ${selectedCategory === c.name ? 'btn-primary' : 'btn-secondary'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-muted)' }}>
            <div className="animate-glow" style={{ fontSize: '1.2rem', color: 'var(--accent-amber)' }}>
              Loading H.A. Overseas Catalog...
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <Box size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ color: '#FFFFFF', marginBottom: '0.5rem' }}>No matching products found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Try searching with another keyword or select All Categories.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {products.map((product) => (
              <div
                key={product._id}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 0,
                  overflow: 'hidden',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                }}
              >
                {/* Product Image */}
                <div style={{ height: '220px', position: 'relative', overflow: 'hidden', backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px' }}>
                  <img
                    src={product.images?.[0] || 'https://haoverseas.com/img-products/com-span.jpg'}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                      color: 'var(--accent-amber-light)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                    }}
                  >
                    {product.sku}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      right: '10px',
                      backgroundColor: 'rgba(16, 185, 129, 0.9)',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: '#090D16',
                    }}
                  >
                    MOQ: {product.moq || 50} pcs
                  </div>
                </div>

                {/* Product Details */}
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', fontWeight: 600, marginBottom: '0.25rem' }}>
                    {product.category}
                  </div>
                  <h3 style={{ fontSize: '1.15rem', color: '#FFFFFF', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                    {product.name}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      marginBottom: '1rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {product.description}
                  </p>

                  {/* Attributes Badges */}
                  <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1rem' }}>
                      {product.allowedFinishes?.slice(0, 2).map((f, i) => (
                        <span key={i} className="badge badge-slate" style={{ fontSize: '0.65rem' }}>
                          {f}
                        </span>
                      ))}
                      {product.allowedFinishes?.length > 2 && (
                        <span className="badge badge-slate" style={{ fontSize: '0.65rem' }}>
                          +{product.allowedFinishes.length - 2} Finishes
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Base FOB Price:</span>
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-amber)' }}>
                          ${(product.basePrice || 0).toFixed(2)} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ pc</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Packing:</span>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#FFFFFF' }}>
                          {product.pcsPerCarton || 20} pcs/ctn
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleConfigureInOrderCreator(product)}
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                    >
                      <ShoppingCart size={16} />
                      <span>Configure & Order</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
