import https from 'https';

export interface PaymobCustomer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface PaymobCheckoutParams {
  accountId: string;
  accountTitle: string;
  amountEgp: number;
  customer?: PaymobCustomer;
}

const httpsPost = (url: string, headers: Record<string, string>, data: any): Promise<any> => {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const postData = JSON.stringify(data);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...headers
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsedRes = JSON.parse(body);
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedRes);
          } else {
            reject(new Error(parsedRes.detail || JSON.stringify(parsedRes)));
          }
        } catch (e) {
          reject(new Error(`Paymob error: ${res.statusCode} ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

const httpsGet = (url: string, headers: Record<string, string>): Promise<any> => {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsed);
          } else {
            reject(new Error(parsed.detail || `Paymob error ${res.statusCode}`));
          }
        } catch (e) {
          reject(new Error(`Paymob parse error: ${res.statusCode} ${body}`));
        }
      });
    });
    req.on('error', reject);
  });
};

export class PaymobService {
  private static cachedAuthToken: { token: string; expiresAt: number } | null = null;

  private static getSecretKey() {
    return (process.env.PAYMOB_SECRET_KEY || '').trim();
  }
  private static getPublicKey() {
    return (process.env.PAYMOB_PUBLIC_KEY || '').trim();
  }
  private static getApiKey() {
    return (process.env.PAYMOB_API_KEY || '').trim();
  }
  private static getIntegrationId() {
    return (process.env.PAYMOB_INTEGRATION_ID || '').trim();
  }
  private static getClientUrl() {
    return (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
  }

  /**
   * جلب توكن المصادقة من Paymob (Classic API) مع تخزينه مؤقتاً
   */
  private static async getAuthToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedAuthToken && this.cachedAuthToken.expiresAt > now) {
      return this.cachedAuthToken.token;
    }

    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('PAYMOB_API_KEY غير موجود في إعدادات الخادم');
    }

    const res = await httpsPost(
      'https://accept.paymob.com/api/auth/tokens',
      {},
      { api_key: apiKey }
    );

    if (!res.token) {
      throw new Error('فشل الحصول على توكن المصادقة من Paymob');
    }

    // Cache token for 45 minutes
    this.cachedAuthToken = {
      token: res.token,
      expiresAt: now + 45 * 60 * 1000,
    };

    return res.token;
  }

  /**
   * إنشاء جلسة دفع موحدة باستخدام Paymob Unified Intention API (الأحدث والأسرع)
   */
  public static async createPaymentSession(params: PaymobCheckoutParams) {
    try {
      const secretKey = this.getSecretKey();
      const publicKey = this.getPublicKey();
      const integrationIdStr = this.getIntegrationId();
      const clientUrl = this.getClientUrl();

      if (!secretKey || !publicKey) {
        throw new Error('مفاتيح Paymob غير مكتملة في الخادم');
      }

      const intIdNum = Number(integrationIdStr);
      const paymentMethods = !isNaN(intIdNum) && intIdNum > 0 ? [intIdNum] : [];

      const amountCents = Math.round(params.amountEgp * 100);
      const customer = params.customer || {
        firstName: 'عميل',
        lastName: 'بيس',
        email: 'customer@pes-store.com',
        phone: '+201000000000'
      };

      // رابط العودة التلقائية بعد الدفع إلى الموقع
      const redirectionUrl = `${clientUrl}/?paymob_callback=true&account_id=${encodeURIComponent(params.accountId)}`;

      const payload = {
        amount: amountCents,
        currency: 'EGP',
        payment_methods: paymentMethods,
        billing_data: {
          first_name: customer.firstName || 'عميل',
          last_name: customer.lastName || 'بيس',
          email: customer.email || 'customer@pes-store.com',
          phone_number: customer.phone || '+201000000000'
        },
        customer: {
          first_name: customer.firstName || 'عميل',
          last_name: customer.lastName || 'بيس',
          email: customer.email || 'customer@pes-store.com'
        },
        extras: {
          account_id: params.accountId,
          account_title: params.accountTitle
        },
        redirection_url: redirectionUrl
      };

      const res = await httpsPost(
        'https://accept.paymob.com/v1/intention/',
        {
          Authorization: `Token ${secretKey}`
        },
        payload
      );

      const clientSecret = res.client_secret;
      const orderId =
        res.intention_order_id ??
        res.intention_order?.id ??
        res.payment_keys?.[0]?.order_id ??
        res.order_id ??
        res.id;

      if (!clientSecret || orderId === undefined || orderId === null) {
        console.error('Paymob response missing orderId or clientSecret:', JSON.stringify(res));
        throw new Error('استجابة Paymob لا تحتوي على بيانات طلب دفع صالحة');
      }
      const checkoutUrl = `https://accept.paymob.com/unifiedcheckout/?publicKey=${publicKey}&clientSecret=${clientSecret}`;

      return {
        success: true,
        orderId: String(orderId),
        clientSecret,
        checkoutUrl,
        paymentUrl: checkoutUrl
      };
    } catch (err: any) {
      console.error('Paymob Intention Error:', err);
      throw err;
    }
  }

  /**
   * التحقق من حالة المعاملة عبر Paymob API الرسمي
   */
  public static async verifyTransaction(transactionId: string | number): Promise<{
    isSuccess: boolean;
    amountCents: number;
    currency: string;
    transaction: any;
  }> {
    try {
      const token = await this.getAuthToken();
      const tx = await httpsGet(
        `https://accept.paymob.com/api/acceptance/transactions/${transactionId}`,
        {
          Authorization: `Bearer ${token}`
        }
      );

      const isSuccess =
        tx &&
        tx.success === true &&
        tx.is_voided === false &&
        tx.is_refunded === false &&
        tx.pending === false;

      const amountCents = Number(tx.amount_cents);
      const currency = String(tx.currency || '');

      return {
        isSuccess: Boolean(isSuccess),
        amountCents,
        currency,
        transaction: tx
      };
    } catch (err: any) {
      console.error(`Paymob verifyTransaction (${transactionId}) Error:`, err.message);
      throw err;
    }
  }
}
