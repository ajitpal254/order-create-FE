import React, { createContext, useContext, useState, useEffect } from 'react';
import { orderApi } from '../api/client';

const OrderContext = createContext(null);

export const OrderProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('hao_order_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [orderMetadata, setOrderMetadata] = useState({
    shippingMarks: 'H.A. OVERSEAS / ORDER LOT\nPORT OF DISCHARGE: BUYER PORT\nFRAGILE / HANDLE WITH CARE',
    specialInstructions: 'Export seaworthy 7-ply corrugated cartons with inner water-proof plastic barrier.',
    customerOverride: null,
  });

  useEffect(() => {
    localStorage.setItem('hao_order_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addItem = (item) => {
    setCartItems((prev) => {
      // Look for identical variant
      const existingIndex = prev.findIndex(
        (i) =>
          i.product === item.product &&
          i.size === item.size &&
          i.finish === item.finish &&
          i.color === item.color &&
          i.brand === item.brand &&
          i.packaging === item.packaging
      );

      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += Number(item.quantity);
        updated[existingIndex].totalPrice =
          updated[existingIndex].quantity * updated[existingIndex].unitPrice;
        return updated;
      } else {
        const unitPrice = Number(item.unitPrice) || 0;
        const qty = Number(item.quantity) || 1;
        return [
          ...prev,
          {
            ...item,
            quantity: qty,
            unitPrice: unitPrice,
            totalPrice: parseFloat((qty * unitPrice).toFixed(2)),
          },
        ];
      }
    });
  };

  const updateItem = (index, updates) => {
    setCartItems((prev) => {
      const updated = [...prev];
      const current = updated[index];
      if (!current) return prev;

      const newQty = updates.quantity !== undefined ? Number(updates.quantity) : current.quantity;
      const unitPrice = current.unitPrice || 0;

      updated[index] = {
        ...current,
        ...updates,
        quantity: newQty,
        totalPrice: parseFloat((newQty * unitPrice).toFixed(2)),
      };
      return updated;
    });
  };

  const removeItem = (index) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('hao_order_cart');
  };

  // Compute live totals
  const totals = cartItems.reduce(
    (acc, item) => {
      const qty = Number(item.quantity) || 0;
      const price = Number(item.unitPrice) || 0;
      const weight = Number(item.weightKg) || 1.0;
      const perCtn = Number(item.pcsPerCarton) || 20;

      acc.totalQuantity += qty;
      acc.totalAmount += qty * price;
      acc.estimatedWeightKg += qty * weight;
      acc.estimatedCartons += Math.ceil(qty / perCtn);
      return acc;
    },
    { totalQuantity: 0, totalAmount: 0, estimatedWeightKg: 0, estimatedCartons: 0 }
  );

  totals.totalAmount = parseFloat(totals.totalAmount.toFixed(2));
  totals.estimatedWeightKg = parseFloat(totals.estimatedWeightKg.toFixed(2));

  const submitOrder = async () => {
    if (cartItems.length === 0) {
      throw new Error('Order sheet is empty. Please add products first.');
    }

    const payload = {
      items: cartItems,
      shippingMarks: orderMetadata.shippingMarks,
      specialInstructions: orderMetadata.specialInstructions,
      customerDetailsOverride: orderMetadata.customerOverride,
    };

    const res = await orderApi.createOrder(payload);
    if (res.success) {
      clearCart();
      return res;
    }
    throw new Error(res.message || 'Failed to submit order');
  };

  return (
    <OrderContext.Provider
      value={{
        cartItems,
        orderMetadata,
        setOrderMetadata,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        totals,
        submitOrder,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};
