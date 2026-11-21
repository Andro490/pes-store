import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';
import { prisma } from '../services/prisma.service';
import { StockService } from '../services/stock.service';

export interface PesAccount {
  id: string;
  title: string;
  platform: 'android' | 'ios';
  price: number;
  oldPrice?: number | null;
  currency: string;
  teamStrength: number;
  coins: number;
  gp: string;
  epicCount: number;
  highlightPlayers: string[];
  loginMethod: string;
  isAvailable: boolean;
  featured: boolean;
  badge?: string | null;
  imageUrl: string;
  details: string;
  stockCount?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const router = Router();

// 1. GET /api/pes-accounts (جلب الحسابات من قاعدة البيانات مع الفلاتر)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { platform, search, maxPrice, status } = req.query;

    const where: Prisma.PesAccountWhereInput = {};

    if (platform && (platform === 'android' || platform === 'ios')) {
      where.platform = platform;
    }

    if (status === 'available') {
      where.isAvailable = true;
    } else if (status === 'paid' || status === 'sold') {
      where.isAvailable = false;
    }

    if (maxPrice && !isNaN(Number(maxPrice))) {
      where.price = { lte: Number(maxPrice) };
    }

    const accounts = await prisma.pesAccount.findMany({
      where,
      orderBy: [
        { isAvailable: 'desc' },
        { coins: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // تحويل highlightPlayers من JSON string إلى مصفوفة
    let formatted: PesAccount[] = accounts.map((acc: any) => {
      let players: string[] = [];
      try {
        players = JSON.parse(acc.highlightPlayers);
      } catch {
        players = [];
      }
      return {
        ...acc,
        platform: acc.platform as 'android' | 'ios',
        highlightPlayers: players,
        isAvailable: Boolean(acc.isAvailable),
      };
    });

    if (search && typeof search === 'string') {
      const s = search.toLowerCase();
      formatted = formatted.filter(
        (acc) =>
          acc.title.toLowerCase().includes(s) ||
          acc.highlightPlayers.some((p) => p.toLowerCase().includes(s)) ||
          acc.details.toLowerCase().includes(s)
      );
    }

    res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل جلب الحسابات من قاعدة البيانات', error: error.message });
  }
});

// 2. GET /api/pes-accounts/:id (جلب حساب محدد)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const account = await prisma.pesAccount.findUnique({
      where: { id: req.params.id },
    });

    if (!account) {
      res.status(404).json({ success: false, message: 'الحساب غير موجود' });
      return;
    }

    let players: string[] = [];
    try {
      players = JSON.parse(account.highlightPlayers);
    } catch {
      players = [];
    }

    res.json({
      success: true,
      data: {
        ...account,
        platform: account.platform as 'android' | 'ios',
        highlightPlayers: players,
        isAvailable: Boolean(account.isAvailable),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل جلب الحساب', error: error.message });
  }
});

// 2.1 POST /api/pes-accounts/:id/instant-purchase (شراء مباشر وتسليم فوري للحساب وحذفه من المخزون)
router.post('/:id/instant-purchase', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const account = await prisma.pesAccount.findUnique({
      where: { id },
      include: {
        _count: {
          select: { stocks: true },
        },
      },
    });

    if (!account) {
      res.status(404).json({ success: false, message: 'الحساب المطلوب غير موجود في المتجر' });
      return;
    }

    const stockCount = account._count?.stocks ?? 0;
    if (!account.isAvailable || stockCount === 0) {
      res.status(400).json({
        success: false,
        message: 'عذراً! نفد مخزون هذا الحساب بالكامل من المتجر، لا يمكن الشراء حالياً 🔴',
      });
      return;
    }

    const deliveryResult = await StockService.purchaseAndDeliverOne(
      id,
      undefined,
      `instant_${Date.now()}`
    );

    res.json({
      success: true,
      message: 'تم الشراء وتسليم الحساب بنجاح 🎉',
      data: {
        deliveredAccount: deliveryResult.deliveredAccount,
      },
    });
  } catch (error: any) {
    console.error('Instant purchase error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'فشل في سحب وتسليم الحساب من المخزون',
    });
  }
});

// 3. POST /api/pes-accounts (إضافة حساب جديد إلى قاعدة البيانات من لوحة التحكم)
router.post('/', authenticate, authorizeRoles('admin'), async (req: Request, res: Response) => {
  try {
    const {
      title,
      platform,
      price,
      oldPrice,
      teamStrength,
      coins,
      gp,
      epicCount,
      highlightPlayers,
      loginMethod,
      badge,
      imageUrl,
      details,
      featured,
      bulkAccounts,
    } = req.body;

    if (!title || !price || !platform) {
      res.status(400).json({ success: false, message: 'العنوان والسعر ونظام الجهاز مطلوبة' });
      return;
    }

    const newId = `pes-${Date.now().toString().slice(-4)}`;
    const playersArray = Array.isArray(highlightPlayers)
      ? highlightPlayers
      : highlightPlayers
      ? String(highlightPlayers).split(',').map((s) => s.trim())
      : ['Messi', 'Ronaldo'];

    const created = await prisma.pesAccount.create({
      data: {
        id: newId,
        title: String(title).trim(),
        platform: platform === 'ios' ? 'ios' : 'android',
        price: Number(price),
        oldPrice: oldPrice ? Number(oldPrice) : null,
        currency: 'EGP',
        teamStrength: Number(teamStrength) || 3150,
        coins: Number(coins) || 0,
        gp: gp ? String(gp) : '1M',
        epicCount: Number(epicCount) || 10,
        highlightPlayers: JSON.stringify(playersArray),
        loginMethod: loginMethod ? String(loginMethod) : 'Konami ID كامل البيانات والتغيير متاح',
        isAvailable: true,
        featured: Boolean(featured),
        badge: badge ? String(badge) : null,
        imageUrl: imageUrl && String(imageUrl).startsWith('http')
          ? String(imageUrl)
          : 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80',
        details: details ? String(details) : 'تشكيلة بيس مميزة بأعلى قوة وتناغم كامل.',
      },
    });

    res.status(201).json({
      success: true,
      message: 'تم حفظ الحساب بنجاح وعرضه في المتجر ✅',
      data: {
        ...created,
        platform: created.platform as 'android' | 'ios',
        highlightPlayers: playersArray,
        isAvailable: true,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل حفظ الحساب في قاعدة البيانات', error: error.message });
  }
});

// 4. PUT /api/pes-accounts/:id (تعديل حساب في قاعدة البيانات)
router.put('/:id', authenticate, authorizeRoles('admin'), async (req: Request, res: Response) => {
  try {
    const existing = await prisma.pesAccount.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'الحساب غير موجود' });
      return;
    }

    const dataToUpdate: any = {};
    if (req.body.title !== undefined) dataToUpdate.title = String(req.body.title).trim();
    if (req.body.platform !== undefined) dataToUpdate.platform = req.body.platform === 'ios' ? 'ios' : 'android';
    if (req.body.price !== undefined) dataToUpdate.price = Number(req.body.price);
    if (req.body.oldPrice !== undefined) dataToUpdate.oldPrice = req.body.oldPrice ? Number(req.body.oldPrice) : null;
    if (req.body.teamStrength !== undefined) dataToUpdate.teamStrength = Number(req.body.teamStrength);
    if (req.body.coins !== undefined) dataToUpdate.coins = Number(req.body.coins);
    if (req.body.gp !== undefined) dataToUpdate.gp = String(req.body.gp);
    if (req.body.epicCount !== undefined) dataToUpdate.epicCount = Number(req.body.epicCount);
    if (req.body.loginMethod !== undefined) dataToUpdate.loginMethod = String(req.body.loginMethod);
    if (req.body.isAvailable !== undefined) dataToUpdate.isAvailable = Boolean(req.body.isAvailable);
    if (req.body.featured !== undefined) dataToUpdate.featured = Boolean(req.body.featured);
    if (req.body.badge !== undefined) dataToUpdate.badge = req.body.badge ? String(req.body.badge) : null;
    if (req.body.imageUrl !== undefined) dataToUpdate.imageUrl = String(req.body.imageUrl);
    if (req.body.details !== undefined) dataToUpdate.details = String(req.body.details);

    if (req.body.highlightPlayers !== undefined) {
      const playersArray = Array.isArray(req.body.highlightPlayers)
        ? req.body.highlightPlayers
        : String(req.body.highlightPlayers).split(',').map((s) => s.trim());
      dataToUpdate.highlightPlayers = JSON.stringify(playersArray);
    }

    const updated = await prisma.pesAccount.update({
      where: { id: req.params.id },
      data: dataToUpdate,
    });

    let players: string[] = [];
    try {
      players = JSON.parse(updated.highlightPlayers);
    } catch {
      players = [];
    }

    res.json({
      success: true,
      message: 'تم تعديل بيانات الحساب في قاعدة البيانات بنجاح ✅',
      data: {
        ...updated,
        platform: updated.platform as 'android' | 'ios',
        highlightPlayers: players,
        isAvailable: Boolean(updated.isAvailable),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل تعديل الحساب في قاعدة البيانات', error: error.message });
  }
});

// 5. PATCH /api/pes-accounts/:id/toggle-paid (تبديل حالة تم الدفع / متاح)
router.patch('/:id/toggle-paid', authenticate, authorizeRoles('admin'), async (req: Request, res: Response) => {
  try {
    const existing = await prisma.pesAccount.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'الحساب غير موجود' });
      return;
    }

    const nextAvailable = !existing.isAvailable;
    const nextBadge = !nextAvailable ? 'نفد المخزون 🔴' : null;

    const updated = await prisma.pesAccount.update({
      where: { id: req.params.id },
      data: {
        isAvailable: nextAvailable,
        badge: nextBadge,
      },
    });

    let players: string[] = [];
    try {
      players = JSON.parse(updated.highlightPlayers);
    } catch {
      players = [];
    }

    res.json({
      success: true,
      message: updated.isAvailable ? 'تمت إعادة الحساب متاحاً للبيع 🟢' : 'تم تعيين الحساب كـ غير متاح / نفد المخزون 🔴',
      data: {
        ...updated,
        platform: updated.platform as 'android' | 'ios',
        highlightPlayers: players,
        isAvailable: updated.isAvailable,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل تغيير حالة الحساب', error: error.message });
  }
});

// 5.1 PATCH /api/pes-accounts/:id/discount (تطبيق أو إلغاء نسبة التخفيض)
router.patch('/:id/discount', authenticate, authorizeRoles('admin'), async (req: Request, res: Response) => {
  try {
    const { percentage } = req.body; // رقم النسبة مثلاً 20 أو 0 أو null لإلغاء التخفيض
    const existing = await prisma.pesAccount.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'الحساب غير موجود' });
      return;
    }

    const discountNum = Number(percentage);

    if (isNaN(discountNum) || discountNum <= 0) {
      // إزالة التخفيض وإعادة السعر الأصلي إذا كان موجوداً
      const originalPrice = existing.oldPrice && existing.oldPrice > existing.price ? existing.oldPrice : existing.price;
      const cleanBadge = existing.badge && existing.badge.includes('خصم') ? null : existing.badge;

      const updated = await prisma.pesAccount.update({
        where: { id: req.params.id },
        data: {
          price: originalPrice,
          oldPrice: null,
          badge: cleanBadge,
        },
      });

      let players: string[] = [];
      try { players = JSON.parse(updated.highlightPlayers); } catch { players = []; }

      res.json({
        success: true,
        message: 'تم إزالة التخفيض واسترجاع السعر الأصلي بنجاح ✅',
        data: {
          ...updated,
          platform: updated.platform as 'android' | 'ios',
          highlightPlayers: players,
          isAvailable: updated.isAvailable,
        },
      });
      return;
    }

    if (discountNum >= 100) {
      res.status(400).json({ success: false, message: 'نسبة التخفيض يجب أن تكون أقل من 100%' });
      return;
    }

    // حساب السعر الأصلي والسعر الجديد
    const basePrice = existing.oldPrice && existing.oldPrice > existing.price ? existing.oldPrice : existing.price;
    const newPrice = Math.round(basePrice * (1 - discountNum / 100));

    const updated = await prisma.pesAccount.update({
      where: { id: req.params.id },
      data: {
        oldPrice: basePrice,
        price: newPrice,
        badge: `خصم ${discountNum}% 🔥`,
      },
    });

    let players: string[] = [];
    try { players = JSON.parse(updated.highlightPlayers); } catch { players = []; }

    res.json({
      success: true,
      message: `تم تطبيق خصم ${discountNum}% بنجاح! السعر الجديد: ${newPrice} ج.م`,
      data: {
        ...updated,
        platform: updated.platform as 'android' | 'ios',
        highlightPlayers: players,
        isAvailable: updated.isAvailable,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل تطبيق التخفيض', error: error.message });
  }
});

// 6. DELETE /api/pes-accounts/:id (حذف الحساب من قاعدة البيانات)
router.delete('/:id', authenticate, authorizeRoles('admin'), async (req: Request, res: Response) => {
  try {
    const existing = await prisma.pesAccount.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'الحساب غير موجود' });
      return;
    }

    await prisma.pesAccount.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: 'تم حذف الحساب من قاعدة البيانات بنجاح 🗑️',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل حذف الحساب', error: error.message });
  }
});

// 8. GET /api/pes-accounts/:id/stock (جلب المخزون لهذا الحساب - للوحة الأدمن)
router.get('/:id/stock', authenticate, authorizeRoles('admin'), async (req: Request, res: Response) => {
  try {
    const stockData = await StockService.getStock(req.params.id);
    res.json({
      success: true,
      data: stockData,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل جلب المخزون', error: error.message });
  }
});

// 9. POST /api/pes-accounts/:id/stock (إضافة مخزون إضافي لحساب - للوحة الأدمن)
router.post('/:id/stock', authenticate, authorizeRoles('admin'), async (req: Request, res: Response) => {
  try {
    const { bulkAccounts } = req.body;
    if (!bulkAccounts || typeof bulkAccounts !== 'string') {
      res.status(400).json({ success: false, message: 'يرجى إرسال بيانات الحسابات بصيغة صحيحة' });
      return;
    }

    const result = await StockService.addBulkStock(req.params.id, bulkAccounts);
    res.json({
      success: true,
      message: `تمت إضافة ${result.addedCount} حسابات للمخزون بنجاح!`,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل إضافة الحسابات للمخزون', error: error.message });
  }
});

// 10. DELETE /api/pes-accounts/stock/:stockId (حذف حساب يدوي من المخزون)
router.delete('/stock/:stockId', authenticate, authorizeRoles('admin'), async (req: Request, res: Response) => {
  try {
    const { stockId } = req.params;
    await prisma.accountStock.delete({
      where: { id: stockId },
    });
    res.json({
      success: true,
      message: 'تم حذف الحساب من المخزون بنجاح',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل حذف الحساب من المخزون', error: error.message });
  }
});

export default router;
