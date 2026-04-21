'use client';

import { useRouter } from 'next/navigation';
import { CartProvider } from '../../src/context/CartContext';
import { PostPurchaseDiscountProvider } from '../../src/context/PostPurchaseDiscountContext';
import { Header } from '../../src/components/Header';
import { Cart } from '../../src/views/Cart';
import { resolveRoute } from '../../src/lib/navigateRoute';
import { useAuthSession } from '../../src/hooks/useAuthSession';

export function KorzinaClient() {
  const router = useRouter();
  const { isAuthenticated } = useAuthSession();

  function onNavigate(page: string) {
    router.push(resolveRoute(page));
  }

  return (
    <CartProvider>
      <PostPurchaseDiscountProvider>
        <Header currentPage="cart" onNavigate={onNavigate} isAuthenticated={isAuthenticated} />
        <Cart onNavigate={onNavigate} isAuthenticated={isAuthenticated} />
      </PostPurchaseDiscountProvider>
    </CartProvider>
  );
}
