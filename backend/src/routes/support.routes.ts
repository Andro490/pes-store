import { Router, Request, Response } from 'express';
import { prisma } from '../services/prisma.service';
import { authenticate, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();

function normalizePhone(phone: string): string {
  return String(phone).trim().replace(/[^\d+]/g, '').slice(0, 30);
}

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

    res.json({ success: true, data: created });
  } catch (error: any) {
    console.error('Support message error:', error);
    res.status(500).json({ success: false, message: 'فشل إرسال الرسالة' });
  }
});

// 2. GET /api/support/messages/:phone (Admin reads a conversation)
router.get('/messages/:phone', authenticate, authorizeRoles('admin'), async (req: Request, res: Response) => {
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
