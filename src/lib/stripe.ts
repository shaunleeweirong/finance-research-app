import 'server-only';
import Stripe from 'stripe';

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    });
  }
  return _stripe;
}

export const PRICE_IDS = {
  pro: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
  },
  premium: {
    monthly: process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID!,
    annual: process.env.STRIPE_PREMIUM_ANNUAL_PRICE_ID!,
  },
} as const;

export function getPlanFromPriceId(priceId: string): 'pro' | 'premium' | 'free' {
  if (priceId === PRICE_IDS.pro.monthly || priceId === PRICE_IDS.pro.annual) return 'pro';
  if (priceId === PRICE_IDS.premium.monthly || priceId === PRICE_IDS.premium.annual) return 'premium';
  return 'free';
}
