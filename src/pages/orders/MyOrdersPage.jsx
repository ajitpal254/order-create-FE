import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderApi, invoiceApi } from '../../api/client';
import { useOrder } from '../../context/OrderContext';
import { StatusBadge } from '../../components/StatusBadge';
import { 
  Package, 
  FileDown, 
  ChevronDown, 
  ChevronUp, 
  ShoppingCart, 
  Boxes, 
  Weight, 
  Truck,
  RotateCcw,
  DollarSign,
  TrendingUp,
  Award,
  ExternalLink,
  Receipt,
  FileText,
  CreditCard
} from 'lucide-react';

export const MyOrdersPage = () => {
  const [activePortalTab, setActivePortalTab] = useState('orders'); // 'orders' | 'invoices'
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [orderTypeFilter, setOrderTypeFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);

  const { cloneOrderToCart } = useOrder();
  const navigate = useNavigate();

  const handleDownloadPdf = async (e, order) => {
    e.stopPropagation();
    try {
      setDownloadingId(order._id);
      await orderApi.downloadPdf(order._id, order.orderNumber);
    } catch (err) {
      alert('Error downloading PDF: ' + err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDownloadInvoicePdf = async (e, invoice) => {
    e.stopPropagation();
    try {
      setDownloadingInvoiceId(invoice._id);
      await invoiceApi.downloadPdf(invoice._id, invoice.invoiceNumber);
    } catch (err) {
      alert('Error downloading Invoice PDF: ' + err.message);
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const handleReorder = (e, order) => {
    e.stopPropagation();
    cloneOrderToCart(order);
    navigate('/order-creator');
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, invoicesRes, analyticsRes] = await Promise.all([
          orderApi.getMyOrders(),
          invoiceApi.getInvoices().catch(() => ({ success: false, data: [] })),
          orderApi.getBuyerAnalytics().catch(() => null),
        ]);

        if (ordersRes.success) {
          setOrders(ordersRes.data);
        }
        if (invoicesRes.success) {
          setInvoices(invoicesRes.data);
        }
        if (analyticsRes?.success) {
          setAnalytics(analyticsRes.analytics);
        }
      } catch (err) {
        console.error('Failed to load user orders/invoices:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  const toggleExpand = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const filteredOrders = orders.filter((ord) => {
    if (orderTypeFilter === 'Orders') return ord.orderType === 'Order';
    if (orderTypeFilter === 'Quotes') return ord.orderType === 'Quote';
    return true;
  });

  return (
    <div style={{ padding: '2.5rem 0' }}>
      <div className="container">
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div className="badge badge-amber" style={{ marginBottom: '0.5rem' }}>
              <Package size={14} />
              <span>BUYER EXPORT PORTAL</span>
            </div>
            <h1 style={{ fontSize: '2.2rem', color: '#FFFFFF' }}>My Orders & Production Tracking</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Track live production milestones, export shipping marks, and download official PDF proforma invoices.
            </p>
          </div>

          <Link to="/order-creator" className="btn btn-primary">
            <ShoppingCart size={16} />
            <span>Create New Order</span>
          </Link>
        </div>

        {/* Buyer Analytics Summary Banner */}
        {analytics && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Spend (FOB)
                </span>
                <DollarSign size={18} color="var(--accent-amber)" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF' }}>
                ${analytics.totalSpendUsd.toLocaleString()} USD
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Across {analytics.totalOrders} total export orders
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Total Export Volume
                </span>
                <Boxes size={18} color="var(--accent-blue)" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF' }}>
                {analytics.totalUnitsExported.toLocaleString()} pcs
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                Precision hand tools manufactured
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Active in Factory
                </span>
                <TrendingUp size={18} color="var(--accent-emerald)" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                {analytics.activeProduction} POs
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                In production or quality check
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Distributor Tier
                </span>
                <Award size={18} color="var(--accent-purple)" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF' }}>
                {analytics.distributorTier}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)', marginTop: '0.25rem' }}>
                {analytics.tierDiscountPercent}% wholesale discount active
              </div>
            </div>
          </div>
        )}

        {/* Main Portal View Selector */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem', borderBottom: '1px solid var(--border-medium)', paddingBottom: '0.75rem' }}>
          <button
            onClick={() => setActivePortalTab('orders')}
            className={`btn ${activePortalTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Package size={16} />
            <span>Export Orders & Quotes ({orders.length})</span>
          </button>
          <button
            onClick={() => setActivePortalTab('invoices')}
            className={`btn ${activePortalTab === 'invoices' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Receipt size={16} />
            <span>Commercial Invoices ({invoices.length})</span>
          </button>
        </div>

        {activePortalTab === 'invoices' ? (
          <div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--accent-amber)' }}>
                Loading your invoices...
              </div>
            ) : invoices.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <Receipt size={54} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <h3 style={{ color: '#FFFFFF', marginBottom: '0.5rem' }}>No Invoices Issued Yet</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  Commercial invoices will appear here as soon as orders are confirmed and billed by our export desk.
                </p>
                <button onClick={() => setActivePortalTab('orders')} className="btn btn-secondary">
                  View My Orders
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {invoices.map((inv) => (
                  <div
                    key={inv._id}
                    className="glass-card"
                    style={{
                      padding: '1.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '260px' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          backgroundColor: '#111827',
                          border: '1px solid var(--border-medium)',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <FileText size={22} color="var(--accent-amber)" />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>
                            {inv.invoiceNumber}
                          </span>
                          <StatusBadge status={inv.status} />
                          <span className="badge badge-slate" style={{ fontSize: '0.7rem' }}>
                            {inv.docType === 'gst_invoice' ? 'GST Invoice' : 'Commercial Invoice'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          Issued: {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString()}
                          {inv.dueDate && ` • Due: ${new Date(inv.dueDate).toLocaleDateString()}`}
                          {inv.order && ` • Order: ${inv.order.orderNumber || String(inv.order).slice(-6)}`}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Grand Total ({inv.currency}):</span>
                        <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                          ${(inv.grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Paid Amount:</span>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                          ${(inv.amountPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Balance Due:</span>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: (inv.balanceDue || 0) > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
                          ${(inv.balanceDue ?? (inv.grandTotal - (inv.amountPaid || 0))).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>

                      <button
                        className="btn btn-primary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        disabled={downloadingInvoiceId === inv._id}
                        onClick={(e) => handleDownloadInvoicePdf(e, inv)}
                      >
                        <FileDown size={15} />
                        <span>{downloadingInvoiceId === inv._id ? 'Downloading...' : 'Download Invoice PDF'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Filter Navigation Tabs for Orders */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {['All', 'Orders', 'Quotes'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setOrderTypeFilter(tab)}
                  className={`btn btn-sm ${orderTypeFilter === tab ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.4rem 1rem' }}
                >
                  {tab === 'Quotes' ? 'Quotations / RFQs' : tab}
                </button>
              ))}
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--accent-amber)' }}>
                Loading your orders...
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                <Package size={54} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                <h3 style={{ color: '#FFFFFF', marginBottom: '0.5rem' }}>No documents found</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                  You haven't placed any orders or RFQ requests in this category yet.
                </p>
                <Link to="/order-creator" className="btn btn-primary">
                  Launch Order Creator
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

            {filteredOrders.map((order) => {
              const isExpanded = expandedOrderId === order._id;

              return (
                <div
                  key={order._id}
                  className="glass-card"
                  style={{
                    padding: '1.5rem',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  {/* Order Summary Header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '1rem',
                      cursor: 'pointer',
                    }}
                    onClick={() => toggleExpand(order._id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          backgroundColor: '#111827',
                          border: '1px solid var(--border-medium)',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Package size={20} color="var(--accent-amber)" />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                            {order.orderNumber}
                          </span>
                          {order.orderType === 'Quote' && (
                            <span className="badge badge-amber" style={{ fontSize: '0.7rem' }}>
                              RFQ QUOTE
                            </span>
                          )}
                          <StatusBadge status={order.status} />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Quantity:</span>
                        <b style={{ color: '#FFFFFF', fontSize: '0.95rem' }}>{order.totalQuantity} pcs</b>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                          Total ({order.incoterm || 'FOB'}):
                        </span>
                        <b style={{ color: 'var(--accent-amber)', fontSize: '1.15rem' }}>
                          {order.currency || 'USD'} ${order.totalAmount?.toFixed(2)}
                        </b>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={(e) => handleReorder(e, order)}
                          className="btn btn-secondary btn-sm"
                          title="1-Click Re-Order / Clone items to configurator"
                        >
                          <RotateCcw size={14} />
                          <span>Re-Order</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDownloadPdf(e, order)}
                          disabled={downloadingId === order._id}
                          className="btn btn-secondary btn-sm"
                          title="Download PDF Proforma"
                        >
                          <FileDown size={14} />
                          <span>{downloadingId === order._id ? 'Generating...' : 'PDF Proforma'}</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-icon"
                          style={{ color: 'var(--text-muted)', padding: '6px' }}
                        >
                          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-subtle)' }}>
                      {/* Carrier Tracking Banner if Shipped */}
                      {order.trackingNumber && (
                        <div
                          style={{
                            background: '#064e3b22',
                            border: '1px solid #059669',
                            borderRadius: 'var(--radius-md)',
                            padding: '1rem',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Truck size={24} color="#10b981" />
                            <div>
                              <div style={{ fontWeight: 700, color: '#10b981', fontSize: '0.9rem' }}>
                                Shipment Dispatched via {order.carrierName || 'Freight Carrier'}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                                Tracking / BL Number: <strong style={{ color: '#FFFFFF' }}>{order.trackingNumber}</strong>
                              </div>
                            </div>
                          </div>
                          {order.trackingUrl && (
                            <a
                              href={order.trackingUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-primary btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            >
                              <span>Track on Carrier</span>
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Commercial Invoice Banner if generated */}
                      {order.invoice?.invoiceId && (
                        <div
                          style={{
                            background: '#1e1b4b22',
                            border: '1px solid #6366f1',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.85rem 1rem',
                            marginBottom: '1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '0.75rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <FileText size={22} color="#818cf8" />
                            <div>
                              <div style={{ fontWeight: 700, color: '#c7d2fe', fontSize: '0.9rem' }}>
                                Commercial Invoice: {order.invoice.invoiceId}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                Official export invoice & packing specification generated
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              const invObj = invoices.find((i) => i.invoiceNumber === order.invoice.invoiceId || i.order === order._id);
                              if (invObj) {
                                handleDownloadInvoicePdf(e, invObj);
                              } else {
                                invoiceApi.downloadPdf(order._id, order.invoice.invoiceId);
                              }
                            }}
                          >
                            <FileDown size={14} />
                            <span>Download Commercial Invoice</span>
                          </button>
                        </div>
                      )}

                      {/* Specification Details */}
                      <div

                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '1rem',
                          backgroundColor: '#111827',
                          padding: '1rem',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: '1.5rem',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Weight:</span>
                          <div style={{ color: '#FFFFFF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Weight size={14} color="var(--accent-amber)" />
                            {order.estimatedWeightKg} kg
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Master Cartons:</span>
                          <div style={{ color: '#FFFFFF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Boxes size={14} color="var(--accent-blue)" />
                            ~{order.estimatedCartons} Master Cartons
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trade Incoterm:</span>
                          <div style={{ color: '#FFFFFF', fontWeight: 600 }}>
                            {order.incoterm || 'FOB (Free On Board)'}
                          </div>
                        </div>

                        <div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pricing Currency:</span>
                          <div style={{ color: '#FFFFFF', fontWeight: 600 }}>
                            {order.currency || 'USD'}
                          </div>
                        </div>
                      </div>

                      {/* Items Table */}
                      <h4 style={{ color: '#FFFFFF', fontSize: '1rem', marginBottom: '0.75rem' }}>Configured Items</h4>
                      <div className="table-responsive" style={{ marginBottom: '1.5rem' }}>
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Tool / SKU</th>
                              <th>Size & Finish</th>
                              <th>Color & Marking</th>
                              <th>Packaging</th>
                              <th>Quantity</th>
                              <th>Unit Price</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item, idx) => (
                              <tr key={idx}>
                                <td>
                                  <b>{item.productName}</b>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.sku}</div>
                                </td>
                                <td>
                                  <div>{item.size}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>{item.finish}</div>
                                </td>
                                <td>
                                  <div>{item.color}</div>
                                  {item.customMarking && (
                                    <div style={{ fontSize: '0.75rem', color: 'var(--accent-blue)' }}>Marking: "{item.customMarking}"</div>
                                  )}
                                </td>
                                <td>{item.packaging}</td>
                                <td><b>{item.quantity}</b> pcs</td>
                                <td>{order.currency || 'USD'} ${item.unitPrice?.toFixed(2)}</td>
                                <td style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>
                                  {order.currency || 'USD'} ${item.totalPrice?.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Timeline */}
                      {order.timeline && order.timeline.length > 0 && (
                        <div>
                          <h4 style={{ color: '#FFFFFF', fontSize: '1rem', marginBottom: '0.75rem' }}>Order Timeline</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {order.timeline.map((step, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '0.75rem',
                                  fontSize: '0.85rem',
                                }}
                              >
                                <div
                                  style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: idx === order.timeline.length - 1 ? 'var(--accent-amber)' : 'var(--border-medium)',
                                    marginTop: '6px',
                                    flexShrink: 0,
                                  }}
                                />
                                <div>
                                  <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{step.status}</span>
                                  <span style={{ color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                                    — {new Date(step.updatedAt).toLocaleString()}
                                  </span>
                                  {step.note && (
                                    <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{step.note}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

