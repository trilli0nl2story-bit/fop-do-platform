'use client';

import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { resolveRoute } from '../../src/lib/navigateRoute';

const Register = dynamic(
  () => import('../../src/views/Register').then((m) => ({ default: m.Register })),
  { ssr: false }
);

export function RegistratsiyaClient() {
  const router = useRouter();

  function onNavigate(page: string) {
    router.push(resolveRoute(page));
  }

  function onRegister() {
    // Session cookie is set by the API; onNavigate('dashboard') follows in Register.tsx.
  }

  return <Register onNavigate={onNavigate} onRegister={onRegister} />;
}
