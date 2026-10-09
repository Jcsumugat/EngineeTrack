@echo off
color A
echo ==========================================
echo  Enginee Track System
echo  Starting Development Environment...
echo ==========================================
echo.

REM Start Apache
echo [1/4] Starting XAMPP Apache...
cd /d "C:\xampp"
start "XAMPP Apache" cmd /c "xampp_start.exe apache"
timeout /t 2 /nobreak >nul

REM Start MySQL
echo [2/4] Starting XAMPP MySQL...
start "XAMPP MySQL" cmd /c "xampp_start.exe mysql"
timeout /t 3 /nobreak >nul

REM Go to project folder
cd /d "C:\Users\ferna\Enginee-track"

REM Start Laravel server
echo [3/4] Starting Laravel server...
start "Laravel Server" cmd /k "php -S 127.0.0.1:8080 -t public"
timeout /t 2 /nobreak >nul

REM Start Vite
echo [4/4] Starting Vite development server...
start "Vite Dev Server" cmd /k "npm run dev"

REM Open browser
timeout /t 3 /nobreak >nul
start "" "http://127.0.0.1:8080/"

echo.
echo ==========================================
echo   Development servers are now running!
echo ==========================================
echo.
echo   XAMPP Services:
echo   - Apache: Running
echo   - MySQL:  Running
echo.
echo   Laravel Application:
echo   - Laravel Server: http://127.0.0.1:8080
echo.
echo   Vite Development:
echo   - Vite will display its URL in the Vite window
echo   - Usually: http://localhost:5173
echo.
echo   phpMyAdmin:
echo   - http://localhost/phpmyadmin
echo.
echo ==========================================
echo.
echo NOTE: Do not close the opened windows!
echo       They are running your development servers.
echo.
echo Press any key to exit this launcher...
echo (Servers will continue running in background)
pause >nul