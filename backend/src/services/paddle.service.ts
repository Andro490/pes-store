import { Paddle, Environment } from '@paddle/paddle-node-sdk';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { prisma } from './prisma.service';
import { StockService } from './stock.service';

export class PaddleService {
  private static paddleInstance: Paddle | null = null;

  public static getApiKey(): string {
    return (process.env.PADDLE_API_KEY || process.env.PADDLE_SANDBOX_API_KEY || '').trim();
  }

  public static getEnvironment(): Environment {
    const key = this.getApiKey();
    if (key.startsWith('pdl_live_') || key.startsWith('live_')) {
      return Environment.production;
    }
    if (key.startsWith('pdl_sdbx_') || key.startsWith('test_') || key.startsWith('paddlesandbox_')) {
      return Environment.sandbox;
    }
    const env = (process.env.PADDLE_ENVIRONMENT || 'sandbox').trim().toLowerCase();
    return env === 'production' || env === 'live' ? Environment.production : Environment.sandbox;
  }

  public static getClientToken(): string {
    return (process.env.PADDLE_CLIENT_TOKEN || '').trim();
  }

  public static getWebhookSecret(): string {
    return (process.env.PADDLE_WEBHOOK_SECRET_KEY || '').trim();
  }

  public static getUsdRate(): number {
    const rate = parseFloat(process.env.USD_EXCHANGE_RATE || '50');
    return Number.isFinite(rate) && rate > 0 ? rate : 50;
  }

  public static getClientUrl(): string {
    return (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
  }

  private static getPaddle(): Paddle {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('لم يتم تعيين PADDLE_API_KEY في ملف .env للسيرفر');
    }

    if (!this.paddleInstance) {
      this.paddleInstance = new Paddle(apiKey, {
        environment: this.getEnvironment(),
      });
    }

    return this.paddleInstance;
  }

  /**
   * إنشاء جلسة دفع ومعاملة في Paddle
   */
  public static async createTransaction(params: {
    accountId: string;
    accountTitle: string;
    amountEgp: number;
    customerEmail?: string;
  }) {
    const paddle = this.getPaddle();
    const rate = this.getUsdRate();
    // Convert EGP to USD cents (minimum $1.00)
    const amountUsd = Math.max(1, Math.round((params.amountEgp / rate) * 100) / 100);
    const amountCents = Math.round(amountUsd * 100);

    const claimToken = randomBytes(32).toString('hex');
    const claimTokenHash = createHash('sha256').update(claimToken).digest('hex');

    const clientUrl = this.getClientUrl();
    const successUrl = `${clientUrl}/?paddle_callback=true&success=true&account_id=${encodeURIComponent(params.accountId)}`;

    // Create automatically-collected transaction in Paddle
    const transaction = await paddle.transactions.create({
      items: [
        {
          quantity: 1,
          price: {
            description: `eFootball Account: ${params.accountTitle}`,
            unitPrice: {
              amount: String(amountCents),
              currencyCode: 'USD',
            },
            product: {
              name: `eFootball PES Account - ${params.accountTitle}`,
              taxCategory: 'standard',
            },
          },
        },
      ],
      customData: {
        accountId: params.accountId,
        accountTitle: params.accountTitle,
        claimToken,
        amountEgp: params.amountEgp,
      },
    });

    // Store payment session in DB
    await prisma.paddlePayment.create({
      data: {
        transactionId: transaction.id,
        accountId: params.accountId,
        amountCents,
        currency: 'USD',
        claimTokenHash,
        status: 'draft',
      },
    });

    return {
      transactionId: transaction.id,
      checkoutUrl: transaction.checkout?.url || null,
      claimToken,
      amountUsd,
      successUrl,
    };
  }

  /**
   * التحقق من حالة المعاملة وتسليم الحساب للمشتري
   */
  public static async verifyAndDeliver(params: {
    transactionId: string;
    accountId: string;
    claimToken: string;
  }) {
    const { transactionId, accountId, claimToken } = params;

    const paymentRecord = await prisma.paddlePayment.findUnique({
      where: { transactionId },
    });

    if (!paymentRecord) {
      throw new Error('لم يتم العثور على سجل جلسة الدفع الخاصة بـ Paddle');
    }

    if (paymentRecord.accountId !== accountId) {
      throw new Error('معرف الحساب غير مطابق لطلب الدفع الأصلي');
    }

    // Verify claimToken hash
    const incomingHash = createHash('sha256').update(claimToken).digest('hex');
    const incomingBuf = Buffer.from(incomingHash, 'hex');
    const savedBuf = Buffer.from(paymentRecord.claimTokenHash, 'hex');

    if (incomingBuf.length !== savedBuf.length || !timingSafeEqual(incomingBuf, savedBuf)) {
      throw new Error('رمز التحقق الأمني (claimToken) غير صالح أو منتهي الصلاحية');
    }

    // Verify status from Paddle API
    const paddle = this.getPaddle();
    const transaction = await paddle.transactions.get(transactionId);

    const paidStatuses = ['completed', 'paid'];
    const isPaid = paidStatuses.includes((transaction.status || '').toLowerCase());

    if (!isPaid) {
      throw new Error(`حالة المعاملة في Paddle هي (${transaction.status}) وليست مكتملة بعد`);
    }

    // Update payment record
    await prisma.paddlePayment.update({
      where: { transactionId },
      data: { status: 'completed' },
    });

    // Deliver one stock account
    const deliveryResult = await StockService.purchaseAndDeliverOne(
      accountId,
      undefined,
      transactionId
    );

    return {
      success: deliveryResult.success,
      message: deliveryResult.alreadyDelivered
        ? 'تم استلام بيانات حسابك بنجاح (تم التوصيل مسبقاً)'
        : 'تم التحقق من الدفع وتسليم الحساب بنجاح 🎉',
      data: {
        deliveredAccount: deliveryResult.deliveredAccount,
        alreadyDelivered: deliveryResult.alreadyDelivered,
      },
    };
  }

  /**
   * معالجة الـ Webhook من Paddle
   */
  public static async handleWebhook(rawBody: string, signature: string) {
    const secret = this.getWebhookSecret();
    if (!secret) {
      console.warn('Paddle webhook received but PADDLE_WEBHOOK_SECRET_KEY is not configured');
      return { handled: false, reason: 'No secret' };
    }

    const paddle = this.getPaddle();
    const event = await paddle.webhooks.unmarshal(rawBody, secret, signature);

    if (event.eventType === 'transaction.completed' || event.eventType === 'transaction.paid') {
      const txnData: any = event.data;
      const transactionId = txnData.id;
      const accountId = txnData.customData?.accountId;

      if (transactionId && accountId) {
        await prisma.paddlePayment.updateMany({
          where: { transactionId },
          data: { status: 'completed' },
        });

        await StockService.purchaseAndDeliverOne(accountId, undefined, transactionId);
      }
    }

    return { handled: true, eventType: event.eventType };
  }
}

