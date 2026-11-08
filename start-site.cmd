@echo off
rem Start the SCI-FI NOODLES site and the MuseTalk sidecar.
rem   start-site.cmd
rem   start-site.cmd -SadTalker
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0services\site\start.ps1" %*
set ERR=%ERRORLEVEL%
echo %CMDCMDLINE% | findstr /I /C:" /c " >nul && pause
exit /b %ERR%
