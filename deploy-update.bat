@echo off
chcp 65001 >nul
echo ========================================================
echo   🚀 جاري تجهيز ورفع التحديثات إلى سيرفر Hostinger VPS
echo   IP: 72.60.190.38
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
echo [3/5] التحقق من وجود شهادة HTTPS صالحة قبل النشر...
ssh root@72.60.190.38 "test -f /etc/letsencrypt/live/pes.fouadf9.network/fullchain.pem && test -f /etc/letsencrypt/live/pes.fouadf9.network/privkey.pem"
if %errorlevel% neq 0 (
    echo [X] لم يتم العثور على شهادة Let's Encrypt للنطاق pes.fouadf9.network.
    echo ثبّت الشهادة أولاً ثم أعد تشغيل سكريبت النشر.
    pause
    exit /b %errorlevel%
)

echo.
echo [4/5] رفع الملفات المحدثة إلى السيرفر عبر SCP...
echo سيُطلب منك إدخال كلمة مرور السيرفر (Root Password):
echo.

cd /d "%~dp0"
scp "backend\package.json" root@72.60.190.38:/var/www/pes-store/backend/
scp -r "frontend\dist" root@72.60.190.38:/var/www/pes-store/frontend/
scp -r "backend\dist" root@72.60.190.38:/var/www/pes-store/backend/
scp -r "backend\src" root@72.60.190.38:/var/www/pes-store/backend/
ssh root@72.60.190.38 "mkdir -p /var/www/pes-store/backend/prisma"
scp "backend\prisma\schema.prisma" root@72.60.190.38:/var/www/pes-store/backend/prisma/schema.prisma
scp -r "frontend\src" root@72.60.190.38:/var/www/pes-store/frontend/
scp "nginx.conf" root@72.60.190.38:/etc/nginx/sites-available/pes-store

echo.
echo [5/5] تحديث قاعدة البيانات وإعادة تشغيل الخدمات وإعداد HTTPS...
ssh root@72.60.190.38 "cd /var/www/pes-store/backend && npm install && npx prisma generate && npx prisma db push && npm prune --omit=dev && (pm2 restart pes-store-backend || pm2 start /var/www/pes-store/ecosystem.config.js)"
if %errorlevel% neq 0 (
    echo [X] فشل تحديث قاعدة البيانات أو إعادة تشغيل الباك إند!
    pause
    exit /b %errorlevel%
)

echo.
echo التحقق من إعداد HTTPS وإعادة تحميل Nginx...
ssh root@72.60.190.38 "test -f /etc/letsencrypt/live/pes.fouadf9.network/fullchain.pem && test -f /etc/letsencrypt/live/pes.fouadf9.network/privkey.pem && ln -sf /etc/nginx/sites-available/pes-store /etc/nginx/sites-enabled/pes-store && nginx -t && systemctl reload nginx"
if %errorlevel% neq 0 (
    echo [X] لم يتم تفعيل إعداد HTTPS. تأكد من تثبيت شهادة Let's Encrypt للنطاق pes.fouadf9.network ثم أعد النشر.
    pause
    exit /b %errorlevel%
)

echo.
echo ========================================================
echo   ✅ تم رفع وتطبيق كافة التحديثات على السيرفر بنجاح!
echo   رابط المتجر: https://pes.fouadf9.network
echo   رابط الإدارة الجديد: https://pes.fouadf9.network/admfoad
echo ========================================================
pause
