import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { invoiceApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Receipt,
  FileDown,
  ArrowLeft,
  Building,
  User,
  CreditCard,
  Ban,
  AlertCircle,
  ShieldAlert,
  Copy,
  Edit3,
  Send,
  CheckCircle
} from 'lucide-react';

export const InvoiceDetailPage = () => {
  const { id } = useParams();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Modals state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'Wire Transfer',
    paymentDate: new Date().toISOString().split('T')[0],
    transactionReference: '',
    notes: '',
  });
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  const [showVoidModal, setShowVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [voidSubmitting, setVoidSubmitting] = useState(false);
  const [voidError, setVoidError] = useState(null);

  const handleMarkAsSent = async () => {
    try {
      setUpdatingStatus(true);
      const res = await invoiceApi.updateInvoice(invoice._id, { status: 'sent' });
      if (res.success) {
        await fetchInvoice();
      }
    } catch (err) {
      alert('Failed to update status: ' + err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const fetchInvoice = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await invoiceApi.getInvoiceById(id);
      const invData = res.data || res.invoice;
      if (res.success && invData) {
        setInvoice(invData);
        setPaymentForm((prev) => ({
          ...prev,
          amount: (invData.balanceDue != null ? invData.balanceDue : (invData.grandTotal - (invData.amountPaid || 0))).toString(),
        }));
      } else {
        setError(res.message || 'Invoice not found');
      }
    } catch (err) {
      console.error('Failed to load invoice:', err);
      setError(err.message || 'Error loading invoice');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleDownloadPdf = async () => {
    if (!invoice) return;
    try {
      setDownloadingPdf(true);
      await invoiceApi.downloadPdf(invoice._id, invoice.invoiceNumber);
    } catch (err) {
      alert('Error downloading PDF: ' + err.message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setPaymentSubmitting(true);
    setPaymentError(null);

    const amountNum = parseFloat(paymentForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setPaymentError('Please enter a valid positive payment amount.');
      setPaymentSubmitting(false);
      return;
    }

    try {
      const res = await invoiceApi.recordPayment(invoice._id, {
        amount: amountNum,
        paymentMethod: paymentForm.paymentMethod,
        paymentDate: paymentForm.paymentDate,
        transactionReference: paymentForm.transactionReference,
        notes: paymentForm.notes,
      });

      if (res.success) {
        setShowPaymentModal(false);
        await fetchInvoice();
      }
    } catch (err) {
      setPaymentError(err.message || 'Failed to record payment');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleVoidInvoice = async (e) => {
    e.preventDefault();
    if (!voidReason || voidReason.trim().length < 3) {
      setVoidError('Please provide a reason of at least 3 characters.');
      return;
    }

    try {
      setVoidSubmitting(true);
      setVoidError(null);
      const res = await invoiceApi.voidInvoice(invoice._id, voidReason);
      if (res.success) {
        setShowVoidModal(false);
        await fetchInvoice();
      }
    } catch (err) {
      setVoidError(err.message || 'Failed to void invoice');
    } finally {
      setVoidSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '6rem 1rem', textAlign: 'center', color: 'var(--accent-amber)' }}>
        <Receipt size={40} className="animate-spin" style={{ margin: '0 auto 1.25rem', opacity: 0.7 }} />
        <div>Loading invoice details...</div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="container" style={{ padding: '4rem 1rem' }}>
        <div
          className="glass-card"
          style={{
            padding: '3rem 2rem',
            textAlign: 'center',
            borderColor: 'rgba(244, 63, 94, 0.4)',
            maxWidth: '560px',
            margin: '0 auto',
          }}
        >
          <AlertCircle size={44} color="var(--accent-rose)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ color: '#FFFFFF', marginBottom: '0.5rem' }}>Invoice Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
            {error || "The requested invoice could not be located or you don't have authorization to view it."}
          </p>
          <button onClick={() => navigate('/invoices')} className="btn btn-secondary">
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  const DOC_TYPE_LABELS = {
    commercial_invoice: 'Commercial Export Invoice',
    gst_invoice: 'GST Tax Invoice',
    proforma_invoice: 'Proforma Invoice',
    standard_invoice: 'Standard Invoice',
    eway_bill: 'E-Way Bill',
  };

  const balanceDue = invoice.balanceDue != null ? invoice.balanceDue : (invoice.grandTotal - (invoice.amountPaid || 0));
  const isVoid = invoice.status === 'void';
  const isPaid = invoice.status === 'paid';

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 5rem' }}>
      {/* Top Breadcrumb & Actions Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <button
          onClick={() => navigate('/invoices')}
          className="btn btn-secondary btn-sm"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={16} />
          <span>All Invoices</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {invoice.status === 'draft' && (
            <button
              onClick={handleMarkAsSent}
              disabled={updatingStatus}
              className="btn btn-primary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'var(--accent-emerald)',
                borderColor: 'var(--accent-emerald)',
              }}
              title="Issue invoice and move status out of Draft to Sent/Active"
            >
              <Send size={15} />
              <span>{updatingStatus ? 'Issuing...' : 'Mark as Sent / Issue'}</span>
            </button>
          )}

          {!isVoid && (
            <button
              onClick={() => navigate(`/invoices/${invoice._id}/edit`)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              title="Edit line items, hours/quantities, prices, or company info"
            >
              <Edit3 size={15} />
              <span>Edit Invoice</span>
            </button>
          )}

          <button
            onClick={() => navigate(`/invoices/new?cloneFrom=${invoice._id}`)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            title="Duplicate line items and customer details into a new invoice"
          >
            <Copy size={15} />
            <span>Duplicate Invoice</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <FileDown size={16} />
            <span>{downloadingPdf ? 'Downloading...' : 'Download Official PDF'}</span>
          </button>

          {isAdmin && !isVoid && !isPaid && (
            <button
              onClick={() => {
                setPaymentForm((prev) => ({
                  ...prev,
                  amount: balanceDue > 0 ? balanceDue.toString() : '0',
                }));
                setShowPaymentModal(true);
              }}
              className="btn btn-primary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <CreditCard size={16} />
              <span>Record Payment</span>
            </button>
          )}

          {isAdmin && !isVoid && (
            <button
              onClick={() => setShowVoidModal(true)}
              className="btn btn-sm"
              style={{
                backgroundColor: 'rgba(244, 63, 94, 0.15)',
                color: 'var(--accent-rose)',
                border: '1px solid rgba(244, 63, 94, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Ban size={15} />
              <span>Void Invoice</span>
            </button>
          )}
        </div>
      </div>

      {/* Draft Notice Banner */}
      {invoice.status === 'draft' && (
        <div
          className="glass-card"
          style={{
            padding: '1.1rem 1.5rem',
            marginBottom: '2rem',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            borderColor: 'rgba(245, 158, 11, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={24} color="var(--accent-amber)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--accent-amber)', fontSize: '0.95rem' }}>
                Invoice in DRAFT Status
              </div>
              <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                This invoice is currently staging as a draft. Click "Mark as Sent / Issue" to activate it for customer billing.
              </div>
            </div>
          </div>

          <button
            onClick={handleMarkAsSent}
            disabled={updatingStatus}
            className="btn btn-primary btn-sm"
            style={{
              backgroundColor: 'var(--accent-emerald)',
              borderColor: 'var(--accent-emerald)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <Send size={14} />
            <span>{updatingStatus ? 'Issuing...' : 'Mark as Sent / Issue'}</span>
          </button>
        </div>
      )}

      {/* Void Notice Banner */}
      {isVoid && (
        <div
          className="glass-card"
          style={{
            padding: '1.25rem 1.75rem',
            marginBottom: '2rem',
            backgroundColor: 'rgba(244, 63, 94, 0.1)',
            borderColor: 'rgba(244, 63, 94, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <ShieldAlert size={28} color="var(--accent-rose)" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, color: 'var(--accent-rose)', fontSize: '1rem' }}>
              This Invoice has been VOIDED
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Reason: {invoice.voidReason || 'No reason provided'} • Voided by: {invoice.voidedBy || 'Staff'} •{' '}
              {invoice.voidedAt && new Date(invoice.voidedAt).toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Main Invoice Card Header */}
      <div
        className="glass-card"
        style={{
          padding: '2rem',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '2rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.02em' }}>
              {invoice.invoiceNumber}
            </h1>
            <StatusBadge status={invoice.status} />
            <span className="badge badge-amber" style={{ fontSize: '0.75rem' }}>
              {DOC_TYPE_LABELS[invoice.docType] || invoice.docType}
            </span>
          </div>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {invoice.totalInWords ? `Total: ${invoice.totalInWords}` : 'Export document generated by H.A. Overseas'}
          </p>

          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.25rem', flexWrap: 'wrap', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Issue Date:</span>{' '}
              <strong style={{ color: '#FFFFFF' }}>
                {new Date(invoice.invoiceDate || invoice.createdAt).toLocaleDateString()}
              </strong>
            </div>

            {invoice.dueDate && (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Due Date:</span>{' '}
                <strong style={{ color: '#FFFFFF' }}>
                  {new Date(invoice.dueDate).toLocaleDateString()}
                </strong>
              </div>
            )}

            {invoice.order && (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Origin Order:</span>{' '}
                <strong style={{ color: 'var(--accent-blue)' }}>
                  #{invoice.order.orderNumber || String(invoice.order).slice(-6)}
                </strong>
              </div>
            )}

            <div>
              <span style={{ color: 'var(--text-muted)' }}>Currency:</span>{' '}
              <strong style={{ color: '#FFFFFF' }}>{invoice.currency || 'USD'}</strong>
            </div>
          </div>
        </div>

        {/* Financial Highlights */}
        <div
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.75rem',
            minWidth: '240px',
          }}
        >
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Grand Total
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', margin: '0.2rem 0' }}>
            ${(invoice.grandTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.6rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Amount Paid:</span>
            <strong style={{ color: 'var(--accent-emerald)' }}>
              ${(invoice.amountPaid || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '0.35rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Balance Due:</span>
            <strong style={{ color: balanceDue > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)' }}>
              ${balanceDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
          </div>
        </div>
      </div>

      {/* Two-Column Parties & Logistics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        {/* Consignor / Exporter */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent-amber)' }}>
            <Building size={18} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>Exporter / Seller</h3>
          </div>
          <div style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            <strong style={{ color: '#FFFFFF', display: 'block', fontSize: '1rem' }}>
              {invoice.senderDetails?.companyName || 'H.A. OVERSEAS'}
            </strong>
            <div>{invoice.senderDetails?.address || 'Industrial Area Phase-II, Ludhiana, Punjab - 141003, India'}</div>
            <div>Phone: {invoice.senderDetails?.phone || '+91-99884-65800'}</div>
            <div>Email: {invoice.senderDetails?.email || 'haoverseas1313@gmail.com'}</div>
            <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              GSTIN: {invoice.senderDetails?.gstin || '03AAAAA0000A1Z5'} • IEC: {invoice.senderDetails?.iecNo || '0300000000'}
            </div>
          </div>
        </div>

        {/* Consignee / Buyer */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--accent-blue)' }}>
            <User size={18} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#FFFFFF' }}>Buyer / Consignee</h3>
          </div>
          <div style={{ fontSize: '0.9rem', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
            <strong style={{ color: '#FFFFFF', display: 'block', fontSize: '1rem' }}>
              {invoice.customerDetails?.businessName || invoice.customerDetails?.customerName || 'N/A'}
            </strong>
            <div>Attn: {invoice.customerDetails?.customerName || 'N/A'}</div>
            <div>{invoice.customerDetails?.address || 'Address on file'}</div>
            <div>Country: {invoice.customerDetails?.country || 'Export'}</div>
            <div>Phone: {invoice.customerDetails?.phoneNumber || 'N/A'}</div>
            {invoice.customerDetails?.taxId && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Tax ID / GSTIN: {invoice.customerDetails.taxId}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export & Logistics Metadata (if available) */}
      {(invoice.portOfDischarge || invoice.countryOfDestination || invoice.shippingMarks) && (
        <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem', color: '#FFFFFF' }}>
            Export Shipment Details
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.85rem' }}>
            {invoice.countryOfDestination && (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Country of Destination:</span>
                <div style={{ color: '#FFFFFF', fontWeight: 600 }}>{invoice.countryOfDestination}</div>
              </div>
            )}
            {invoice.portOfDischarge && (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Port of Discharge:</span>
                <div style={{ color: '#FFFFFF', fontWeight: 600 }}>{invoice.portOfDischarge}</div>
              </div>
            )}
            {invoice.shippingMarks && (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Shipping Marks:</span>
                <div style={{ color: '#FFFFFF', fontWeight: 600 }}>{invoice.shippingMarks}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Line Items Table */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', overflowX: 'auto' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', color: '#FFFFFF' }}>
          Line Items ({invoice.items?.length || 0})
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              <th style={{ padding: '0.75rem' }}>#</th>
              <th style={{ padding: '0.75rem' }}>Product & Description</th>
              <th style={{ padding: '0.75rem' }}>HSN</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Qty</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Unit Price</th>
              {invoice.items?.some((i) => i.discountPercent > 0) && (
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Disc %</th>
              )}
              {invoice.items?.some((i) => i.taxRate > 0) && (
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Tax %</th>
              )}
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {(invoice.items || []).map((it, idx) => (
              <tr
                key={it._id || idx}
                style={{
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: '0.85rem',
                  color: '#FFFFFF',
                }}
              >
                <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-muted)' }}>{idx + 1}</td>
                <td style={{ padding: '0.85rem 0.75rem' }}>
                  <div style={{ fontWeight: 600 }}>{it.productName}</div>
                  {it.sku && it.sku !== 'N/A' && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                      SKU: {it.sku}
                    </div>
                  )}
                </td>
                <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-secondary)' }}>
                  {it.hsnCode || '8205.59'}
                </td>
                <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', fontWeight: 600 }}>
                  {it.quantity} {it.unit || 'PCS'}
                </td>
                <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                  ${(it.unitPrice || 0).toFixed(2)}
                </td>
                {invoice.items?.some((i) => i.discountPercent > 0) && (
                  <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', color: 'var(--accent-amber)' }}>
                    {it.discountPercent ? `${it.discountPercent}%` : '-'}
                  </td>
                )}
                {invoice.items?.some((i) => i.taxRate > 0) && (
                  <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', color: 'var(--text-secondary)' }}>
                    {it.taxRate ? `${it.taxRate}%` : '0%'}
                  </td>
                )}
                <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right', fontWeight: 700 }}>
                  ${(it.lineTotal != null ? it.lineTotal : it.quantity * it.unitPrice).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Summary Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <div style={{ minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Subtotal:</span>
              <strong style={{ color: '#FFFFFF' }}>${((invoice.subtotal != null ? invoice.subtotal : invoice.subTotal) || 0).toFixed(2)}</strong>
            </div>

            {invoice.discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-amber)' }}>
                <span>Discount:</span>
                <strong>-${(invoice.discountAmount || 0).toFixed(2)}</strong>
              </div>
            )}

            {invoice.shippingCharges > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Freight / Shipping:</span>
                <strong style={{ color: '#FFFFFF' }}>${(invoice.shippingCharges || 0).toFixed(2)}</strong>
              </div>
            )}

            {invoice.taxAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Tax ({invoice.taxRate || 0}%):</span>
                <strong style={{ color: '#FFFFFF' }}>${(invoice.taxAmount || 0).toFixed(2)}</strong>
              </div>
            )}

            {invoice.roundOff !== 0 && invoice.roundOff != null && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Round Off:</span>
                <span>${(invoice.roundOff || 0).toFixed(2)}</span>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px solid var(--border-medium)',
                paddingTop: '0.65rem',
                fontSize: '1.15rem',
                fontWeight: 800,
                color: '#FFFFFF',
              }}
            >
              <span>Grand Total:</span>
              <span style={{ color: 'var(--accent-amber)' }}>
                ${(invoice.grandTotal || 0).toFixed(2)} {invoice.currency || 'USD'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Ledger / History */}
      <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={18} color="var(--accent-emerald)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>
              Payment History ({invoice.payments?.length || 0})
            </h3>
          </div>

          {isAdmin && !isVoid && !isPaid && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <CreditCard size={14} />
              <span>Record Payment</span>
            </button>
          )}
        </div>

        {(!invoice.payments || invoice.payments.length === 0) ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            No payments recorded yet for this invoice.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '550px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-medium)', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Date</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Method</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Reference #</th>
                  <th style={{ padding: '0.65rem 0.75rem' }}>Notes</th>
                  <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.payments.map((p, idx) => (
                  <tr
                    key={p._id || idx}
                    style={{
                      borderBottom: '1px solid var(--border-subtle)',
                      fontSize: '0.85rem',
                      color: '#FFFFFF',
                    }}
                  >
                    <td style={{ padding: '0.75rem' }}>
                      {new Date(p.paymentDate || p.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className="badge badge-slate" style={{ fontSize: '0.7rem' }}>
                        {p.paymentMethod || 'Wire Transfer'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                      {p.transactionReference || '-'}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                      {p.notes || '-'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                      +${(p.amount || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Terms & Notes */}
      {(invoice.termsAndConditions || invoice.notes) && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          {invoice.notes && (
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ color: '#FFFFFF', fontSize: '0.9rem', display: 'block', marginBottom: '0.35rem' }}>
                Invoice Notes:
              </strong>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                {invoice.notes}
              </p>
            </div>
          )}

          {invoice.termsAndConditions && (
            <div>
              <strong style={{ color: '#FFFFFF', fontSize: '0.9rem', display: 'block', marginBottom: '0.35rem' }}>
                Terms & Conditions:
              </strong>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>
                {invoice.termsAndConditions}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="glass-card"
            style={{
              padding: '2rem',
              maxWidth: '480px',
              width: '100%',
              backgroundColor: '#0F172A',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={20} color="var(--accent-emerald)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF' }}>Record Payment</h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.2rem 0.5rem' }}
              >
                ✕
              </button>
            </div>

            {paymentError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--accent-rose)',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}
              >
                {paymentError}
              </div>
            )}

            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Amount ({invoice.currency || 'USD'}) * (Balance due: ${balanceDue.toFixed(2)})
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={balanceDue}
                  required
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
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
                  Payment Method *
                </label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
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
                  <option value="Wire Transfer">Wire Transfer (TT)</option>
                  <option value="LC">Letter of Credit (LC)</option>
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Payment Date *
                </label>
                <input
                  type="date"
                  required
                  value={paymentForm.paymentDate}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
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
                  Transaction Reference / UTR
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR-982348274 or Bank Ref #"
                  value={paymentForm.transactionReference}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionReference: e.target.value })}
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
                  Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional notes about this remittance..."
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="btn btn-secondary"
                  disabled={paymentSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={paymentSubmitting}
                >
                  {paymentSubmitting ? 'Recording...' : 'Confirm Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Void Invoice Modal */}
      {showVoidModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="glass-card"
            style={{
              padding: '2rem',
              maxWidth: '480px',
              width: '100%',
              backgroundColor: '#0F172A',
              borderColor: 'rgba(244, 63, 94, 0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Ban size={22} color="var(--accent-rose)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#FFFFFF' }}>Void Invoice</h3>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Voiding cancels this invoice and marks it as void. This action cannot be undone. Please provide a clear audit reason.
            </p>

            {voidError && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: 'rgba(244, 63, 94, 0.15)',
                  border: '1px solid rgba(244, 63, 94, 0.4)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--accent-rose)',
                  fontSize: '0.85rem',
                  marginBottom: '1rem',
                }}
              >
                {voidError}
              </div>
            )}

            <form onSubmit={handleVoidInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Reason for Voiding * (minimum 3 characters)
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Issued in error / Replaced by amended invoice #..."
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowVoidModal(false)}
                  className="btn btn-secondary"
                  disabled={voidSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={voidSubmitting}
                  className="btn btn-sm"
                  style={{
                    backgroundColor: 'var(--accent-rose)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                  }}
                >
                  {voidSubmitting ? 'Voiding...' : 'Yes, Void Invoice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
