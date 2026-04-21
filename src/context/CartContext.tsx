import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';

const CART_STORAGE_KEY = 'mkp_cart_items_v2';
const REFERRAL_STORAGE_KEY = 'mkp_cart_referral_code_v1';

export interface CartItem {
  id: number;
  slug?: string;
  materialId?: string;
  title: string;
  category: string;
  price: number;
  fileType: 'PDF' | 'DOCX' | 'PPT' | 'PPTX';
}

export interface CartQuoteItem {
  materialId: string | null;
  slug: string;
  title: string;
  shortDescription: string;
  category: string;
  fileType: 'PDF' | 'DOCX' | 'PPT' | 'PPTX';
  unitPriceRubles: number;
  finalPriceRubles: number;
  discountAmountRubles: number;
  available: boolean;
  reason: 'ok' | 'not_found' | 'not_store' | 'not_published';
}

export interface CartQuoteDiscount {
  code: 'subscription' | 'referral';
  label: string;
  requestedPercent: number;
  appliedPercent: number;
  amountRubles: number;
}

export interface CartQuote {
  items: CartQuoteItem[];
  subtotalRubles: number;
  totalRubles: number;
  totalDiscountRubles: number;
  totalDiscountPercent: number;
  maxDiscountPercent: number;
  discounts: CartQuoteDiscount[];
  subscriptionActive: boolean;
  referral: {
    code: string | null;
    applied: boolean;
    requestedPercent: number;
    message: string | null;
  };
  checkoutReady: boolean;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: number) => void;
  clearCart: () => void;
  quote: CartQuote | null;
  quoteLoading: boolean;
  quoteError: string | null;
  refreshQuote: () => Promise<void>;
  referralCode: string;
  setReferralCode: (code: string) => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
  quote: null,
  quoteLoading: false,
  quoteError: null,
  refreshQuote: async () => {},
  referralCode: '',
  setReferralCode: () => {},
  total: 0,
  count: 0,
});

function loadCartItems(): CartItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCartItems(items: CartItem[]): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage errors
  }
}

function loadReferralCode(): string {
  if (typeof window === 'undefined') return '';

  try {
    return window.localStorage.getItem(REFERRAL_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

function saveReferralCode(code: string): void {
  if (typeof window === 'undefined') return;

  try {
    const normalized = code.trim();
    if (normalized) {
      window.localStorage.setItem(REFERRAL_STORAGE_KEY, normalized);
    } else {
      window.localStorage.removeItem(REFERRAL_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadCartItems());
  const [referralCode, setReferralCodeState] = useState<string>(() => loadReferralCode());
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  useEffect(() => {
    saveCartItems(items);
  }, [items]);

  useEffect(() => {
    saveReferralCode(referralCode);
  }, [referralCode]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const ref = url.searchParams.get('ref');
    if (ref && ref.trim()) {
      setReferralCodeState(ref.trim());
    }
  }, []);

  const fetchQuote = useMemo(() => {
    return async () => {
      const quoteItems = items
        .map((item) => ({ slug: item.slug?.trim() ?? '' }))
        .filter((item) => item.slug.length > 0);

      if (quoteItems.length === 0) {
        setQuote(null);
        setQuoteError(null);
        setQuoteLoading(false);
        return;
      }

      setQuoteLoading(true);
      setQuoteError(null);

      try {
        const res = await fetch('/api/cart/quote', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: quoteItems,
            referralCode: referralCode.trim() || null,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.quote) {
          throw new Error(data?.message || 'Не удалось получить расчёт корзины.');
        }

        setQuote(data.quote as CartQuote);
      } catch (error) {
        setQuote(null);
        setQuoteError(
          error instanceof Error
            ? error.message
            : 'Не удалось пересчитать корзину. Попробуйте ещё раз.'
        );
      } finally {
        setQuoteLoading(false);
      }
    };
  }, [items, referralCode]);

  useEffect(() => {
    void fetchQuote();
  }, [fetchQuote]);

  const addItem = (item: CartItem) => {
    setItems((prev) => {
      const exists = prev.some((current) => {
        if (item.slug && current.slug) {
          return current.slug === item.slug;
        }
        return current.id === item.id;
      });

      return exists ? prev : [...prev, item];
    });
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
    setQuote(null);
  };

  const total = quote?.totalRubles ?? items.reduce((sum, item) => sum + item.price, 0);
  const count = items.length;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearCart,
        quote,
        quoteLoading,
        quoteError,
        refreshQuote: fetchQuote,
        referralCode,
        setReferralCode: setReferralCodeState,
        total,
        count,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
