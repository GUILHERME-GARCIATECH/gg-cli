$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$distDir = Join-Path $repoRoot "dist"
$seaDir = Join-Path $distDir "sea"
$bundlePath = Join-Path $seaDir "gg.cjs"
$blobPath = Join-Path $seaDir "sea-prep.blob"
$seaConfigPath = Join-Path $seaDir "sea-config.json"
$exePath = Join-Path $distDir "gg.exe"

if (Test-Path -LiteralPath $seaDir) {
    Remove-Item -LiteralPath $seaDir -Recurse -Force
}

if (-not (Test-Path -LiteralPath $distDir)) {
    New-Item -ItemType Directory -Path $distDir | Out-Null
}

New-Item -ItemType Directory -Path $seaDir | Out-Null

if (Test-Path -LiteralPath $exePath) {
    Remove-Item -LiteralPath $exePath -Force
}

$nodeCommand = Get-Command "node" -ErrorAction Stop
$nodePath = $nodeCommand.Source

Push-Location $repoRoot
try {
    npx esbuild src/index.js `
        --bundle `
        --platform=node `
        --format=cjs `
        --target=node24 `
        --log-override:empty-import-meta=silent `
        --outfile="$bundlePath"

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

    $seaConfig = @{
        main = $bundlePath
        output = $blobPath
        disableExperimentalSEAWarning = $true
        useSnapshot = $false
        useCodeCache = $false
        execArgvExtension = "none"
    }

    $seaConfig |
        ConvertTo-Json -Depth 4 |
        Set-Content -LiteralPath $seaConfigPath -Encoding UTF8

    node --experimental-sea-config "$seaConfigPath"

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

    Copy-Item -LiteralPath $nodePath -Destination $exePath -Force

    npx postject "$exePath" NODE_SEA_BLOB "$blobPath" `
        --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

    & $exePath hello

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }

    & $exePath --help

    if ($LASTEXITCODE -ne 0) {
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}
