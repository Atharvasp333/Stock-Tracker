@echo off
echo Starting Stock Portfolio Application...
echo.

echo Starting server...
start "Server" cmd /k "cd server && npm run dev"

echo Waiting for server to start...
timeout /t 3 /nobreak > nul

echo Starting client...
start "Client" cmd /k "cd client && npm start"

echo.
echo Both server and client are starting...
echo Server: http://localhost:5000
echo Client: http://localhost:3000
echo.
echo Press any key to exit...
pause > nul