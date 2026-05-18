@echo off
setlocal EnableExtensions

set "SCRIPT_DIR=%~dp0"
set "SCRIPT_FILE=%SCRIPT_DIR%gg-portable.ps1"

if not exist "%SCRIPT_FILE%" (
    echo Nao encontrei o script PowerShell:
    echo %SCRIPT_FILE%
    pause
    exit /b 1
)

where pwsh.exe >nul 2>nul
if "%ERRORLEVEL%"=="0" (
    pwsh.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_FILE%" %*
    set "EXIT_CODE=%ERRORLEVEL%"
    endlocal & exit /b %EXIT_CODE%
)

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_FILE%" %*
set "EXIT_CODE=%ERRORLEVEL%"
endlocal & exit /b %EXIT_CODE%
