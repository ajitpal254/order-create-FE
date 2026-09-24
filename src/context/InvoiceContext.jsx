import React, { createContext, useContext, useReducer, useMemo } from 'react';

const InvoiceContext = createContext(null);

const initialInvoiceState = {
  customInvoiceNumber: '',
  docType: 'standard_invoice', // 'commercial_invoice' | 'standard_invoice' | 'gst_invoice' | 'proforma_invoice' | 'eway_bill'
  currency: 'CAD',
  taxRate: 13,
  isCustomTax: false,
  invoiceDate: new Date().toISOString().split('T')[0],
  dueDate: '',
  discountType: 'amount', // 'amount' | 'percent'
  discountValue: 0,
  shippingCharges: 0,
  notes: 'Payment is due within 30 days of invoice date.',
  termsAndConditions: '1. Payment as per agreed terms.\n2. Goods/services rendered are subject to standard warranty.',
  showSkuHsn: false,
  showCustomSender: false,
  sender: {
    companyName: '',
    address: '',
    phoneNumber: '',
    email: '',
    gstin: '',
    pan: '',
    iecNo: '',
  },
  customer: {
    customerName: '',
    businessName: '',
    email: '',
    phoneNumber: '',
    address: '',
    country: 'Canada',
    taxId: '',
    stateCode: '',
  },
  items: [
    {
      id: '1',
      productName: '',
      sku: '',
      description: '',
      hsnCode: '8205.59',
      unit: 'HRS', // 'HRS' | 'PCS' | 'DAYS' | 'FLAT' | 'SET' | 'BOX'
      quantity: 1,
      unitPrice: 0,
      discountPercent: 0,
      taxRate: 13,
    },
  ],
};

function invoiceReducer(state, action) {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };

    case 'SET_CUSTOMER':
      return { ...state, customer: { ...state.customer, [action.field]: action.value } };

    case 'SET_ALL_CUSTOMER':
      return { ...state, customer: { ...state.customer, ...action.payload } };

    case 'SET_SENDER':
      return { ...state, sender: { ...state.sender, [action.field]: action.value } };

    case 'SET_ALL_SENDER':
      return { ...state, sender: { ...state.sender, ...action.payload } };

    case 'ADD_ITEM': {
      const newItem = {
        id: Date.now().toString(),
        productName: '',
        sku: '',
        description: '',
        hsnCode: '8205.59',
        unit: action.unit || state.items[0]?.unit || 'HRS',
        quantity: action.unit === 'HRS' ? 1 : 1,
        unitPrice: 0,
        discountPercent: 0,
        taxRate: state.taxRate,
      };
      return { ...state, items: [...state.items, newItem] };
    }

    case 'UPDATE_ITEM': {
      const updatedItems = state.items.map((item, idx) => {
        if (idx === action.index) {
          return { ...item, [action.field]: action.value };
        }
        return item;
      });
      return { ...state, items: updatedItems };
    }

    case 'REMOVE_ITEM': {
      if (state.items.length <= 1) return state;
      return { ...state, items: state.items.filter((_, idx) => idx !== action.index) };
    }

    case 'SET_ALL_UNITS': {
      return {
        ...state,
        items: state.items.map((it) => ({ ...it, unit: action.unit })),
      };
    }

    case 'SET_TAX_RATE': {
      return {
        ...state,
        taxRate: action.rate,
        isCustomTax: action.isCustom || false,
        items: state.items.map((it) => ({ ...it, taxRate: action.rate })),
      };
    }

    case 'LOAD_TEMPLATE': {
      return {
        ...state,
        ...action.payload,
      };
    }

    case 'RESET_INVOICE':
      return { ...initialInvoiceState };

    default:
      return state;
  }
}

export const InvoiceProvider = ({ children }) => {
  const [state, dispatch] = useReducer(invoiceReducer, initialInvoiceState);

  // Financial calculations
  const totals = useMemo(() => {
    const subtotal = state.items.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const disc = parseFloat(item.discountPercent) || 0;
      const base = qty * price;
      const discounted = base - (base * disc) / 100;
      return sum + discounted;
    }, 0);

    let discountAmount = 0;
    if (state.discountValue > 0) {
      if (state.discountType === 'percent') {
        discountAmount = (subtotal * parseFloat(state.discountValue)) / 100;
      } else {
        discountAmount = parseFloat(state.discountValue) || 0;
      }
    }

    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = (taxableAmount * (parseFloat(state.taxRate) || 0)) / 100;
    const shipping = parseFloat(state.shippingCharges) || 0;
    const grandTotal = taxableAmount + taxAmount + shipping;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      taxableAmount: Math.round(taxableAmount * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      shippingCharges: shipping,
      grandTotal: Math.round(grandTotal * 100) / 100,
    };
  }, [state.items, state.discountType, state.discountValue, state.taxRate, state.shippingCharges]);

  // Action Dispatchers
  const actions = useMemo(
    () => ({
      setField: (field, value) => dispatch({ type: 'SET_FIELD', field, value }),
      setCustomer: (field, value) => dispatch({ type: 'SET_CUSTOMER', field, value }),
      setAllCustomer: (payload) => dispatch({ type: 'SET_ALL_CUSTOMER', payload }),
      setSender: (field, value) => dispatch({ type: 'SET_SENDER', field, value }),
      setAllSender: (payload) => dispatch({ type: 'SET_ALL_SENDER', payload }),
      addItem: (unit) => dispatch({ type: 'ADD_ITEM', unit }),
      updateItem: (index, field, value) => dispatch({ type: 'UPDATE_ITEM', index, field, value }),
      removeItem: (index) => dispatch({ type: 'REMOVE_ITEM', index }),
      setAllUnits: (unit) => dispatch({ type: 'SET_ALL_UNITS', unit }),
      setTaxRate: (rate, isCustom) => dispatch({ type: 'SET_TAX_RATE', rate, isCustom }),
      loadTemplate: (payload) => dispatch({ type: 'LOAD_TEMPLATE', payload }),
      resetInvoice: () => dispatch({ type: 'RESET_INVOICE' }),
    }),
    []
  );

  return (
    <InvoiceContext.Provider value={{ state, totals, actions }}>
      {children}
    </InvoiceContext.Provider>
  );
};

export const useInvoice = () => {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoice must be used within an InvoiceProvider');
  }
  return context;
};
