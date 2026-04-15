'use client';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { resolveRoute } from '../../src/lib/navigateRoute';
import { useAuthSession } from '../../src/hooks/useAuthSession';

const Login = dynamic(
  () => import('../../src/views/Login').then((m) => ({ default: m.Login })),
  { ssr: false }
);

export function VhodClient() {
  const router = useRouter();
  const { refresh } = useAuthSession();

  function onNavigate(page: string) {
    router.push(resolveRoute(page));
  }

  function onLogin() {
    // Session cookie is set by the API. Refresh session state then navigate.
    refresh();
    router.push(resolveRoute('dashboard'));
  }

  return <Login onNavigate={onNavigate} onLogin={onLogin} />;
}
