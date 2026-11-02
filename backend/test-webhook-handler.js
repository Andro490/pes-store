/**
 * Test webhook signature verification using Paddle simulator-style payload.
 * This tests that our route correctly rejects invalid signatures.
 */
const BASE = 'http://localhost:5000';

async function test() {
  console.log('\n🧪 Testing Paddle webhook handler...\n');

  // Test 1: Missing signature → should get 400
  const res1 = await fetch(`${BASE}/api/paddle/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event_type: 'test', data: {} }),
  });
  const j1 = await res1.json();
  console.log(`Test 1 - No signature → HTTP ${res1.status} (expected 400)`);
  console.log('  Response:', j1.error || j1.message || JSON.stringify(j1));
  console.log(res1.status === 400 ? '  ✅ PASS' : '  ❌ FAIL');

  // Test 2: Wrong signature → should get 400
  const res2 = await fetch(`${BASE}/api/paddle/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Paddle-Signature': 'ts=1234567890;h1=badhash',
    },
    body: JSON.stringify({ event_type: 'test', data: {} }),
  });
  const j2 = await res2.json();
  console.log(`\nTest 2 - Bad signature → HTTP ${res2.status} (expected 400)`);
  console.log('  Response:', j2.error || j2.message || JSON.stringify(j2));
  console.log(res2.status === 400 ? '  ✅ PASS' : '  ❌ FAIL');

  // Test 3: Config endpoint works
  const res3 = await fetch(`${BASE}/api/paddle/config`);
  const j3 = await res3.json();
  console.log(`\nTest 3 - Config endpoint → HTTP ${res3.status} (expected 200)`);
  console.log('  Environment:', j3.data?.environment);
  console.log('  isConfigured:', j3.data?.isConfigured);
  console.log(res3.status === 200 && j3.data?.isConfigured ? '  ✅ PASS' : '  ❌ FAIL');

  // Test 4: Portal session with invalid customerId
  const res4 = await fetch(`${BASE}/api/paddle/portal-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId: 'invalid_id' }),
  });
  const j4 = await res4.json();
  console.log(`\nTest 4 - Portal bad customerId → HTTP ${res4.status} (expected 400)`);
  console.log('  Response:', j4.message || JSON.stringify(j4));
  console.log(res4.status === 400 ? '  ✅ PASS' : '  ❌ FAIL');

  // Test 5: Portal session with non-existent customer
  const res5 = await fetch(`${BASE}/api/paddle/portal-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId: 'ctm_00000000000000000000000000' }),
  });
  const j5 = await res5.json();
  console.log(`\nTest 5 - Portal unknown customer → HTTP ${res5.status} (expected 404)`);
  console.log('  Response:', j5.message || JSON.stringify(j5));
  console.log(res5.status === 404 ? '  ✅ PASS' : '  ❌ FAIL');

  console.log('\n✅ Webhook handler tests complete!\n');
}

test().catch(console.error);

