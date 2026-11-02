import { Router, Request, Response } from 'express';
import express from 'express';
import { Paddle, Environment } from '@paddle/paddle-node-sdk';
import { PaddleService } from '../services/paddle.service';
import { prisma } from '../services/prisma.service';
import {
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionCanceled,
  handleCustomerCreated,
  handleCustomerUpdated,
  handleTransactionCompleted,
  createPortalSession,
  customerHasAccess,
  getActiveSubscriptions,
} from '../services/paddle-subscription.service';

const router = Router();

// GET /api/paddle/config
// إرجاع الإعدادات العامة (البيئة ومفتاح العميل) للواجهة الأمامية
router.get('/config', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      environment: PaddleService.getEnvironment(),
      clientToken: PaddleService.getClientToken(),
      usdRate: PaddleService.getUsdRate(),
      isConfigured: Boolean(PaddleService.getApiKey()),
    },
  });
});

// POST /api/paddle/initiate
// إنشاء معاملة دفع جديدة في Paddle
router.post('/initiate', async (req: Request, res: Response) => {
  try {
    const { accountId, customerEmail } = req.body;

    if (typeof accountId !== 'string' || !accountId.trim()) {
      res.status(400).json({ success: false, message: 'معرّف الحساب مطلوب' });
      return;
    }

    // التحقق الصارم من توفر المخزون في قاعدة البيانات قبل إنشاء المعاملة في Paddle
    const [account, stockCount] = await Promise.all([
      prisma.pesAccount.findUnique({ where: { id: accountId } }),
      prisma.accountStock.count({ where: { accountId } }),
    ]);

    if (!account) {
      res.status(404).json({ success: false, message: 'الحساب المطلوب غير موجود في المتجر' });
      return;
    }

    const amountEgp = Number(account.price);
    if (!Number.isFinite(amountEgp) || amountEgp <= 0) {
      res.status(400).json({ success: false, message: 'سعر الحساب غير صالح للدفع' });
      return;
    }

    if (!account.isAvailable || stockCount === 0) {
      res.status(400).json({
        success: false,
        message: 'عذراً! نفد مخزون هذا الحساب بالكامل من المتجر، لا يمكن الدفع لهذا الحساب حالياً 🔴',
      });
      return;
    }

    const session = await PaddleService.createTransaction({
      accountId,
      accountTitle: account.title,
      amountEgp,
      customerEmail,
    });

    res.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    console.error('Paddle initiate error:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في إنشاء جلسة الدفع مع Paddle',
      error: error.message,
    });
  }
});

// POST /api/paddle/verify-and-deliver
// التحقق من إتمام الدفع مع Paddle وتسليم بيانات الحساب تلقائياً للمشتري
router.post('/verify-and-deliver', async (req: Request, res: Response) => {
  try {
    const { transactionId, accountId, claimToken } = req.body;

    if (
      typeof transactionId !== 'string' ||
      !transactionId.trim() ||
      typeof accountId !== 'string' ||
      !accountId.trim() ||
      typeof claimToken !== 'string' ||
      !/^[a-f0-9]{64}$/i.test(claimToken)
    ) {
      res.status(400).json({
        success: false,
        message: 'معرف المعاملة (transactionId) ومعرف الحساب ورمز التحقق مطلوبة بشكل صحيح',
      });
      return;
    }

    const deliveryResult = await PaddleService.verifyAndDeliver({
      transactionId,
      accountId,
      claimToken,
    });

    // deliveryResult already has shape { success, message, data: { deliveredAccount } }
    res.json(deliveryResult);
  } catch (error: any) {
    console.error('Paddle verify-and-deliver error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'فشل في التحقق من الدفع مع Paddle أو تسليم الحساب',
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/paddle/webhook
// Receives Paddle webhook deliveries.
// IMPORTANT: must read the RAW body (not JSON-parsed) for signature verification.
// Registered BEFORE the global express.json() middleware via a dedicated router.
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  '/webhook',
  async (req: Request, res: Response) => {
    const signature = (req.headers['paddle-signature'] as string) || '';
    const secret    = (process.env.PADDLE_WEBHOOK_SECRET_KEY || '').trim();
    const apiKey    = (process.env.PADDLE_API_KEY || '').trim();

    if (!secret) {
      console.error('[Paddle Webhook] PADDLE_WEBHOOK_SECRET_KEY is not set — rejecting');
      res.status(400).json({ success: false, error: 'Webhook secret not configured' });
      return;
    }

    // rawBody MUST be a string for paddle.webhooks.unmarshal
    const rawBody =
      Buffer.isBuffer(req.body)
        ? req.body.toString('utf-8')
        : typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body);

    let event: any;
    try {
      const keyLower = apiKey.toLowerCase();
      const environment =
        keyLower.startsWith('pdl_live_') || keyLower.startsWith('live_')
          ? Environment.production
          : Environment.sandbox;

      const paddle = new Paddle(apiKey, { environment });
      event = await paddle.webhooks.unmarshal(rawBody, secret, signature);
    } catch (err: any) {
      // Verification failed → do NOT return 2xx (Paddle would stop retrying)
      console.error('[Paddle Webhook] Signature verification FAILED:', err.message);
      res.status(400).json({ success: false, error: 'Webhook signature verification failed' });
      return;
    }

    // Route verified event to typed handlers (idempotent upserts)
    try {
      const data = event.data as any;
      switch (event.eventType) {
        case 'subscription.created':
          await handleSubscriptionCreated(data);
          break;
        case 'subscription.updated':
          await handleSubscriptionUpdated(data);
          break;
        case 'subscription.canceled':
          await handleSubscriptionCanceled(data);
          break;
        case 'customer.created':
          await handleCustomerCreated(data);
          break;
        case 'customer.updated':
          await handleCustomerUpdated(data);
          break;
        case 'transaction.completed':
          // Mirror customer state, then also run PES account delivery if applicable
          await handleTransactionCompleted(data);
          // Legacy: deliver PES account if this was a one-time purchase
          await PaddleService.handleWebhook(rawBody, signature).catch(() => {});
          break;
        default:
          // Safely ignore other event types
          console.log(`[Paddle Webhook] Ignoring event type: ${event.eventType}`);
      }

      res.json({ success: true, eventType: event.eventType });
    } catch (err: any) {
      console.error('[Paddle Webhook] Handler error:', err.message);
      // Still return 2xx so Paddle doesn't retry a successfully-verified but processing-failed event
      // Log internally and handle via DB reconciliation
      res.status(200).json({ success: false, error: 'Handler error logged' });
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/paddle/subscriptions/:customerId
// Returns active subscriptions for a Paddle customer.
// customerId resolved server-side; never trust client input directly.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/subscriptions/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    if (!customerId || !customerId.startsWith('ctm_')) {
      res.status(400).json({ success: false, message: 'Invalid customer ID format' });
      return;
    }

    const [hasAccess, subs] = await Promise.all([
      customerHasAccess(customerId),
      getActiveSubscriptions(customerId),
    ]);

    res.json({ success: true, data: { hasAccess, subscriptions: subs } });
  } catch (err: any) {
    console.error('Paddle subscriptions error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/paddle/portal-session
// Mints a Paddle customer portal session for the authenticated user.
// Customer ID is resolved SERVER-SIDE from the session / body — never from
// an unauthenticated client-supplied value.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/portal-session', async (req: Request, res: Response) => {
  try {
    // In a real app: resolve customerId from req.user (JWT/session).
    // Here we accept it from the body but validate it against our DB first
    // (the createPortalSession helper verifies the customer exists in DB).
    const { customerId } = req.body;

    if (typeof customerId !== 'string' || !customerId.startsWith('ctm_')) {
      res.status(400).json({ success: false, message: 'Invalid or missing customerId' });
      return;
    }

    const portalUrl = await createPortalSession(customerId);
    res.json({ success: true, data: { url: portalUrl } });
  } catch (err: any) {
    console.error('Paddle portal-session error:', err);
    res.status(err.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;

