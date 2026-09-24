import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { orderApi, invoiceApi } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import {
  Receipt,
  ArrowLeft,
  Plus,
  Trash2,
  Package,
  Building,
  AlertCircle,
  FileText,
  Copy,
  CheckCircle,
  Clock,
  ChevronDown,
  Sliders,
  Percent,
  Calendar,
  DollarSign,
  Eye,
  EyeOff,
  Briefcase,
  Layers,
  Sparkles,
  Save
} from 'lucide-react';

export const CreateInvoicePage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const cloneFromId = searchParams.get('cloneFrom') || searchParams.get('cloneId');
  const isEdit = Boolean(id) && !cloneFromId;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast, formatMoney } = useUI();

  const [loadingOrder, setLoadingOrder] = useState(!!orderId || !!cloneFromId || isEdit);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [importedNotice, setImportedNotice] = useState(null);

  // Past Invoices List for quick import
  const [pastInvoices, setPastInvoices] = useState([]);
  const [showImportSelector, setShowImportSelector] = useState(false);

  // Customization Visibility Toggles
  const [showSkuHsn, setShowSkuHsn] = useState(true);
  const [showCustomSender, setShowCustomSender] = useState(false);
  const [customTaxMode, setCustomTaxMode] = useState(false);

  // Form State
  const [customInvoiceNumber, setCustomInvoiceNumber] = useState('');
  const [docType, setDocType] = useState('commercial_invoice');
  const [currency, setCurrency] = useState('USD');
  const [status, setStatus] = useState('sent');
  const [taxRate, setTaxRate] = useState(0);
  const [customTaxInput, setCustomTaxInput] = useState('0');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [discountType, setDiscountType] = useState('amount');
  const [discountValue, setDiscountValue] = useState(0);
  const [shippingCharges, setShippingCharges] = useState(0);
  const [notes, setNotes] = useState('Payment is due within 30 days of invoice date.');
  const [termsAndConditions, setTermsAndConditions] = useState(
    '1. Payment as per agreed terms.\n2. Goods once sold/inspected will not be taken back.'
  );

  // Optional Custom Sender / Company details
  const [sender, setSender] = useState({
    companyName: '',
    address: '',
    phoneNumber: '',
    email: '',
    gstin: '',
    pan: '',
    iecNo: '',
  });

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
      unit: 'HRS', // 'HRS' | 'PCS' | 'DAYS' | 'FLAT' | 'SET' | 'BOX'
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      taxRate: 0,
    },
  ]);

  // Load Past Invoices list on mount for the selector
  useEffect(() => {
    const fetchPast = async () => {
      try {
        const res = await invoiceApi.getInvoices({ limit: 50 });
        if (res.success && Array.isArray(res.data)) {
          setPastInvoices(res.data);
        }
      } catch (err) {
        console.error('Failed to load past invoices for import:', err);
      }
    };
    fetchPast();
  }, []);

  // Helper to apply data from an existing invoice
  const applyInvoiceData = (inv, isDirectEdit = false) => {
    if (!inv) return;

    if (inv.invoiceNumber) setCustomInvoiceNumber(inv.invoiceNumber);
    if (inv.docType) setDocType(inv.docType);
    if (inv.currency) setCurrency(inv.currency);
    if (inv.status && ['draft', 'sent'].includes(inv.status)) setStatus(inv.status);
    if (inv.discountType) setDiscountType(inv.discountType);
    if (inv.discountValue != null) setDiscountValue(Number(inv.discountValue));
    if (inv.taxRate != null) {
      setTaxRate(Number(inv.taxRate));
      setCustomTaxInput(String(inv.taxRate));
      if (![0, 5, 12, 13, 15, 18, 28].includes(Number(inv.taxRate))) {
        setCustomTaxMode(true);
      }
    }
    if (inv.shippingCharges != null) setShippingCharges(Number(inv.shippingCharges));
    if (inv.notes) setNotes(inv.notes);
    if (inv.termsAndConditions) setTermsAndConditions(inv.termsAndConditions);
    if (inv.invoiceDate) setInvoiceDate(new Date(inv.invoiceDate).toISOString().split('T')[0]);
    if (inv.dueDate) setDueDate(new Date(inv.dueDate).toISOString().split('T')[0]);

    if (inv.senderDetails) {
      setSender({
        companyName: inv.senderDetails.companyName || '',
        address: inv.senderDetails.address || '',
        phoneNumber: inv.senderDetails.phoneNumber || inv.senderDetails.phone || '',
        email: inv.senderDetails.email || '',
        gstin: inv.senderDetails.gstin || '',
        pan: inv.senderDetails.pan || '',
        iecNo: inv.senderDetails.iecNo || '',
      });
      if (inv.senderDetails.companyName) {
        setShowCustomSender(true);
      }
    }

    if (inv.customerDetails) {
      setCustomer({
        customerName: inv.customerDetails.customerName || '',
        businessName: inv.customerDetails.businessName || '',
        email: inv.customerDetails.email || '',
        phoneNumber: inv.customerDetails.phoneNumber || '',
        address: inv.customerDetails.address || '',
        country: inv.customerDetails.country || '',
        taxId: inv.customerDetails.taxId || '',
        stateCode: inv.customerDetails.stateCode || '',
      });
    }

    if (Array.isArray(inv.items) && inv.items.length > 0) {
      const hasSkuOrHsn = inv.items.some((it) => (it.sku && it.sku !== 'N/A') || (it.hsnCode && it.hsnCode !== '8205.59'));
      setShowSkuHsn(hasSkuOrHsn);

      setItems(
        inv.items.map((it, idx) => ({
          productName: (it.productName || it.description || `Item #${idx + 1}`).trim(),
          sku: (it.sku || 'N/A').trim(),
          description: (it.description || '').trim(),
          hsnCode: (it.hsnCode || '8205.59').trim(),
          unit: it.unit || (it.quantity % 1 !== 0 ? 'HRS' : 'PCS'),
          quantity: parseFloat(it.quantity || it.qty) || 1,
          unitPrice: parseFloat(it.unitPrice || it.price) || 0,
          discountPercent: parseFloat(it.discountPercent || it.discRate) || 0,
          taxRate: parseFloat(it.taxRate) || 0,
        }))
      );
    }

    if (isDirectEdit) {
      showToast(`Loaded invoice #${inv.invoiceNumber} for editing`, 'info');
    } else {
      setImportedNotice(
        `Imported ${inv.items?.length || 0} line items & customer details from Invoice #${inv.invoiceNumber}`
      );
      showToast(`Loaded invoice template #${inv.invoiceNumber}`, 'success');
      setShowImportSelector(false);
    }
  };

  // Load Edit Invoice if isEdit, Order if orderId provided, or Clone if cloneFromId provided
  useEffect(() => {
    if (isEdit) {
      const fetchEditInvoice = async () => {
        try {
          setLoadingOrder(true);
          const res = await invoiceApi.getInvoiceById(id);
          if (res.success && (res.data || res.invoice)) {
            const inv = res.data || res.invoice;
            applyInvoiceData(inv, true);
          } else {
            setError('Invoice record not found for editing');
          }
        } catch (err) {
          console.error('Error fetching invoice for editing:', err);
          setError(err.message || 'Could not load invoice for editing');
        } finally {
          setLoadingOrder(false);
        }
      };
      fetchEditInvoice();
    } else if (orderId) {
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
    } else if (cloneFromId) {
      const fetchClone = async () => {
        try {
          setLoadingOrder(true);
          const res = await invoiceApi.getInvoiceById(cloneFromId);
          if (res.success && res.data) {
            applyInvoiceData(res.data);
          } else {
            setError('Source invoice for cloning not found');
          }
        } catch (err) {
          console.error('Error fetching clone invoice:', err);
          setError(err.message || 'Could not load source invoice');
        } finally {
          setLoadingOrder(false);
        }
      };
      fetchClone();
    } else {
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
    }
  }, [id, isEdit, orderId, cloneFromId, user]);

  // Line item handlers
  const handleItemChange = (index, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      const currentItem = updated[index];
      if (field === 'productName') {
        // Keep description in sync if it was identical or empty
        const shouldSyncDesc = !currentItem.description || currentItem.description === currentItem.productName;
        updated[index] = {
          ...currentItem,
          productName: value,
          ...(shouldSyncDesc ? { description: value } : {}),
        };
      } else {
        updated[index] = { ...currentItem, [field]: value };
      }
      return updated;
    });
  };

  const handleAddItem = (defaultUnit = 'HRS') => {
    setItems((prev) => [
      ...prev,
      {
        productName: '',
        sku: '',
        description: '',
        hsnCode: '8205.59',
        unit: defaultUnit,
        quantity: 1,
        unitPrice: 0,
        discountPercent: 0,
        taxRate: taxRate,
      },
    ]);
    showToast(`Added line item (${defaultUnit})`, 'info');
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
    showToast('Removed line item', 'warning');
  };

  // Bulk switcher for all items unit (Quantity vs Hours vs Flat)
  const setAllItemsUnit = (unit) => {
    setItems((prev) =>
      prev.map((item) => ({
        ...item,
        unit,
      }))
    );
    showToast(`Switched all items to ${unit === 'HRS' ? 'Hourly (Hrs)' : unit === 'PCS' ? 'Quantity (Pcs)' : unit}`, 'info');
  };

  // Tax Rate helper
  const handleTaxPreset = (rate) => {
    setTaxRate(rate);
    setCustomTaxInput(String(rate));
    setCustomTaxMode(false);
  };

  const handleCustomTaxChange = (val) => {
    setCustomTaxInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
      setTaxRate(parsed);
    }
  };

  // Currency symbols helper
  const getCurrencySymbol = (cur) => {
    switch (cur) {
      case 'CAD':
      case 'USD':
      case 'AUD':
        return '$';
      case 'INR':
        return '₹';
      case 'EUR':
        return '€';
      case 'GBP':
        return '£';
      default:
        return '$';
    }
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

  let discountAmount = 0;
  if (discountValue > 0) {
    if (discountType === 'percent') {
      discountAmount = (itemsSubtotal * parseFloat(discountValue)) / 100;
    } else {
      discountAmount = parseFloat(discountValue) || 0;
    }
  }

  const taxableAmount = Math.max(0, itemsSubtotal - discountAmount);
  const previewTax = (taxableAmount * (parseFloat(taxRate) || 0)) / 100;
  const previewGrandTotal = taxableAmount + previewTax + (parseFloat(shippingCharges) || 0);

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      let payload = {
        invoiceNumber: customInvoiceNumber.trim() ? customInvoiceNumber.trim() : undefined,
        docType,
        currency,
        status: status || 'sent',
        taxRate: parseFloat(taxRate) || 0,
        discountType,
        discountValue: parseFloat(discountValue) || 0,
        shippingCharges: parseFloat(shippingCharges) || 0,
        notes,
        termsAndConditions,
        invoiceDate: invoiceDate || undefined,
        dueDate: dueDate || undefined,
      };

      if (showCustomSender && (sender.companyName.trim() || sender.address.trim())) {
        payload.senderDetails = {
          companyName: sender.companyName.trim() || 'H.A. OVERSEAS',
          address: sender.address.trim(),
          phoneNumber: sender.phoneNumber.trim(),
          phone: sender.phoneNumber.trim(),
          email: sender.email.trim(),
          gstin: sender.gstin.trim(),
          pan: sender.pan.trim(),
          iecNo: sender.iecNo.trim(),
        };
      }

      if (orderId) {
        payload.orderId = orderId;
      } else {
        // Validate standalone fields
        const effectiveCustName = (customer.customerName || customer.businessName || user?.customerName || user?.username || '').trim();
        const effectiveBizName = (customer.businessName || customer.customerName || user?.businessName || '').trim();

        if (!effectiveCustName && !effectiveBizName) {
          throw new Error('Please provide at least a customer name or business name.');
        }

        const formattedItems = items.map((it) => {
          const pName = (it.productName || it.description || 'Service / Product').trim();
          const desc = it.description?.trim() ? it.description.trim() : pName;
          return {
            productName: pName,
            sku: it.sku?.trim() || 'N/A',
            description: desc,
            hsnCode: it.hsnCode?.trim() || '8205.59',
            unit: it.unit || 'PCS',
            quantity: parseFloat(it.quantity) > 0 ? parseFloat(it.quantity) : 1,
            unitPrice: parseFloat(it.unitPrice) >= 0 ? parseFloat(it.unitPrice) : 0,
            discountPercent: parseFloat(it.discountPercent) || 0,
            taxRate: parseFloat(it.taxRate) || parseFloat(taxRate) || 0,
          };
        });

        const invalidItem = formattedItems.find((it) => !it.productName);
        if (invalidItem) {
          throw new Error('Each line item must have a product/service name.');
        }

        payload.customerDetails = {
          ...customer,
          customerName: effectiveCustName,
          businessName: effectiveBizName,
        };
        payload.items = formattedItems;
      }

      if (isEdit) {
        const res = await invoiceApi.updateInvoice(id, payload);
        if (res.success && (res.invoice || res.data)) {
          showToast(`Invoice #${customInvoiceNumber || id} updated successfully!`, 'success');
          navigate(`/invoices/${id}`);
        } else {
          throw new Error(res.message || 'Invoice update failed');
        }
      } else {
        const res = await invoiceApi.createInvoice(payload);
        if (res.success && (res.invoice || res.data)) {
          const createdInv = res.invoice || res.data;
          showToast(`Invoice #${createdInv.invoiceNumber} created successfully!`, 'success');
          navigate(`/invoices/${createdInv._id}`);
        } else {
          throw new Error(res.message || 'Invoice creation failed');
        }
      }
    } catch (err) {
      console.error('Invoice save/update error:', err);
      setError(err.message || (isEdit ? 'Failed to update invoice' : 'Failed to create invoice'));
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

  const sym = getCurrencySymbol(currency);

  return (
    <div className="container" style={{ padding: '2.5rem 1rem 5rem', maxWidth: '1040px' }}>
      {/* Header & Back Link */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Custom Sender Toggle */}
            <button
              type="button"
              onClick={() => setShowCustomSender(!showCustomSender)}
              className="btn btn-secondary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                borderColor: showCustomSender ? 'rgba(59, 130, 246, 0.6)' : 'var(--border-medium)',
                color: showCustomSender ? '#60A5FA' : 'var(--text-secondary)',
                backgroundColor: showCustomSender ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
              }}
            >
              <Briefcase size={14} />
              <span>{showCustomSender ? 'Custom Issuer Active' : 'Customize Issuer'}</span>
            </button>

            {/* Past Invoices Import */}
            {!order && pastInvoices.length > 0 && (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowImportSelector(!showImportSelector)}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    borderColor: 'rgba(245, 158, 11, 0.4)',
                    color: 'var(--accent-amber)',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                  }}
                >
                  <Copy size={15} />
                  <span>Import from Past Invoice</span>
                  <ChevronDown size={14} />
                </button>

                {/* Import Dropdown Menu */}
                {showImportSelector && (
                  <div
                    className="glass-card"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '380px',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      zIndex: 200,
                      backgroundColor: '#0F172A',
                      boxShadow: 'var(--shadow-md)',
                      border: '1px solid var(--border-medium)',
                      padding: '0.5rem',
                    }}
                  >
                    <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)' }}>
                      Select an invoice to copy:
                    </div>
                    {pastInvoices.map((inv) => (
                      <div
                        key={inv._id}
                        onClick={() => applyInvoiceData(inv)}
                        style={{
                          padding: '0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          transition: 'background var(--transition-fast)',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.15)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: '#FFFFFF', fontSize: '0.85rem' }}>{inv.invoiceNumber}</strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--accent-amber)', fontWeight: 700 }}>
                            {inv.currency} {(inv.grandTotal || 0).toFixed(2)}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                          {inv.customerDetails?.businessName || inv.customerDetails?.customerName || 'Direct'} •{' '}
                          {inv.items?.length || 0} items ({inv.docType?.replace('_', ' ')})
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
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
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              {isEdit
                ? `Edit Invoice #${customInvoiceNumber || ''}`
                : order
                ? `Generate Invoice for Order #${order.orderNumber}`
                : cloneFromId
                ? 'Duplicate / Re-Issue Invoice'
                : 'Custom Invoice Creator'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              {isEdit
                ? 'Modify line items, quantities, hourly units, pricing, custom branding, or tax settings for this invoice.'
                : order
                ? 'Generate an official commercial export invoice linked to verified order items.'
                : 'Create highly customized invoices: bill by Quantity or Decimal Hours, choose currencies, and set custom tax rates.'}
            </p>
          </div>
        </div>
      </div>

      {importedNotice && (
        <div
          className="glass-card"
          style={{
            padding: '0.85rem 1.25rem',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            borderColor: 'rgba(16, 185, 129, 0.4)',
            color: 'var(--accent-emerald)',
            fontSize: '0.875rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={18} />
            <span>{importedNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setImportedNotice(null)}
            className="btn btn-sm"
            style={{ padding: '0.2rem 0.5rem', background: 'transparent', color: 'var(--accent-emerald)' }}
          >
            ✕
          </button>
        </div>
      )}

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
        {/* Custom Issuer / Sender Section (Optional & Collapsible) */}
        {showCustomSender && (
          <div
            className="glass-card"
            style={{
              padding: '1.75rem',
              marginBottom: '1.75rem',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#60A5FA' }}>
                <Briefcase size={20} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Issuer / Seller Information (Custom Sender)
                </h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Overrides default H.A. Overseas header on PDF
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                  Issuer / Company Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Infynix Global Inc / H.A. Overseas"
                  value={sender.companyName}
                  onChange={(e) => setSender({ ...sender, companyName: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
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
                  Issuer Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. billing@infynix.ca"
                  value={sender.email}
                  onChange={(e) => setSender({ ...sender, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
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
                  Issuer Phone
                </label>
                <input
                  type="text"
                  placeholder="e.g. +1-555-0100"
                  value={sender.phoneNumber}
                  onChange={(e) => setSender({ ...sender, phoneNumber: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
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
                  Issuer Tax / GST / BN ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 7026923229RT0001 or 03AAAAA..."
                  value={sender.gstin}
                  onChange={(e) => setSender({ ...sender, gstin: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem',
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
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
                Issuer Registered Address
              </label>
              <textarea
                rows={2}
                placeholder="Full address of the billing business / agency"
                value={sender.address}
                onChange={(e) => setSender({ ...sender, address: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
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

        {/* Invoice Configuration Card */}
        <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', color: 'var(--accent-amber)' }}>
            <Sliders size={20} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>
              Invoice Configuration & Terms
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
            {/* Document Type */}
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
                <option value="standard_invoice">Standard Invoice / Consulting Bill</option>
                <option value="gst_invoice">GST Tax Invoice</option>
                <option value="proforma_invoice">Proforma Commercial Invoice</option>
                <option value="eway_bill">E-Way Bill</option>
              </select>
            </div>

            {/* Invoice Status */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Invoice Status *
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  backgroundColor: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  color: status === 'draft' ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
              >
                <option value="sent">Issued / Sent (Active)</option>
                <option value="draft">Draft (Review / Staging)</option>
              </select>
            </div>

            {/* Currency */}
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
                <option value="CAD">CAD ($) - Canadian Dollar</option>
                <option value="USD">USD ($) - US Dollar / Export</option>
                <option value="INR">INR (₹) - Indian Rupee / Domestic GST</option>
                <option value="EUR">EUR (€) - European Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="AUD">AUD ($) - Australian Dollar</option>
              </select>
            </div>

            {/* Custom Invoice # */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Custom Invoice # (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. INV-0007 (leave blank for auto)"
                value={customInvoiceNumber}
                onChange={(e) => setCustomInvoiceNumber(e.target.value)}
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

            {/* Issue Date */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
                Invoice Issue Date
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
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

            {/* Due Date */}
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

          {/* Tax Configuration Row */}
          <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                Tax Rate (%) & Presets:
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                {[
                  { label: '0% (Export/Zero-Rated)', val: 0 },
                  { label: '5% GST', val: 5 },
                  { label: '13% ON HST', val: 13 },
                  { label: '15% HST', val: 15 },
                  { label: '18% GST', val: 18 },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => handleTaxPreset(preset.val)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      border: taxRate === preset.val && !customTaxMode ? '1px solid var(--accent-amber)' : '1px solid var(--border-medium)',
                      backgroundColor: taxRate === preset.val && !customTaxMode ? 'rgba(245, 158, 11, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                      color: taxRate === preset.val && !customTaxMode ? 'var(--accent-amber)' : 'var(--text-secondary)',
                      fontWeight: taxRate === preset.val && !customTaxMode ? 700 : 400,
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCustomTaxMode(!customTaxMode)}
                  style={{
                    padding: '0.35rem 0.75rem',
                    fontSize: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    border: customTaxMode ? '1px solid #3B82F6' : '1px solid var(--border-medium)',
                    backgroundColor: customTaxMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                    color: customTaxMode ? '#60A5FA' : 'var(--text-secondary)',
                    fontWeight: customTaxMode ? 700 : 400,
                  }}
                >
                  Custom %
                </button>
              </div>
            </div>

            {customTaxMode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', maxWidth: '300px', marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Custom Rate:</span>
                <div style={{ position: 'relative', width: '120px' }}>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={customTaxInput}
                    onChange={(e) => handleCustomTaxChange(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.45rem 1.5rem 0.45rem 0.65rem',
                      backgroundColor: '#0F172A',
                      border: '1px solid #3B82F6',
                      borderRadius: 'var(--radius-sm)',
                      color: '#FFFFFF',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  />
                  <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#60A5FA', fontSize: '0.8rem' }}>%</span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-amber)' }}>Applied: {taxRate}%</span>
              </div>
            )}
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
                      <td style={{ padding: '0.7rem 0.5rem', textAlign: 'right' }}>{sym}{(it.unitPrice || 0).toFixed(2)}</td>
                      <td style={{ padding: '0.7rem 0.5rem', textAlign: 'right', fontWeight: 700 }}>
                        {sym}{((it.quantity || 0) * (it.unitPrice || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', fontSize: '1rem', fontWeight: 800 }}>
              <span style={{ color: 'var(--text-secondary)', marginRight: '1rem' }}>Order Total:</span>
              <span style={{ color: 'var(--accent-amber)' }}>
                {sym}{(order.totalAmount || 0).toFixed(2)} {order.currency || 'USD'}
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
                  placeholder="e.g. Infynix Global Inc / Apex Supplies LLC"
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
                  placeholder="e.g. Ajit Pal / John Doe"
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
                  placeholder="e.g. ajitpal353@gmail.com"
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
                  placeholder="e.g. +1-000-000-0000"
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
                  placeholder="e.g. Canada, United States, Germany"
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
                  placeholder="e.g. 7026923229RT0001 or EIN-..."
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
                placeholder="Street address, City, Province/State, Postal Code"
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-amber)' }}>
                <FileText size={20} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#FFFFFF' }}>
                  Line Items ({items.length})
                </h3>
              </div>

              {/* Quick Billing Mode & View Options */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Set unit for all:</span>
                <button
                  type="button"
                  onClick={() => setAllItemsUnit('HRS')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                >
                  ⏱️ Hours (Hrs)
                </button>
                <button
                  type="button"
                  onClick={() => setAllItemsUnit('PCS')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                >
                  📦 Quantity (Pcs)
                </button>
                <button
                  type="button"
                  onClick={() => setAllItemsUnit('DAYS')}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                >
                  📅 Days
                </button>

                {/* Toggle SKU / HSN columns */}
                <button
                  type="button"
                  onClick={() => setShowSkuHsn(!showSkuHsn)}
                  className="btn btn-secondary btn-sm"
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.6rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    color: showSkuHsn ? 'var(--text-secondary)' : '#60A5FA',
                  }}
                >
                  {showSkuHsn ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{showSkuHsn ? 'Hide SKU/HSN' : 'Show SKU/HSN'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddItem(items[0]?.unit || 'HRS')}
                  className="btn btn-secondary btn-sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    backgroundColor: 'rgba(245, 158, 11, 0.15)',
                    color: 'var(--accent-amber)',
                    borderColor: 'rgba(245, 158, 11, 0.3)',
                  }}
                >
                  <Plus size={15} />
                  <span>Add Item</span>
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {items.map((item, idx) => {
                const isHourly = item.unit === 'HRS';
                const isDaily = item.unit === 'DAYS';
                const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0) * (1 - (parseFloat(item.discountPercent) || 0) / 100);

                return (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '1.15rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem',
                      transition: 'border-color var(--transition-fast)',
                    }}
                  >
                    {/* Top row of item */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: showSkuHsn
                          ? 'minmax(220px, 3fr) 110px 110px 110px minmax(100px, 1fr) minmax(110px, 1fr) 80px 40px'
                          : 'minmax(250px, 3fr) 115px minmax(110px, 1fr) minmax(120px, 1fr) 85px 40px',
                        gap: '0.75rem',
                        alignItems: 'flex-end',
                      }}
                    >
                      {/* Product Name / Service Description */}
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                          Product / Service Description *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={isHourly ? 'e.g. TD Project (August 1- August 31, 2026)' : 'e.g. Heavy Duty Hand Tools'}
                          value={item.productName}
                          onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.55rem 0.65rem',
                            backgroundColor: '#0F172A',
                            border: '1px solid var(--border-medium)',
                            borderRadius: 'var(--radius-sm)',
                            color: '#FFFFFF',
                            fontSize: '0.85rem',
                            outline: 'none',
                          }}
                        />
                      </div>

                      {/* Billing Unit Selector */}
                      <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                          Unit / Type
                        </label>
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.55rem 0.45rem',
                            backgroundColor: '#0F172A',
                            border: '1px solid var(--border-medium)',
                            borderRadius: 'var(--radius-sm)',
                            color: isHourly ? 'var(--accent-amber)' : '#FFFFFF',
                            fontWeight: isHourly ? 700 : 400,
                            fontSize: '0.85rem',
                            outline: 'none',
                          }}
                        >
                          <option value="HRS">Hours (Hrs)</option>
                          <option value="PCS">Quantity (Pcs)</option>
                          <option value="DAYS">Days</option>
                          <option value="FLAT">Flat Rate</option>
                          <option value="MO">Months</option>
                          <option value="SET">Sets</option>
                          <option value="BOX">Boxes</option>
                        </select>
                      </div>

                      {/* SKU (if visible) */}
                      {showSkuHsn && (
                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                            SKU
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. N/A"
                            value={item.sku}
                            onChange={(e) => handleItemChange(idx, 'sku', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.55rem 0.65rem',
                              backgroundColor: '#0F172A',
                              border: '1px solid var(--border-medium)',
                              borderRadius: 'var(--radius-sm)',
                              color: '#FFFFFF',
                              fontSize: '0.85rem',
                              outline: 'none',
                            }}
                          />
                        </div>
                      )}

                      {/* HSN Code (if visible) */}
                      {showSkuHsn && (
                        <div>
                          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                            HSN/SAC
                          </label>
                          <input
                            type="text"
                            value={item.hsnCode}
                            onChange={(e) => handleItemChange(idx, 'hsnCode', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.55rem 0.65rem',
                              backgroundColor: '#0F172A',
                              border: '1px solid var(--border-medium)',
                              borderRadius: 'var(--radius-sm)',
                              color: '#FFFFFF',
                              fontSize: '0.85rem',
                              outline: 'none',
                            }}
                          />
                        </div>
                      )}

                      {/* Quantity / Hours Input with Decimal Support */}
                      <div>
                        <label style={{ fontSize: '0.75rem', color: isHourly ? 'var(--accent-amber)' : 'var(--text-muted)', fontWeight: isHourly ? 700 : 400, display: 'block', marginBottom: '0.25rem' }}>
                          {isHourly ? 'Hours *' : isDaily ? 'Days *' : 'Quantity *'}
                        </label>
                        <input
                          type="number"
                          step="any"
                          min="0.001"
                          required
                          placeholder={isHourly ? 'e.g. 112.5' : '1'}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                          style={{
                            width: '100%',
                            padding: '0.55rem 0.65rem',
                            backgroundColor: '#0F172A',
                            border: '1px solid var(--border-medium)',
                            borderRadius: 'var(--radius-sm)',
                            color: '#FFFFFF',
                            fontSize: '0.85rem',
                            outline: 'none',
                          }}
                        />
                      </div>

                      {/* Unit Price / Hourly Rate Input */}
                      <div>
                        <label style={{ fontSize: '0.75rem', color: isHourly ? 'var(--accent-amber)' : 'var(--text-muted)', fontWeight: isHourly ? 700 : 400, display: 'block', marginBottom: '0.25rem' }}>
                          {isHourly ? 'Hourly Rate *' : 'Unit Price *'}
                        </label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{sym}</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            placeholder={isHourly ? '45.00' : '10.00'}
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '0.55rem 0.65rem 0.55rem 1.4rem',
                              backgroundColor: '#0F172A',
                              border: '1px solid var(--border-medium)',
                              borderRadius: 'var(--radius-sm)',
                              color: '#FFFFFF',
                              fontSize: '0.85rem',
                              outline: 'none',
                            }}
                          />
                        </div>
                      </div>

                      {/* Discount % */}
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
                            padding: '0.55rem 0.45rem',
                            backgroundColor: '#0F172A',
                            border: '1px solid var(--border-medium)',
                            borderRadius: 'var(--radius-sm)',
                            color: '#FFFFFF',
                            fontSize: '0.85rem',
                            outline: 'none',
                          }}
                        />
                      </div>

                      {/* Delete button */}
                      <div>
                        <button
                          type="button"
                          disabled={items.length <= 1}
                          onClick={() => handleRemoveItem(idx)}
                          className="btn btn-secondary btn-sm"
                          style={{
                            color: 'var(--accent-rose)',
                            borderColor: 'transparent',
                            padding: '0.55rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: items.length <= 1 ? 0.4 : 1,
                          }}
                          title="Delete Item"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Bottom row of item: Line total preview & optional detailed description */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', borderTop: '1px dashed rgba(255, 255, 255, 0.06)', paddingTop: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>Item #{idx + 1}:</span>
                        <span style={{ color: '#FFFFFF' }}>
                          {item.quantity || 0} {item.unit} @ {sym}{(parseFloat(item.unitPrice) || 0).toFixed(2)}
                          {item.discountPercent > 0 ? ` (${item.discountPercent}% off)` : ''}
                        </span>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--accent-amber)', fontSize: '0.9rem' }}>
                        Line Total: {sym}{lineTotal.toFixed(2)} {currency}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Standalone Live Financial Breakdown */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
              <div
                style={{
                  minWidth: '320px',
                  backgroundColor: 'rgba(15, 23, 42, 0.85)',
                  border: '1px solid var(--border-medium)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  fontSize: '0.875rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Items Subtotal:</span>
                  <strong style={{ color: '#FFFFFF', fontSize: '0.95rem' }}>{sym}{itemsSubtotal.toFixed(2)}</strong>
                </div>

                {/* Additional Discount Input (Optional) */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Global Discount:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value)}
                      style={{
                        padding: '0.2rem 0.35rem',
                        backgroundColor: '#0F172A',
                        border: '1px solid var(--border-medium)',
                        color: '#FFFFFF',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                      }}
                    >
                      <option value="amount">{sym}</option>
                      <option value="percent">%</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      style={{
                        width: '70px',
                        padding: '0.2rem 0.35rem',
                        backgroundColor: '#0F172A',
                        border: '1px solid var(--border-medium)',
                        color: '#FFFFFF',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        textAlign: 'right',
                      }}
                    />
                  </div>
                </div>

                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-emerald)', fontSize: '0.8rem' }}>
                    <span>Discount applied:</span>
                    <span>-{sym}{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                {/* Shipping & Handling (Optional) */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Shipping / Extra:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontSize: '0.8rem' }}>{sym}</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={shippingCharges}
                      onChange={(e) => setShippingCharges(e.target.value)}
                      style={{
                        width: '70px',
                        padding: '0.2rem 0.35rem',
                        backgroundColor: '#0F172A',
                        border: '1px solid var(--border-medium)',
                        color: '#FFFFFF',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                        textAlign: 'right',
                      }}
                    />
                  </div>
                </div>

                {/* Estimated Tax */}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Estimated Tax ({taxRate}%):</span>
                  <strong style={{ color: '#FFFFFF', fontSize: '0.95rem' }}>{sym}{previewTax.toFixed(2)}</strong>
                </div>

                {/* Grand Total */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    borderTop: '1px solid var(--border-medium)',
                    paddingTop: '0.75rem',
                    marginTop: '0.25rem',
                  }}
                >
                  <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF' }}>Grand Total:</span>
                  <span style={{ color: 'var(--accent-amber)', fontSize: '1.35rem', fontWeight: 900 }}>
                    {sym}{previewGrandTotal.toFixed(2)} {currency}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes & Terms & Conditions Card */}
        <div className="glass-card" style={{ padding: '1.75rem', marginBottom: '2.5rem' }}>
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
                placeholder="Payment terms, bank wire instructions, or client greeting"
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
                placeholder="Official warranty, dispute resolution, or return terms"
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

        {/* Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
            style={{ padding: '0.75rem 1.5rem' }}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary"
            style={{
              padding: '0.75rem 2rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1rem',
              fontWeight: 700,
            }}
          >
            {submitting ? (
              <>
                <Receipt size={18} className="animate-spin" />
                <span>{isEdit ? 'Saving Changes...' : 'Issuing Invoice...'}</span>
              </>
            ) : isEdit ? (
              <>
                <Save size={18} />
                <span>Save & Update Invoice</span>
              </>
            ) : (
              <>
                <Receipt size={18} />
                <span>Generate & Issue Invoice</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoicePage;
