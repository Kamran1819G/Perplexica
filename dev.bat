@echo off
echo 🚀 Starting Perplexify Development Environment

REM Start SearXNG in Docker
echo 📡 Starting SearXNG...
docker compose -f docker-compose.dev.yaml up -d searxng

REM Wait a moment for SearXNG to start
echo ⏳ Waiting for SearXNG to start...
timeout /t 3 /nobreak >nul

REM Check if SearXNG is running
docker compose -f docker-compose.dev.yaml ps searxng | findstr "Up" >nul
if %errorlevel% equ 0 (
    echo ✅ SearXNG is running on http://localhost:4000
) else (
    echo ❌ Failed to start SearXNG
    exit /b 1
)

REM Start Next.js development server
echo ⚡ Starting Next.js development server...
echo 🌐 Your app will be available at http://localhost:3000
echo 🔍 SearXNG will be available at http://localhost:4000
echo.
echo Press Ctrl+C to stop both services

REM Start Next.js dev server
yarn dev 