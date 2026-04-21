'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CartProvider } from '../../../src/context/CartContext';
import { PostPurchaseDiscountProvider } from '../../../src/context/PostPurchaseDiscountContext';
import { Header } from '../../../src/components/Header';
import { SubscriptionMaterials } from '../../../src/views/materials/SubscriptionMaterials';
import { resolveRoute } from '../../../src/lib/navigateRoute';
import { useAuthSession } from '../../../src/hooks/useAuthSession';

export function PodpiskaClient() {
  const router = useRouter();
  const { isAuthenticated } = useAuthSession();
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setHasSubscription(false);
      return;
    }

    fetch('/api/account/summary', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data) => {
        const active = data?.subscription?.status === 'active';
        setHasSubscription(active);
      })
      .catch(() => setHasSubscription(false));
  }, [isAuthenticated]);

  function onNavigate(page: string) {
    router.push(resolveRoute(page));
  }

  return (
    <CartProvider>
      <PostPurchaseDiscountProvider>
        <Header currentPage="subscription-materials" onNavigate={onNavigate} isAuthenticated={isAuthenticated} />
        <SubscriptionMaterials onNavigate={onNavigate} hasSubscription={hasSubscription} isAuthenticated={isAuthenticated} />
      </PostPurchaseDiscountProvider>
    </CartProvider>
  );
}
