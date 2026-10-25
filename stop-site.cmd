@echo off
rem Stop the SCI-FI NOODLES site and the sidecars that start-site launched.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0services\site\stop.ps1" %*
set ERR=%ERRORLEVEL%
echo %CMDCMDLINE% | findstr /I /C:" /c " >nul && pause
exit /b %ERR%
