import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { invoiceApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Receipt,
  FileDown,
  Plus,
  Search,
  ArrowRight,
  Calendar,
  Building,
  AlertCircle,
  FileText,
  Copy,
  Edit3
} from 'lucide-react';

export const InvoicesPage = () => {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [docTypeFilter, setDocTypeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await invoiceApi.getInvoices({ limit: 100 });
      if (res.success) {
        setInvoices(res.data || []);
      } else {
        setInvoices([]);
      }
    } catch (err) {
      console.error('Failed to load invoices:', err);
      setError(err.message || 'Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleDownloadPdf = async (e, inv) => {
    e.stopPropagation();
    try {
      setDownloadingId(inv._id);
      await invoiceApi.downloadPdf(inv._id, inv.invoiceNumber);
    } catch (err) {
      alert('Error downloading Invoice PDF: ' + err.message);
    } finally {
      setDownloadingId(null);
    }
  };

  // Status Filter options
  const STATUS_OPTIONS = ['All', 'draft', 'sent', 'paid', 'partial', 'overdue', 'void'];
  const DOC_TYPE_LABELS = {
    commercial_invoice: 'Commercial Invoice',
    gst_invoice: 'GST Tax Invoice',
    proforma_invoice: 'Proforma Invoice',
    standard_invoice: 'Standard Invoice',
    eway_bill: 'E-Way Bill',
  };

  // Filter & Search
  const filteredInvoices = invoices.filter((inv) => {
    const matchesStatus =
      statusFilter === 'All' || inv.status?.toLowerCase() === statusFilter.toLowerCase();
    const matchesDocType =
      docTypeFilter === 'All' || inv.docType === docTypeFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      inv.invoiceNumber?.toLowerCase().includes(q) ||
      inv.order?.orderNumber?.toLowerCase().includes(q) ||
      inv.customerDetails?.customerName?.toLowerCase().includes(q) ||
      inv.customerDetails?.businessName?.toLowerCase().includes(q) ||
      inv.customerDetails?.country?.toLowerCase().includes(q);

    return matchesStatus && matchesDocType && matchesSearch;
  });

  // Calculate high-level summary metrics
  const stats = invoices.reduce(
    (acc, inv) => {
      if (inv.status !== 'void') {
        acc.totalInvoiced += inv.grandTotal || 0;
        acc.totalPaid += inv.amountPaid || 0;
        acc.totalDue += inv.balanceDue != null ? inv.balanceDue : (inv.grandTotal - (inv.amountPaid || 0));
      }
      return acc;
    },
    { totalInvoiced: 0, totalPaid: 0, totalDue: 0 }
  );

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 4rem' }}>
      {/* Page Header */}
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
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-amber)',
              }}
            >
              <Receipt size={22} />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Invoices & Billing</h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {isAdmin
              ? 'Manage commercial invoices, record payments, and export tax documents across all buyers.'
              : 'View all export commercial invoices, check payment balances, and download official PDF records.'}
          </p>
        </div>

        {isAdmin && (
          <Link
            to="/invoices/new"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Plus size={16} />
            <span>Create New Invoice</span>
          </Link>
        )}
      </div>

      {/* Metrics Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Invoiced
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF', marginTop: '0.35rem' }}>
            ${stats.totalInvoiced.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Across {invoices.filter((i) => i.status !== 'void').length} active records
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Collected
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.35rem' }}>
            ${stats.totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Confirmed received funds
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Outstanding Balance
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: stats.totalDue > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)', marginTop: '0.35rem' }}>
            ${stats.totalDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Receivable across orders
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.25rem 1.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Documents
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-amber)', marginTop: '0.35rem' }}>
            {invoices.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {invoices.filter((i) => i.status === 'paid').length} fully paid
          </div>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div
        className="glass-card"
        style={{
          padding: '1.25rem 1.5rem',
          marginBottom: '1.75rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search box */}
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '450px' }}>
            <Search
              size={17}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search by invoice #, order #, buyer or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 0.75rem 0.6rem 2.4rem',
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                color: '#FFFFFF',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Doc Type Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Type:</span>
            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              style={{
                padding: '0.5rem 0.85rem',
                backgroundColor: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            >
              <option value="All">All Types</option>
              <option value="commercial_invoice">Commercial Invoice</option>
              <option value="gst_invoice">GST Tax Invoice</option>
              <option value="proforma_invoice">Proforma Invoice</option>
              <option value="standard_invoice">Standard Invoice</option>
              <option value="eway_bill">E-Way Bill</option>
            </select>
          </div>
        </div>

        {/* Status Filters */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginRight: '0.4rem' }}>
            Status:
          </span>
          {STATUS_OPTIONS.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize', fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Invoice List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--accent-amber)' }}>
          <Receipt size={36} className="animate-spin" style={{ margin: '0 auto 1rem', opacity: 0.7 }} />
          <div>Loading invoices...</div>
        </div>
      ) : error ? (
        <div
          className="glass-card"
          style={{
            padding: '2.5rem',
            textAlign: 'center',
            borderColor: 'rgba(244, 63, 94, 0.3)',
          }}
        >
          <AlertCircle size={40} color="var(--accent-rose)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ color: '#FFFFFF', marginBottom: '0.5rem' }}>Failed to Load Invoices</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
          <button onClick={fetchInvoices} className="btn btn-secondary">
            Try Again
          </button>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="glass-card" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
          <Receipt size={56} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
          <h3 style={{ color: '#FFFFFF', marginBottom: '0.5rem' }}>No Invoices Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
            {searchQuery || statusFilter !== 'All' || docTypeFilter !== 'All'
              ? 'No invoices match the specified search or filter criteria. Try adjusting your filters.'
              : 'Commercial invoices will appear here once orders are confirmed and billed.'}
          </p>
          {isAdmin ? (
            <Link to="/invoices/new" className="btn btn-primary">
              <Plus size={16} />
              <span>Create First Invoice</span>
            </Link>
          ) : (
            <Link to="/my-orders" className="btn btn-secondary">
              Go to My Orders
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredInvoices.map((inv) => {
            const balance = inv.balanceDue != null ? inv.balanceDue : (inv.grandTotal - (inv.amountPaid || 0));
            return (
              <div
                key={inv._id}
                className="glass-card"
                style={{
                  padding: '1.35rem 1.6rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1.25rem',
                  transition: 'border-color var(--transition-fast), transform var(--transition-fast)',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/invoices/${inv._id}`)}
              >
                {/* Left section: Identity & Metadata */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.1rem', minWidth: '280px' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-medium)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-amber)',
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={22} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '0.02em' }}>
                        {inv.invoiceNumber}
                      </span>
                      <StatusBadge status={inv.status} />
                      <span className="badge badge-slate" style={{ fontSize: '0.68rem' }}>
                        {DOC_TYPE_LABELS[inv.docType] || inv.docType}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.85rem',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        marginTop: '0.35rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Calendar size={13} />
                        {new Date(inv.invoiceDate || inv.createdAt).toLocaleDateString()}
                      </span>

                      {inv.customerDetails?.businessName && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Building size={13} />
                          {inv.customerDetails.businessName}
                        </span>
                      )}

                      {inv.customerDetails?.country && (
                        <span>({inv.customerDetails.country})</span>
                      )}

                      {inv.order && (
                        <span style={{ color: 'var(--accent-blue)' }}>
                          Order #{inv.order.orderNumber || String(inv.order).slice(-6)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right section: Financials & Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem', flexWrap: 'wrap' }}>
                  {/* Grand total */}
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Total ({inv.currency || 'USD'})
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFFFFF' }}>
                      ${(inv.grandTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Paid */}
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Paid</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
                      ${(inv.amountPaid || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Balance */}
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Balance</div>
                    <div
                      style={{
                        fontSize: '1rem',
                        fontWeight: 800,
                        color: balance > 0 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                      }}
                    >
                      ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    {inv.status !== 'void' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/invoices/${inv._id}/edit`);
                        }}
                        title="Edit this invoice"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Edit3 size={13} />
                        <span>Edit</span>
                      </button>
                    )}

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/invoices/new?cloneFrom=${inv._id}`);
                      }}
                      title="Clone & Re-Issue this invoice"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <Copy size={13} />
                      <span>Clone</span>
                    </button>

                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => handleDownloadPdf(e, inv)}
                      disabled={downloadingId === inv._id}
                      title="Download PDF"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <FileDown size={14} />
                      <span>{downloadingId === inv._id ? 'Downloading...' : 'PDF'}</span>
                    </button>

                    <button
                      className="btn btn-primary btn-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/invoices/${inv._id}`);
                      }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                      <span>View</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
