import Stripe from 'stripe';

// Initialize Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// Payment tier configuration
export const PAYMENT_TIERS = {
  basic: {
    name: 'Basic Plan',
    priceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic',
    checkoutLink: process.env.STRIPE_BASIC_CHECKOUT_LINK,
  },
  pro: {
    name: 'Pro Plan',
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
    checkoutLink: process.env.STRIPE_PRO_CHECKOUT_LINK,
  },
  enterprise: {
    name: 'Enterprise Plan',
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise',
    checkoutLink: process.env.STRIPE_ENTERPRISE_CHECKOUT_LINK,
  },
} as const;

export type PaymentTier = keyof typeof PAYMENT_TIERS;

// Create checkout session
export async function createCheckoutSession(
  tier: PaymentTier,
  successUrl: string,
  cancelUrl: string,
  metadata?: Record<string, string>
) {
  const tierConfig = PAYMENT_TIERS[tier];
  
  if (!tierConfig.priceId) {
    throw new Error(`No price ID configured for tier: ${tier}`);
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: tierConfig.priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      tier,
      ...metadata,
    },
  });

  return session;
}

// Get checkout link for tier
export function getCheckoutLink(tier: PaymentTier): string | null {
  const tierConfig = PAYMENT_TIERS[tier];
  return tierConfig.checkoutLink || null;
}
