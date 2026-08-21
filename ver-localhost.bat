@echo off
title DebitHub - Preview local
echo Iniciando o DebitHub em http://localhost:5500 ...
echo (Feche esta janela para parar o servidor)
cd /d "%~dp0"
npx --yes http-server -c-1 -o -p 5500
pause
