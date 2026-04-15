/**
 * Maps legacy page-name strings (used by onNavigate) to Next.js URL paths.
 */
export function resolveRoute(page: string): string {
  if (page === 'landing') return '/';
  if (page === 'materials-hub' || page.startsWith('materials-hub/')) return '/materialy';
  if (page === 'free-materials') return '/materialy/besplatno';
  if (page === 'subscription-materials') return '/materialy/podpiska';
  if (page === 'store-materials') return '/materialy/magazin';
  if (page.startsWith('store/')) return `/materialy/magazin/${page.slice('store/'.length)}`;
  // Not yet migrated — stay on landing for now
  return '/';
}
