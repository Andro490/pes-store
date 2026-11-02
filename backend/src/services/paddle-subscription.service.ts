/**
 * Paddle Subscription Service
 * Mirrors Paddle subscription + customer state from verified webhook events.
 * Provides access-check helper and customer portal session minting.
 */

import { Paddle, Environment } from '@paddle/paddle-node-sdk';
import { prisma } from './prisma.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getPaddle(): Paddle {
  const apiKey = (process.env.PADDLE_API_KEY || '').trim();
  if (!apiKey) throw new Error('PADDLE_API_KEY not set');

  const keyLower = apiKey.toLowerCase();
  const environment =
    keyLower.startsWith('pdl_live_') || keyLower.startsWith('live_')
      ? Environment.production
      : Environment.sandbox;

  return new Paddle(apiKey, { environment });
}

// ─── Access Helper ────────────────────────────────────────────────────────────

/**
 * Returns true if the subscription currently grants paid access.
 * Rules:
 *  - active   → access ✅
 *  - trialing → access ✅
 *  - paused   → NO access ❌
 *  - past_due → NO access ❌  (change to ✅ if you want a grace period)
 *  - canceled → NO access ❌
 * A scheduled_change (e.g. "will cancel at end of period") does NOT revoke
 * access — only the actual status flip does.
 */
export function subscriptionGrantsAccess(status: string): boolean {
  return status === 'active' || status === 'trialing';
}

// ─── Mirror: Customer ─────────────────────────────────────────────────────────

export async function upsertCustomer(data: {
  customerId: string;
  email: string;
}) {
  return prisma.paddleCustomer.upsert({
    where: { customerId: data.customerId },
    create: {
      customerId: data.customerId,
      email: data.email,
    },
    update: {
      email: data.email,
      updatedAt: new Date(),
    },
  });
}

// ─── Mirror: Subscription ─────────────────────────────────────────────────────

export async function upsertSubscription(data: {
  subscriptionId: string;
  customerId: string;
  status: string;
  priceId: string;
  productId: string;
  scheduledChangeAction?: string | null;
  scheduledChangeAt?: Date | null;
}) {
  return prisma.paddleSubscription.upsert({
    where: { subscriptionId: data.subscriptionId },
    create: {
      subscriptionId: data.subscriptionId,
      customerId: data.customerId,
      status: data.status,
      priceId: data.priceId,
      productId: data.productId,
      scheduledChangeAction: data.scheduledChangeAction ?? null,
      scheduledChangeAt: data.scheduledChangeAt ?? null,
    },
    update: {
      customerId: data.customerId,
      status: data.status,
      priceId: data.priceId,
      productId: data.productId,
      scheduledChangeAction: data.scheduledChangeAction ?? null,
      scheduledChangeAt: data.scheduledChangeAt ?? null,
      updatedAt: new Date(),
    },
  });
}

// ─── Extract subscription fields from Paddle event data ───────────────────────

function extractSubscriptionFields(sub: any) {
  const item = sub.items?.[0];
  const priceId = item?.price?.id ?? item?.priceId ?? '';
  const productId = item?.price?.productId ?? item?.productId ?? '';

  let scheduledChangeAction: string | null = null;
  let scheduledChangeAt: Date | null = null;

  if (sub.scheduledChange) {
    scheduledChangeAction = sub.scheduledChange.action ?? null;
    scheduledChangeAt = sub.scheduledChange.effectiveAt
      ? new Date(sub.scheduledChange.effectiveAt)
      : null;
  }

  return { priceId, productId, scheduledChangeAction, scheduledChangeAt };
}

// ─── Webhook Event Handlers ───────────────────────────────────────────────────

export async function handleSubscriptionCreated(data: any) {
  const customerId: string = data.customId ?? data.customerId ?? '';
  const email: string = data.customer?.email ?? '';

  if (customerId && email) {
    await upsertCustomer({ customerId, email });
  }

  const { priceId, productId, scheduledChangeAction, scheduledChangeAt } =
    extractSubscriptionFields(data);

  await upsertSubscription({
    subscriptionId: data.id,
    customerId,
    status: data.status,
    priceId,
    productId,
    scheduledChangeAction,
    scheduledChangeAt,
  });

  console.log(`[Paddle] subscription.created → ${data.id} | status: ${data.status}`);
}

export async function handleSubscriptionUpdated(data: any) {
  const { priceId, productId, scheduledChangeAction, scheduledChangeAt } =
    extractSubscriptionFields(data);

  // Ensure customer row exists (may arrive before customer.created)
  const customerId: string = data.customId ?? data.customerId ?? '';
  const email: string = data.customer?.email ?? '';
  if (customerId && email) {
    await upsertCustomer({ customerId, email });
  }

  await upsertSubscription({
    subscriptionId: data.id,
    customerId,
    status: data.status,
    priceId,
    productId,
    scheduledChangeAction,
    scheduledChangeAt,
  });

  console.log(`[Paddle] subscription.updated → ${data.id} | status: ${data.status} | scheduled: ${scheduledChangeAction ?? 'none'}`);
}

export async function handleSubscriptionCanceled(data: any) {
  await prisma.paddleSubscription.updateMany({
    where: { subscriptionId: data.id },
    data: {
      status: 'canceled',
      scheduledChangeAction: null,
      scheduledChangeAt: null,
      updatedAt: new Date(),
    },
  });

  console.log(`[Paddle] subscription.canceled → ${data.id}`);
}

export async function handleCustomerCreated(data: any) {
  const customerId: string = data.id;
  const email: string = data.email ?? '';
  if (customerId && email) {
    await upsertCustomer({ customerId, email });
    console.log(`[Paddle] customer.created → ${customerId} (${email})`);
  }
}

export async function handleCustomerUpdated(data: any) {
  const customerId: string = data.id;
  const email: string = data.email ?? '';
  if (customerId && email) {
    await upsertCustomer({ customerId, email });
    console.log(`[Paddle] customer.updated → ${customerId} (${email})`);
  }
}

export async function handleTransactionCompleted(data: any) {
  // Mirror customer if embedded in transaction
  const customerId: string = data.customerId ?? '';
  const email: string = data.customer?.email ?? '';
  if (customerId && email) {
    await upsertCustomer({ customerId, email });
  }

  console.log(`[Paddle] transaction.completed → ${data.id} | customer: ${customerId}`);
}

// ─── Customer Portal Session ──────────────────────────────────────────────────

/**
 * Mint a Paddle customer portal session URL.
 * customerId must be resolved SERVER-SIDE from the authenticated session —
 * never accept it from the client directly.
 */
export async function createPortalSession(customerId: string): Promise<string> {
  const paddle = getPaddle();

  // Verify customer exists in our DB (server-side resolution)
  const customer = await prisma.paddleCustomer.findUnique({
    where: { customerId },
  });

  if (!customer) {
    throw new Error('Customer not found in database');
  }

  // Mint portal session via Paddle SDK
  const session = await (paddle.customers as any).createPortalSession(customerId, {
    subscriptionIds: [],   // empty = all subscriptions
  });

  // SDK returns { urls: { general: { overview: string } } }
  const portalUrl =
    session?.urls?.general?.overview ??
    session?.url ??
    null;

  if (!portalUrl) {
    throw new Error('Paddle did not return a portal URL');
  }

  return portalUrl;
}

// ─── Query Helpers ────────────────────────────────────────────────────────────

/** Get all active/trialing subscriptions for a Paddle customer */
export async function getActiveSubscriptions(customerId: string) {
  const subs = await prisma.paddleSubscription.findMany({
    where: { customerId },
  });
  return subs.filter((s) => subscriptionGrantsAccess(s.status));
}

/** Check if a Paddle customer ID currently has paid access */
export async function customerHasAccess(customerId: string): Promise<boolean> {
  const active = await getActiveSubscriptions(customerId);
  return active.length > 0;
}

