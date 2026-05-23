@echo off
echo ================================================
echo   KrishiRakshak AI - Windows Setup Script
echo   Python 3.10+ required (tested on 3.14)
echo ================================================

echo.
echo [1/4] Installing root packages...
npm install
if %ERRORLEVEL% NEQ 0 (echo ERROR: npm install failed && pause && exit /b 1)

echo.
echo [2/4] Installing frontend packages...
cd frontend
npm install
if %ERRORLEVEL% NEQ 0 (echo ERROR: frontend npm install failed && pause && exit /b 1)
cd ..

echo.
echo [3/4] Setting up Python virtual environment...
cd backend
python -m venv .venv
if %ERRORLEVEL% NEQ 0 (echo ERROR: venv creation failed && pause && exit /b 1)

echo.
echo [4/4] Installing Python dependencies...
.venv\Scripts\pip install --upgrade pip
.venv\Scripts\pip install -r requirements.txt
if %ERRORLEVEL% NEQ 0 (echo ERROR: pip install failed && pause && exit /b 1)
cd ..

echo.
echo ================================================
echo   Setup complete! To start the app:
echo.
echo   Terminal 1: cd backend
echo               .venv\Scripts\activate
echo               python main.py
echo.
echo   Terminal 2: cd frontend
echo               npm run dev
echo.
echo   Then open: http://localhost:5173
echo ================================================
pause
