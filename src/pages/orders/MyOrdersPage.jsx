import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '../../api/client';
import { StatusBadge } from '../../components/StatusBadge';
import { 
  Package, 
  FileDown, 
  ChevronDown, 
  ChevronUp, 
  ShoppingCart, 
  Clock, 
  Boxes, 
  Weight, 
  ArrowRight,
  Truck
} from 'lucide-react';

export const MyOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

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

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await orderApi.getMyOrders();
        if (res.success) {
          setOrders(res.data);
        }
      } catch (err) {
        console.error('Failed to load user orders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const toggleExpand = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

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
              Review submitted order specifications, timeline progress, and download official PDF proforma invoices.
            </p>
          </div>

          <Link to="/order-creator" className="btn btn-primary">
            <ShoppingCart size={16} />
            <span>Create New Order</span>
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--accent-amber)' }}>
            Loading your orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <Package size={54} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <h3 style={{ color: '#FFFFFF', marginBottom: '0.5rem' }}>No orders found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              You haven't placed any custom manufacturing orders yet.
            </p>
            <Link to="/order-creator" className="btn btn-primary">
              Launch Order Creator
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {orders.map((order) => {
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF' }}>
                            {order.orderNumber}
                          </span>
                          <StatusBadge status={order.status} />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Total Quantity:</span>
                        <b style={{ color: '#FFFFFF', fontSize: '0.95rem' }}>{order.totalQuantity} pcs</b>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Order Value (FOB):</span>
                        <b style={{ color: 'var(--accent-amber)', fontSize: '1.1rem' }}>${order.totalAmount?.toFixed(2)} USD</b>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={(e) => handleDownloadPdf(e, order)}
                          disabled={downloadingId === order._id}
                          className="btn btn-secondary btn-sm"
                          title="Download PDF"
                        >
                          <FileDown size={16} />
                          <span>{downloadingId === order._id ? 'Downloading...' : 'PDF'}</span>
                        </button>

                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.4rem' }}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Items & Tracking Timeline */}
                  {isExpanded && (
                    <div
                      style={{
                        marginTop: '1.5rem',
                        paddingTop: '1.5rem',
                        borderTop: '1px solid var(--border-subtle)',
                      }}
                    >
                      {/* Timeline status bar */}
                      <div
                        style={{
                          backgroundColor: '#111827',
                          borderRadius: 'var(--radius-md)',
                          padding: '1rem',
                          marginBottom: '1.25rem',
                        }}
                      >
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-amber)', textTransform: 'uppercase' }}>
                          Export Processing Timeline
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                          {(order.timeline || []).map((tl, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
                              <Clock size={14} color="var(--accent-blue)" />
                              <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{tl.status}</span>
                              <span style={{ color: 'var(--text-muted)' }}>— {tl.note}</span>
                              <span style={{ color: 'var(--text-muted)', marginLeft: 'auto' }}>
                                {new Date(tl.updatedAt).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Items table */}
                      <div className="table-responsive">
                        <table className="custom-table">
                          <thead>
                            <tr>
                              <th>#</th>
                              <th>Item & SKU</th>
                              <th>Size</th>
                              <th>Finish & Color</th>
                              <th>Brand / Marking</th>
                              <th>Packaging</th>
                              <th style={{ textAlign: 'right' }}>Qty</th>
                              <th style={{ textAlign: 'right' }}>Price</th>
                              <th style={{ textAlign: 'right' }}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items?.map((item, idx) => (
                              <tr key={idx}>
                                <td>{idx + 1}</td>
                                <td>
                                  <b style={{ color: '#FFFFFF' }}>{item.productName}</b>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--accent-amber-light)' }}>
                                    {item.sku}
                                  </div>
                                </td>
                                <td>{item.size}</td>
                                <td>{item.finish} / {item.color}</td>
                                <td>
                                  {item.brand}
                                  {item.customMarking && (
                                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-blue)' }}>
                                      {item.customMarking}
                                    </div>
                                  )}
                                </td>
                                <td>{item.packaging}</td>
                                <td style={{ textAlign: 'right' }}>{item.quantity} pcs</td>
                                <td style={{ textAlign: 'right' }}>${item.unitPrice?.toFixed(2)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-amber)' }}>
                                  ${item.totalPrice?.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Shipping Marks box */}
                      {order.shippingMarks && (
                        <div
                          style={{
                            marginTop: '1rem',
                            padding: '0.75rem 1rem',
                            backgroundColor: '#111827',
                            border: '1px dashed var(--border-subtle)',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                          }}
                        >
                          <span style={{ color: 'var(--text-muted)' }}>Master Carton Marks: </span>
                          <span style={{ color: '#FFFFFF', fontFamily: 'monospace' }}>{order.shippingMarks}</span>
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
    </div>
  );
};
