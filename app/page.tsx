'use client';

/**
 * TEMPORARY – first migration step.
 *
 * This page renders the existing Landing component with:
 *  - A stub `onNavigate` (full URL routing wired in next step)
 *  - CartProvider + PostPurchaseDiscountProvider wrapped here
 *  - Landing loaded dynamically (ssr: false) to avoid hydration mismatches
 *    caused by Math.random() inside SocialProofToast.
 *    Full SSG metadata + server rendering comes in a later migration step.
 */

import dynamic from 'next/dynamic';
import { CartProvider } from '../src/context/CartContext';
import { PostPurchaseDiscountProvider } from '../src/context/PostPurchaseDiscountContext';
import { Header } from '../src/components/Header';

// Load Landing client-only: SocialProofToast uses Math.random() which
// causes SSR/client hydration mismatches. SSG will be added in a later step.
const Landing = dynamic(
  () => import('../src/views/Landing').then((m) => ({ default: m.Landing })),
  { ssr: false }
);

function stubNavigate(page: string) {
  // Navigation stub — full Next.js routing will replace this in the next step.
  console.log('[nav stub] navigate to:', page);
}

export default function HomePage() {
  return (
    <CartProvider>
      <PostPurchaseDiscountProvider>
        <Header
          currentPage="landing"
          onNavigate={stubNavigate}
          isAuthenticated={false}
        />
        <Landing onNavigate={stubNavigate} isAuthenticated={false} />
      </PostPurchaseDiscountProvider>
    </CartProvider>
  );
}
