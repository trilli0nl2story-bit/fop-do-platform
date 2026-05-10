const DEFAULT_LEGAL_NAME = 'ИП Васильева Наталья Александровна';
const DEFAULT_LEGAL_INN = '781631928699';
const DEFAULT_LEGAL_OGRNIP = '323784700298822';
const DEFAULT_LEGAL_EMAIL = 'official@doshkolnoe-na-lokanichnom.ru';

function readPublicEnv(value: string | undefined): string {
  return value?.trim() ?? '';
}

const publicEnv: {
  legalName?: string;
  inn?: string;
  ogrnip?: string;
  email?: string;
  address?: string;
} =
  typeof process !== 'undefined'
    ? {
        legalName: process.env.NEXT_PUBLIC_LEGAL_NAME,
        inn: process.env.NEXT_PUBLIC_LEGAL_INN,
        ogrnip: process.env.NEXT_PUBLIC_LEGAL_OGRNIP,
        email: process.env.NEXT_PUBLIC_LEGAL_EMAIL,
        address: process.env.NEXT_PUBLIC_LEGAL_ADDRESS,
      }
    : {};

export const legalInfo = {
  projectName: 'Дошкольное на лаконичном',
  platformName: 'Методический кабинет педагога',
  legalName: readPublicEnv(publicEnv.legalName) || DEFAULT_LEGAL_NAME,
  inn: readPublicEnv(publicEnv.inn) || DEFAULT_LEGAL_INN,
  ogrnip: readPublicEnv(publicEnv.ogrnip) || DEFAULT_LEGAL_OGRNIP,
  email: readPublicEnv(publicEnv.email) || DEFAULT_LEGAL_EMAIL,
  correspondenceAddress: readPublicEnv(publicEnv.address),
  domains: ['fop-do.ru', 'фоп-до.рф'],
};

function looksLikePlaceholder(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return (
    normalized.length === 0 ||
    normalized.includes('replace') ||
    normalized.includes('example') ||
    normalized.includes('будет добавлено') ||
    normalized.includes('[будет')
  );
}

export function hasCompleteLegalRequisites(): boolean {
  return Boolean(
    !looksLikePlaceholder(legalInfo.legalName) &&
      !looksLikePlaceholder(legalInfo.inn) &&
      !looksLikePlaceholder(legalInfo.ogrnip) &&
      !looksLikePlaceholder(legalInfo.email),
  );
}
