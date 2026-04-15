'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { CartProvider } from '../src/context/CartContext';
import { PostPurchaseDiscountProvider } from '../src/context/PostPurchaseDiscountContext';
import { Header } from '../src/components/Header';
import { resolveRoute } from '../src/lib/navigateRoute';
import { useAuthSession } from '../src/hooks/useAuthSession';

const Landing = dynamic(
  () => import('../src/views/Landing').then((m) => ({ default: m.Landing })),
  { ssr: false }
);

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthSession();

  function onNavigate(page: string) {
    router.push(resolveRoute(page));
  }

  return (
    <CartProvider>
      <PostPurchaseDiscountProvider>
        <Header
          currentPage="landing"
          onNavigate={onNavigate}
          isAuthenticated={isAuthenticated}
        />
        <Landing onNavigate={onNavigate} isAuthenticated={isAuthenticated} />
      </PostPurchaseDiscountProvider>
    </CartProvider>
  );
}
