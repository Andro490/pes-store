/**
 * Paddle Sandbox Full Test
 * Run: node backend/test-paddle-full.js
 */
require('dotenv').config({ path: __dirname + '/.env' });

const API_KEY = process.env.PADDLE_API_KEY;
const BASE = 'https://sandbox-api.paddle.com';

async function req(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  return json;
}

async function main() {
  console.log('\n🔑 API Key:', API_KEY?.slice(0, 20) + '...');
  console.log('🌍 Environment: Sandbox\n');

  // 1. Create a product
  console.log('📦 Step 1: Creating product...');
  const product = await req('POST', '/products', {
    name: 'eFootball PES Account Test',
    tax_category: 'standard',
  });
  
  if (product.error) {
    console.error('❌ Product error:', JSON.stringify(product.error, null, 2));
    
    // Try listing existing products
    console.log('\n📋 Listing existing products...');
    const list = await req('GET', '/products');
    if (list.data && list.data.length > 0) {
      console.log('✅ Found products:', list.data.map(p => `${p.id}: ${p.name}`));
    }
  } else {
    console.log('✅ Product created:', product.data?.id, product.data?.name);
  }

  // 2. Create a price
  const productId = product.data?.id || null;
  let priceId = null;
  
  if (productId) {
    console.log('\n💰 Step 2: Creating price...');
    const price = await req('POST', '/prices', {
      product_id: productId,
      description: 'Test Price',
      unit_price: { amount: '100', currency_code: 'USD' },
      billing_cycle: null,
      trial_period: null,
    });
    
    if (price.error) {
      console.error('❌ Price error:', JSON.stringify(price.error, null, 2));
    } else {
      priceId = price.data?.id;
      console.log('✅ Price created:', priceId);
    }
  }

  // 3. Create a transaction (test payment)
  console.log('\n💳 Step 3: Creating test transaction...');
  const txnBody = {
    items: [{
      quantity: 1,
      price: {
        description: 'eFootball Account: Test',
        unit_price: { amount: '199', currency_code: 'USD' },
        product: {
          name: 'eFootball PES Account',
          tax_category: 'standard',
        },
      },
    }],
    checkout: {
      url: 'https://pes.fouadf9.network',
    },
  };

  if (priceId) {
    txnBody.items = [{ price_id: priceId, quantity: 1 }];
  }

  const txn = await req('POST', '/transactions', txnBody);
  
  if (txn.error) {
    console.error('❌ Transaction error:', JSON.stringify(txn.error, null, 2));
    console.log('\n📋 Error code:', txn.error?.code);
    console.log('💡 Detail:', txn.error?.detail);
  } else {
    console.log('✅ Transaction created!');
    console.log('   ID:', txn.data?.id);
    console.log('   Status:', txn.data?.status);
    console.log('   Checkout URL:', txn.data?.checkout?.url);
  }

  // 4. List transactions
  console.log('\n📋 Step 4: Listing recent transactions...');
  const list = await req('GET', '/transactions?per_page=5&order_by=created_at[DESC]');
  if (list.data) {
    console.log(`✅ Found ${list.data.length} transaction(s):`);
    list.data.forEach(t => {
      console.log(`   - ${t.id} | ${t.status} | ${t.created_at}`);
    });
  }

  // 5. Check account status
  console.log('\n🏢 Step 5: Checking account status...');
  const account = await req('GET', '/sellers/me');
  if (account.data) {
    console.log('✅ Account:', account.data?.name || account.data?.id);
    console.log('   Status:', account.data?.status);
    console.log('   Checkout enabled:', account.data?.is_checkout_enabled ?? 'N/A');
  } else {
    console.log('ℹ️  Account response:', JSON.stringify(account, null, 2));
  }
}

main().catch(console.error);

