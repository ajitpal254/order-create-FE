import React, { useState, useEffect } from 'react';
import { 
  orderApi, 
  productApi, 
  attributeApi, 
  userApi 
} from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import { 
  ShieldCheck, 
  Package, 
  Layers, 
  Settings2, 
  Users, 
  FileDown, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  Clock, 
  Upload, 
  DollarSign, 
  Search, 
  Boxes, 
  AlertCircle,
  TrendingUp,
  X
} from 'lucide-react';

export const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'products' | 'attributes' | 'customers'

  // Stats
  const [stats, setStats] = useState(null);

  // Orders Tab State
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('All');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrderForStatus, setSelectedOrderForStatus] = useState(null);
  const [newStatus, setNewStatus] = useState('Confirmed');
  const [statusNote, setStatusNote] = useState('');

  // Products Tab State
  const [products, setProducts] = useState([]);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    sku: '',
    category: 'Grease Guns & Lubrication',
    description: '',
    basePrice: 10,
    moq: 50,
    weightKg: 1.0,
    pcsPerCarton: 20,
    allowedSizes: [],
    allowedFinishes: [],
    allowedColors: [],
    allowedBrands: [],
    images: [],
  });
  const [uploadedImageFile, setUploadedImageFile] = useState(null);

  // Attributes Tab State
  const [attributes, setAttributes] = useState({
    finishes: [],
    colors: [],
    brands: [],
    sizes: [],
    categories: [],
  });
  const [newFinish, setNewFinish] = useState({ name: '', code: '', description: '' });
  const [newColor, setNewColor] = useState({ name: '', hexCode: '#DC2626', description: '' });
  const [newBrand, setNewBrand] = useState({ name: '', isCustom: false, description: '' });
  const [newSize, setNewSize] = useState({ label: '', unit: '', categoryType: 'General' });

  // Customers Tab State
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');

  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);
  const [downloadingPdfId, setDownloadingPdfId] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleDownloadPdf = async (orderId, orderNumber) => {
    try {
      setDownloadingPdfId(orderId);
      await orderApi.downloadPdf(orderId, orderNumber);
    } catch (err) {
      alert('Error downloading PDF: ' + err.message);
    } finally {
      setDownloadingPdfId(null);
    }
  };

  // Initial Load
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, productsRes, attrRes, usersRes] = await Promise.all([
        orderApi.getStats().catch(() => ({ success: false })),
        orderApi.getAllOrders(),
        productApi.getProducts({ limit: 200 }),
        attributeApi.getAll(),
        userApi.getUsers().catch(() => ({ success: false, data: [] })),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (ordersRes.success) setOrders(ordersRes.data);
      if (productsRes.success) setProducts(productsRes.data);
      if (attrRes.success) setAttributes(attrRes.data);
      if (usersRes.success) setCustomers(usersRes.data);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Update Status Action
  const handleUpdateStatus = async () => {
    if (!selectedOrderForStatus) return;
    try {
      const res = await orderApi.updateOrderStatus(selectedOrderForStatus._id, {
        status: newStatus,
        note: statusNote || `Status changed to ${newStatus} by Admin`,
      });
      if (res.success) {
        showToast(`Order #${selectedOrderForStatus.orderNumber} updated to ${newStatus}`);
        setSelectedOrderForStatus(null);
        setStatusNote('');
        const updated = await orderApi.getAllOrders();
        if (updated.success) setOrders(updated.data);
      }
    } catch (err) {
      alert('Error updating status: ' + err.message);
    }
  };

  // Add or Edit Product Action
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', productForm.name);
      formData.append('sku', productForm.sku);
      formData.append('category', productForm.category);
      formData.append('description', productForm.description);
      formData.append('basePrice', productForm.basePrice);
      formData.append('moq', productForm.moq);
      formData.append('weightKg', productForm.weightKg);
      formData.append('pcsPerCarton', productForm.pcsPerCarton);
      formData.append('allowedSizes', JSON.stringify(productForm.allowedSizes));
      formData.append('allowedFinishes', JSON.stringify(productForm.allowedFinishes));
      formData.append('allowedColors', JSON.stringify(productForm.allowedColors));
      formData.append('allowedBrands', JSON.stringify(productForm.allowedBrands));

      if (uploadedImageFile) {
        formData.append('images', uploadedImageFile);
      }

      if (editingProduct) {
        await productApi.updateProduct(editingProduct._id, formData);
        showToast(`Product ${productForm.name} updated!`);
      } else {
        await productApi.createProduct(formData);
        showToast(`New Product ${productForm.name} added to catalog!`);
      }

      setIsProductModalOpen(false);
      setEditingProduct(null);
      setUploadedImageFile(null);
      const res = await productApi.getProducts({ limit: 200 });
      if (res.success) setProducts(res.data);
    } catch (err) {
      alert('Error saving product: ' + err.message);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await productApi.deleteProduct(id);
      showToast(`Product "${name}" deleted.`);
      setProducts(products.filter((p) => p._id !== id));
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Attribute Handlers
  const handleAddFinish = async (e) => {
    e.preventDefault();
    if (!newFinish.name) return;
    try {
      await attributeApi.addFinish(newFinish);
      setNewFinish({ name: '', code: '', description: '' });
      showToast('Finish added!');
      const res = await attributeApi.getAll();
      if (res.success) setAttributes(res.data);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteFinish = async (id) => {
    try {
      await attributeApi.deleteFinish(id);
      showToast('Finish removed');
      const res = await attributeApi.getAll();
      if (res.success) setAttributes(res.data);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddColor = async (e) => {
    e.preventDefault();
    if (!newColor.name) return;
    try {
      await attributeApi.addColor(newColor);
      setNewColor({ name: '', hexCode: '#DC2626', description: '' });
      showToast('Color added!');
      const res = await attributeApi.getAll();
      if (res.success) setAttributes(res.data);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteColor = async (id) => {
    try {
      await attributeApi.deleteColor(id);
      showToast('Color removed');
      const res = await attributeApi.getAll();
      if (res.success) setAttributes(res.data);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddBrand = async (e) => {
    e.preventDefault();
    if (!newBrand.name) return;
    try {
      await attributeApi.addBrand(newBrand);
      setNewBrand({ name: '', isCustom: false, description: '' });
      showToast('Brand added!');
      const res = await attributeApi.getAll();
      if (res.success) setAttributes(res.data);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteBrand = async (id) => {
    try {
      await attributeApi.deleteBrand(id);
      showToast('Brand removed');
      const res = await attributeApi.getAll();
      if (res.success) setAttributes(res.data);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleAddSize = async (e) => {
    e.preventDefault();
    if (!newSize.label) return;
    try {
      await attributeApi.addSize(newSize);
      setNewSize({ label: '', unit: '', categoryType: 'General' });
      showToast('Size option added!');
      const res = await attributeApi.getAll();
      if (res.success) setAttributes(res.data);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteSize = async (id) => {
    try {
      await attributeApi.deleteSize(id);
      showToast('Size option removed');
      const res = await attributeApi.getAll();
      if (res.success) setAttributes(res.data);
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchStatus = orderFilter === 'All' || o.status === orderFilter;
    const matchSearch =
      !orderSearch ||
      o.orderNumber?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerDetails?.customerName?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerDetails?.businessName?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customerDetails?.country?.toLowerCase().includes(orderSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div style={{ padding: '2.5rem 0 4rem' }}>
      <div className="container">
        {/* Toast */}
        {toastMessage && (
          <div
            className="animate-fade-in"
            style={{
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              backgroundColor: '#10B981',
              color: '#090D16',
              padding: '0.85rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 700,
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Check size={18} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Dashboard Header */}
        <div style={{ marginBottom: '2rem' }}>
          <div className="badge badge-rose" style={{ marginBottom: '0.5rem' }}>
            <ShieldCheck size={14} />
            <span>H.A. OVERSEAS EXECUTIVE CONTROL DESK</span>
          </div>
          <h1 style={{ fontSize: '2.4rem', color: '#FFFFFF', marginBottom: '0.25rem' }}>
            Factory Administration Center
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Manage wholesale orders, update dynamic finishes & colorways, configure products, and inspect buyer registrations.
          </p>
        </div>

        {/* Top Analytics Metrics */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem',
          }}
        >
          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Inbound Orders</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFFFFF', marginTop: '0.25rem' }}>
              {stats?.totalOrders ?? orders.length}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending Review</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-amber)', marginTop: '0.25rem' }}>
              {stats?.pendingOrders ?? orders.filter((o) => ['Submitted', 'Under Review'].includes(o.status)).length}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Catalog Products</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-blue)', marginTop: '0.25rem' }}>
              {products.length}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Pipeline Value</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#10B981', marginTop: '0.25rem' }}>
              ${(stats?.totalRevenue ?? orders.reduce((s, o) => s + (o.totalAmount || 0), 0)).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '0.5rem',
            overflowX: 'auto',
          }}
        >
          <button
            onClick={() => setActiveTab('orders')}
            className={`btn btn-sm ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Package size={16} />
            <span>Orders Management ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`btn btn-sm ${activeTab === 'products' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Layers size={16} />
            <span>Products Catalog ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('attributes')}
            className={`btn btn-sm ${activeTab === 'attributes' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Settings2 size={16} />
            <span>Dynamic Masters (Finishes & Colors)</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`btn btn-sm ${activeTab === 'customers' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Users size={16} />
            <span>Registered Importers ({customers.length})</span>
          </button>
        </div>

        {/* TAB 1: ORDERS MANAGEMENT */}
        {activeTab === 'orders' && (
          <div className="glass-card">
            {/* Filters */}
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ position: 'relative', flex: '1 1 280px' }}>
                <Search
                  size={16}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  type="text"
                  placeholder="Search by Order #, Buyer Name, Business, Country..."
                  className="form-control"
                  style={{ paddingLeft: '2.5rem' }}
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {['All', 'Submitted', 'Under Review', 'Confirmed', 'In Production', 'Dispatched', 'Completed'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderFilter(st)}
                    className={`btn btn-sm ${orderFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Table */}
            {filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                No orders match your filter criteria.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Date</th>
                      <th>Buyer Details</th>
                      <th>Items Count</th>
                      <th style={{ textAlign: 'right' }}>Weight & Cartons</th>
                      <th style={{ textAlign: 'right' }}>Total (USD)</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((ord) => (
                      <tr key={ord._id}>
                        <td>
                          <b style={{ color: '#FFFFFF' }}>{ord.orderNumber}</b>
                        </td>
                        <td>
                          {new Date(ord.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: '#FFFFFF' }}>
                            {ord.customerDetails?.customerName || 'N/A'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {ord.customerDetails?.businessName} ({ord.customerDetails?.country})
                          </div>
                        </td>
                        <td>{ord.totalQuantity} pcs ({ord.items?.length} types)</td>
                        <td style={{ textAlign: 'right' }}>
                          {ord.estimatedWeightKg} kg / ~{ord.estimatedCartons} ctn
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'var(--accent-amber)' }}>
                          ${ord.totalAmount?.toFixed(2)}
                        </td>
                        <td>
                          <StatusBadge status={ord.status} />
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <button
                              onClick={() => {
                                setSelectedOrderForStatus(ord);
                                setNewStatus(ord.status);
                              }}
                              className="btn btn-secondary btn-sm"
                              title="Update Status"
                            >
                              <Edit3 size={14} />
                              <span>Status</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(ord._id, ord.orderNumber)}
                              disabled={downloadingPdfId === ord._id}
                              className="btn btn-secondary btn-sm"
                              title="Download PDF"
                            >
                              <FileDown size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRODUCTS CATALOG MANAGEMENT */}
        {activeTab === 'products' && (
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div>
                <h3 style={{ color: '#FFFFFF', fontSize: '1.2rem' }}>Catalog Tools & Grease Guns</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Add new products or configure allowed variants</p>
              </div>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setProductForm({
                    name: '',
                    sku: '',
                    category: attributes.categories[0]?.name || 'Grease Guns & Lubrication',
                    description: '',
                    basePrice: 10,
                    moq: 50,
                    weightKg: 1.0,
                    pcsPerCarton: 20,
                    allowedSizes: attributes.sizes.slice(0, 3).map((s) => s.label),
                    allowedFinishes: attributes.finishes.slice(0, 3).map((f) => f.name),
                    allowedColors: attributes.colors.slice(0, 3).map((c) => c.name),
                    allowedBrands: attributes.brands.map((b) => b.name),
                    images: [],
                  });
                  setIsProductModalOpen(true);
                }}
                className="btn btn-primary btn-sm"
              >
                <Plus size={16} />
                <span>Add New Tool Model</span>
              </button>
            </div>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name & SKU</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Base Price</th>
                    <th>MOQ & Packing</th>
                    <th>Allowed Finishes</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p._id}>
                      <td style={{ width: '60px' }}>
                        <img
                          src={p.images?.[0] || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=100&q=80'}
                          alt={p.name}
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px' }}
                        />
                      </td>
                      <td>
                        <b style={{ color: '#FFFFFF', display: 'block' }}>{p.name}</b>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber-light)' }}>SKU: {p.sku}</span>
                      </td>
                      <td>{p.category}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-amber)' }}>
                        ${p.basePrice?.toFixed(2)}
                      </td>
                      <td>
                        MOQ: {p.moq} pcs | {p.pcsPerCarton} pcs/ctn
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                          {p.allowedFinishes?.slice(0, 2).map((fn, i) => (
                            <span key={i} className="badge badge-slate" style={{ fontSize: '0.65rem' }}>{fn}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setProductForm({
                                ...p,
                              });
                              setIsProductModalOpen(true);
                            }}
                            className="btn btn-secondary btn-sm"
                            title="Edit Product"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p._id, p.name)}
                            className="btn btn-danger btn-sm"
                            title="Delete Product"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: DYNAMIC ATTRIBUTES MANAGEMENT */}
        {activeTab === 'attributes' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
            {/* Finishes Manager */}
            <div className="glass-card">
              <h3 style={{ color: '#FFFFFF', fontSize: '1.15rem', marginBottom: '0.25rem' }}>
                Tool Surface Finishes
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                Finishes selectable by clients during order creation
              </p>

              <form onSubmit={handleAddFinish} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  placeholder="e.g. Copper Nickel Antique"
                  className="form-control"
                  style={{ flex: 1 }}
                  value={newFinish.name}
                  onChange={(e) => setNewFinish({ ...newFinish, name: e.target.value })}
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  <Plus size={16} />
                  <span>Add</span>
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {attributes.finishes.map((f) => (
                  <div
                    key={f._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#111827',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span>{f.name}</span>
                    <button
                      onClick={() => handleDeleteFinish(f._id)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Colors Manager */}
            <div className="glass-card">
              <h3 style={{ color: '#FFFFFF', fontSize: '1.15rem', marginBottom: '0.25rem' }}>
                Tool & Grease Gun Colors
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                Powder coating & paint color palette
              </p>

              <form onSubmit={handleAddColor} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <input
                  type="color"
                  style={{ width: '40px', height: '38px', padding: '2px', background: '#111827', border: '1px solid var(--border-medium)', borderRadius: '4px', cursor: 'pointer' }}
                  value={newColor.hexCode}
                  onChange={(e) => setNewColor({ ...newColor, hexCode: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Color Name (e.g. Electric Orange)"
                  className="form-control"
                  style={{ flex: 1 }}
                  value={newColor.name}
                  onChange={(e) => setNewColor({ ...newColor, name: e.target.value })}
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  <Plus size={16} />
                  <span>Add</span>
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {attributes.colors.map((c) => (
                  <div
                    key={c._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#111827',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="color-swatch-dot" style={{ backgroundColor: c.hexCode }} />
                      <span>{c.name}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteColor(c._id)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Brands Manager */}
            <div className="glass-card">
              <h3 style={{ color: '#FFFFFF', fontSize: '1.15rem', marginBottom: '0.25rem' }}>
                Brand & Private Labels
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                Brand marking options for tools
              </p>

              <form onSubmit={handleAddBrand} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  placeholder="Brand / OEM Marking"
                  className="form-control"
                  style={{ flex: 1 }}
                  value={newBrand.name}
                  onChange={(e) => setNewBrand({ ...newBrand, name: e.target.value })}
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  <Plus size={16} />
                  <span>Add</span>
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {attributes.brands.map((b) => (
                  <div
                    key={b._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#111827',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span>{b.name}</span>
                    <button
                      onClick={() => handleDeleteBrand(b._id)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Sizes Manager */}
            <div className="glass-card">
              <h3 style={{ color: '#FFFFFF', fontSize: '1.15rem', marginBottom: '0.25rem' }}>
                Standard Tool Sizes
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1.25rem' }}>
                Capacity, length, and dimension presets
              </p>

              <form onSubmit={handleAddSize} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  placeholder="Size (e.g. 16 Inch / 400mm)"
                  className="form-control"
                  style={{ flex: 1 }}
                  value={newSize.label}
                  onChange={(e) => setNewSize({ ...newSize, label: e.target.value })}
                />
                <button type="submit" className="btn btn-primary btn-sm">
                  <Plus size={16} />
                  <span>Add</span>
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {attributes.sizes.map((s) => (
                  <div
                    key={s._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#111827',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.85rem',
                    }}
                  >
                    <span>{s.label}</span>
                    <button
                      onClick={() => handleDeleteSize(s._id)}
                      style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: REGISTERED CUSTOMERS DIRECTORY */}
        {activeTab === 'customers' && (
          <div className="glass-card">
            <h3 style={{ color: '#FFFFFF', fontSize: '1.2rem', marginBottom: '1.25rem' }}>
              Registered Importers & Wholesale Buyers
            </h3>

            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Customer Name</th>
                    <th>Business Name</th>
                    <th>Country</th>
                    <th>Phone / WhatsApp</th>
                    <th>Email & Username</th>
                    <th>Address</th>
                    <th>Joined Date</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c) => (
                    <tr key={c._id}>
                      <td><b style={{ color: '#FFFFFF' }}>{c.customerName}</b></td>
                      <td>{c.businessName}</td>
                      <td>
                        <span className="badge badge-slate">{c.country}</span>
                      </td>
                      <td>{c.phoneNumber}</td>
                      <td>
                        <div>{c.email}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>@{c.username}</div>
                      </td>
                      <td style={{ fontSize: '0.8rem', maxWidth: '200px' }}>{c.address}</td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Update Order Status */}
      {selectedOrderForStatus && (
        <Modal
          isOpen={Boolean(selectedOrderForStatus)}
          onClose={() => setSelectedOrderForStatus(null)}
          title={`Update Status for Order #${selectedOrderForStatus.orderNumber}`}
        >
          <div className="form-group">
            <label className="form-label">Select Pipeline Status</label>
            <select
              className="form-control form-select"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option value="Submitted">Submitted (Under Review)</option>
              <option value="Under Review">Under Review (Pricing Check)</option>
              <option value="Confirmed">Confirmed (Proforma Issued)</option>
              <option value="In Production">In Production (Forging/Assembly)</option>
              <option value="Dispatched">Dispatched (Bill of Lading Issued)</option>
              <option value="Completed">Completed (Delivered)</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Internal & Customer Note</label>
            <textarea
              rows={3}
              className="form-control"
              placeholder="e.g. Raw material batch forged; electro-plating scheduled for Friday."
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => setSelectedOrderForStatus(null)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdateStatus}
              className="btn btn-primary btn-sm"
            >
              Save Status Update
            </button>
          </div>
        </Modal>
      )}

      {/* Modal: Add/Edit Product */}
      {isProductModalOpen && (
        <Modal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          title={editingProduct ? 'Edit Product Catalog' : 'Add New Tool Model'}
          maxWidth="700px"
        >
          <form onSubmit={handleSaveProduct}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">SKU / Item Code *</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={productForm.sku}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-control form-select"
                  value={productForm.category}
                  onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                >
                  {attributes.categories.map((c) => (
                    <option key={c._id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Base FOB Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={productForm.basePrice}
                  onChange={(e) => setProductForm({ ...productForm, basePrice: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">MOQ (pcs)</label>
                <input
                  type="number"
                  className="form-control"
                  value={productForm.moq}
                  onChange={(e) => setProductForm({ ...productForm, moq: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description & Technical Features</label>
              <textarea
                rows={3}
                className="form-control"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Upload Product Image (Optional)</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="form-control"
                onChange={(e) => setUploadedImageFile(e.target.files[0])}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="btn btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
              >
                {editingProduct ? 'Save Changes' : 'Create Product'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
