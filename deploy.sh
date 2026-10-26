#!/bin/bash
# سكريبت النشر والتحديث التلقائي لمتجر بيس على Hostinger VPS

echo "🚀 بدء عملية تحديث ونشر المشروع..."

# 1. سحب أحدث كود من GitHub
echo "📦 سحب التحديثات من Git..."
git pull origin main

# 2. بناء الـ Backend وتجهيز قاعدة البيانات
echo "⚙️ تثبيت وبناء الـ Backend وتجهيز قاعدة البيانات..."
cd backend
npm install --production=false
npx prisma generate
npx prisma db push
npm run build
cd ..

# 3. بناء الـ Frontend
echo "🎨 تثبيت وبناء الـ Frontend..."
cd frontend
npm install
npm run build
cd ..

# 4. إعادة تشغيل السيرفر عبر PM2
echo "🔄 إعادة تشغيل خدمة الـ Backend عبر PM2..."
pm2 restart pes-store-backend || pm2 start ecosystem.config.js
pm2 save

# 5. تحديث إعدادات Nginx
echo "🌐 تحديث وضبط Nginx..."
cp -f nginx.conf /etc/nginx/conf.d/pes-store.conf 2>/dev/null || true
nginx -t && systemctl reload nginx 2>/dev/null || true

echo "✅ تم نشر وتحديث المتجر بنجاح 🚀"
