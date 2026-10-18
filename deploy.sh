#!/bin/bash
# سكريبت النشر والتحديث التلقائي لمتجر بيس على Hostinger VPS

echo "🚀 بدء عملية تحديث ونشر المشروع..."

# 1. سحب أحدث كود من GitHub
echo "📦 سحب التحديثات من Git..."
git pull origin main

# 2. بناء الـ Backend
echo "⚙️ تثبيت وبناء الـ Backend..."
cd backend
npm install --production=false
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

echo "✅ تم نشر وتحديث المتجر بنجاح 🚀"
