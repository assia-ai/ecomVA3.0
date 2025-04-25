export interface StripeCustomer {
  id: string;
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}

export interface StripeSubscription {
  id: string;
  customerId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt?: string;
  priceId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionStatus = 
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'trialing'
  | 'unpaid';

export interface StripeEvent {
  id: string;
  type: string;
  object: 'event';
  data: {
    object: any;
  };
  created: number;
  livemode: boolean;
  pending_webhooks: number;
  request?: {
    id: string | null;
    idempotency_key: string | null;
  };
}

export interface CreateCheckoutSessionRequest {
  priceId: string;
  customerId?: string;
  userId: string;
  successUrl: string;
  cancelUrl: string;
  trialDays?: number;
}

export interface CreateCustomerPortalSessionRequest {
  customerId: string;
  userId: string;
  returnUrl: string;
}

export interface SubscriptionData {
  plan: 'free' | 'pro';
  status: SubscriptionStatus | 'inactive';
  currentPeriodEnd: string | null;
  customerId: string | null;
}