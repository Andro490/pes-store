import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

export interface PesAccount {
  id: string;
  title: string;
  platform: 'android' | 'ios';
  price: number;
  oldPrice?: number;
  currency: string;
  teamStrength: number;
  coins: number;
  gp: string;
  epicCount: number;
  highlightPlayers: string[];
  loginMethod: string;
  isAvailable: boolean;
  featured: boolean;
  badge?: string;
  imageUrl: string;
  details: string;
}

const dataFilePath = path.join(__dirname, '../../data/accounts.json');

// دوال مساعدة للقراءة والكتابة في JSON
const readAccounts = (): PesAccount[] => {
  try {
    if (!fs.existsSync(dataFilePath)) {
      return [];
    }
    const data = fs.readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading accounts.json:', err);
    return [];
  }
};

const writeAccounts = (accounts: PesAccount[]): boolean => {
  try {
    const dir = path.dirname(dataFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(accounts, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing accounts.json:', err);
    return false;
  }
};

const router = Router();

// 1. GET /api/pes-accounts (جلب الحسابات مع الفلاتر)
router.get('/', (req: Request, res: Response) => {
  const { platform, search, maxPrice, status } = req.query;

  let accounts = readAccounts();

  // فلترة حسب المنصة
  if (platform && (platform === 'android' || platform === 'ios')) {
    accounts = accounts.filter(acc => acc.platform === platform);
  }

  // فلترة حسب الحالة (متاح / تم الدفع)
  if (status === 'available') {
    accounts = accounts.filter(acc => acc.isAvailable === true);
  } else if (status === 'paid' || status === 'sold') {
    accounts = accounts.filter(acc => acc.isAvailable === false);
  }

  // فلترة بالبحث
  if (search && typeof search === 'string') {
    const s = search.toLowerCase();
    accounts = accounts.filter(acc =>
      acc.title.toLowerCase().includes(s) ||
      acc.highlightPlayers.some(p => p.toLowerCase().includes(s)) ||
      acc.details.toLowerCase().includes(s)
    );
  }

  // فلترة بأعلى سعر
  if (maxPrice && !isNaN(Number(maxPrice))) {
    accounts = accounts.filter(acc => acc.price <= Number(maxPrice));
  }

  res.json({
    success: true,
    count: accounts.length,
    data: accounts
  });
});

// 2. GET /api/pes-accounts/:id (جلب حساب محدد)
router.get('/:id', (req: Request, res: Response) => {
  const accounts = readAccounts();
  const account = accounts.find(a => a.id === req.params.id);
  if (!account) {
    res.status(404).json({ success: false, message: 'الحساب غير موجود' });
    return;
  }
  res.json({ success: true, data: account });
});

// 3. POST /api/pes-accounts (إضافة حساب جديد من لوحة التحكم)
router.post('/', (req: Request, res: Response) => {
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
      featured
    } = req.body;

    if (!title || !price || !platform) {
      res.status(400).json({ success: false, message: 'العنوان والسعر ونظام الجهاز مطلوبة' });
      return;
    }

    const accounts = readAccounts();
    const newId = `pes-${Date.now().toString().slice(-4)}`;

    const newAccount: PesAccount = {
      id: newId,
      title: title.trim(),
      platform: platform === 'ios' ? 'ios' : 'android',
      price: Number(price),
      oldPrice: oldPrice ? Number(oldPrice) : undefined,
      currency: 'EGP',
      teamStrength: Number(teamStrength) || 3150,
      coins: Number(coins) || 0,
      gp: gp ? String(gp) : '1M',
      epicCount: Number(epicCount) || 10,
      highlightPlayers: Array.isArray(highlightPlayers)
        ? highlightPlayers
        : (highlightPlayers ? String(highlightPlayers).split(',').map(s => s.trim()) : ['Messi', 'Ronaldo']),
      loginMethod: loginMethod ? String(loginMethod) : 'Konami ID كامل البيانات والتغيير متاح',
      isAvailable: true,
      featured: Boolean(featured),
      badge: badge ? String(badge) : undefined,
      imageUrl: imageUrl && String(imageUrl).startsWith('http')
        ? String(imageUrl)
        : 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&auto=format&fit=crop&q=80',
      details: details ? String(details) : 'تشكيلة بيس مميزة بأعلى قوة وتناغم كامل.'
    };

    accounts.unshift(newAccount);
    writeAccounts(accounts);

    res.status(201).json({
      success: true,
      message: 'تم إضافة الحساب بنجاح وعرضه في المتجر ✅',
      data: newAccount
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل حفظ الحساب', error: error.message });
  }
});

// 4. PUT /api/pes-accounts/:id (تعديل حساب)
router.put('/:id', (req: Request, res: Response) => {
  try {
    const accounts = readAccounts();
    const index = accounts.findIndex(a => a.id === req.params.id);

    if (index === -1) {
      res.status(404).json({ success: false, message: 'الحساب غير موجود' });
      return;
    }

    const existing = accounts[index];
    const updated: PesAccount = {
      ...existing,
      ...req.body,
      id: existing.id, // الحفاظ على نفس الـ ID
      price: req.body.price !== undefined ? Number(req.body.price) : existing.price,
      teamStrength: req.body.teamStrength !== undefined ? Number(req.body.teamStrength) : existing.teamStrength,
      coins: req.body.coins !== undefined ? Number(req.body.coins) : existing.coins,
      epicCount: req.body.epicCount !== undefined ? Number(req.body.epicCount) : existing.epicCount,
      highlightPlayers: Array.isArray(req.body.highlightPlayers)
        ? req.body.highlightPlayers
        : (req.body.highlightPlayers ? String(req.body.highlightPlayers).split(',').map((s: string) => s.trim()) : existing.highlightPlayers)
    };

    accounts[index] = updated;
    writeAccounts(accounts);

    res.json({
      success: true,
      message: 'تم تعديل بيانات الحساب بنجاح ✅',
      data: updated
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل تعديل الحساب', error: error.message });
  }
});

// 5. PATCH /api/pes-accounts/:id/toggle-paid (تبديل حالة تم الدفع / متاح)
router.patch('/:id/toggle-paid', (req: Request, res: Response) => {
  try {
    const accounts = readAccounts();
    const account = accounts.find(a => a.id === req.params.id);

    if (!account) {
      res.status(404).json({ success: false, message: 'الحساب غير موجود' });
      return;
    }

    account.isAvailable = !account.isAvailable;
    account.badge = !account.isAvailable ? 'تم الدفع 🔴' : undefined;

    writeAccounts(accounts);

    res.json({
      success: true,
      message: account.isAvailable ? 'تمت إعادة الحساب متاحاً للبيع 🟢' : 'تم تعيين الحساب كـ مدفوع / مباع 🔴',
      data: account
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل تغيير حالة الحساب', error: error.message });
  }
});

// 6. DELETE /api/pes-accounts/:id (حذف الحساب)
router.delete('/:id', (req: Request, res: Response) => {
  try {
    let accounts = readAccounts();
    const initialLen = accounts.length;
    accounts = accounts.filter(a => a.id !== req.params.id);

    if (accounts.length === initialLen) {
      res.status(404).json({ success: false, message: 'الحساب غير موجود' });
      return;
    }

    writeAccounts(accounts);

    res.json({
      success: true,
      message: 'تم حذف الحساب بنجاح 🗑️'
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل حذف الحساب', error: error.message });
  }
});

export default router;
