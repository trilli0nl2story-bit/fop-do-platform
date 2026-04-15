'use client';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { resolveRoute } from '../../src/lib/navigateRoute';

const Login = dynamic(
  () => import('../../src/views/Login').then((m) => ({ default: m.Login })),
  { ssr: false }
);

export function VhodClient() {
  const router = useRouter();

  function onNavigate(page: string) {
    router.push(resolveRoute(page));
  }

  function onLogin() {
    // Session cookie is set by the API; navigate to dashboard.
    // Dashboard migrated to /materialy temporarily.
    router.push(resolveRoute('dashboard'));
  }

  return <Login onNavigate={onNavigate} onLogin={onLogin} />;
}
