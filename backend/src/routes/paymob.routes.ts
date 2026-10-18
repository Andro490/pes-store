import { Router, Request, Response } from 'express';
import { PaymobService } from '../services/paymob.service';

const router = Router();

// POST /api/paymob/initiate
router.post('/initiate', async (req: Request, res: Response) => {
  try {
    const { accountId, accountTitle, amountEgp, customer } = req.body;

    if (!accountId || !amountEgp) {
      res.status(400).json({ success: false, message: 'بيانات الحساب والسعر مطلوبة' });
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

// POST /api/paymob/webhook (Callback من Paymob عند نجاح الدفع)
router.post('/webhook', (req: Request, res: Response) => {
  const transaction = req.body.obj;
  if (transaction && transaction.success === true) {
    console.log(`\n🎉 عملية دفع ناجحة لطلب رقم: ${transaction.order?.id}`);
    console.log(`💰 المبلغ: ${transaction.amount_cents / 100} EGP`);
    console.log(`👤 العميل: ${transaction.order?.shipping_data?.first_name} (${transaction.order?.shipping_data?.phone_number})`);
    
    // هنا يتم إرسال بيانات الحساب تلقائياً للعميل
  }

  res.status(200).send('OK');
});

export default router;
