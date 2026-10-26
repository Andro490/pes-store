import { Router, Request, Response } from 'express';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { PaymobService } from '../services/paymob.service';
import { StockService } from '../services/stock.service';
import { prisma } from '../services/prisma.service';

const router = Router();

// POST /api/paymob/initiate
router.post('/initiate', async (req: Request, res: Response) => {
  try {
    const { accountId, customer } = req.body;

    if (typeof accountId !== 'string' || !accountId.trim()) {
      res.status(400).json({ success: false, message: 'معرّف الحساب مطلوب' });
      return;
    }

    // التحقق الصارم من توفر المخزون في قاعدة البيانات قبل إنشاء جلسة الدفع في Paymob
    const [account, stockCount] = await Promise.all([
      prisma.pesAccount.findUnique({ where: { id: accountId } }),
      prisma.accountStock.count({ where: { accountId } }),
    ]);

    if (!account) {
      res.status(404).json({ success: false, message: 'الحساب المطلوب غير موجود في المتجر' });
      return;
    }

    const amountEgp = Number(account.price);
    if (account.currency !== 'EGP' || !Number.isFinite(amountEgp) || amountEgp <= 0) {
      res.status(400).json({ success: false, message: 'سعر أو عملة الحساب غير صالحة للدفع' });
      return;
    }

    if (!account.isAvailable || stockCount === 0) {
      res.status(400).json({
        success: false,
        message: 'عذراً! نفد مخزون هذا الحساب بالكامل من المتجر، لا يمكن الدفع لهذا الحساب حالياً 🔴',
      });
      return;
    }

    const session = await PaymobService.createPaymentSession({
      accountId,
      accountTitle: account.title,
      amountEgp,
      customer: customer || {
        firstName: 'عميل',
        lastName: 'بيس',
        email: 'customer@pes-store.com',
        phone: '+201000000000'
      }
    });
    const claimToken = randomBytes(32).toString('hex');

    await prisma.paymobPayment.create({
      data: {
        orderId: session.orderId,
        accountId: account.id,
        amountCents: Math.round(amountEgp * 100),
        currency: account.currency,
        claimTokenHash: createHash('sha256').update(claimToken).digest('hex'),
      },
    });

    res.json({
      success: true,
      data: { ...session, claimToken }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'فشل في إنشاء جلسة الدفع مع Paymob',
      error: error.message
    });
  }
});

// POST /api/paymob/verify-and-deliver
// التحقق من إتمام الدفع مع Paymob وتسليم بيانات الحساب تلقائياً للمشتري
router.post('/verify-and-deliver', async (req: Request, res: Response) => {
  try {
    const { transactionId, accountId, claimToken } = req.body;

    if (
      (typeof transactionId !== 'string' && typeof transactionId !== 'number') ||
      !/^[0-9]+$/.test(String(transactionId)) ||
      typeof accountId !== 'string' ||
      !accountId.trim() ||
      typeof claimToken !== 'string' ||
      !/^[a-f0-9]{64}$/i.test(claimToken)
    ) {
      res.status(400).json({
        success: false,
        message: 'رقم المعاملة (Transaction ID) ومعرّف الحساب مطلوبان'
      });
      return;
    }

    const verifyResult = await PaymobService.verifyTransaction(transactionId);

    if (!verifyResult.isSuccess) {
      res.status(400).json({
        success: false,
        message: 'عملية الدفع غير مؤكدة أو لم تكتمل بنجاح في Paymob'
      });
      return;
    }

    const orderId = verifyResult.transaction?.order?.id;
    if (orderId === undefined || orderId === null) {
      res.status(400).json({
        success: false,
        message: 'تعذر ربط المعاملة بطلب دفع صالح'
      });
      return;
    }

    const payment = await prisma.paymobPayment.findUnique({ where: { orderId: String(orderId) } });
    if (!payment || payment.accountId !== accountId) {
      res.status(400).json({ success: false, message: 'المعاملة لا تخص هذا الحساب أو طلباً مسجلاً' });
      return;
    }

    const suppliedTokenHash = createHash('sha256').update(claimToken).digest();
    const storedTokenHash = Buffer.from(payment.claimTokenHash, 'hex');
    if (
      storedTokenHash.length !== suppliedTokenHash.length ||
      !timingSafeEqual(storedTokenHash, suppliedTokenHash)
    ) {
      res.status(403).json({ success: false, message: 'بيانات استلام الطلب غير صالحة' });
      return;
    }

    if (
      verifyResult.amountCents !== payment.amountCents ||
      verifyResult.currency !== payment.currency
    ) {
      res.status(400).json({ success: false, message: 'مبلغ أو عملة الدفع غير مطابقة لطلب الشراء' });
      return;
    }

    const account = await prisma.pesAccount.findUnique({ where: { id: payment.accountId } });
    if (!account) {
      res.status(404).json({ success: false, message: 'الحساب المطلوب غير موجود' });
      return;
    }

    await prisma.paymobPayment.update({
      where: { orderId: payment.orderId },
      data: { transactionId: String(transactionId) },
    });

    const phone =
      verifyResult.transaction?.order?.shipping_data?.phone_number ||
      verifyResult.transaction?.billing_data?.phone_number ||
      undefined;

    const deliveryResult = await StockService.purchaseAndDeliverOne(
      accountId,
      phone,
      String(transactionId)
    );

    res.json({
      success: true,
      message: deliveryResult.alreadyDelivered
        ? 'تم استرجاع بيانات الحساب المدفوع بنجاح ✅'
        : 'تم تأكيد الدفع وتسليم الحساب بنجاح! 🚀🎉',
      data: deliveryResult
    });
  } catch (error: any) {
    console.error('Verify & Deliver Error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'حدث خطأ أثناء تسليم الحساب بعد الدفع'
    });
  }
});

// POST /api/paymob/webhook (Callback من Paymob عند نجاح الدفع)
router.post('/webhook', (req: Request, res: Response) => {
  try {
    const transaction = req.body.obj;
    if (transaction && transaction.success === true) {
      console.log(`\n🎉 عملية دفع ناجحة عبر Webhook لطلب رقم: ${transaction.order?.id}`);
      console.log(`💰 المبلغ: ${(transaction.amount_cents || 0) / 100} EGP`);
      console.log(`🆔 رقم المعاملة: ${transaction.id}`);
    }
  } catch (err: any) {
    console.error('Webhook error:', err);
  }

  res.status(200).send('OK');
});

export default router;
