@echo off
setlocal

set "GG_DATA_ROOT=C:\ProgramData\GG"

if exist "%~dp0gg.exe" (
  "%~dp0gg.exe" %*
  exit /b %ERRORLEVEL%
)

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado no PATH.
  echo Instale o Node.js e tente novamente.
  exit /b 1
)

node "%~dp0..\src\index.js" %*
