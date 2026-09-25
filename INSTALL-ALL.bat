@echo off
setlocal
cd /d %~dp0

echo ==========================================
echo ShopLite - install all dependencies
echo ==========================================
echo.

call npm --version >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm was not found. Install Node.js first.
  pause
  exit /b 1
)

for %%D in (
  "frontend"
  "gateway"
  "services\user-service"
  "services\product-service"
  "services\order-service"
  "services\notification-service"
  "services\review-service"
) do (
  echo.
  echo ==========================================
  echo Installing %%~D
  echo ==========================================
  pushd "%%~D"
  call npm install
  if errorlevel 1 (
    echo [ERROR] npm install failed in %%~D
    popd
    pause
    exit /b 1
  )
  popd
)

echo.
echo ==========================================
echo All ShopLite dependencies installed.
echo ==========================================
echo Run start-all.bat next.
pause
