const YANDEX_DISK_HOSTS = new Set(['disk.yandex.ru', 'yadi.sk']);
const VK_VIDEO_HOSTS = new Set(['vkvideo.ru', 'vk.com', 'm.vk.com']);

export type PreviewPresentation =
  | { kind: 'none' }
  | { kind: 'embed'; src: string }
  | { kind: 'image'; src: string }
  | { kind: 'link'; href: string };

function safeParseUrl(value: string): URL | null {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function isHttpUrl(value: string): boolean {
  const parsed = safeParseUrl(value);
  return Boolean(parsed && (parsed.protocol === 'http:' || parsed.protocol === 'https:'));
}

function htmlIframeSrc(value: string): string | null {
  return value.match(/src=["']([^"']+)["']/i)?.[1] ?? null;
}

function directImageByExtension(pathname: string): boolean {
  return /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(pathname);
}

export function isYandexDiskPublicAssetUrl(value: string): boolean {
  const parsed = safeParseUrl(value);
  if (!parsed || !YANDEX_DISK_HOSTS.has(parsed.hostname)) return false;
  return /^\/(i|d)\//.test(parsed.pathname);
}

export function getDisplayCoverUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/')) return trimmed;
  if (isYandexDiskPublicAssetUrl(trimmed)) {
    return `/api/materials/external-image?source=${encodeURIComponent(trimmed)}`;
  }
  return trimmed;
}

function parseVkVideoIdentifiers(value: string): { oid: string; id: string } | null {
  const parsed = safeParseUrl(value);
  if (!parsed || !VK_VIDEO_HOSTS.has(parsed.hostname)) return null;

  const joined = `${parsed.pathname}${parsed.search}${parsed.hash}`;
  const match = joined.match(/video(-?\d+)_(\d+)/i);
  if (!match) return null;

  return { oid: match[1], id: match[2] };
}

export function getDisplayPreviewUrl(value: string): string {
  const raw = value.trim();
  if (!raw) return '';

  const iframeSrc = htmlIframeSrc(raw)?.trim();
  const trimmed = (iframeSrc ?? raw).trim();
  if (!trimmed) return '';

  const vkIds = parseVkVideoIdentifiers(trimmed);
  if (vkIds) {
    return `https://vk.com/video_ext.php?oid=${vkIds.oid}&id=${vkIds.id}&hd=2`;
  }

  const parsed = safeParseUrl(trimmed);
  if (parsed?.hostname === 'youtu.be') {
    const videoId = parsed.pathname.replace(/^\/+/, '').split('/')[0];
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }

  if (parsed && /(^|\.)youtube\.com$/i.test(parsed.hostname) && parsed.pathname === '/watch') {
    const videoId = parsed.searchParams.get('v');
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }

  return trimmed;
}

function isEmbeddableUrl(value: string): boolean {
  const parsed = safeParseUrl(value);
  if (!parsed) return false;

  if (/^\/api\/materials\/media\//.test(parsed.pathname)) return false;

  return (
    /(^|\.)youtube\.com$/i.test(parsed.hostname) ||
    parsed.hostname === 'youtu.be' ||
    parsed.hostname === 'vk.com'
  );
}

export function getPreviewPresentation(value: string): PreviewPresentation {
  const href = getDisplayPreviewUrl(value);
  if (!href) return { kind: 'none' };

  if (href.startsWith('/')) {
    if (directImageByExtension(href) || href.includes('/api/materials/external-image')) {
      return { kind: 'image', src: href };
    }
    return { kind: 'link', href };
  }

  const parsed = safeParseUrl(href);
  if (!parsed) return { kind: 'link', href };

  if (isEmbeddableUrl(href)) {
    return { kind: 'embed', src: href };
  }

  if (directImageByExtension(parsed.pathname)) {
    return { kind: 'image', src: href };
  }

  return { kind: 'link', href };
}

export function isDirectImageLikeUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/')) return directImageByExtension(trimmed) || trimmed.includes('/api/materials/external-image');
  if (!isHttpUrl(trimmed)) return false;
  const parsed = safeParseUrl(trimmed);
  return Boolean(parsed && directImageByExtension(parsed.pathname));
}
