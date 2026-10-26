import { Router, Request, Response } from 'express';
import { PaymobService } from '../services/paymob.service';
import { StockService } from '../services/stock.service';
import { prisma } from '../services/prisma.service';

const router = Router();

// POST /api/paymob/initiate
router.post('/initiate', async (req: Request, res: Response) => {
  try {
    const { accountId, accountTitle, amountEgp, customer } = req.body;

    if (!accountId || !amountEgp) {
      res.status(400).json({ success: false, message: 'بيانات الحساب والسعر مطلوبة' });
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

    if (!account.isAvailable || stockCount === 0) {
      res.status(400).json({
        success: false,
        message: 'عذراً! نفد مخزون هذا الحساب بالكامل من المتجر، لا يمكن الدفع لهذا الحساب حالياً 🔴',
      });
      return;
    }

    const session = await PaymobService.createPaymentSession({
      accountId,
      accountTitle: accountTitle || 'حساب بيس eFootball',
      amountEgp: Number(amountEgp),
      customer: customer || {
        firstName: 'عميل',
        lastName: 'بيس',
        email: 'customer@pes-store.com',
        phone: '+201000000000'
      }
    });

    res.json({
      success: true,
      data: session
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
    const { transactionId, accountId, buyerPhone } = req.body;

    if (!transactionId || !accountId) {
      res.status(400).json({
        success: false,
        message: 'رقم المعاملة (Transaction ID) ومعرّف الحساب مطلوبان'
      });
      return;
    }

    const account = await prisma.pesAccount.findUnique({ where: { id: accountId } });
    if (!account) {
      res.status(404).json({ success: false, message: 'الحساب المطلوب غير موجود' });
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

    const expectedAmount = Number(account.price);
    const actualAmount = Number(verifyResult.amountEgp);
    if (!Number.isFinite(actualAmount) || actualAmount <= 0 || Math.abs(actualAmount - expectedAmount) > 0.01) {
      res.status(400).json({
        success: false,
        message: `مبلغ الدفع غير مطابق لسعر الحساب. السعر المتوقع: ${expectedAmount} EGP`
      });
      return;
    }

    const phone = buyerPhone ||
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
