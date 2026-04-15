'use client';

import { useRouter } from 'next/navigation';
import { CartProvider } from '../../../src/context/CartContext';
import { PostPurchaseDiscountProvider } from '../../../src/context/PostPurchaseDiscountContext';
import { Header } from '../../../src/components/Header';
import { FreeMaterials } from '../../../src/views/materials/FreeMaterials';
import { resolveRoute } from '../../../src/lib/navigateRoute';

export function BesplatnoClient() {
  const router = useRouter();

  function onNavigate(page: string) {
    router.push(resolveRoute(page));
  }

  return (
    <CartProvider>
      <PostPurchaseDiscountProvider>
        <Header currentPage="free-materials" onNavigate={onNavigate} isAuthenticated={false} />
        <FreeMaterials onNavigate={onNavigate} isAuthenticated={false} />
      </PostPurchaseDiscountProvider>
    </CartProvider>
  );
}
