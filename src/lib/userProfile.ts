export interface UserProfile {
  name: string;
  email: string;
  city: string;
  institution: string;
  role: string;
}

export interface ReferralStats {
  referralCode: string;
  referralLink: string;
  invitedCount: number;
  paidReferralCount: number;
  baseDiscount: number;
  referralDiscount: number;
  subscriptionDiscount: number;
  appliedDiscount: number;
  referralDiscountExpiresAt: string | null;
  lastPaidReferralAt: string | null;
  nextMilestone: number;
}

const PROFILE_KEY = 'user_profile';
const REFERRAL_KEY = 'user_referral_stats';

const REFERRAL_MILESTONES = [
  { count: 1, discount: 6 },
  { count: 3, discount: 7 },
  { count: 5, discount: 8 },
  { count: 10, discount: 10 },
];

function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function getDefaultProfile(): UserProfile {
  return {
    name: 'Иванова Мария Петровна',
    email: 'ivanova.maria@example.com',
    city: '',
    institution: 'МБДОУ "Детский сад №15"',
    role: 'Воспитатель',
  };
}

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return { ...getDefaultProfile(), ...JSON.parse(raw) };
  } catch {}
  return getDefaultProfile();
}

export function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

export function computeReferralDiscount(paidCount: number): number {
  let discount = 5;
  for (const m of REFERRAL_MILESTONES) {
    if (paidCount >= m.count) discount = m.discount;
  }
  return discount;
}

function computeNextMilestone(paidCount: number): number {
  for (const m of REFERRAL_MILESTONES) {
    if (paidCount < m.count) return m.count;
  }
  return 10;
}

export function loadReferralStats(hasSubscription = false): ReferralStats {
  try {
    const raw = localStorage.getItem(REFERRAL_KEY);
    const saved = raw ? JSON.parse(raw) : {};

    const code = saved.referralCode || generateReferralCode();
    const paidCount = saved.paidReferralCount ?? 0;
    const invited = saved.invitedCount ?? 0;

    const baseDiscount = 5;
    const referralDiscount = computeReferralDiscount(paidCount);
    const subscriptionDiscount = hasSubscription ? 25 : 0;
    const appliedDiscount = Math.max(baseDiscount, referralDiscount, subscriptionDiscount);

    const stats: ReferralStats = {
      referralCode: code,
      referralLink: `https://fop-do.ru/ref/${code}`,
      invitedCount: invited,
      paidReferralCount: paidCount,
      baseDiscount,
      referralDiscount,
      subscriptionDiscount,
      appliedDiscount,
      referralDiscountExpiresAt: saved.referralDiscountExpiresAt ?? null,
      lastPaidReferralAt: saved.lastPaidReferralAt ?? null,
      nextMilestone: computeNextMilestone(paidCount),
    };

    if (!saved.referralCode) {
      localStorage.setItem(REFERRAL_KEY, JSON.stringify({ ...saved, referralCode: code }));
    }

    return stats;
  } catch {
    const code = generateReferralCode();
    return {
      referralCode: code,
      referralLink: `https://fop-do.ru/ref/${code}`,
      invitedCount: 0,
      paidReferralCount: 0,
      baseDiscount: 5,
      referralDiscount: 5,
      subscriptionDiscount: 0,
      appliedDiscount: 5,
      referralDiscountExpiresAt: null,
      lastPaidReferralAt: null,
      nextMilestone: 1,
    };
  }
}

export function saveReferralStats(stats: Partial<ReferralStats>): void {
  try {
    const raw = localStorage.getItem(REFERRAL_KEY);
    const existing = raw ? JSON.parse(raw) : {};
    localStorage.setItem(REFERRAL_KEY, JSON.stringify({ ...existing, ...stats }));
  } catch {}
}

export { REFERRAL_MILESTONES };
