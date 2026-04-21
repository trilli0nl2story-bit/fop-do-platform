'use client';

import { useRouter } from 'next/navigation';
import { CartProvider } from '../../../../src/context/CartContext';
import { PostPurchaseDiscountProvider } from '../../../../src/context/PostPurchaseDiscountContext';
import { Header } from '../../../../src/components/Header';
import { StoreProductDetail } from '../../../../src/views/materials/StoreProductDetail';
import { resolveRoute } from '../../../../src/lib/navigateRoute';
import type { StoreProduct } from '../../../../src/data/storeProducts';
import { useAuthSession } from '../../../../src/hooks/useAuthSession';

interface ProductDetailClientProps {
  slug: string;
  initialProduct?: StoreProduct | null;
}

export function ProductDetailClient({ slug, initialProduct = null }: ProductDetailClientProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthSession();

  function onNavigate(page: string) {
    router.push(resolveRoute(page));
  }

  return (
    <CartProvider>
      <PostPurchaseDiscountProvider>
        <Header currentPage="store-materials" onNavigate={onNavigate} isAuthenticated={isAuthenticated} />
        <StoreProductDetail
          slug={slug}
          onNavigate={onNavigate}
          isAuthenticated={isAuthenticated}
          initialProduct={initialProduct}
        />
      </PostPurchaseDiscountProvider>
    </CartProvider>
  );
}
