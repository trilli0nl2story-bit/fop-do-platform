'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { CartProvider } from '../src/context/CartContext';
import { PostPurchaseDiscountProvider } from '../src/context/PostPurchaseDiscountContext';
import { Header } from '../src/components/Header';
import { resolveRoute } from '../src/lib/navigateRoute';

const Landing = dynamic(
  () => import('../src/views/Landing').then((m) => ({ default: m.Landing })),
  { ssr: false }
);

export default function HomePage() {
  const router = useRouter();

  function onNavigate(page: string) {
    router.push(resolveRoute(page));
  }

  return (
    <CartProvider>
      <PostPurchaseDiscountProvider>
        <Header
          currentPage="landing"
          onNavigate={onNavigate}
          isAuthenticated={false}
        />
        <Landing onNavigate={onNavigate} isAuthenticated={false} />
      </PostPurchaseDiscountProvider>
    </CartProvider>
  );
}
