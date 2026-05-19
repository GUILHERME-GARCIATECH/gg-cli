$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$installerScript = Join-Path $repoRoot "installer\gg-cli.iss"
$ggExe = Join-Path $repoRoot "dist\gg.exe"

if (Test-Path -LiteralPath $ggExe) {
    Remove-Item -LiteralPath $ggExe -Force
}

Push-Location $repoRoot
try {
    npm run build:exe
} finally {
    Pop-Location
}

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

$isccCommand = Get-Command "ISCC.exe" -ErrorAction SilentlyContinue
$isccPath = $null

if ($isccCommand) {
    $isccPath = $isccCommand.Source
}

if (-not $isccPath) {
    $knownPaths = @(
        "C:\Program Files (x86)\Inno Setup 6\ISCC.exe",
        "C:\Program Files\Inno Setup 6\ISCC.exe"
    )

    foreach ($knownPath in $knownPaths) {
        if (Test-Path -LiteralPath $knownPath) {
            $isccPath = $knownPath
            break
        }
    }
}

if (-not $isccPath) {
    throw "ISCC.exe nao encontrado. Instale o Inno Setup 6 ou adicione o ISCC ao PATH."
}

if (-not (Test-Path -LiteralPath $installerScript)) {
    throw "Arquivo do instalador nao encontrado: $installerScript"
}

& $isccPath $installerScript

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}
