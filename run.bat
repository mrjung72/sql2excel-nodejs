@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul 2>&1
cls
color 0F

echo.
echo ================================================================
echo                   SQL2Excel Tool v1.2.7
echo ================================================================
echo.

:: Check Node.js installation
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed.
    echo Please install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Run application (English mode)
set LANGUAGE=en
node app.js

pause
