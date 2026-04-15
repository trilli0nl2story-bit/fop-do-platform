/**
 * Maps legacy page-name strings (used by onNavigate) to Next.js URL paths.
 * Only covers the public materials routes wired in this step;
 * everything else falls back to '/' until later migration steps.
 */
export function resolveRoute(page: string): string {
  if (page === 'landing') return '/';
  if (page === 'materials-hub' || page.startsWith('materials-hub/')) return '/materialy';
  if (page === 'free-materials') return '/materialy/besplatno';
  if (page === 'subscription-materials') return '/materialy/podpiska';
  if (page === 'store-materials') return '/materialy/magazin';
  // Not yet migrated — stay on landing for now
  return '/';
}
