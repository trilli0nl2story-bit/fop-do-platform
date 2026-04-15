'use client';

import { useRouter } from 'next/navigation';
import { CartProvider } from '../../src/context/CartContext';
import { PostPurchaseDiscountProvider } from '../../src/context/PostPurchaseDiscountContext';
import { Header } from '../../src/components/Header';
import { resolveRoute } from '../../src/lib/navigateRoute';
import { Offer } from '../../src/views/legal/Offer';
import { Privacy } from '../../src/views/legal/Privacy';
import { Terms } from '../../src/views/legal/Terms';
import { Consent } from '../../src/views/legal/Consent';
import { Refund } from '../../src/views/legal/Refund';
import { Authors } from '../../src/views/legal/Authors';

const VIEWS: Record<string, React.ComponentType<{ onNavigate: (p: string) => void }>> = {
  oferta: Offer,
  konfidentsialnost: Privacy,
  usloviya: Terms,
  soglasie: Consent,
  vozvrat: Refund,
  avtory: Authors,
};

interface LegalClientWrapperProps {
  slug: string;
}

export function LegalClientWrapper({ slug }: LegalClientWrapperProps) {
  const router = useRouter();

  function onNavigate(page: string) {
    router.push(resolveRoute(page));
  }

  const View = VIEWS[slug];
  if (!View) return null;

  return (
    <CartProvider>
      <PostPurchaseDiscountProvider>
        <Header currentPage="legal" onNavigate={onNavigate} isAuthenticated={false} />
        <View onNavigate={onNavigate} />
      </PostPurchaseDiscountProvider>
    </CartProvider>
  );
}
