import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface PostPurchaseDiscount {
  discountAmount: number;
  orderTotal: number;
  expiresAt: Date;
  used: boolean;
}

interface PostPurchaseDiscountContextType {
  discount: PostPurchaseDiscount | null;
  grantDiscount: (orderTotal: number) => void;
  applyDiscount: () => void;
  hoursRemaining: number | null;
}

const PostPurchaseDiscountContext = createContext<PostPurchaseDiscountContextType>({
  discount: null,
  grantDiscount: () => {},
  applyDiscount: () => {},
  hoursRemaining: null,
});

const STORAGE_KEY = 'post_purchase_discount';

function loadFromStorage(): PostPurchaseDiscount | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { ...parsed, expiresAt: new Date(parsed.expiresAt) };
  } catch {
    return null;
  }
}

function saveToStorage(discount: PostPurchaseDiscount | null) {
  if (discount) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(discount));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function PostPurchaseDiscountProvider({ children }: { children: ReactNode }) {
  const [discount, setDiscount] = useState<PostPurchaseDiscount | null>(() => {
    const stored = loadFromStorage();
    if (!stored) return null;
    if (stored.used || new Date() >= stored.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return stored;
  });

  const [hoursRemaining, setHoursRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!discount) {
      setHoursRemaining(null);
      return;
    }
    const update = () => {
      const now = new Date();
      if (now >= discount.expiresAt || discount.used) {
        setDiscount(null);
        saveToStorage(null);
        setHoursRemaining(null);
        return;
      }
      const ms = discount.expiresAt.getTime() - now.getTime();
      setHoursRemaining(Math.ceil(ms / (1000 * 60 * 60)));
    };
    update();
    const interval = setInterval(update, 60 * 1000);
    return () => clearInterval(interval);
  }, [discount]);

  const grantDiscount = (orderTotal: number) => {
    const discountAmount = Math.round(orderTotal * 0.1);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const next: PostPurchaseDiscount = { discountAmount, orderTotal, expiresAt, used: false };
    setDiscount(next);
    saveToStorage(next);
  };

  const applyDiscount = () => {
    if (!discount) return;
    const updated = { ...discount, used: true };
    setDiscount(updated);
    saveToStorage(updated);
  };

  return (
    <PostPurchaseDiscountContext.Provider value={{ discount, grantDiscount, applyDiscount, hoursRemaining }}>
      {children}
    </PostPurchaseDiscountContext.Provider>
  );
}

export function usePostPurchaseDiscount() {
  return useContext(PostPurchaseDiscountContext);
}
