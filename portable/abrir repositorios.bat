@echo off
setlocal EnableExtensions EnableDelayedExpansion
chcp 65001 >nul
title Gerenciador de Repositorios v2

REM =========================================================
REM CONFIG GERAL
REM =========================================================
set "BASE_DIR=C:\.bla"
set "SRC_DIR=%BASE_DIR%\projetossrc"
set "GIT_NAME=Guilherme Garcia"
set "GIT_EMAIL=guilherme.garciatech@gmail.com"
REM =========================================================

REM =========================================================
REM ANSI / CORES
REM =========================================================
for /f %%a in ('echo prompt $E^| cmd') do set "ESC=%%a"
set "C_RESET=%ESC%[0m"
set "C_TITLE=%ESC%[38;5;45m"
set "C_OK=%ESC%[38;5;82m"
set "C_WARN=%ESC%[38;5;220m"
set "C_ERR=%ESC%[38;5;196m"
set "C_INFO=%ESC%[38;5;117m"
set "C_MENU=%ESC%[38;5;141m"
set "C_DIM=%ESC%[38;5;244m"
set "C_HL=%ESC%[38;5;51m"

goto :main

:: #########################################################
:: MENU PRINCIPAL
:: #########################################################
:main
call :carregar_repos
call :garantir_pastas
cls
call :banner
call :resumo

echo   %C_MENU%[1]%C_RESET% Abrir repositorio
echo   %C_MENU%[2]%C_RESET% Fechar repositorio ^(apagar copia local^)
echo   %C_MENU%[3]%C_RESET% Cadastrar repositorio
echo   %C_MENU%[4]%C_RESET% Listar repositorios
echo   %C_MENU%[5]%C_RESET% Sair
echo.
set /p "opcao=   Escolha uma opcao: "

if "%opcao%"=="1" goto :abrir_repo
if "%opcao%"=="2" goto :fechar_repo
if "%opcao%"=="3" goto :cadastrar_repo
if "%opcao%"=="4" goto :listar_repos
if "%opcao%"=="5" goto :fim

echo.
echo   %C_ERR%[ERRO]%C_RESET% Opcao invalida.
call :pause_voltar
goto :main

:: #########################################################
:: ABRIR REPO
:: #########################################################
:abrir_repo
call :selecionar_repo
if not defined REPO_ESCOLHIDO goto :main

call set "REPO_NOME=%%REPO[%REPO_ESCOLHIDO%].NOME%%"
call set "REPO_URL=%%REPO[%REPO_ESCOLHIDO%].URL%%"
set "REPO_DIR=%SRC_DIR%\%REPO_NOME%"

cls
call :banner
echo   %C_HL%Repositorio:%C_RESET% %REPO_NOME%
echo   %C_HL%URL:%C_RESET%         %REPO_URL%
echo   %C_HL%Pasta:%C_RESET%       %REPO_DIR%
echo.

where git >nul 2>nul
if errorlevel 1 (
    echo   %C_ERR%[ERRO]%C_RESET% Git nao encontrado no PATH.
    call :pause_voltar
    goto :main
)

if exist "%REPO_DIR%\.git" (
    echo   %C_INFO%[INFO]%C_RESET% Repositorio ja existe localmente.
    echo   %C_INFO%[INFO]%C_RESET% Aplicando config local...
    cd /d "%REPO_DIR%"
    if errorlevel 1 (
        echo   %C_ERR%[ERRO]%C_RESET% Nao foi possivel acessar a pasta do repositorio.
        call :pause_voltar
        goto :main
    )

    git config user.name "%GIT_NAME%"
    git config user.email "%GIT_EMAIL%"

    echo.
    echo   %C_INFO%[INFO]%C_RESET% Atualizando com git pull...
    call :git_pull_auto
    if errorlevel 1 (
        echo.
        echo   %C_WARN%[AVISO]%C_RESET% Nao foi possivel atualizar automaticamente.
        echo   %C_WARN%[AVISO]%C_RESET% Mesmo assim vou abrir a pasta e o VS Code.
    ) else (
        echo.
        echo   %C_OK%[OK]%C_RESET% Repositorio atualizado com sucesso.
    )

    call :abrir_explorer_e_code "%REPO_DIR%"
    goto :main
)

echo   %C_INFO%[INFO]%C_RESET% Repositorio ainda nao existe localmente.
echo   %C_INFO%[INFO]%C_RESET% Clonando...
git clone "%REPO_URL%" "%REPO_DIR%"
if errorlevel 1 (
    echo.
    echo   %C_ERR%[ERRO]%C_RESET% Falha ao clonar o repositorio.
    call :pause_voltar
    goto :main
)

cd /d "%REPO_DIR%"
if errorlevel 1 (
    echo   %C_ERR%[ERRO]%C_RESET% Nao foi possivel acessar a pasta apos o clone.
    call :pause_voltar
    goto :main
)

git config user.name "%GIT_NAME%"
git config user.email "%GIT_EMAIL%"

echo.
echo   %C_OK%[OK]%C_RESET% Repositorio clonado com sucesso.
call :abrir_explorer_e_code "%REPO_DIR%"
goto :main

:: #########################################################
:: FECHAR REPO
:: #########################################################
:fechar_repo
call :selecionar_repo
if not defined REPO_ESCOLHIDO goto :main

call set "REPO_NOME=%%REPO[%REPO_ESCOLHIDO%].NOME%%"
set "REPO_DIR=%SRC_DIR%\%REPO_NOME%"

cls
call :banner
echo   %C_HL%Fechar repositorio:%C_RESET% %REPO_NOME%
echo   %C_HL%Pasta local:%C_RESET%        %REPO_DIR%
echo.
echo   %C_WARN%Isso vai apagar toda a copia local desse repositorio.%C_RESET%
echo   %C_DIM%O cadastro do repo no menu permanece.%C_RESET%
echo.
choice /c SN /n /m "   Confirmar exclusao da copia local? [S/N]: "
if errorlevel 2 goto :main

if not exist "%REPO_DIR%" (
    echo.
    echo   %C_WARN%[AVISO]%C_RESET% Esse repositorio nao existe localmente.
    call :pause_voltar
    goto :main
)

if exist "%REPO_DIR%\.git" (
    cd /d "%REPO_DIR%"
    git config --local --unset user.name 2>nul
    git config --local --unset user.email 2>nul
)

cd /d "%SRC_DIR%" 2>nul
echo.
echo   %C_INFO%[INFO]%C_RESET% Apagando copia local...
rmdir /s /q "%REPO_DIR%"

if exist "%REPO_DIR%" (
    echo.
    echo   %C_ERR%[ERRO]%C_RESET% Nao foi possivel remover a pasta.
    echo   %C_WARN%Feche o VS Code, terminal ou Explorer abertos nesse repo e tente novamente.%C_RESET%
    call :pause_voltar
    goto :main
)

echo.
echo   %C_OK%[OK]%C_RESET% Copia local removida com sucesso.
call :pause_voltar
goto :main

:: #########################################################
:: CADASTRAR REPO
:: #########################################################
:cadastrar_repo
cls
call :banner
echo   %C_HL%Cadastro de novo repositorio%C_RESET%
echo.

set "NOVO_NOME="
set "NOVA_URL="

set /p "NOVO_NOME=   Nome do repositorio: "
if not defined NOVO_NOME (
    echo.
    echo   %C_ERR%[ERRO]%C_RESET% Nome nao informado.
    call :pause_voltar
    goto :main
)

set /p "NOVA_URL=   URL do repositorio: "
if not defined NOVA_URL (
    echo.
    echo   %C_ERR%[ERRO]%C_RESET% URL nao informada.
    call :pause_voltar
    goto :main
)

call :validar_nome "%NOVO_NOME%"
if errorlevel 1 (
    echo.
    echo   %C_ERR%[ERRO]%C_RESET% Nome invalido.
    echo   %C_DIM%Use apenas letras, numeros, ponto, traco e underline.%C_RESET%
    call :pause_voltar
    goto :main
)

call :carregar_repos
for /L %%I in (1,1,%REPO_COUNT%) do (
    set "TMP_NOME="
    call set "TMP_NOME=%%REPO[%%I].NOME%%"
    if /I "!TMP_NOME!"=="%NOVO_NOME%" (
        echo.
        echo   %C_ERR%[ERRO]%C_RESET% Ja existe um repositorio com esse nome.
        call :pause_voltar
        goto :main
    )
)

call :persistir_repo "%NOVO_NOME%" "%NOVA_URL%"
if errorlevel 1 (
    echo.
    echo   %C_ERR%[ERRO]%C_RESET% Falha ao gravar o repositorio no BAT.
    call :pause_voltar
    goto :main
)

echo.
echo   %C_OK%[OK]%C_RESET% Repositorio cadastrado com sucesso.
echo   %C_INFO%Nome:%C_RESET% %NOVO_NOME%
echo   %C_INFO%URL :%C_RESET% %NOVA_URL%
call :pause_voltar
goto :main

:: #########################################################
:: LISTAR REPOS
:: #########################################################
:listar_repos
cls
call :banner
call :carregar_repos

if %REPO_COUNT% LEQ 0 (
    echo   %C_WARN%Nenhum repositorio cadastrado.%C_RESET%
    echo.
    call :pause_voltar
    goto :main
)

echo   %C_HL%Repositorios cadastrados:%C_RESET%
echo.

for /L %%I in (1,1,%REPO_COUNT%) do (
    set "TMP_NOME="
    set "TMP_URL="
    call set "TMP_NOME=%%REPO[%%I].NOME%%"
    call set "TMP_URL=%%REPO[%%I].URL%%"
    set "TMP_DIR=%SRC_DIR%\!TMP_NOME!"

    if exist "!TMP_DIR!\.git" (
        set "STATUS=%C_OK%LOCAL%C_RESET%"
    ) else (
        set "STATUS=%C_DIM%NAO CLONADO%C_RESET%"
    )

    echo   [%%I] !TMP_NOME!  -  !STATUS!
    echo       !TMP_URL!
    echo.
)

call :pause_voltar
goto :main

:: #########################################################
:: SELECIONAR REPO
:: #########################################################
:selecionar_repo
set "REPO_ESCOLHIDO="
cls
call :banner
call :carregar_repos

if %REPO_COUNT% LEQ 0 (
    echo   %C_WARN%Nenhum repositorio cadastrado.%C_RESET%
    echo.
    call :pause_voltar
    goto :eof
)

echo   %C_HL%Repositorios disponíveis:%C_RESET%
echo.

for /L %%I in (1,1,%REPO_COUNT%) do (
    set "TMP_NOME="
    call set "TMP_NOME=%%REPO[%%I].NOME%%"
    set "TMP_DIR=%SRC_DIR%\!TMP_NOME!"
    if exist "!TMP_DIR!\.git" (
        set "STATUS=%C_OK%LOCAL%C_RESET%"
    ) else (
        set "STATUS=%C_DIM%NAO CLONADO%C_RESET%"
    )
    echo   [%%I] !TMP_NOME!  -  !STATUS!
)

echo.
set /p "ESCOLHA=   Digite o numero desejado: "
if not defined ESCOLHA goto :eof

for /f "delims=0123456789" %%A in ("%ESCOLHA%") do goto :opcao_invalida
if %ESCOLHA% LSS 1 goto :opcao_invalida
if %ESCOLHA% GTR %REPO_COUNT% goto :opcao_invalida

set "REPO_ESCOLHIDO=%ESCOLHA%"
goto :eof

:opcao_invalida
echo.
echo   %C_ERR%[ERRO]%C_RESET% Opcao invalida.
call :pause_voltar
goto :eof

:: #########################################################
:: GIT PULL AUTO
:: #########################################################
:git_pull_auto
setlocal EnableDelayedExpansion

set "REMOTE_NAME="
set "REMOTE_HEAD="

for /f "delims=" %%R in ('git remote') do (
    if not defined REMOTE_NAME set "REMOTE_NAME=%%R"
)

if not defined REMOTE_NAME (
    endlocal & exit /b 1
)

for /f "tokens=2 delims=/" %%H in ('git symbolic-ref refs/remotes/%REMOTE_NAME%/HEAD 2^>nul') do (
    set "REMOTE_HEAD=%%H"
)

if not defined REMOTE_HEAD (
    for /f "delims=" %%B in ('git branch --show-current 2^>nul') do (
        set "REMOTE_HEAD=%%B"
    )
)

if not defined REMOTE_HEAD set "REMOTE_HEAD=main"

git pull !REMOTE_NAME! !REMOTE_HEAD! --progress
set "RET=%errorlevel%"

if not "!RET!"=="0" if /I not "!REMOTE_HEAD!"=="main" (
    git pull !REMOTE_NAME! main --progress
    set "RET=!errorlevel!"
)

if not "!RET!"=="0" if /I not "!REMOTE_HEAD!"=="master" (
    git pull !REMOTE_NAME! master --progress
    set "RET=!errorlevel!"
)

endlocal & exit /b %RET%

:: #########################################################
:: ABRIR EXPLORER E VSCODE
:: #########################################################
:abrir_explorer_e_code
set "PASTA_ALVO=%~1"
echo.
echo   %C_INFO%[INFO]%C_RESET% Abrindo pasta no Explorer...
start "" explorer "%PASTA_ALVO%"

where code >nul 2>nul
if errorlevel 1 (
    echo   %C_WARN%[AVISO]%C_RESET% VS Code nao encontrado no PATH.
    goto :eof
)

echo   %C_INFO%[INFO]%C_RESET% Abrindo no VS Code...
start "" code "%PASTA_ALVO%"
goto :eof

:: #########################################################
:: RESUMO
:: #########################################################
:resumo
set /a LOCAL_COUNT=0
if %REPO_COUNT% GTR 0 (
    for /L %%I in (1,1,%REPO_COUNT%) do (
        set "TMP_NOME="
        call set "TMP_NOME=%%REPO[%%I].NOME%%"
        if exist "%SRC_DIR%\!TMP_NOME!\.git" set /a LOCAL_COUNT+=1
    )
)
echo   %C_INFO%Base:%C_RESET% %SRC_DIR%
echo   %C_INFO%Repos cadastrados:%C_RESET% %REPO_COUNT%
echo   %C_INFO%Clonados localmente:%C_RESET% %LOCAL_COUNT%
echo.
goto :eof

:: #########################################################
:: BANNER
:: #########################################################
:banner
echo.
echo   %C_TITLE%==========================================================%C_RESET%
echo   %C_TITLE%               GERENCIADOR DE REPOSITORIOS v2             %C_RESET%
echo   %C_TITLE%==========================================================%C_RESET%
echo.
goto :eof

:: #########################################################
:: GARANTIR PASTAS
:: #########################################################
:garantir_pastas
if not exist "%BASE_DIR%" mkdir "%BASE_DIR%" >nul 2>nul
if not exist "%SRC_DIR%" mkdir "%SRC_DIR%" >nul 2>nul
attrib +h "%BASE_DIR%" >nul 2>nul
attrib +h "%SRC_DIR%" >nul 2>nul
goto :eof

:: #########################################################
:: CARREGAR REPOS
:: #########################################################
:carregar_repos
for /f "tokens=1 delims==" %%A in ('set REPO[ 2^>nul') do set "%%A="
set "REPO_COUNT=0"

for /f "usebackq tokens=2,3 delims=|" %%A in (`findstr /b /c:"::REPO|" "%~f0"`) do (
    set /a REPO_COUNT+=1
    set "REPO[!REPO_COUNT!].NOME=%%A"
    set "REPO[!REPO_COUNT!].URL=%%B"
)

goto :eof

:: #########################################################
:: VALIDAR NOME
:: #########################################################
:validar_nome
setlocal
set "NOME_TESTE=%~1"
echo(%NOME_TESTE%| findstr /r "^[A-Za-z0-9._-][A-Za-z0-9._-]*$" >nul
endlocal & exit /b %errorlevel%

:: #########################################################
:: PERSISTIR REPO NO PROPRIO BAT
:: #########################################################
:persistir_repo
setlocal DisableDelayedExpansion
set "NOVO_NOME=%~1"
set "NOVA_URL=%~2"

copy /y "%~f0" "%~f0.bak" >nul 2>nul
if errorlevel 1 (
    endlocal & exit /b 1
)

>> "%~f0" (
    echo(
    echo ::REPO^|%NOVO_NOME%^|%NOVA_URL%
)
if errorlevel 1 (
    endlocal & exit /b 1
)

endlocal & exit /b 0

:: #########################################################
:: PAUSA
:: #########################################################
:pause_voltar
echo.
pause
goto :eof

:fim
endlocal
exit /b 0

:: #########################################################
:: DADOS DOS REPOSITORIOS
:: FORMATO: ::REPO|nome|url
:: #########################################################
::REPO|exercicios-facul|https://github.com/GUILHERME-GARCIATECH/exercicios-facul.git
::REPO|sftp-backup-automation|https://github.com/GUILHERME-GARCIATECH/sftp-backup-automation.git

::REPO|recrutamento|https://github.com/GUILHERME-GARCIATECH/recrutamento.git

::REPO|mineLab-page|https://github.com/GUILHERME-GARCIATECH/mineLab-page.git

::REPO|Pag-requisicoes|https://github.com/GUILHERME-GARCIATECH/Pag-requisicoes.git

::REPO|minelandia|https://github.com/GUILHERME-GARCIATECH/minelandia.git

::REPO|jogoDaVelha|https://github.com/GUILHERME-GARCIATECH/jogoDaVelha.git

::REPO|certbot-hostinger-dns-automation|https://github.com/GUILHERME-GARCIATECH/certbot-hostinger-dns-automation.git

::REPO|valores-armazenamento|https://github.com/GUILHERME-GARCIATECH/valores-binarios.git

::REPO|licita-assessoria|https://github.com/GUILHERME-GARCIATECH/licita-assessoria.git

::REPO|RumoOBI|https://github.com/GUILHERME-GARCIATECH/RumoOBI.git

::REPO|calculadora-binarios|https://github.com/GUILHERME-GARCIATECH/calculadora-binarios.git

::REPO|dev-study-roadmap|https://github.com/GUILHERME-GARCIATECH/dev-study-roadmap.git

::REPO|obi-study-roadmap|https://github.com/GUILHERME-GARCIATECH/obi-study-roadmap.git
