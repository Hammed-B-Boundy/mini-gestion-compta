@echo off
cd /d %~dp0

start "MiniCompta Backend" cmd /k "cd /d %~dp0server && npm start"
timeout /t 3 /nobreak > nul
start "MiniCompta Frontend" cmd /k "cd /d %~dp0 && npm start"
timeout /t 5 /nobreak > nul
start http://localhost:3000