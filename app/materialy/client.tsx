'use client';

import { useRouter } from 'next/navigation';
import { CartProvider } from '../../src/context/CartContext';
import { PostPurchaseDiscountProvider } from '../../src/context/PostPurchaseDiscountContext';
import { Header } from '../../src/components/Header';
import { MaterialsHub } from '../../src/views/materials/MaterialsHub';
import { resolveRoute } from '../../src/lib/navigateRoute';

export function MaterialyClient() {
  const router = useRouter();

  function onNavigate(page: string) {
    router.push(resolveRoute(page));
  }

  return (
    <CartProvider>
      <PostPurchaseDiscountProvider>
        <Header currentPage="materials-hub" onNavigate={onNavigate} isAuthenticated={false} />
        <MaterialsHub onNavigate={onNavigate} />
      </PostPurchaseDiscountProvider>
    </CartProvider>
  );
}
