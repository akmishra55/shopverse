
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartCtx = createContext(null);
export const useCart = () => useContext(CartCtx);

const FREE_SHIPPING = 999, SHIPPING_FEE = 49;

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem('sv_cart') || '[]'));

  useEffect(() => {
    localStorage.setItem('sv_cart', JSON.stringify(items));
  }, [items]);

  const add = (product, qty = 1) =>
    setItems((prev) => {
      const found = prev.find((i) => i._id === product._id);
      return found
        ? prev.map((i) => (i._id === product._id ? { ...i, qty: Math.min(10, i.qty + qty) } : i))
        : [...prev, { _id: product._id, name: product.name, price: product.price, image: product.images?.[0], qty }];
    });

  const setQty = (id, qty) =>
    setItems((prev) =>
      qty <= 0 ? prev.filter((i) => i._id !== id) : prev.map((i) => (i._id === id ? { ...i, qty } : i))
    );

  const clear = () => setItems([]);

  const { count, subtotal, shipping, total } = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    return {
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal,
      shipping: subtotal === 0 || subtotal >= FREE_SHIPPING ? 0 : SHIPPING_FEE,
      total: subtotal + (subtotal === 0 || subtotal >= FREE_SHIPPING ? 0 : SHIPPING_FEE),
    };
  }, [items]);

  return (
    <CartCtx.Provider value={{ items, add, setQty, clear, count, subtotal, shipping, total }}>
      {children}
    </CartCtx.Provider>
  );
}
