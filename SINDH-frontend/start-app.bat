@echo off
cd /d "%~dp0"
REM Check if Node.js is in PATH, if not add it
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo Adding Node.js to PATH for this session...
    set "PATH=%PATH%;C:\Program Files\nodejs"
)
echo Starting React application...
npm start
