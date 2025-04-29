@echo off
echo Installing dependencies for Connectify Like Minds frontend...
cd /d "%~dp0"
call npm install
call npm install tailwind-merge clsx --save
echo Done!
pause 