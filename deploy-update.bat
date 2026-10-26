@echo off
chcp 65001 >nul
echo ========================================================
echo   🚀 جاري تجهيز ورفع المتجر إلى سيرفر Hostinger VPS
echo   نظام التشغيل: AlmaLinux 10
echo   IP: 72.60.190.38
echo   الدومين: pes.fouadf9.network
echo ========================================================
echo.

echo [1/5] بناء الفرونت إند (Frontend Build)...
cd /d "%~dp0frontend"
call npm run build
if %errorlevel% neq 0 (
    echo [X] فشل بناء الفرونت إند!
    pause
    exit /b %errorlevel%
)

echo.
echo [2/5] بناء الباك إند (Backend Build)...
cd /d "%~dp0backend"
call npm run build
if %errorlevel% neq 0 (
    echo [X] فشل بناء الباك إند!
    pause
    exit /b %errorlevel%
)

echo.
echo [3/5] إنشاء المجلدات المطلوبة على السيرفر...
ssh root@72.60.190.38 "mkdir -p /var/www/pes-store/frontend /var/www/pes-store/backend/prisma /etc/nginx/conf.d /etc/nginx/sites-available /etc/nginx/sites-enabled /var/www/certbot"

echo.
echo [4/5] رفع الملفات المحدثة إلى السيرفر عبر SCP...
cd /d "%~dp0"
scp "ecosystem.config.js" root@72.60.190.38:/var/www/pes-store/
scp "backend\package.json" root@72.60.190.38:/var/www/pes-store/backend/
scp "backend\.env.production" root@72.60.190.38:/var/www/pes-store/backend/.env
scp -r "frontend\dist" root@72.60.190.38:/var/www/pes-store/frontend/
scp -r "backend\dist" root@72.60.190.38:/var/www/pes-store/backend/
scp -r "backend\src" root@72.60.190.38:/var/www/pes-store/backend/
scp "backend\prisma\schema.prisma" root@72.60.190.38:/var/www/pes-store/backend/prisma/schema.prisma
scp "nginx.conf" root@72.60.190.38:/etc/nginx/conf.d/pes-store.conf
scp "nginx.conf" root@72.60.190.38:/etc/nginx/sites-available/pes-store

echo.
echo [5/5] تثبيت حزم الباك إند وتشغيل الخدمة عبر PM2...
ssh root@72.60.190.38 "cd /var/www/pes-store/backend && npm install --production=false && npx prisma generate && npx prisma db push && cd /var/www/pes-store && (pm2 restart pes-store-backend || pm2 start ecosystem.config.js) && pm2 save"
if %errorlevel% neq 0 (
    echo [X] حدث خطأ أثناء تشغيل الباك إند عبر PM2!
    pause
    exit /b %errorlevel%
)

echo.
echo التحقق من Nginx وإعادة تشغيله...
ssh root@72.60.190.38 "nginx -t && systemctl reload nginx"
if %errorlevel% neq 0 (
    echo [!] تنبيه: تحقق من شهادة SSL أو إعدادات Nginx عبر السيرفر.
)

echo.
echo ========================================================
echo   ✅ تم رفع وتطبيق كافة الملفات على السيرفر بنجاح!
echo   رابط المتجر: https://pes.fouadf9.network
echo   لوحة تحكم الإدارة: https://pes.fouadf9.network/admfoad
echo ========================================================
pause
