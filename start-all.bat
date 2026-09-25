@echo off
setlocal
cd /d %~dp0

echo Starting ShopLite services in separate windows...
start "ShopLite User Service" cmd /k "cd /d %~dp0services\user-service && npm run dev"
start "ShopLite Product Service" cmd /k "cd /d %~dp0services\product-service && npm run dev"
start "ShopLite Order Service" cmd /k "cd /d %~dp0services\order-service && npm run dev"
start "ShopLite Notification Service" cmd /k "cd /d %~dp0services\notification-service && npm run dev"
start "ShopLite Review Service" cmd /k "cd /d %~dp0services\review-service && npm run dev"
start "ShopLite API Gateway" cmd /k "cd /d %~dp0gateway && npm run dev"
start "ShopLite Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ShopLite startup commands sent.
echo Open http://localhost:5173 after the services finish starting.
pause
