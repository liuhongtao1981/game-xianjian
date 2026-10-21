@echo off
setlocal
cd /d "%~dp0"
title Xunsheng - Local Server

if not exist "prototype\index.html" (
    echo [ERROR] Cannot find prototype\index.html.
    echo Keep run.bat in the project root directory.
    pause
    exit /b 1
)

py -3 -c "import sys; assert sys.version_info.major == 3" >nul 2>&1
if not errorlevel 1 (
    set "PYTHON_CMD=py -3"
    goto :launch
)

python -c "import sys; assert sys.version_info.major == 3" >nul 2>&1
if not errorlevel 1 (
    set "PYTHON_CMD=python"
    goto :launch
)

echo [ERROR] Python 3 is required. Install it and run this file again.
pause
exit /b 1

:launch
echo Starting game at http://localhost:4173/
echo Keep this window open while playing. Press Ctrl+C to stop.
start "" /b powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:4173/'"
%PYTHON_CMD% -m http.server 4173 --bind 127.0.0.1 --directory prototype
if errorlevel 1 (
    echo [ERROR] Server failed. Check whether port 4173 is already in use.
    pause
    exit /b 1
)
endlocal
