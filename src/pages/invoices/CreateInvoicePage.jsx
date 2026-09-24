import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { orderApi, invoiceApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import {
  Receipt,
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  Building,
  AlertCircle,
  FileText
} from 'lucide-react';

export const CreateInvoicePage = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loadingOrder, setLoadingOrder] = useState(!!orderId);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [docType, setDocType] = useState('commercial_invoice');
  const [currency, setCurrency] = useState('USD');
  const [taxRate, setTaxRate] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [shippingCharges, setShippingCharges] = useState(0);
  const [notes, setNotes] = useState('');
  const [termsAndConditions, setTermsAndConditions] = useState(
    '1. Payment as per agreed export terms.\n2. Goods once inspected and dispatched are subject to standard international export warranty.'
  );

  // Standalone Customer details
  const [customer, setCustomer] = useState({
    customerName: '',
    businessName: '',
    email: '',
    phoneNumber: '',
    address: '',
    country: '',
    taxId: '',
    stateCode: '',
  });

  // Standalone Line items
  const [items, setItems] = useState([
    {
      productName: '',
      sku: '',
      description: '',
      hsnCode: '8205.59',
      quantity: 100,
      unit: 'PCS',
      unitPrice: 10.0,
      discountPercent: 0,
      taxRate: 0,
    },
  ]);

  // Load Order if orderId provided
  useEffect(() => {
    if (!orderId) {
      if (user) {
        setCustomer({
          customerName: user.customerName || '',
          businessName: user.businessName || '',
          email: user.email || '',
          phoneNumber: user.phoneNumber || '',
          address: user.address || '',
          country: user.country || '',
          taxId: user.taxId || '',
          stateCode: '',
        });
      }
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoadingOrder(true);
        const res = await orderApi.getOrderById(orderId);
        if (res.success && res.data) {
          const ord = res.data;
          setOrder(ord);
          setCurrency(ord.currency || 'USD');
          if (ord.customerDetails) {
            setCustomer({
              customerName: ord.customerDetails.customerName || '',
              businessName: ord.customerDetails.businessName || '',
              email: ord.customerDetails.email || '',
              phoneNumber: ord.customerDetails.phoneNumber || '',
              address: ord.customerDetails.address || '',
              country: ord.customerDetails.country || '',
              taxId: ord.customerDetails.taxId || '',
              stateCode: ord.customerDetails.stateCode || '',
            });
          }
        } else {
          setError('Order not found');
        }
      } catch (err) {
        console.error('Error fetching order for invoice:', err);
        setError(err.message || 'Could not load order');
      } finally {
        setLoadingOrder(false);
      }
    };

    fetchOrder();
  }, [orderId, user]);

  // Line item handlers
  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      {
        productName: '',
        sku: '',
        description: '',
        hsnCode: '8205.59',
        quantity: 100,
        unit: 'PCS',
        unitPrice: 0,
        discountPercent: 0,
        taxRate: taxRate,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Live Calculations (for standalone preview)
  const itemsSubtotal = items.reduce((sum, item) => {
    const qty = parseFloat(item.quantity) || 0;
    const price = parseFloat(item.unitPrice) || 0;
    const disc = parseFloat(item.discountPercent) || 0;
    const base = qty * price;
    const discounted = base - (base * disc) / 100;
    return sum + discounted;
  }, 0);

  const previewTax = (itemsSubtotal * (parseFloat(taxRate) || 0)) / 100;
  const previewGrandTotal = itemsSubtotal + previewTax + (parseFloat(shippingCharges) || 0);

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      let payload = {
        docType,
        currency,
        taxRate: parseFloat(taxRate) || 0,
        shippingCharges: parseFloat(shippingCharges) || 0,
        notes,
        termsAndConditions,
        dueDate: dueDate || undefined,
      };

      if (orderId) {
        payload.orderId = orderId;
      } else {
        // Validate standalone fields
        if (!customer.customerName && !customer.businessName) {
          throw new Error('Please provide at least a customer name or business name.');
        }

        const formattedItems = items.map((it) => ({
          productName: it.productName.trim(),
          sku: it.sku.trim() || 'N/A',
          description: it.description.trim(),
          hsnCode: it.hsnCode.trim() || '8205.59',
          quantity: parseInt(it.quantity, 10) || 1,
          unit: it.unit || 'PCS',
          unitPrice: parseFloat(it.unitPrice) || 0,
          discountPercent: parseFloat(it.discountPercent) || 0,
          taxRate: parseFloat(it.taxRate) || parseFloat(taxRate) || 0,
        }));

        const invalidItem = formattedItems.find((it) => !it.productName);
        if (invalidItem) {
          throw new Error('Each line item must have a product name.');
        }

        payload.customerDetails = customer;
        payload.items = formattedItems;
      }

      const res = await invoiceApi.createInvoice(payload);
      if (res.success && res.invoice) {
        navigate(`/invoices/${res.invoice._id}`);
      } else {
        throw new Error(res.message || 'Invoice creation failed');
      }
    } catch (err) {
      console.error('Invoice creation error:', err);
      setError(err.message || 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingOrder) {
    return (
      <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center', color: 'var(--accent-amber)' }}>
        <Receipt size={40} className="animate-spin" style={{ margin: '0 auto 1.25rem', opacity: 0.7 }} />
        <div>Preparing invoice generator...</div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 5rem', maxWidth: '1020px' }}>
      {/* Header & Back Link */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem' }}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-amber)',
            }}
          >
            <Receipt size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FFFFFF' }}>
              {order ? `Generate Invoice for Order #${order.orderNumber}` : 'Create Commercial Invoice'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {order
                ? 'Generate an official export commercial invoice with verified order items and prices.'
                : 'Issue a standalone commercial export invoice, proforma invoice, or GST tax document.'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div
          className="glass-card"
          style={{
            padding: '1rem 1.25rem',
            backgroundColor: 'rgba(244, 63, 94, 0.15)',
            borderColor: 'rgba(244, 63, 94, 0.4)',
            color: 'var(--accent-rose)',
            fontSize: '0.9rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Document Configuration Card */}
        <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: '#FFFFFF' }}>
            Invoice Configuration
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Document Type *
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              >
                <option value="commercial_invoice">Commercial Export Invoice</option>
                <option value="gst_invoice">GST Tax Invoice</option>
                <option value="proforma_invoice">Proforma Invoice</option>
                <option value="standard_invoice">Standard Invoice</option>
                <option value="eway_bill">E-Way Bill</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Currency *
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={!!order}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  outline: 'none',
                  opacity: order ? 0.7 : 1,
                }}
              >
                <option value="USD">USD ($) - Export Standard</option>
                <option value="INR">INR (₹) - Domestic / GST</option>
                <option value="EUR">EUR (€) - European Trade</option>
                <option value="GBP">GBP (£) - UK Trade</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Tax Rate (%)
              </label>
              <select
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              >
                <option value={0}>0% (Export Zero-Rated)</option>
                <option value={5}>5% GST</option>
                <option value={12}>12% GST</option>
                <option value={18}>18% Standard GST</option>
                <option value={28}>28% Luxury GST</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Payment Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* Linked Order Summary (if order-linked) */}
        {order && (
          <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent-blue)' }}>
              <Package size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>
                Order Items to be Invoiced ({order.items?.length || 0})
              </h3>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '550px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <th style={{ padding: '0.5rem' }}>Product</th>
                    <th style={{ padding: '0.5rem' }}>SKU</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Qty</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Unit Price</th>
                    <th style={{ padding: '0.5rem', textAlign: 'right' }}>Line Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)', fontSize: '0.85rem', color: '#FFFFFF' }}>
                      <td style={{ padding: '0.7rem 0.5rem' }}>{it.productName}</td>
                      <td style={{ padding: '0.7rem 0.5rem', color: 'var(--text-secondary)' }}>{it.sku || 'N/A'}</td>
                      <td style={{ padding: '0.7rem 0.5rem', textAlign: 'right' }}>{it.quantity}</td>
                      <td style={{ padding: '0.7rem 0.5rem', textAlign: 'right' }}>${(it.unitPrice || 0).toFixed(2)}</td>
                      <td style={{ padding: '0.7rem 0.5rem', textAlign: 'right', fontWeight: 700 }}>
                        ${((it.quantity || 0) * (it.unitPrice || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', fontSize: '1rem', fontWeight: 800 }}>
              <span style={{ color: 'var(--text-secondary)', marginRight: '1rem' }}>Order Total:</span>
              <span style={{ color: 'var(--accent-amber)' }}>
                ${(order.totalAmount || 0).toFixed(2)} {order.currency || 'USD'}
              </span>
            </div>
          </div>
        )}

        {/* Standalone Customer Details */}
        {!order && (
          <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--accent-amber)' }}>
              <Building size={20} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>
                Buyer / Consignee Information
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Business / Company Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Industrial Supplies LLC"
                  value={customer.businessName}
                  onChange={(e) => setCustomer({ ...customer, businessName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    color: '#FFFFFF',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Contact Person *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={customer.customerName}
                  onChange={(e) => setCustomer({ ...customer, customerName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    color: '#FFFFFF',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="e.g. purchasing@apexsupplies.com"
                  value={customer.email}
                  onChange={(e) => setCustomer({ ...customer, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    color: '#FFFFFF',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. +1-555-0199"
                  value={customer.phoneNumber}
                  onChange={(e) => setCustomer({ ...customer, phoneNumber: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    color: '#FFFFFF',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Country *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. United States, Germany, UAE"
                  value={customer.country}
                  onChange={(e) => setCustomer({ ...customer, country: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    color: '#FFFFFF',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Tax ID / VAT / GSTIN
                </label>
                <input
                  type="text"
                  placeholder="e.g. EIN-1234567 or 03AAAAA..."
                  value={customer.taxId}
                  onChange={(e) => setCustomer({ ...customer, taxId: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-medium)',
                    borderRadius: 'var(--radius-md)',
                    color: '#FFFFFF',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Full Billing / Consignee Address
              </label>
              <textarea
                rows={2}
                placeholder="Street address, City, State/Province, Postal Code"
                value={customer.address}
                onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  outline: 'none',
                  resize: 'none',
                }}
              />
            </div>
          </div>
        )}

        {/* Standalone Line Items Editor */}
        {!order && (
          <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-amber)' }}>
                <FileText size={20} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>Line Items</h3>
              </div>

              <button
                type="button"
                onClick={handleAddItem}
                className="btn btn-secondary btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <Plus size={15} />
                <span>Add Item</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    backgroundColor: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr)) 40px',
                    gap: '0.75rem',
                    alignItems: 'flex-end',
                  }}
                >
                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Lever Action Grease Gun 500cc"
                      value={item.productName}
                      onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        backgroundColor: '#0F172A',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#FFFFFF',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      SKU
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. GG-500-LVR"
                      value={item.sku}
                      onChange={(e) => handleItemChange(idx, 'sku', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        backgroundColor: '#0F172A',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#FFFFFF',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      HSN Code
                    </label>
                    <input
                      type="text"
                      value={item.hsnCode}
                      onChange={(e) => handleItemChange(idx, 'hsnCode', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        backgroundColor: '#0F172A',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#FFFFFF',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        backgroundColor: '#0F172A',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#FFFFFF',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Unit Price *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        backgroundColor: '#0F172A',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#FFFFFF',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                      Disc %
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={item.discountPercent}
                      onChange={(e) => handleItemChange(idx, 'discountPercent', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        backgroundColor: '#0F172A',
                        border: '1px solid var(--border-medium)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#FFFFFF',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <button
                      type="button"
                      disabled={items.length <= 1}
                      onClick={() => handleRemoveItem(idx)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        color: 'var(--accent-rose)',
                        borderColor: 'transparent',
                        padding: '0.5rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Standalone Live Financial Breakdown */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.75rem' }}>
              <div style={{ minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Items Subtotal:</span>
                  <strong style={{ color: '#FFFFFF' }}>${itemsSubtotal.toFixed(2)}</strong>
                </div>

                {taxRate > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Estimated Tax ({taxRate}%):</span>
                    <strong style={{ color: '#FFFFFF' }}>${previewTax.toFixed(2)}</strong>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--border-medium)',
                    paddingTop: '0.5rem',
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    color: '#FFFFFF',
                  }}
                >
                  <span>Grand Total:</span>
                  <span style={{ color: 'var(--accent-amber)' }}>
                    ${previewGrandTotal.toFixed(2)} {currency}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Terms & Notes */}
        <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: '#FFFFFF' }}>
            Notes & Terms
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Invoice Notes (visible on PDF)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Export under LC No. 2026/891. Goods manufactured in Ludhiana, Punjab."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                  outline: 'none',
                  resize: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Terms & Conditions
              </label>
              <textarea
                rows={3}
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  color: '#FFFFFF',
                  fontSize: '0.85rem',
                  outline: 'none',
                  resize: 'none',
                }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting}
            style={{ minWidth: '180px' }}
          >
            {submitting ? 'Generating Invoice...' : 'Generate & Issue Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
};
