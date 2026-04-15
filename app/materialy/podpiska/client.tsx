'use client';

import { useRouter } from 'next/navigation';
import { CartProvider } from '../../../src/context/CartContext';
import { PostPurchaseDiscountProvider } from '../../../src/context/PostPurchaseDiscountContext';
import { Header } from '../../../src/components/Header';
import { SubscriptionMaterials } from '../../../src/views/materials/SubscriptionMaterials';
import { resolveRoute } from '../../../src/lib/navigateRoute';

export function PodpiskaClient() {
  const router = useRouter();

  function onNavigate(page: string) {
    router.push(resolveRoute(page));
  }

  return (
    <CartProvider>
      <PostPurchaseDiscountProvider>
        <Header currentPage="subscription-materials" onNavigate={onNavigate} isAuthenticated={false} />
        <SubscriptionMaterials onNavigate={onNavigate} hasSubscription={false} isAuthenticated={false} />
      </PostPurchaseDiscountProvider>
    </CartProvider>
  );
}
