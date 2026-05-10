export const LEGAL_DOCUMENT_VERSION = 'draft-2026-05';
export const LEGAL_DOCUMENT_UPDATED_AT = '2026-05-10';

export type LegalDocumentSlug =
  | 'privacy-policy'
  | 'personal-data-consent'
  | 'marketing-consent'
  | 'terms'
  | 'offer'
  | 'subscription'
  | 'refund'
  | 'ai-rules'
  | 'referral'
  | 'review-consent'
  | 'author-agreement'
  | 'copyright'
  | 'personal-data-requests';

export interface LegalDocumentConfig {
  slug: LegalDocumentSlug;
  title: string;
  route: string;
  version: string;
  updatedAt: string;
  documentHash: string | null;
}

export const legalDocuments: LegalDocumentConfig[] = [
  {
    slug: 'privacy-policy',
    title: 'Политика обработки персональных данных',
    route: '/legal/privacy-policy',
    version: LEGAL_DOCUMENT_VERSION,
    updatedAt: LEGAL_DOCUMENT_UPDATED_AT,
    documentHash: null,
  },
  {
    slug: 'personal-data-consent',
    title: 'Согласие на обработку персональных данных',
    route: '/legal/personal-data-consent',
    version: LEGAL_DOCUMENT_VERSION,
    updatedAt: LEGAL_DOCUMENT_UPDATED_AT,
    documentHash: null,
  },
  {
    slug: 'marketing-consent',
    title: 'Согласие на рассылку',
    route: '/legal/marketing-consent',
    version: LEGAL_DOCUMENT_VERSION,
    updatedAt: LEGAL_DOCUMENT_UPDATED_AT,
    documentHash: null,
  },
  {
    slug: 'terms',
    title: 'Пользовательское соглашение',
    route: '/legal/terms',
    version: LEGAL_DOCUMENT_VERSION,
    updatedAt: LEGAL_DOCUMENT_UPDATED_AT,
    documentHash: null,
  },
  {
    slug: 'offer',
    title: 'Публичная оферта',
    route: '/legal/offer',
    version: LEGAL_DOCUMENT_VERSION,
    updatedAt: LEGAL_DOCUMENT_UPDATED_AT,
    documentHash: null,
  },
  {
    slug: 'subscription',
    title: 'Условия подписки и продления доступа',
    route: '/legal/subscription',
    version: LEGAL_DOCUMENT_VERSION,
    updatedAt: LEGAL_DOCUMENT_UPDATED_AT,
    documentHash: null,
  },
  {
    slug: 'refund',
    title: 'Возврат и отмена доступа',
    route: '/legal/refund',
    version: LEGAL_DOCUMENT_VERSION,
    updatedAt: LEGAL_DOCUMENT_UPDATED_AT,
    documentHash: null,
  },
  {
    slug: 'ai-rules',
    title: 'Правила AI-помощника',
    route: '/legal/ai-rules',
    version: LEGAL_DOCUMENT_VERSION,
    updatedAt: LEGAL_DOCUMENT_UPDATED_AT,
    documentHash: null,
  },
  {
    slug: 'referral',
    title: 'Правила реферальной программы',
    route: '/legal/referral',
    version: LEGAL_DOCUMENT_VERSION,
    updatedAt: LEGAL_DOCUMENT_UPDATED_AT,
    documentHash: null,
  },
  {
    slug: 'review-consent',
    title: 'Согласие на публикацию отзыва',
    route: '/legal/review-consent',
    version: LEGAL_DOCUMENT_VERSION,
    updatedAt: LEGAL_DOCUMENT_UPDATED_AT,
    documentHash: null,
  },
  {
    slug: 'author-agreement',
    title: 'Соглашение автора',
    route: '/legal/author-agreement',
    version: LEGAL_DOCUMENT_VERSION,
    updatedAt: LEGAL_DOCUMENT_UPDATED_AT,
    documentHash: null,
  },
  {
    slug: 'copyright',
    title: 'Правообладателям',
    route: '/legal/copyright',
    version: LEGAL_DOCUMENT_VERSION,
    updatedAt: LEGAL_DOCUMENT_UPDATED_AT,
    documentHash: null,
  },
  {
    slug: 'personal-data-requests',
    title: 'Обращения по персональным данным',
    route: '/legal/personal-data-requests',
    version: LEGAL_DOCUMENT_VERSION,
    updatedAt: LEGAL_DOCUMENT_UPDATED_AT,
    documentHash: null,
  },
];

export function getLegalDocument(slug: LegalDocumentSlug): LegalDocumentConfig {
  const document = legalDocuments.find((item) => item.slug === slug);
  if (!document) {
    throw new Error(`[legalDocuments] Unknown legal document slug: ${slug}`);
  }
  return document;
}
