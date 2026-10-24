import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

export const prisma = new PrismaClient();

/**
 * Seed existing accounts from accounts.json into SQLite DB on first run if database is empty.
 * Once seeded, the database is independent and will never be overwritten.
 */
export async function seedInitialAccountsIfEmpty(): Promise<void> {
  try {
    const count = await prisma.pesAccount.count();
    if (count > 0) {
      // Database already has records, no need to seed
      return;
    }

    const jsonPath = path.join(__dirname, '../../data/accounts.json');
    if (!fs.existsSync(jsonPath)) {
      return;
    }

    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const accounts = JSON.parse(rawData);

    if (Array.isArray(accounts) && accounts.length > 0) {
      console.log(`📦 جاري تهيئة قاعدة البيانات بـ ${accounts.length} حسابات أولية...`);
      for (const acc of accounts) {
        await prisma.pesAccount.create({
          data: {
            id: acc.id,
            title: acc.title,
            platform: acc.platform,
            price: Number(acc.price),
            oldPrice: acc.oldPrice ? Number(acc.oldPrice) : null,
            currency: acc.currency || 'EGP',
            teamStrength: Number(acc.teamStrength || 3000),
            coins: Number(acc.coins || 0),
            gp: acc.gp ? String(acc.gp) : '1M',
            epicCount: Number(acc.epicCount || 0),
            highlightPlayers: JSON.stringify(acc.highlightPlayers || []),
            loginMethod: acc.loginMethod || 'Konami ID',
            isAvailable: acc.isAvailable !== false,
            featured: Boolean(acc.featured),
            badge: acc.badge || null,
            imageUrl: acc.imageUrl || '',
            details: acc.details || '',
          },
        });
      }
      console.log('✅ تمت تهيئة قاعدة البيانات بنجاح!');
    }
  } catch (error) {
    console.error('Error during initial database seed:', error);
  }
}
