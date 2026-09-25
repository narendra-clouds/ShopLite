@echo off
setlocal
cd /d %~dp0

echo ==========================================
echo ShopLite - starting local services
echo ==========================================
echo.

start "ShopLite User Service" cmd /k "cd /d %~dp0services\user-service && npm run dev"
start "ShopLite Product Service" cmd /k "cd /d %~dp0services\product-service && npm run dev"
start "ShopLite Order Service" cmd /k "cd /d %~dp0services\order-service && npm run dev"
start "ShopLite Notification Service" cmd /k "cd /d %~dp0services\notification-service && npm run dev"
start "ShopLite Review Service" cmd /k "cd /d %~dp0services\review-service && npm run dev"
start "ShopLite API Gateway" cmd /k "cd /d %~dp0gateway && npm run dev"
timeout /t 3 /nobreak >nul
start "ShopLite Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo All startup commands have been sent.
echo.
echo Frontend:   http://localhost:5173
echo Gateway:    http://localhost:8080/health
echo Services:   http://localhost:8080/health/services
echo.
echo Keep all opened terminal windows running.
pause
