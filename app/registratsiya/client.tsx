'use client';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { resolveRoute } from '../../src/lib/navigateRoute';
import { useAuthSession } from '../../src/hooks/useAuthSession';

const Register = dynamic(
  () => import('../../src/views/Register').then((m) => ({ default: m.Register })),
  { ssr: false }
);

export function RegistratsiyaClient() {
  const router = useRouter();
  const { refresh } = useAuthSession();

  function onNavigate(page: string) {
    router.push(resolveRoute(page));
  }

  function onRegister() {
    // Session cookie is set by the API. Refresh session state; navigation
    // to 'dashboard' follows via onNavigate('dashboard') in Register.tsx.
    refresh();
  }

  return <Register onNavigate={onNavigate} onRegister={onRegister} />;
}
