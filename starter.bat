@echo off
echo Iniciando a API...

:: Muda para o diretório onde o arquivo index.js está localizado
cd /d "C:\Users\orbita\Desktop\API-R3 2.0"

start cmd /k "node index.js"
timeout /t 5 /nobreak

echo Executando o script request.js...
node request.js