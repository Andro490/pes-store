import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../services/prisma.service';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

function normalizePhone(phone: string): string {
  return String(phone).trim().replace(/[^\d+]/g, '').slice(0, 30);
}

function generateChatToken(phone: string, deviceId?: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is missing');
  return jwt.sign(
    { phone: normalizePhone(phone), deviceId: deviceId || '', role: 'chat_user' },
    secret,
    { expiresIn: '90d' }
  );
}

function canAccessChat(req: Request, targetPhone: string): boolean {
  const cleanTarget = normalizePhone(targetPhone);

  // 1. Is it an authenticated admin via cookie or bearer?
  const cookieToken = (req as any).cookies?.admin_token;
  const authHeader = req.headers.authorization;
  const adminToken = cookieToken || (authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined);
  if (adminToken) {
    try {
      const secret = process.env.JWT_SECRET;
      if (secret) {
        const decoded = jwt.verify(adminToken, secret) as any;
        if (decoded && decoded.role === 'admin') return true;
      }
    } catch {}
  }

  // 2. Is it the customer who has the valid chat token?
  const chatToken =
    (req.headers['x-chat-token'] as string) ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : undefined);

  if (chatToken) {
    try {
      const secret = process.env.JWT_SECRET;
      if (secret) {
        const decoded = jwt.verify(chatToken, secret) as any;
        if (decoded && decoded.role === 'chat_user' && normalizePhone(decoded.phone) === cleanTarget) {
          return true;
        }
      }
    } catch {}
  }

  return false;
}

// 0. POST /api/support/session (Issue chat session token for the customer's device)
router.post('/session', (req: Request, res: Response) => {
  const { phone } = req.body;
  const cleanPhone = normalizePhone(phone);
  if (!cleanPhone || cleanPhone.length < 5 || !/^\+?[0-9]{8,15}$/.test(cleanPhone)) {
    res.status(400).json({ success: false, message: 'رقم هاتف غير صالح' });
    return;
  }
  const deviceId = (req.headers['x-device-id'] as string) || '';
  const chatToken = generateChatToken(cleanPhone, deviceId);
  res.json({ success: true, chatToken });
});

// 1. POST /api/support/message (User sends a message with mandatory phone)
router.post('/message', async (req: Request, res: Response) => {
  try {
    const { phone, message } = req.body;
    const cleanPhone = normalizePhone(phone);

    if (!cleanPhone || cleanPhone.length < 5 || !/^\+?[0-9]{8,15}$/.test(cleanPhone)) {
      res.status(400).json({ success: false, message: 'رقم الموبايل مطلوب وصحيح قبل إرسال الرسالة' });
      return;
    }

    if (!message || !String(message).trim()) {
      res.status(400).json({ success: false, message: 'محتوى الرسالة مطلوب' });
      return;
    }

    const cleanMessage = String(message).trim().replace(/<[^>]*>?/gm, '').slice(0, 1000);

    const created = await (prisma as any).supportMessage.create({
      data: {
        phone: cleanPhone,
        sender: 'user',
        message: cleanMessage,
        isRead: false,
      },
    });

    // الرد التلقائي: إذا لم يتم إرسال رد تلقائي خلال آخر 12 ساعة
    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const recentAutoReply = await (prisma as any).supportMessage.findFirst({
      where: {
        phone: cleanPhone,
        sender: 'admin',
        createdAt: { gte: twelveHoursAgo },
      },
    });

    if (!recentAutoReply) {
      await (prisma as any).supportMessage.create({
        data: {
          phone: cleanPhone,
          sender: 'admin',
          message: 'أهلاً بك! تم استلام رسالتك، سيتم الرد عليك والتواصل معك خلال 24 ساعة ⏳',
          isRead: false,
        },
      });
    }

    const deviceId = (req.headers['x-device-id'] as string) || '';
    const chatToken = generateChatToken(cleanPhone, deviceId);
    res.json({ success: true, data: created, chatToken });
  } catch (error: any) {
    console.error('Support message error:', error);
    res.status(500).json({ success: false, message: 'فشل إرسال الرسالة' });
  }
});

// 2. GET /api/support/messages/:phone (Fetch conversation messages)
router.get('/messages/:phone', async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;

    if (!phone) {
      res.status(400).json({ success: false, message: 'رقم الموبايل مطلوب' });
      return;
    }

    const cleanPhone = normalizePhone(phone);

    if (!cleanPhone || !/^\+?[0-9]{8,15}$/.test(cleanPhone)) {
      res.status(400).json({ success: false, message: 'رقم الموبايل مطلوب' });
      return;
    }

    if (!canAccessChat(req, cleanPhone)) {
      res.status(403).json({ success: false, message: 'غير مصرح بالاطلاع على هذه المحادثة الخاصة.' });
      return;
    }

    const messages = await (prisma as any).supportMessage.findMany({
      where: { phone: cleanPhone },
      orderBy: { createdAt: 'asc' },
    });

    res.json({ success: true, data: messages });
  } catch (error: any) {
    console.error('Fetch support messages error:', error);
    res.status(500).json({ success: false, message: 'فشل جلب الرسائل' });
  }
});

// 3. GET /api/support/conversations (Admin gets all conversations grouped by phone)
router.get('/conversations', authenticate, authorizeRoles('admin'), async (_req: Request, res: Response) => {
  try {
    const messages = await (prisma as any).supportMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Group by phone
    const conversationsMap = new Map<string, {
      phone: string;
      lastMessage: string;
      lastSender: string;
      lastTime: Date;
      unreadCount: number;
      totalMessages: number;
    }>();

    for (const msg of messages) {
      if (!conversationsMap.has(msg.phone)) {
        conversationsMap.set(msg.phone, {
          phone: msg.phone,
          lastMessage: msg.message,
          lastSender: msg.sender,
          lastTime: msg.createdAt,
          unreadCount: msg.sender === 'user' && !msg.isRead ? 1 : 0,
          totalMessages: 1,
        });
      } else {
        const conv = conversationsMap.get(msg.phone)!;
        conv.totalMessages += 1;
        if (msg.sender === 'user' && !msg.isRead) {
          conv.unreadCount += 1;
        }
      }
    }

    const conversations = Array.from(conversationsMap.values());
    res.json({ success: true, data: conversations });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل جلب المحادثات', error: error.message });
  }
});

// 4. POST /api/support/reply (Admin replies to a conversation)
router.post('/reply', authenticate, authorizeRoles('admin'), async (req: Request, res: Response) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !String(phone).trim()) {
      res.status(400).json({ success: false, message: 'رقم الموبايل مطلوب' });
      return;
    }

    if (!message || !String(message).trim()) {
      res.status(400).json({ success: false, message: 'الرد مطلوب' });
      return;
    }

    const cleanPhone = String(phone).trim();
    const cleanMessage = String(message).trim();

    // Mark previous user messages as read
    await (prisma as any).supportMessage.updateMany({
      where: { phone: cleanPhone, sender: 'user', isRead: false },
      data: { isRead: true },
    });

    // Create admin message
    const replyMsg = await (prisma as any).supportMessage.create({
      data: {
        phone: cleanPhone,
        sender: 'admin',
        message: cleanMessage,
        isRead: true,
      },
    });

    res.json({ success: true, data: replyMsg });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل إرسال الرد', error: error.message });
  }
});

// 5. DELETE /api/support/conversations/:phone (Admin deletes a conversation)
router.delete('/conversations/:phone', authenticate, authorizeRoles('admin'), async (req: Request, res: Response) => {
  try {
    const { phone } = req.params;
    if (!phone) {
      res.status(400).json({ success: false, message: 'رقم الموبايل مطلوب' });
      return;
    }

    await (prisma as any).supportMessage.deleteMany({
      where: { phone: String(phone).trim() },
    });

    res.json({ success: true, message: 'تم حذف المحادثة بنجاح' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'فشل حذف المحادثة', error: error.message });
  }
});

export default router;
