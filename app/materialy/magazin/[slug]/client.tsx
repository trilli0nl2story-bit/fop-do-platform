'use client';

import { useRouter } from 'next/navigation';
import { CartProvider } from '../../../../src/context/CartContext';
import { PostPurchaseDiscountProvider } from '../../../../src/context/PostPurchaseDiscountContext';
import { Header } from '../../../../src/components/Header';
import { StoreProductDetail } from '../../../../src/views/materials/StoreProductDetail';
import { resolveRoute } from '../../../../src/lib/navigateRoute';

interface ProductDetailClientProps {
  slug: string;
}

export function ProductDetailClient({ slug }: ProductDetailClientProps) {
  const router = useRouter();

  function onNavigate(page: string) {
    router.push(resolveRoute(page));
  }

  return (
    <CartProvider>
      <PostPurchaseDiscountProvider>
        <Header currentPage="store-materials" onNavigate={onNavigate} isAuthenticated={false} />
        <StoreProductDetail slug={slug} onNavigate={onNavigate} isAuthenticated={false} />
      </PostPurchaseDiscountProvider>
    </CartProvider>
  );
}
