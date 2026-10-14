@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start.ps1" %*
set ERR=%ERRORLEVEL%
echo %CMDCMDLINE% | findstr /I /C:" /c " >nul && pause
exit /b %ERR%
