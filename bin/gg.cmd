@echo off
setlocal

set "GG_DATA_ROOT=C:\ProgramData\GG"

if exist "%~dp0gg.exe" (
  "%~dp0gg.exe" %*
  exit /b %ERRORLEVEL%
)

if exist "%~dp0..\dist\gg.exe" (
  "%~dp0..\dist\gg.exe" %*
  exit /b %ERRORLEVEL%
)

echo GG CLI nao encontrou o executavel gg.exe.
echo Reinstale pelo instalador oficial ou rode npm run build:exe neste checkout.
exit /b 1
