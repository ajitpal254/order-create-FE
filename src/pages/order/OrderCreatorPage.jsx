import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOrder } from '../../context/OrderContext';
import { productApi, attributeApi, orderApi } from '../../api/client';
import confetti from 'canvas-confetti';
import { 
  Wrench, 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Layers, 
  CheckCircle2, 
  FileDown, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  Package,
  Weight,
  Boxes,
  DollarSign,
  Building,
  Printer
} from 'lucide-react';
import { Modal } from '../../components/Modal';

export const OrderCreatorPage = () => {
  const { user, isAuthenticated } = useAuth();
  const { 
    cartItems, 
    addItem, 
    updateItem, 
    removeItem, 
    clearCart, 
    totals, 
    orderMetadata, 
    setOrderMetadata, 
    submitOrder 
  } = useOrder();

  const location = useLocation();
  const navigate = useNavigate();

  // Master Data States
  const [products, setProducts] = useState([]);
  const [attributes, setAttributes] = useState({
    finishes: [],
    colors: [],
    brands: [],
    sizes: [],
    categories: [],
  });
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Configurator Form State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedFinish, setSelectedFinish] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedPackaging, setSelectedPackaging] = useState('Master Carton (Standard Export)');
  const [customMarking, setCustomMarking] = useState('');
  const [quantity, setQuantity] = useState(100);
  const [unitPriceOverride, setUnitPriceOverride] = useState('');

  // UI / Submission state
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccessModal, setOrderSuccessModal] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Load initial products & master attributes
  useEffect(() => {
    const loadMasterData = async () => {
      setLoading(false);
      try {
        const [prodRes, attrRes] = await Promise.all([
          productApi.getProducts(),
          attributeApi.getAll(),
        ]);

        if (prodRes.success && prodRes.data.length > 0) {
          setProducts(prodRes.data);

          // Check if there was a preselected product from catalog navigation
          const preSelected = location.state?.preSelectedProduct;
          const initialProduct = preSelected || prodRes.data[0];

          if (initialProduct) {
            applyProductDefaults(initialProduct, attrRes.data);
          }
        }

        if (attrRes.success) {
          setAttributes(attrRes.data);
        }
      } catch (err) {
        console.error('Error loading master data:', err);
      }
    };

    loadMasterData();
  }, [location.state]);

  const applyProductDefaults = (prod, attrData = attributes) => {
    setSelectedProductId(prod._id);
    setSelectedSize(prod.allowedSizes?.[0] || attrData?.sizes?.[0]?.label || 'Standard');
    setSelectedFinish(prod.allowedFinishes?.[0] || attrData?.finishes?.[0]?.name || 'Chrome Plated');
    setSelectedColor(prod.allowedColors?.[0] || attrData?.colors?.[0]?.name || 'Industrial Red');
    setSelectedBrand(prod.allowedBrands?.[0] || attrData?.brands?.[0]?.name || 'H.A. Overseas');
    setQuantity(prod.moq || 50);
    setUnitPriceOverride(prod.basePrice?.toString() || '');
  };

  const handleProductChange = (e) => {
    const prodId = e.target.value;
    const prod = products.find((p) => p._id === prodId);
    if (prod) {
      applyProductDefaults(prod);
    }
  };

  const currentProduct = products.find((p) => p._id === selectedProductId);

  // Add Item to Matrix Sheet
  const handleAddLineItem = (e) => {
    e.preventDefault();
    if (!currentProduct) return;

    const unitPrice = parseFloat(unitPriceOverride) || currentProduct.basePrice || 0;
    const qty = parseInt(quantity) || currentProduct.moq || 50;

    addItem({
      product: currentProduct._id,
      productName: currentProduct.name,
      sku: currentProduct.sku,
      size: selectedSize,
      finish: selectedFinish,
      color: selectedColor,
      brand: selectedBrand,
      packaging: selectedPackaging,
      customMarking: customMarking,
      quantity: qty,
      unitPrice: unitPrice,
      weightKg: currentProduct.weightKg || 1.0,
      pcsPerCarton: currentProduct.pcsPerCarton || 20,
    });

    setCustomMarking('');
  };

  // Submit Completed Order
  const handleFinalSubmit = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }

    if (cartItems.length === 0) {
      setErrorMessage('Please add at least one line item to your order sheet.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await submitOrder();
      if (res.success && res.order) {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
        });
        setOrderSuccessModal(res.order);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit order.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && products.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--accent-amber)' }}>
        Loading Order Creator Engine...
      </div>
    );
  }

  return (
    <div style={{ padding: '2.5rem 0 4rem' }}>
      <div className="container">
        {/* Page Title */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="badge badge-amber" style={{ marginBottom: '0.5rem' }}>
            <Wrench size={14} />
            <span>CUSTOM BATCH ORDER CONFIGURATOR</span>
          </div>
          <h1 style={{ fontSize: '2.4rem', color: '#FFFFFF', marginBottom: '0.5rem' }}>
            Interactive Order Creator
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            Select products, customize finish coatings, brand logos, packing cartons, and generate instant proforma invoices.
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#F87171',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <AlertCircle size={20} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
          {/* TOP SECTION: Configurator Tool Box */}
          <div className="glass-card highlight" style={{ padding: '1.75rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '0.75rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <h2 style={{ fontSize: '1.3rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    backgroundColor: 'var(--accent-amber)',
                    color: '#090D16',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                  }}
                >
                  1
                </span>
                Configure Tool Specifications & Variants
              </h2>
              {currentProduct && (
                <span className="badge badge-blue">
                  Selected SKU: {currentProduct.sku}
                </span>
              )}
            </div>

            <form onSubmit={handleAddLineItem}>
              {/* Selected Tool Live Preview */}
              {currentProduct && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    backgroundColor: '#111827',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      backgroundColor: '#FFFFFF',
                      borderRadius: 'var(--radius-sm)',
                      overflow: 'hidden',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px',
                    }}
                  >
                    <img
                      src={currentProduct.images?.[0] || 'https://haoverseas.com/img-products/com-span.jpg'}
                      alt={currentProduct.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#FFFFFF' }}>
                      {currentProduct.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent-amber)' }}>
                      Category: {currentProduct.category} | SKU: {currentProduct.sku} | MOQ: {currentProduct.moq} pcs | Weight: {currentProduct.weightKg} kg/pc
                    </div>
                  </div>
                </div>
              )}

              {/* Row 1: Product Selection & Image Preview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Select Tool Model / Category *</label>
                  <select
                    className="form-control form-select"
                    value={selectedProductId}
                    onChange={handleProductChange}
                  >
                    {products.map((p) => (
                      <option key={p._id} value={p._id} style={{ background: '#131B2A' }}>
                        {p.name} ({p.sku}) — Base ${p.basePrice?.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Size / Dimension / Capacity *</label>
                  <select
                    className="form-control form-select"
                    value={selectedSize}
                    onChange={(e) => setSelectedSize(e.target.value)}
                  >
                    {(currentProduct?.allowedSizes?.length ? currentProduct.allowedSizes : attributes.sizes.map((s) => s.label)).map((sz, i) => (
                      <option key={i} value={sz} style={{ background: '#131B2A' }}>
                        {sz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Finish & Color Selection */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Surface Finish & Plating *</label>
                  <select
                    className="form-control form-select"
                    value={selectedFinish}
                    onChange={(e) => setSelectedFinish(e.target.value)}
                  >
                    {(currentProduct?.allowedFinishes?.length ? currentProduct.allowedFinishes : attributes.finishes.map((f) => f.name)).map((fn, i) => (
                      <option key={i} value={fn} style={{ background: '#131B2A' }}>
                        {fn}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Colorway / Paint Coating *</label>
                  <select
                    className="form-control form-select"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                  >
                    {(currentProduct?.allowedColors?.length ? currentProduct.allowedColors : attributes.colors.map((c) => c.name)).map((cl, i) => (
                      <option key={i} value={cl} style={{ background: '#131B2A' }}>
                        {cl}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Brand Marking, Packaging, Quantity, Price */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Brand Marking *</label>
                  <select
                    className="form-control form-select"
                    value={selectedBrand}
                    onChange={(e) => setSelectedBrand(e.target.value)}
                  >
                    {(currentProduct?.allowedBrands?.length ? currentProduct.allowedBrands : attributes.brands.map((b) => b.name)).map((br, i) => (
                      <option key={i} value={br} style={{ background: '#131B2A' }}>
                        {br}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Packaging Type</label>
                  <select
                    className="form-control form-select"
                    value={selectedPackaging}
                    onChange={(e) => setSelectedPackaging(e.target.value)}
                  >
                    <option value="Master Carton (Standard Export)" style={{ background: '#131B2A' }}>Master Export Carton</option>
                    <option value="Individual Color Display Box" style={{ background: '#131B2A' }}>Individual Color Box</option>
                    <option value="Heavy Duty Blister Card" style={{ background: '#131B2A' }}>Heavy Blister Card</option>
                    <option value="Heavy Canvas Roll Pouch" style={{ background: '#131B2A' }}>Canvas Roll Pouch</option>
                    <option value="Polybag with Barcode Sticker" style={{ background: '#131B2A' }}>Polybag with Barcode</option>
                  </select>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Quantity (Pieces) *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    className="form-control"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                  {currentProduct && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      MOQ: {currentProduct.moq || 50} pcs | ~{Math.ceil(quantity / (currentProduct.pcsPerCarton || 20))} ctns
                    </span>
                  )}
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">FOB Price / Pc ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={unitPriceOverride}
                    onChange={(e) => setUnitPriceOverride(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 4: Custom Marking Text & Submit Line Item */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Custom Buyer Laser Marking / Embossing Note (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Laser mark: 'APEX PRO HEAVY DUTY' + Lot #44"
                    value={customMarking}
                    onChange={(e) => setCustomMarking(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ height: '42px', padding: '0 1.75rem' }}
                >
                  <Plus size={18} />
                  <span>Add Line Item</span>
                </button>
              </div>
            </form>
          </div>

          {/* BOTTOM SECTION: Live Order Sheet & Matrix Table */}
          <div className="glass-card" style={{ padding: '1.75rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '0.75rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <h2 style={{ fontSize: '1.3rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    backgroundColor: 'var(--accent-blue)',
                    color: '#090D16',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                  }}
                >
                  2
                </span>
                Active Order Sheet ({cartItems.length} {cartItems.length === 1 ? 'Item' : 'Items'})
              </h2>

              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="btn btn-danger btn-sm"
                >
                  <Trash2 size={14} />
                  <span>Clear Sheet</span>
                </button>
              )}
            </div>

            {cartItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                <ShoppingCart size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <h4 style={{ color: '#FFFFFF', marginBottom: '0.4rem' }}>Your order matrix is empty</h4>
                <p style={{ fontSize: '0.85rem' }}>
                  Use the configurator above to add tools, sizes, finishes, and quantities to this order sheet.
                </p>
              </div>
            ) : (
              <>
                <div className="table-responsive" style={{ marginBottom: '1.5rem' }}>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Item & SKU</th>
                        <th>Size</th>
                        <th>Finish / Color</th>
                        <th>Brand & Marking</th>
                        <th>Packaging</th>
                        <th style={{ textAlign: 'right' }}>Qty (pcs)</th>
                        <th style={{ textAlign: 'right' }}>Unit Price</th>
                        <th style={{ textAlign: 'right' }}>Total (USD)</th>
                        <th style={{ textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cartItems.map((item, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>
                            <b style={{ color: '#FFFFFF', display: 'block' }}>{item.productName}</b>
                            <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber-light)' }}>
                              SKU: {item.sku}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-slate">{item.size}</span>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.8rem' }}>{item.finish}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.color}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{item.brand}</div>
                            {item.customMarking && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--accent-blue)', fontStyle: 'italic' }}>
                                Note: {item.customMarking}
                              </div>
                            )}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8rem' }}>{item.packaging}</span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <input
                              type="number"
                              min={1}
                              style={{
                                width: '70px',
                                background: '#111827',
                                border: '1px solid var(--border-medium)',
                                color: '#FFFFFF',
                                borderRadius: '4px',
                                padding: '4px',
                                textAlign: 'right',
                              }}
                              value={item.quantity}
                              onChange={(e) => updateItem(idx, { quantity: e.target.value })}
                            />
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>
                            ${item.unitPrice?.toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--accent-amber)' }}>
                            ${item.totalPrice?.toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              onClick={() => removeItem(idx)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#EF4444',
                                cursor: 'pointer',
                                padding: '4px',
                              }}
                              title="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Real-time Order Analytics Bar */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '1rem',
                    backgroundColor: '#111827',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Quantity</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Package size={20} color="var(--accent-amber)" />
                      {totals.totalQuantity} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>pcs</span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Est. Gross Weight</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Weight size={20} color="var(--accent-blue)" />
                      {totals.estimatedWeightKg} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>kg</span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Est. Master Cartons</span>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Boxes size={20} color="var(--accent-emerald)" />
                      {totals.estimatedCartons} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ctns</span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Grand Total (FOB)</span>
                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-amber)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      ${totals.totalAmount?.toFixed(2)} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>USD</span>
                    </div>
                  </div>
                </div>

                {/* Shipping Marks & Special Instructions */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Shipping Marks (For Outer Master Cartons)</label>
                    <textarea
                      rows={2}
                      className="form-control"
                      value={orderMetadata.shippingMarks}
                      onChange={(e) =>
                        setOrderMetadata({ ...orderMetadata, shippingMarks: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Special Packing & Pallet Instructions</label>
                    <textarea
                      rows={2}
                      className="form-control"
                      value={orderMetadata.specialInstructions}
                      onChange={(e) =>
                        setOrderMetadata({ ...orderMetadata, specialInstructions: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Submit / Action Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {isAuthenticated ? (
                      <span>
                        Submitting as: <b style={{ color: '#FFFFFF' }}>{user.customerName}</b> ({user.businessName}, {user.country})
                      </span>
                    ) : (
                      <span>
                        ⚠️ You will be prompted to sign in or register before final export dispatch.
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleFinalSubmit}
                    disabled={submitting || cartItems.length === 0}
                    className="btn btn-primary btn-lg"
                    style={{ padding: '0.85rem 2rem' }}
                  >
                    <Sparkles size={18} />
                    <span>{submitting ? 'Submitting Order...' : 'Submit Order to H.A. Overseas'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Order Confirmation Modal */}
      {orderSuccessModal && (
        <Modal
          isOpen={Boolean(orderSuccessModal)}
          onClose={() => setOrderSuccessModal(null)}
          title="Order Submitted Successfully!"
          maxWidth="640px"
        >
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <CheckCircle2 size={56} color="#10B981" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ color: '#FFFFFF', fontSize: '1.4rem', marginBottom: '0.5rem' }}>
              Order Reference #{orderSuccessModal.orderNumber}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Thank you, <b>{orderSuccessModal.customerDetails?.customerName}</b>. Your customized tooling order has been officially logged with the H.A. Overseas production & export desk.
            </p>

            <div
              style={{
                backgroundColor: '#111827',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                textAlign: 'left',
                marginBottom: '1.5rem',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Buyer Business:</span>
                <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{orderSuccessModal.customerDetails?.businessName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Total Configured Units:</span>
                <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{orderSuccessModal.totalQuantity} pcs</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Estimated Gross Weight:</span>
                <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{orderSuccessModal.estimatedWeightKg} kg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Proforma Total Value (FOB):</span>
                <span style={{ color: 'var(--accent-amber)', fontWeight: 800, fontSize: '1rem' }}>
                  ${orderSuccessModal.totalAmount?.toFixed(2)} USD
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setDownloadingPdf(true);
                    await orderApi.downloadPdf(orderSuccessModal._id, orderSuccessModal.orderNumber);
                  } catch (err) {
                    alert('Error downloading PDF: ' + err.message);
                  } finally {
                    setDownloadingPdf(false);
                  }
                }}
                disabled={downloadingPdf}
                className="btn btn-primary"
              >
                <FileDown size={18} />
                <span>{downloadingPdf ? 'Generating PDF...' : 'Download Purchase Order PDF'}</span>
              </button>
              <Link to="/my-orders" className="btn btn-secondary">
                View My Orders
              </Link>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
