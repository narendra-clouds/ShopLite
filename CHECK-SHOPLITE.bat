@echo off
setlocal
cd /d %~dp0

echo Checking ShopLite prerequisites...
node --version
npm --version

echo.
echo Checking package.json files...
if not exist frontend\package.json echo [ERROR] frontend package.json missing & goto :fail
if not exist gateway\package.json echo [ERROR] gateway package.json missing & goto :fail
if not exist services\user-service\package.json echo [ERROR] user-service package.json missing & goto :fail
if not exist services\product-service\package.json echo [ERROR] product-service package.json missing & goto :fail
if not exist services\order-service\package.json echo [ERROR] order-service package.json missing & goto :fail
if not exist services\notification-service\package.json echo [ERROR] notification-service package.json missing & goto :fail
if not exist services\review-service\package.json echo [ERROR] review-service package.json missing & goto :fail

echo.
echo All ShopLite package files are present.
echo Run npm install in each folder once, then start-all.bat.
pause
exit /b 0

:fail
echo.
echo ShopLite setup check failed. See the ERROR above.
pause
exit /b 1
