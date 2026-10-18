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

export class PaymobService {
  private static getSecretKey() {
    return (process.env.PAYMOB_SECRET_KEY || '').trim();
  }
  private static getPublicKey() {
    return (process.env.PAYMOB_PUBLIC_KEY || '').trim();
  }
  private static getIntegrationId() {
    return (process.env.PAYMOB_INTEGRATION_ID || '').trim();
  }

  /**
   * إنشاء جلسة دفع موحدة باستخدام Paymob Unified Intention API (الأحدث والأسرع)
   */
  public static async createPaymentSession(params: PaymobCheckoutParams) {
    try {
      const secretKey = this.getSecretKey();
      const publicKey = this.getPublicKey();
      const integrationIdStr = this.getIntegrationId();

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
        }
      };

      const res = await httpsPost(
        'https://accept.paymob.com/v1/intention/',
        {
          Authorization: `Token ${secretKey}`
        },
        payload
      );

      const clientSecret = res.client_secret;
      const checkoutUrl = `https://accept.paymob.com/unifiedcheckout/?publicKey=${publicKey}&clientSecret=${clientSecret}`;

      return {
        success: true,
        orderId: res.id || res.intention_order?.id || Date.now(),
        clientSecret,
        checkoutUrl,
        paymentUrl: checkoutUrl
      };
    } catch (err: any) {
      console.error('Paymob Intention Error:', err);
      throw err;
    }
  }
}
