export const SUBSCRIPTION_BASE_MONTHLY_PRICE_RUBLES = 278;

export interface SubscriptionPlanDefinition {
  id: 'monthly' | 'quarterly' | 'semiannual' | 'annual';
  label: string;
  months: number;
  discountPercent: number;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlanDefinition[] = [
  { id: 'monthly', label: '1 месяц', months: 1, discountPercent: 0 },
  { id: 'quarterly', label: '3 месяца', months: 3, discountPercent: 10 },
  { id: 'semiannual', label: '6 месяцев', months: 6, discountPercent: 15 },
  { id: 'annual', label: '12 месяцев', months: 12, discountPercent: 25 },
];

export function getSubscriptionPlan(planId: string): SubscriptionPlanDefinition | null {
  return SUBSCRIPTION_PLANS.find((plan) => plan.id === planId) ?? null;
}

export function getSubscriptionPlanTotalRubles(plan: SubscriptionPlanDefinition): number {
  const total = SUBSCRIPTION_BASE_MONTHLY_PRICE_RUBLES * plan.months;
  return Math.round(total * (1 - plan.discountPercent / 100));
}

export function getSubscriptionPlanDiscountRubles(plan: SubscriptionPlanDefinition): number {
  const fullPrice = SUBSCRIPTION_BASE_MONTHLY_PRICE_RUBLES * plan.months;
  return fullPrice - getSubscriptionPlanTotalRubles(plan);
}

export function getSubscriptionPlanMonthlyRubles(plan: SubscriptionPlanDefinition): number {
  return Math.round(getSubscriptionPlanTotalRubles(plan) / plan.months);
}
