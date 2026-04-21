'use client';

import { useRouter } from 'next/navigation';
import type { StoreProduct } from '../../../src/data/storeProducts';
import { CartProvider } from '../../../src/context/CartContext';
import { PostPurchaseDiscountProvider } from '../../../src/context/PostPurchaseDiscountContext';
import { Header } from '../../../src/components/Header';
import { StoreMaterials } from '../../../src/views/materials/StoreMaterials';
import { resolveRoute } from '../../../src/lib/navigateRoute';
import { useAuthSession } from '../../../src/hooks/useAuthSession';

interface MagazinClientProps {
  initialProducts?: StoreProduct[];
}

export function MagazinClient({ initialProducts = [] }: MagazinClientProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthSession();

  function onNavigate(page: string) {
    router.push(resolveRoute(page));
  }

  return (
    <CartProvider>
      <PostPurchaseDiscountProvider>
        <Header currentPage="store-materials" onNavigate={onNavigate} isAuthenticated={isAuthenticated} />
        <StoreMaterials
          onNavigate={onNavigate}
          isAuthenticated={isAuthenticated}
          initialProducts={initialProducts}
        />
      </PostPurchaseDiscountProvider>
    </CartProvider>
  );
}
