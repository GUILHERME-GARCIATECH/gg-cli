$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$installer = Join-Path $repoRoot "dist\installer\gg-cli-setup.exe"
$buildScript = Join-Path $PSScriptRoot "build-installer.ps1"

if (-not (Test-Path -LiteralPath $installer)) {
    & $buildScript
}

if (-not (Test-Path -LiteralPath $installer)) {
    throw "Instalador nao encontrado depois do build: $installer"
}

Start-Process -FilePath $installer -Wait
