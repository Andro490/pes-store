/**
 * Creates a test Paddle customer (sandbox) and then mints a portal URL.
 * Run after you have completed the onboarding and have a signing secret.
 */
require('dotenv').config({ path: __dirname + '/.env' });

import { Paddle, Environment } from '@paddle/paddle-node-sdk';

async function main() {
  const apiKey = process.env.PADDLE_API_KEY?.trim();
  if (!apiKey) throw new Error('PADDLE_API_KEY missing');

  const paddle = new Paddle(apiKey, {
    environment:
      apiKey.toLowerCase().startsWith('pdl_live_') ? Environment.production : Environment.sandbox,
  });

  // 1️⃣ Create a test customer (sandbox only)
  const customer = await paddle.customers.create({
    email: `test-${Date.now()}@example.com`,
    marketingConsent: false,
  });
  console.log('✅ Created Paddle customer', customer.id);

  // 2️⃣ Mint a portal session via our backend endpoint
  const portalRes = await fetch('http://localhost:5000/api/paddle/portal-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId: customer.id }),
  });
  const portalJson = await portalRes.json();
  console.log('Portal endpoint response', portalRes.status, portalJson);
}

main().catch((e) => console.error('❌ error', e));

