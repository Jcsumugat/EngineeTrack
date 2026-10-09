@echo off
color 4
echo ==========================================
echo  Enginee Track System
echo  Stopping Development Environment...
echo ==========================================
echo.

REM Stop Laravel PHP server
echo [1/4] Stopping Laravel server...
taskkill /F /FI "WINDOWTITLE eq Laravel Server" >nul 2>&1
taskkill /F /IM php.exe >nul 2>&1
echo        Done.

REM Stop Vite
echo [2/4] Stopping Vite dev server...
taskkill /F /FI "WINDOWTITLE eq Vite Dev Server" >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
echo        Done.

REM Stop Apache
echo [3/4] Stopping XAMPP Apache...
cd /d "C:\xampp"
start "XAMPP Apache Stop" cmd /c "xampp_stop.exe apache"
timeout /t 2 /nobreak >nul
echo        Done.

REM Stop MySQL
echo [4/4] Stopping XAMPP MySQL...
start "XAMPP MySQL Stop" cmd /c "xampp_stop.exe mysql"
timeout /t 2 /nobreak >nul
echo        Done.

echo.
echo ==========================================
echo   All services stopped successfully!
echo ==========================================
echo.
echo Press any key to exit...
pause >nul