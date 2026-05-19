param(
    [string] $Repo = "GUILHERME-GARCIATECH/gg-cli",
    [string] $AssetName = "gg-cli-setup.exe"
)

$ErrorActionPreference = "Stop"

$downloadUrl = "https://github.com/$Repo/releases/latest/download/$AssetName"
$installerPath = Join-Path $env:TEMP $AssetName

Write-Host "Baixando GG CLI de $downloadUrl"
Invoke-WebRequest -Uri $downloadUrl -OutFile $installerPath -UseBasicParsing

Write-Host "Abrindo instalador..."
Start-Process -FilePath $installerPath -Verb RunAs -Wait

Remove-Item -LiteralPath $installerPath -Force -ErrorAction SilentlyContinue
Write-Host "Instalacao concluida. Abra um novo terminal e rode: gg hello"
