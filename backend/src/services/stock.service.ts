import { prisma } from './prisma.service';

export interface ParsedAccountStock {
  email: string;
  password: string;
  codeUrl: string;
}

export class StockService {
  /**
   * Parse bulk text input where each line is formatted as:
   * email | password | codeUrl
   */
  static parseBulkAccounts(rawText: string): ParsedAccountStock[] {
    if (!rawText || typeof rawText !== 'string') return [];

    const lines = rawText.split(/\r?\n/);
    const results: ParsedAccountStock[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Split by |
      const parts = line.split('|').map((p) => p.trim());
      if (parts.length >= 2) {
        const email = parts[0];
        const password = parts[1];
        const codeUrl = parts[2] || 'http://mail.lutianqiwy.xyz/';

        if (email && password) {
          results.push({ email, password, codeUrl });
        }
      }
    }

    return results;
  }

  /**
   * Add multiple stock accounts to a specific PES listing
   */
  static async addBulkStock(accountId: string, rawTextOrItems: string | ParsedAccountStock[]) {
    const items = typeof rawTextOrItems === 'string'
      ? this.parseBulkAccounts(rawTextOrItems)
      : rawTextOrItems;

    if (items.length === 0) return { addedCount: 0 };

    await prisma.accountStock.createMany({
      data: items.map((item) => ({
        accountId,
        email: item.email,
        password: item.password,
        codeUrl: item.codeUrl,
      })),
    });

    // Mark listing as available
    await prisma.pesAccount.update({
      where: { id: accountId },
      data: { isAvailable: true },
    });

    const totalStock = await prisma.accountStock.count({ where: { accountId } });
    return { addedCount: items.length, totalStock };
  }

  /**
   * Get available stock count and items for an account
   */
  static async getStock(accountId: string) {
    const [stocks, count] = await Promise.all([
      prisma.accountStock.findMany({
        where: { accountId },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.accountStock.count({ where: { accountId } }),
    ]);

    return { count, stocks };
  }

  /**
   * Deliver one account to the buyer and delete it from stock immediately
   */
  static async purchaseAndDeliverOne(accountId: string, buyerPhone?: string, transactionId?: string) {
    try {
      return await prisma.$transaction(async (tx) => {
        // If transactionId is supplied, check if already fulfilled
        if (transactionId) {
          const existingSale = await tx.soldAccount.findFirst({
            where: { transactionId },
          });
          if (existingSale) {
            return {
              success: true,
              deliveredAccount: {
                accountId: existingSale.accountId,
                accountTitle: existingSale.accountTitle,
                email: existingSale.email,
                password: existingSale.password,
                codeUrl: existingSale.codeUrl,
                price: existingSale.price,
              },
              alreadyDelivered: true,
            };
          }
        }

        const account = await tx.pesAccount.findUnique({
          where: { id: accountId },
        });

        if (!account) {
          throw new Error('الحساب المطلوب غير موجود في المتجر');
        }

        // Find the first available stock item
        const stockItem = await tx.accountStock.findFirst({
          where: { accountId },
          orderBy: { createdAt: 'asc' },
        });

        if (!stockItem) {
          // Auto update availability to false
          await tx.pesAccount.update({
            where: { id: accountId },
            data: { isAvailable: false, badge: 'نفد المخزون 🔴' },
          });
          throw new Error('نفدت الكمية المتوفرة من هذا الحساب حالياً! يرجى اختيار حساب آخر');
        }

        // Archive in SoldAccount history
        await tx.soldAccount.create({
          data: {
            accountId: account.id,
            accountTitle: account.title,
            email: stockItem.email,
            password: stockItem.password,
            codeUrl: stockItem.codeUrl,
            price: account.price,
            buyerPhone: buyerPhone || null,
            transactionId: transactionId || null,
          },
        });

        // Delete from active stock so it can never be used again
        await tx.accountStock.delete({
          where: { id: stockItem.id },
        });

        // Check remaining stock
        const remainingStock = await tx.accountStock.count({ where: { accountId } });
        if (remainingStock === 0) {
          await tx.pesAccount.update({
            where: { id: accountId },
            data: { isAvailable: false, badge: 'تم البيع بالكامل 🔴' },
          });
        }

        return {
          success: true,
          deliveredAccount: {
            accountId: account.id,
            accountTitle: account.title,
            email: stockItem.email,
            password: stockItem.password,
            codeUrl: stockItem.codeUrl,
            platform: account.platform,
            price: account.price,
          },
          remainingStock,
        };
      });
    } catch (err: any) {
      // If unique constraint failed on transactionId, another concurrent request just fulfilled it!
      if (transactionId && (err.code === 'P2002' || String(err?.message || '').includes('Unique constraint'))) {
        const existingSale = await prisma.soldAccount.findFirst({
          where: { transactionId },
        });
        if (existingSale) {
          return {
            success: true,
            deliveredAccount: {
              accountId: existingSale.accountId,
              accountTitle: existingSale.accountTitle,
              email: existingSale.email,
              password: existingSale.password,
              codeUrl: existingSale.codeUrl,
              price: existingSale.price,
            },
            alreadyDelivered: true,
          };
        }
      }
      throw err;
    }
  }
}
