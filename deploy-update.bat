@echo off
chcp 65001 >nul
echo ========================================================
echo   🚀 جاري تجهيز ورفع التحديثات إلى سيرفر Hostinger VPS
echo   IP: 72.60.190.38
echo ========================================================
echo.

echo [1/4] بناء الفرونت إند (Frontend Build)...
cd /d "%~dp0frontend"
call npm run build
if %errorlevel% neq 0 (
    echo [X] فشل بناء الفرونت إند!
    pause
    exit /b %errorlevel%
)

echo.
echo [2/4] بناء الباك إند (Backend Build)...
cd /d "%~dp0backend"
call npm run build
if %errorlevel% neq 0 (
    echo [X] فشل بناء الباك إند!
    pause
    exit /b %errorlevel%
)

echo.
echo [3/4] رفع الملفات المحدثة إلى السيرفر عبر SCP...
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

echo.
echo [4/4] تحديث قاعدة البيانات وإعادة تشغيل الباك إند (PM2 Restart)...
ssh root@72.60.190.38 "cd /var/www/pes-store/backend && npm install && npx prisma generate && npx prisma db push && npm prune --omit=dev && (pm2 restart pes-store-backend || pm2 start /var/www/pes-store/ecosystem.config.js)"

echo.
echo ========================================================
echo   ✅ تم رفع وتطبيق كافة التحديثات على السيرفر بنجاح!
echo   رابط المتجر: http://pes.fouadf9.network
echo   رابط الإدارة الجديد: http://pes.fouadf9.network/admfoad
echo ========================================================
pause
