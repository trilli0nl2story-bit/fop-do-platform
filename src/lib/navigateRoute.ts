/**
 * Maps legacy page-name strings (used by onNavigate) to Next.js URL paths.
 */
export function resolveRoute(page: string): string {
  if (page === 'landing') return '/';
  if (page === 'login') return '/vhod';
  if (page === 'register') return '/registratsiya';
  if (page === 'forgot-password') return '/vosstanovlenie-parolya';
  if (page === 'library') return '/materialy';
  if (page === 'answer-base') return '/molodoy-specialist';
  if (page === 'dashboard') return '/kabinet';
  if (page === 'profile') return '/profil';
  if (page === 'cart') return '/korzina';
  if (page === 'subscription') return '/podpiska';
  if (page === 'assistant') return '/pomoshchnik';
  if (page === 'my-materials') return '/moi-materialy';
  if (page === 'my-documents') return '/moi-materialy';
  if (page === 'young-specialist') return '/molodoy-specialist';
  if (page === 'request-document') return '/zakazat-dokument';
  if (page === 'become-author') return '/stat-avtorom';
  if (page === 'legal') return '/legal';
  if (page === 'offer') return '/legal/oferta';
  if (page === 'privacy') return '/legal/konfidentsialnost';
  if (page === 'terms') return '/legal/usloviya';
  if (page === 'consent') return '/legal/soglasie';
  if (page === 'refund') return '/legal/vozvrat';
  if (page === 'authors') return '/legal/avtory';
  if (page === 'privacy-policy') return '/legal/privacy-policy';
  if (page === 'personal-data-consent') return '/legal/personal-data-consent';
  if (page === 'marketing-consent') return '/legal/marketing-consent';
  if (page === 'materials-hub' || page.startsWith('materials-hub/')) return '/materialy';
  if (page === 'free-materials') return '/materialy/besplatno';
  if (page === 'subscription-materials') return '/materialy/podpiska';
  if (page === 'subscription-contents') return '/materialy/podpiska';
  if (page === 'store-materials') return '/materialy/magazin';
  if (page.startsWith('store/')) return `/materialy/magazin/${page.slice('store/'.length)}`;
  // Not yet migrated — stay on landing for now
  return '/';
}
