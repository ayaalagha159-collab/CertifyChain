@echo off
title منصة توثيق الشهادات - تشغيل تلقائي
cd /d "%~dp0"

IF NOT EXIST "node_modules" (
  echo.
  echo ▷ تثبيت الحزم لأول مرة... (قد يستغرق دقيقة)
  call npm install
)

start "" http://localhost:3000/
npm start
