export function getAppOrigin(requestOrigin?: string): string {
  const configured =
    process.env.APP_ORIGIN ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL;

  if (configured) {
    return configured.replace(/\/+$/, '');
  }

  if (requestOrigin) {
    return requestOrigin.replace(/\/+$/, '');
  }

  return 'http://localhost:5000';
}
