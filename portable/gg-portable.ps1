$ErrorActionPreference = "Stop"

$Script:PortableRoot = Split-Path -Parent $PSCommandPath
$Script:ConfigDir = Join-Path $Script:PortableRoot "config"
$Script:ReposPath = Join-Path $Script:ConfigDir "repos.json"
$Script:SettingsPath = Join-Path $Script:ConfigDir "settings.json"
$Script:BackupDir = Join-Path $Script:ConfigDir "backups"
$Script:ProjectRoot = Split-Path -Parent $Script:PortableRoot
$Script:CliReposPath = Join-Path $Script:ProjectRoot "config\repos.json"
$Script:CliSettingsPath = Join-Path $Script:ProjectRoot "config\settings.json"

function Write-Line {
    param(
        [string]$Message = "",
        [ConsoleColor]$Color = [ConsoleColor]::Gray
    )

    if ($Message -eq "") {
        Write-Host ""
        return
    }

    Write-Host $Message -ForegroundColor $Color
}

function Show-Header {
    param([string]$Title)

    try {
        Clear-Host
    } catch {
        Write-Host ""
    }

    Write-Line ""
    Write-Line "============================================================" Cyan
    Write-Line "                    GG PORTABLE" Cyan
    Write-Line "============================================================" Cyan
    if ($Title) {
        Write-Line $Title Yellow
        Write-Line ""
    }
}

function Pause-Return {
    Write-Line ""
    Read-Host "Pressione Enter para continuar" | Out-Null
}

function Confirm-Action {
    param(
        [string]$Message,
        [bool]$Default = $false
    )

    $suffix = "[s/N]"
    if ($Default) {
        $suffix = "[S/n]"
    }

    $answer = Read-Host "$Message $suffix"
    if ([string]::IsNullOrWhiteSpace($answer)) {
        return $Default
    }

    return $answer.Trim().ToLowerInvariant().StartsWith("s")
}

function Read-Text {
    param(
        [string]$Prompt,
        [string]$Default = ""
    )

    if ($Default) {
        $value = Read-Host "$Prompt [$Default]"
        if ([string]::IsNullOrWhiteSpace($value)) {
            return $Default
        }
        return $value.Trim()
    }

    return (Read-Host $Prompt).Trim()
}

function Select-MenuOption {
    param(
        [string]$Message,
        [object[]]$Choices
    )

    Write-Line $Message Yellow
    Write-Line ""

    for ($index = 0; $index -lt $Choices.Count; $index++) {
        $number = $index + 1
        Write-Line ("  [{0}] {1}" -f $number, $Choices[$index].Label) Magenta
    }

    Write-Line ""
    $choice = Read-Host "Escolha uma opcao"
    $selected = 0

    if (-not [int]::TryParse($choice, [ref]$selected)) {
        Write-Line "Opcao invalida." Red
        Pause-Return
        return $null
    }

    if ($selected -lt 1 -or $selected -gt $Choices.Count) {
        Write-Line "Opcao invalida." Red
        Pause-Return
        return $null
    }

    return $Choices[$selected - 1].Value
}

function Get-DefaultSettings {
    return [ordered]@{
        defaultWorkspace = "C:\gg-workspace"
        facultyWorkspace = "C:\gg-faculdade"
        defaultGitUser = [ordered]@{
            name = ""
            email = ""
        }
        editors = [ordered]@{
            vscode = "code"
            intellij = "idea"
        }
        safeClean = $true
    }
}

function Backup-ConfigFile {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        return $null
    }

    if (-not (Test-Path -LiteralPath $Script:BackupDir)) {
        New-Item -ItemType Directory -Path $Script:BackupDir -Force | Out-Null
    }

    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $name = [System.IO.Path]::GetFileName($Path)
    $backupPath = Join-Path $Script:BackupDir "$timestamp-$name"
    Copy-Item -LiteralPath $Path -Destination $backupPath -Force
    return $backupPath
}

function Save-JsonFile {
    param(
        [string]$Path,
        [object]$Data
    )

    if (-not (Test-Path -LiteralPath $Script:ConfigDir)) {
        New-Item -ItemType Directory -Path $Script:ConfigDir -Force | Out-Null
    }

    Backup-ConfigFile $Path | Out-Null
    $json = ConvertTo-Json -InputObject $Data -Depth 10
    Set-Content -LiteralPath $Path -Value $json -Encoding UTF8
}

function Read-JsonFile {
    param(
        [string]$Path,
        [object]$Fallback
    )

    if (-not (Test-Path -LiteralPath $Path)) {
        return $Fallback
    }

    $content = Get-Content -LiteralPath $Path -Raw
    if ([string]::IsNullOrWhiteSpace($content)) {
        return $Fallback
    }

    return $content | ConvertFrom-Json
}

function Read-Repos {
    $data = Read-JsonFile $Script:ReposPath @()
    if ($null -eq $data) {
        return @()
    }

    return @($data)
}

function Save-Repos {
    param([object[]]$Repos)
    Save-JsonFile $Script:ReposPath @($Repos)
}

function Ensure-SettingsShape {
    param([object]$Settings)

    $defaults = Get-DefaultSettings

    if ($null -eq $Settings) {
        $Settings = [pscustomobject]$defaults
    }

    if (-not (Get-Member -InputObject $Settings -Name "defaultWorkspace" -MemberType NoteProperty)) {
        $Settings | Add-Member -MemberType NoteProperty -Name "defaultWorkspace" -Value $defaults.defaultWorkspace
    }

    if (-not (Get-Member -InputObject $Settings -Name "facultyWorkspace" -MemberType NoteProperty)) {
        $Settings | Add-Member -MemberType NoteProperty -Name "facultyWorkspace" -Value $defaults.facultyWorkspace
    }

    if (-not (Get-Member -InputObject $Settings -Name "defaultGitUser" -MemberType NoteProperty)) {
        $Settings | Add-Member -MemberType NoteProperty -Name "defaultGitUser" -Value ([pscustomobject]$defaults.defaultGitUser)
    }

    if (-not (Get-Member -InputObject $Settings.defaultGitUser -Name "name" -MemberType NoteProperty)) {
        $Settings.defaultGitUser | Add-Member -MemberType NoteProperty -Name "name" -Value ""
    }

    if (-not (Get-Member -InputObject $Settings.defaultGitUser -Name "email" -MemberType NoteProperty)) {
        $Settings.defaultGitUser | Add-Member -MemberType NoteProperty -Name "email" -Value ""
    }

    if (-not (Get-Member -InputObject $Settings -Name "editors" -MemberType NoteProperty)) {
        $Settings | Add-Member -MemberType NoteProperty -Name "editors" -Value ([pscustomobject]$defaults.editors)
    }

    if (-not (Get-Member -InputObject $Settings.editors -Name "vscode" -MemberType NoteProperty)) {
        $Settings.editors | Add-Member -MemberType NoteProperty -Name "vscode" -Value $defaults.editors.vscode
    }

    if (-not (Get-Member -InputObject $Settings.editors -Name "intellij" -MemberType NoteProperty)) {
        $Settings.editors | Add-Member -MemberType NoteProperty -Name "intellij" -Value $defaults.editors.intellij
    }

    if (-not (Get-Member -InputObject $Settings -Name "safeClean" -MemberType NoteProperty)) {
        $Settings | Add-Member -MemberType NoteProperty -Name "safeClean" -Value $true
    }

    return $Settings
}

function Read-Settings {
    $settings = Read-JsonFile $Script:SettingsPath ([pscustomobject](Get-DefaultSettings))
    return Ensure-SettingsShape $settings
}

function Save-Settings {
    param([object]$Settings)
    Save-JsonFile $Script:SettingsPath $Settings
}

function Initialize-PortableConfig {
    $needsSetup = $false

    if (-not (Test-Path -LiteralPath $Script:ConfigDir)) {
        New-Item -ItemType Directory -Path $Script:ConfigDir -Force | Out-Null
    }

    if (-not (Test-Path -LiteralPath $Script:ReposPath)) {
        if (Test-Path -LiteralPath $Script:CliReposPath) {
            Copy-Item -LiteralPath $Script:CliReposPath -Destination $Script:ReposPath -Force
        } else {
            Save-Repos @()
            $needsSetup = $true
        }
    }

    if (-not (Test-Path -LiteralPath $Script:SettingsPath)) {
        if (Test-Path -LiteralPath $Script:CliSettingsPath) {
            Copy-Item -LiteralPath $Script:CliSettingsPath -Destination $Script:SettingsPath -Force
        } else {
            Save-Settings ([pscustomobject](Get-DefaultSettings))
            $needsSetup = $true
        }
    }

    if ($needsSetup) {
        Show-Header "Setup inicial"
        Write-Line "Nao encontrei config da CLI para importar. Vamos revisar os caminhos basicos." Yellow
        Edit-Workspaces
        Edit-GitUser
        Edit-Editors
    }
}

function Normalize-RepoName {
    param([string]$Value)
    return (($Value.Trim().ToLowerInvariant()) -replace "\s+", "-")
}

function Test-RepoName {
    param([string]$Name)

    if ([string]::IsNullOrWhiteSpace($Name)) {
        return $false
    }

    if ($Name -eq "." -or $Name -eq "..") {
        return $false
    }

    return $Name -match "^[A-Za-z0-9._-]+$"
}

function Test-GitUrl {
    param([string]$Url)

    if ([string]::IsNullOrWhiteSpace($Url)) {
        return $false
    }

    $value = $Url.Trim()
    return $value.StartsWith("https://github.com/") -or $value.StartsWith("git@github.com:")
}

function Get-RepoWorkspace {
    param([object]$Repo)

    if ($Repo.workspace) {
        return $Repo.workspace
    }

    return "default"
}

function Get-WorkspacePath {
    param(
        [string]$Workspace,
        [object]$Settings
    )

    if ($Workspace -eq "faculdade") {
        if ($Settings.facultyWorkspace) {
            return $Settings.facultyWorkspace
        }

        return "C:\gg-faculdade"
    }

    if ($Settings.defaultWorkspace) {
        return $Settings.defaultWorkspace
    }

    return "C:\gg-workspace"
}

function Get-FullPathSafe {
    param([string]$Path)
    return [System.IO.Path]::GetFullPath($Path)
}

function Test-IsInsidePath {
    param(
        [string]$ParentPath,
        [string]$ChildPath
    )

    $parentFull = Get-FullPathSafe $ParentPath
    $childFull = Get-FullPathSafe $ChildPath

    if (-not $parentFull.EndsWith([System.IO.Path]::DirectorySeparatorChar)) {
        $parentFull = $parentFull + [System.IO.Path]::DirectorySeparatorChar
    }

    return $childFull.StartsWith($parentFull, [System.StringComparison]::OrdinalIgnoreCase)
}

function Get-RepoPath {
    param(
        [object]$Repo,
        [object]$Settings
    )

    $workspacePath = Get-WorkspacePath (Get-RepoWorkspace $Repo) $Settings
    return Join-Path $workspacePath $Repo.name
}

function Ensure-WorkspaceExists {
    param(
        [string]$Workspace,
        [object]$Settings
    )

    $workspacePath = Get-WorkspacePath $Workspace $Settings
    if (-not (Test-Path -LiteralPath $workspacePath)) {
        New-Item -ItemType Directory -Path $workspacePath -Force | Out-Null
    }

    return $workspacePath
}

function Test-CommandAvailable {
    param([string]$Command)

    if ([string]::IsNullOrWhiteSpace($Command)) {
        return $false
    }

    if (Test-Path -LiteralPath $Command) {
        return $true
    }

    $found = Get-Command $Command -ErrorAction SilentlyContinue
    return $null -ne $found
}

function Invoke-External {
    param(
        [string]$Command,
        [string[]]$Arguments = @(),
        [string]$WorkingDirectory = ""
    )

    $oldLocation = Get-Location

    try {
        if ($WorkingDirectory) {
            Set-Location -LiteralPath $WorkingDirectory
        }

        $output = & $Command @Arguments 2>&1
        $exitCode = $LASTEXITCODE
        $text = ($output | Out-String).Trim()

        return [pscustomobject]@{
            ok = ($exitCode -eq 0)
            exitCode = $exitCode
            output = $text
        }
    } catch {
        return [pscustomobject]@{
            ok = $false
            exitCode = 1
            output = $_.Exception.Message
        }
    } finally {
        Set-Location $oldLocation
    }
}

function Classify-GitFailure {
    param([string]$Output)

    $text = ""
    if ($Output) {
        $text = $Output.ToLowerInvariant()
    }

    if ($text.Contains("dubious ownership") -or $text.Contains("safe.directory")) {
        return "safe-directory"
    }

    if ($text.Contains("not a git repository")) {
        return "not-git"
    }

    if ($text.Contains("authentication failed") -or
        $text.Contains("permission denied") -or
        $text.Contains("could not read from remote repository") -or
        $text.Contains("repository not found")) {
        return "auth"
    }

    if ($text.Contains("not possible to fast-forward") -or
        $text.Contains("divergent") -or
        $text.Contains("non-fast-forward")) {
        return "fast-forward"
    }

    if ($text.Contains("local changes") -or $text.Contains("would be overwritten")) {
        return "local-changes"
    }

    return "git-error"
}

function Get-FailureMessage {
    param(
        [string]$Reason,
        [string]$RepoPath
    )

    switch ($Reason) {
        "missing" { return "Repositorio ainda nao foi clonado." }
        "invalid-name" { return "Nome de repositorio invalido." }
        "not-directory" { return "O caminho esperado existe, mas nao e uma pasta." }
        "not-git" { return "A pasta existe, mas nao parece ser um repositorio Git." }
        "unsafe-path" { return "O caminho calculado fica fora do workspace configurado." }
        "safe-directory" { return "Git bloqueou este repositorio por dono diferente. Se confiar nessa pasta, rode: git config --global --add safe.directory `"$RepoPath`"" }
        "auth" { return "Falha de autenticacao ou permissao no Git remoto." }
        "fast-forward" { return "O pull --ff-only foi recusado porque a branch local divergiu da remota." }
        "local-changes" { return "Existem alteracoes locais que precisam ser commitadas, stashadas ou revisadas." }
        "git-missing" { return "Git nao foi encontrado no PATH." }
        default { return "Git retornou erro para este repositorio." }
    }
}

function Get-RepoLocalState {
    param(
        [object]$Repo,
        [object]$Settings
    )

    $workspacePath = Get-WorkspacePath (Get-RepoWorkspace $Repo) $Settings
    $repoPath = Get-RepoPath $Repo $Settings

    if (-not (Test-RepoName $Repo.name)) {
        return [pscustomobject]@{
            ok = $false
            kind = "invalid-name"
            repo = $Repo
            repoPath = $repoPath
            message = Get-FailureMessage "invalid-name" $repoPath
            output = ""
        }
    }

    if (-not (Test-IsInsidePath $workspacePath $repoPath)) {
        return [pscustomobject]@{
            ok = $false
            kind = "unsafe-path"
            repo = $Repo
            repoPath = $repoPath
            message = Get-FailureMessage "unsafe-path" $repoPath
            output = ""
        }
    }

    if (-not (Test-Path -LiteralPath $repoPath)) {
        return [pscustomobject]@{
            ok = $false
            kind = "missing"
            repo = $Repo
            repoPath = $repoPath
            message = Get-FailureMessage "missing" $repoPath
            output = ""
        }
    }

    if (-not (Test-Path -LiteralPath $repoPath -PathType Container)) {
        return [pscustomobject]@{
            ok = $false
            kind = "not-directory"
            repo = $Repo
            repoPath = $repoPath
            message = Get-FailureMessage "not-directory" $repoPath
            output = ""
        }
    }

    if (-not (Test-CommandAvailable "git")) {
        return [pscustomobject]@{
            ok = $false
            kind = "git-missing"
            repo = $Repo
            repoPath = $repoPath
            message = Get-FailureMessage "git-missing" $repoPath
            output = ""
        }
    }

    $result = Invoke-External "git" @("-C", $repoPath, "rev-parse", "--is-inside-work-tree")
    if (-not $result.ok -or $result.output.Trim() -ne "true") {
        $reason = Classify-GitFailure $result.output
        if ($reason -ne "safe-directory") {
            $reason = "not-git"
        }

        return [pscustomobject]@{
            ok = $false
            kind = $reason
            repo = $Repo
            repoPath = $repoPath
            message = Get-FailureMessage $reason $repoPath
            output = $result.output
        }
    }

    return [pscustomobject]@{
        ok = $true
        kind = "ready"
        repo = $Repo
        repoPath = $repoPath
        message = "OK"
        output = ""
    }
}

function Get-RepoLocalLabel {
    param(
        [object]$Repo,
        [object]$Settings
    )

    $state = Get-RepoLocalState $Repo $Settings

    switch ($state.kind) {
        "ready" { return "LOCAL" }
        "missing" { return "NAO CLONADO" }
        "safe-directory" { return "SAFE.DIR" }
        "git-missing" { return "SEM GIT" }
        default { return "PROBLEMA" }
    }
}

function Select-Repo {
    $repos = Read-Repos
    $settings = Read-Settings

    if ($repos.Count -eq 0) {
        Write-Line "Nenhum repositorio cadastrado." Yellow
        Pause-Return
        return $null
    }

    Write-Line "Repositorios disponiveis:" Yellow
    Write-Line ""

    for ($index = 0; $index -lt $repos.Count; $index++) {
        $repo = $repos[$index]
        $number = $index + 1
        $label = Get-RepoLocalLabel $repo $settings
        Write-Line ("  [{0}] {1} - {2}" -f $number, $repo.name, $label) Magenta
    }

    Write-Line ""
    $choice = Read-Host "Digite o numero desejado"
    $selected = 0

    if (-not [int]::TryParse($choice, [ref]$selected)) {
        Write-Line "Opcao invalida." Red
        Pause-Return
        return $null
    }

    if ($selected -lt 1 -or $selected -gt $repos.Count) {
        Write-Line "Opcao invalida." Red
        Pause-Return
        return $null
    }

    return $repos[$selected - 1]
}

function Configure-RepoGitUser {
    param(
        [string]$RepoPath,
        [object]$Settings
    )

    if (-not $Settings.defaultGitUser.name -or -not $Settings.defaultGitUser.email) {
        return [pscustomobject]@{
            ok = $false
            message = "defaultGitUser.name e defaultGitUser.email nao estao configurados."
        }
    }

    $nameResult = Invoke-External "git" @("-C", $RepoPath, "config", "user.name", $Settings.defaultGitUser.name)
    $emailResult = Invoke-External "git" @("-C", $RepoPath, "config", "user.email", $Settings.defaultGitUser.email)

    if (-not $nameResult.ok -or -not $emailResult.ok) {
        $output = @($nameResult.output, $emailResult.output) -join "`n"
        return [pscustomobject]@{
            ok = $false
            message = "Nao foi possivel aplicar a configuracao Git local. $output"
        }
    }

    return [pscustomobject]@{
        ok = $true
        message = "Git local configurado como $($Settings.defaultGitUser.name) <$($Settings.defaultGitUser.email)>."
    }
}

function Clone-RepoIfNeeded {
    param(
        [object]$Repo,
        [object]$Settings
    )

    if (-not (Test-CommandAvailable "git")) {
        Write-Line (Get-FailureMessage "git-missing" "") Red
        return $null
    }

    $state = Get-RepoLocalState $Repo $Settings

    if ($state.kind -eq "unsafe-path" -or $state.kind -eq "invalid-name") {
        Write-Line $state.message Red
        Write-Line $state.repoPath DarkGray
        return $null
    }

    if (Test-Path -LiteralPath $state.repoPath) {
        if ($state.kind -eq "ready" -or $state.kind -eq "safe-directory") {
            Write-Line "Repositorio ja existe em: $($state.repoPath)" Cyan
            return $state.repoPath
        }

        Write-Line $state.message Red
        if ($state.output) {
            Write-Line $state.output DarkGray
        }
        Write-Line "Nao vou clonar por cima de uma pasta existente." Yellow
        return $null
    }

    Ensure-WorkspaceExists (Get-RepoWorkspace $Repo) $Settings | Out-Null

    Write-Line "Clonando $($Repo.name)..." Cyan
    Write-Line "Destino: $($state.repoPath)" DarkGray

    $result = Invoke-External "git" @("clone", $Repo.url, $state.repoPath)

    if (-not $result.ok) {
        Write-Line "Nao foi possivel clonar o repositorio: $($Repo.name)" Red
        Write-Line "URL: $($Repo.url)" Yellow
        if ($result.output) {
            Write-Line $result.output DarkGray
        }
        return $null
    }

    Write-Line "Repositorio clonado com sucesso." Green
    return $state.repoPath
}

function Open-RepoWithEditor {
    param(
        [object]$Repo,
        [string]$RepoPath,
        [string]$Editor
    )

    $settings = Read-Settings
    $selectedEditor = $Editor
    if (-not $selectedEditor -or $selectedEditor -eq "default") {
        $selectedEditor = $Repo.defaultEditor
    }
    if (-not $selectedEditor) {
        $selectedEditor = "explorer"
    }

    try {
        switch ($selectedEditor) {
            "vscode" {
                $command = $settings.editors.vscode
                if (-not (Test-CommandAvailable $command)) {
                    Write-Line "VS Code nao encontrado: $command" Yellow
                    return
                }
                Start-Process -FilePath $command -ArgumentList @($RepoPath)
            }
            "code" {
                $command = $settings.editors.vscode
                if (-not (Test-CommandAvailable $command)) {
                    Write-Line "VS Code nao encontrado: $command" Yellow
                    return
                }
                Start-Process -FilePath $command -ArgumentList @($RepoPath)
            }
            "intellij" {
                $command = $settings.editors.intellij
                if (-not (Test-CommandAvailable $command)) {
                    Write-Line "IntelliJ IDEA nao encontrado: $command" Yellow
                    return
                }
                Start-Process -FilePath $command -ArgumentList @($RepoPath)
            }
            "idea" {
                $command = $settings.editors.intellij
                if (-not (Test-CommandAvailable $command)) {
                    Write-Line "IntelliJ IDEA nao encontrado: $command" Yellow
                    return
                }
                Start-Process -FilePath $command -ArgumentList @($RepoPath)
            }
            "terminal" {
                Start-Process -FilePath "cmd.exe" -ArgumentList @("/k", "cd /d `"$RepoPath`"")
            }
            default {
                Start-Process -FilePath "explorer.exe" -ArgumentList @($RepoPath)
            }
        }

        Write-Line "Aberto com: $selectedEditor" Green
    } catch {
        Write-Line "Nao foi possivel abrir o repositorio." Red
        Write-Line $_.Exception.Message DarkGray
    }
}

function List-Repos {
    $repos = Read-Repos
    $settings = Read-Settings

    if ($repos.Count -eq 0) {
        Write-Line "Nenhum repositorio cadastrado." Yellow
        return
    }

    Write-Line "Repositorios cadastrados:" Yellow
    Write-Line ""

    foreach ($repo in $repos) {
        $state = Get-RepoLocalState $repo $settings
        Write-Line "- $($repo.name) [$($state.kind)]" Cyan
        Write-Line "  $($repo.description)" Gray
        Write-Line "  URL: $($repo.url)" Gray
        Write-Line "  Tipo: $($repo.type)" Gray
        Write-Line "  Workspace: $(Get-RepoWorkspace $repo)" Gray
        Write-Line "  Editor padrao: $($repo.defaultEditor)" Gray
        Write-Line "  Caminho: $($state.repoPath)" Gray
        Write-Line ""
    }
}

function Add-Repo {
    $repos = Read-Repos

    $nameInput = Read-Text "Nome curto do repositorio"
    $name = Normalize-RepoName $nameInput

    if (-not (Test-RepoName $name)) {
        Write-Line "Nome invalido. Use letras, numeros, ponto, traco e underline." Red
        return
    }

    if (@($repos | Where-Object { $_.name -eq $name }).Count -gt 0) {
        Write-Line "Ja existe um repositorio com esse nome." Red
        return
    }

    $description = Read-Text "Descricao"
    $url = Read-Text "URL GitHub HTTPS ou SSH"
    if (-not (Test-GitUrl $url)) {
        Write-Line "URL invalida. Use https://github.com/... ou git@github.com:..." Red
        return
    }

    $type = Select-MenuOption "Tipo do projeto:" @(
        @{ Label = "Node.js"; Value = "node" },
        @{ Label = "Java"; Value = "java" },
        @{ Label = "Estudo"; Value = "study" },
        @{ Label = "Script/Automacao"; Value = "automation" },
        @{ Label = "Outro"; Value = "other" }
    )
    if (-not $type) { return }

    $defaultEditor = Select-MenuOption "Editor padrao:" @(
        @{ Label = "VS Code"; Value = "vscode" },
        @{ Label = "IntelliJ IDEA"; Value = "intellij" },
        @{ Label = "Explorer"; Value = "explorer" },
        @{ Label = "Terminal"; Value = "terminal" }
    )
    if (-not $defaultEditor) { return }

    $workspace = Select-MenuOption "Workspace:" @(
        @{ Label = "Padrao"; Value = "default" },
        @{ Label = "Faculdade"; Value = "faculdade" }
    )
    if (-not $workspace) { return }

    $newRepo = [ordered]@{
        name = $name
        description = $description
        url = $url.Trim()
        type = $type
        defaultEditor = $defaultEditor
        workspace = $workspace
    }

    Write-Line ""
    Write-Line "Novo repositorio:" Yellow
    Write-Line (($newRepo | ConvertTo-Json -Depth 5)) Gray

    if (-not (Confirm-Action "Salvar este repositorio?")) {
        Write-Line "Cadastro cancelado." Yellow
        return
    }

    $updated = @($repos) + ([pscustomobject]$newRepo)
    Save-Repos $updated
    Write-Line "Repositorio cadastrado: $name" Green
}

function Remove-RepoRegistration {
    $repo = Select-Repo
    if ($null -eq $repo) {
        return
    }

    Write-Line ""
    Write-Line "Repositorio selecionado: $($repo.name)" Yellow
    Write-Line "URL: $($repo.url)" Gray

    if (-not (Confirm-Action "Remover este repositorio do cadastro?")) {
        Write-Line "Remocao cancelada." Yellow
        return
    }

    $repos = Read-Repos
    $updated = @($repos | Where-Object { $_.name -ne $repo.name })
    Save-Repos $updated
    Write-Line "Repositorio removido do cadastro: $($repo.name)" Green
}

function Clone-SelectedRepo {
    $repo = Select-Repo
    if ($null -eq $repo) {
        return
    }

    $settings = Read-Settings
    Clone-RepoIfNeeded $repo $settings | Out-Null
}

function Open-SelectedRepo {
    $repo = Select-Repo
    if ($null -eq $repo) {
        return
    }

    $editor = Select-MenuOption "Como deseja abrir?" @(
        @{ Label = "Editor padrao do repositorio"; Value = "default" },
        @{ Label = "VS Code"; Value = "vscode" },
        @{ Label = "IntelliJ IDEA"; Value = "intellij" },
        @{ Label = "Explorer"; Value = "explorer" },
        @{ Label = "Terminal"; Value = "terminal" }
    )
    if (-not $editor) { return }

    $settings = Read-Settings
    $repoPath = Clone-RepoIfNeeded $repo $settings
    if ($repoPath) {
        Open-RepoWithEditor $repo $repoPath $editor
    }
}

function Get-RepoStatus {
    param(
        [object]$Repo,
        [bool]$Print = $true
    )

    $settings = Read-Settings
    $state = Get-RepoLocalState $Repo $settings

    if ($Print) {
        Write-Line ""
        Write-Line "Status: $($Repo.name)" Cyan
        Write-Line "Pasta: $($state.repoPath)" Gray
    }

    if ($state.kind -eq "missing") {
        $message = "$($state.message) Clone primeiro."
        if ($Print) { Write-Line $message Yellow }
        return [pscustomobject]@{ repoName = $Repo.name; status = "skipped"; reason = "missing"; message = $message; repoPath = $state.repoPath }
    }

    if (-not $state.ok) {
        if ($Print) {
            Write-Line $state.message Red
            if ($state.output) { Write-Line $state.output DarkGray }
        }
        return [pscustomobject]@{ repoName = $Repo.name; status = "failed"; reason = $state.kind; message = $state.message; repoPath = $state.repoPath }
    }

    $result = Invoke-External "git" @("-C", $state.repoPath, "status", "--short")
    if (-not $result.ok) {
        $reason = Classify-GitFailure $result.output
        $message = Get-FailureMessage $reason $state.repoPath
        if ($Print) {
            Write-Line $message Red
            if ($result.output) { Write-Line $result.output DarkGray }
        }
        return [pscustomobject]@{ repoName = $Repo.name; status = "failed"; reason = $reason; message = $message; repoPath = $state.repoPath }
    }

    if ($Print) {
        if ($result.output) {
            Write-Line $result.output Yellow
        } else {
            Write-Line "Sem alteracoes locais." Green
        }
    }

    return [pscustomobject]@{ repoName = $Repo.name; status = "ok"; reason = "status"; dirty = [bool]$result.output; output = $result.output; repoPath = $state.repoPath }
}

function Get-LocalChanges {
    param([string]$RepoPath)

    $result = Invoke-External "git" @("-C", $RepoPath, "status", "--porcelain")
    return [pscustomobject]@{
        ok = $result.ok
        dirty = [bool]$result.output
        status = $result.output
        output = $result.output
    }
}

function Pull-Repo {
    param(
        [object]$Repo,
        [bool]$Print = $true
    )

    $settings = Read-Settings
    $state = Get-RepoLocalState $Repo $settings

    if ($Print) {
        Write-Line ""
        Write-Line "Atualizando: $($Repo.name)" Cyan
        Write-Line "Pasta: $($state.repoPath)" Gray
    }

    if ($state.kind -eq "missing") {
        $message = "$($state.message) Clone primeiro."
        if ($Print) { Write-Line $message Yellow }
        return [pscustomobject]@{ repoName = $Repo.name; status = "skipped"; reason = "missing"; message = $message; repoPath = $state.repoPath }
    }

    if (-not $state.ok) {
        if ($Print) {
            Write-Line $state.message Red
            if ($state.output) { Write-Line $state.output DarkGray }
        }
        return [pscustomobject]@{ repoName = $Repo.name; status = "failed"; reason = $state.kind; message = $state.message; repoPath = $state.repoPath }
    }

    $changes = Get-LocalChanges $state.repoPath
    if (-not $changes.ok) {
        $reason = Classify-GitFailure $changes.output
        $message = Get-FailureMessage $reason $state.repoPath
        if ($Print) {
            Write-Line $message Red
            if ($changes.output) { Write-Line $changes.output DarkGray }
        }
        return [pscustomobject]@{ repoName = $Repo.name; status = "failed"; reason = $reason; message = $message; repoPath = $state.repoPath }
    }

    if ($changes.dirty) {
        $message = "Pull pulado porque existem alteracoes locais."
        if ($Print) {
            Write-Line $message Yellow
            Write-Line $changes.status DarkGray
        }
        return [pscustomobject]@{ repoName = $Repo.name; status = "skipped"; reason = "local-changes"; message = $message; repoPath = $state.repoPath }
    }

    $result = Invoke-External "git" @("-C", $state.repoPath, "pull", "--ff-only")
    if (-not $result.ok) {
        $reason = Classify-GitFailure $result.output
        $message = Get-FailureMessage $reason $state.repoPath
        if ($Print) {
            Write-Line $message Red
            if ($result.output) { Write-Line $result.output DarkGray }
        }
        return [pscustomobject]@{ repoName = $Repo.name; status = "failed"; reason = $reason; message = $message; repoPath = $state.repoPath }
    }

    if ($Print) {
        if ($result.output) {
            Write-Line $result.output Green
        } else {
            Write-Line "Repositorio atualizado." Green
        }
    }

    return [pscustomobject]@{ repoName = $Repo.name; status = "ok"; reason = "pull"; output = $result.output; repoPath = $state.repoPath }
}

function Print-BatchSummary {
    param(
        [string]$Title,
        [object[]]$Results
    )

    $ok = @($Results | Where-Object { $_.status -eq "ok" })
    $skipped = @($Results | Where-Object { $_.status -eq "skipped" })
    $failed = @($Results | Where-Object { $_.status -eq "failed" })

    Write-Line ""
    Write-Line "$Title - resumo" Yellow
    Write-Line "OK: $($ok.Count)" Green
    Write-Line "Pulados: $($skipped.Count)" Yellow
    Write-Line "Falhas: $($failed.Count)" Red

    foreach ($item in @($skipped + $failed)) {
        Write-Line "- $($item.repoName): $($item.message)" Gray
    }
}

function Status-SelectedRepo {
    $repo = Select-Repo
    if ($null -eq $repo) { return }
    Get-RepoStatus $repo $true | Out-Null
}

function Pull-SelectedRepo {
    $repo = Select-Repo
    if ($null -eq $repo) { return }
    Pull-Repo $repo $true | Out-Null
}

function Status-AllRepos {
    $repos = Read-Repos
    if ($repos.Count -eq 0) {
        Write-Line "Nenhum repositorio cadastrado." Yellow
        return
    }

    $results = @()
    foreach ($repo in $repos) {
        $results += Get-RepoStatus $repo $true
    }

    Print-BatchSummary "Status de todos" $results
}

function Pull-AllRepos {
    $repos = Read-Repos
    if ($repos.Count -eq 0) {
        Write-Line "Nenhum repositorio cadastrado." Yellow
        return
    }

    $results = @()
    foreach ($repo in $repos) {
        $results += Pull-Repo $repo $true
    }

    Print-BatchSummary "Atualizacao de todos" $results
}

function Doctor-Repos {
    $repos = Read-Repos
    $settings = Read-Settings

    if ($repos.Count -eq 0) {
        Write-Line "Nenhum repositorio cadastrado." Yellow
        return
    }

    $results = @()

    foreach ($repo in $repos) {
        Write-Line ""
        Write-Line $repo.name Cyan
        Write-Line "URL: $($repo.url)" Gray
        Write-Line "Workspace: $(Get-RepoWorkspace $repo)" Gray

        $problems = @()
        if (-not (Test-RepoName $repo.name)) {
            $problems += "nome invalido"
        }
        if (-not (Test-GitUrl $repo.url)) {
            $problems += "URL invalida"
        }

        $state = Get-RepoLocalState $repo $settings
        Write-Line "Caminho: $($state.repoPath)" Gray

        if ($problems.Count -gt 0) {
            Write-Line ("Cadastro: " + ($problems -join ", ")) Red
        } else {
            Write-Line "Cadastro: OK" Green
        }

        if ($state.ok) {
            Write-Line "Estado local: OK" Green
            $results += [pscustomobject]@{ repoName = $repo.name; status = "ok"; message = "OK" }
        } elseif ($state.kind -eq "missing") {
            Write-Line "Estado local: $($state.message)" Yellow
            $results += [pscustomobject]@{ repoName = $repo.name; status = "skipped"; message = $state.message }
        } else {
            Write-Line "Estado local: $($state.message)" Red
            if ($state.output) { Write-Line $state.output DarkGray }
            $results += [pscustomobject]@{ repoName = $repo.name; status = "failed"; message = $state.message }
        }
    }

    Print-BatchSummary "Doctor de repositorios" $results
}

function Remove-LocalCopy {
    $repo = Select-Repo
    if ($null -eq $repo) {
        return
    }

    $settings = Read-Settings
    $state = Get-RepoLocalState $repo $settings
    $workspacePath = Get-WorkspacePath (Get-RepoWorkspace $repo) $settings

    Write-Line ""
    Write-Line "Apagar copia local: $($repo.name)" Yellow
    Write-Line "Pasta: $($state.repoPath)" Gray

    if (-not (Test-IsInsidePath $workspacePath $state.repoPath)) {
        Write-Line "Recusei apagar porque o caminho fica fora do workspace." Red
        return
    }

    if (-not (Test-Path -LiteralPath $state.repoPath)) {
        Write-Line "Esse repositorio nao existe localmente." Yellow
        return
    }

    if ($state.ok) {
        $changes = Get-LocalChanges $state.repoPath
        if ($changes.ok -and $changes.dirty) {
            Write-Line ""
            Write-Line "Atencao: existem alteracoes locais neste repo." Yellow
            Write-Line $changes.status DarkGray
        }
    }

    Write-Line ""
    Write-Line "Isso vai apagar toda a copia local. O cadastro permanece." Yellow
    if (-not (Confirm-Action "Confirmar exclusao da copia local?")) {
        Write-Line "Exclusao cancelada." Yellow
        return
    }

    try {
        Remove-Item -LiteralPath $state.repoPath -Recurse -Force
        Write-Line "Copia local removida com sucesso." Green
    } catch {
        Write-Line "Nao foi possivel remover a pasta." Red
        Write-Line "Feche editores, terminais ou Explorer abertos nesse repo e tente novamente." Yellow
        Write-Line $_.Exception.Message DarkGray
    }
}

function Generate-Workspace {
    param([string]$Workspace)

    $settings = Read-Settings
    $repos = @(Read-Repos | Where-Object { (Get-RepoWorkspace $_) -eq $Workspace })
    $workspacePath = Ensure-WorkspaceExists $Workspace $settings

    Write-Line "Workspace: $workspacePath" Cyan

    if ($repos.Count -eq 0) {
        Write-Line "Nenhum repositorio cadastrado para este workspace." Yellow
        return
    }

    $results = @()

    foreach ($repo in $repos) {
        Write-Line ""
        Write-Line "Preparando $($repo.name)..." Cyan
        $repoPath = Clone-RepoIfNeeded $repo $settings

        if (-not $repoPath) {
            $results += [pscustomobject]@{ repoName = $repo.name; status = "failed"; message = "Nao foi possivel clonar ou validar." }
            continue
        }

        $state = Get-RepoLocalState $repo $settings
        if ($state.ok) {
            $gitConfig = Configure-RepoGitUser $state.repoPath $settings
            if ($gitConfig.ok) {
                Write-Line $gitConfig.message Green
            } else {
                Write-Line $gitConfig.message Yellow
            }
            $results += [pscustomobject]@{ repoName = $repo.name; status = "ok"; message = "Pronto" }
        } else {
            Write-Line $state.message Yellow
            $results += [pscustomobject]@{ repoName = $repo.name; status = "failed"; message = $state.message }
        }
    }

    Print-BatchSummary "Geracao do workspace $Workspace" $results
}

function Generate-AllWorkspaces {
    Generate-Workspace "default"
    Write-Line ""
    Generate-Workspace "faculdade"
}

function Show-Config {
    $settings = Read-Settings
    $repos = Read-Repos

    Write-Line "Arquivos:" Yellow
    Write-Line "settings.json: $Script:SettingsPath" Gray
    Write-Line "repos.json: $Script:ReposPath" Gray
    Write-Line ""
    Write-Line "Settings:" Yellow
    Write-Line (($settings | ConvertTo-Json -Depth 10)) Gray
    Write-Line ""
    Write-Line "Repositorios cadastrados: $($repos.Count)" Cyan
}

function Edit-Workspaces {
    $settings = Read-Settings

    $defaultWorkspace = Read-Text "Workspace padrao" $settings.defaultWorkspace
    $facultyWorkspace = Read-Text "Workspace faculdade" $settings.facultyWorkspace

    $settings.defaultWorkspace = $defaultWorkspace
    $settings.facultyWorkspace = $facultyWorkspace
    Save-Settings $settings
    Write-Line "Workspaces salvos." Green
}

function Edit-GitUser {
    $settings = Read-Settings

    $name = Read-Text "Git user.name" $settings.defaultGitUser.name
    $email = Read-Text "Git user.email" $settings.defaultGitUser.email

    $settings.defaultGitUser.name = $name
    $settings.defaultGitUser.email = $email
    Save-Settings $settings
    Write-Line "Git user salvo." Green
}

function Edit-Editors {
    $settings = Read-Settings

    $vscode = Read-Text "Comando/caminho do VS Code" $settings.editors.vscode
    $intellij = Read-Text "Comando/caminho do IntelliJ IDEA" $settings.editors.intellij

    $settings.editors.vscode = $vscode
    $settings.editors.intellij = $intellij
    Save-Settings $settings
    Write-Line "Editores salvos." Green
}

function Import-CliConfig {
    $hasRepos = Test-Path -LiteralPath $Script:CliReposPath
    $hasSettings = Test-Path -LiteralPath $Script:CliSettingsPath

    if (-not $hasRepos -and -not $hasSettings) {
        Write-Line "Nao encontrei config da CLI ao lado do portable." Yellow
        Write-Line "Esperado: $Script:ProjectRoot\config" Gray
        return
    }

    Write-Line "Origem CLI: $Script:ProjectRoot\config" Cyan
    if (-not (Confirm-Action "Importar e sobrescrever a config portatil?")) {
        Write-Line "Importacao cancelada." Yellow
        return
    }

    if ($hasRepos) {
        Backup-ConfigFile $Script:ReposPath | Out-Null
        Copy-Item -LiteralPath $Script:CliReposPath -Destination $Script:ReposPath -Force
        Write-Line "repos.json importado." Green
    }

    if ($hasSettings) {
        Backup-ConfigFile $Script:SettingsPath | Out-Null
        Copy-Item -LiteralPath $Script:CliSettingsPath -Destination $Script:SettingsPath -Force
        Write-Line "settings.json importado." Green
    }
}

function Export-ConfigBackup {
    $created = @()
    $repoBackup = Backup-ConfigFile $Script:ReposPath
    $settingsBackup = Backup-ConfigFile $Script:SettingsPath

    if ($repoBackup) { $created += $repoBackup }
    if ($settingsBackup) { $created += $settingsBackup }

    if ($created.Count -eq 0) {
        Write-Line "Nenhum arquivo de config encontrado para backup." Yellow
        return
    }

    Write-Line "Backups criados:" Green
    foreach ($item in $created) {
        Write-Line "- $item" Gray
    }
}

function Show-Doctor {
    $settings = Read-Settings
    $repos = Read-Repos

    Write-Line "GG Portable Doctor" Yellow
    Write-Line "Portable: $Script:PortableRoot" Gray
    Write-Line ""

    if (Test-CommandAvailable "git") {
        $gitVersion = Invoke-External "git" @("--version")
        Write-Line "[OK] Git - $($gitVersion.output)" Green
    } else {
        Write-Line "[AVISO] Git nao encontrado no PATH." Red
    }

    if (Test-Path -LiteralPath $Script:ReposPath) {
        Write-Line "[OK] repos.json - $Script:ReposPath" Green
    } else {
        Write-Line "[AVISO] repos.json nao encontrado." Red
    }

    if (Test-Path -LiteralPath $Script:SettingsPath) {
        Write-Line "[OK] settings.json - $Script:SettingsPath" Green
    } else {
        Write-Line "[AVISO] settings.json nao encontrado." Red
    }

    Write-Line "[INFO] Repositorios cadastrados: $($repos.Count)" Cyan
    Write-Line "[INFO] Workspace padrao: $(Get-WorkspacePath "default" $settings)" Cyan
    Write-Line "[INFO] Workspace faculdade: $(Get-WorkspacePath "faculdade" $settings)" Cyan

    if (Test-CommandAvailable $settings.editors.vscode) {
        Write-Line "[OK] VS Code - $($settings.editors.vscode)" Green
    } else {
        Write-Line "[AVISO] VS Code nao encontrado: $($settings.editors.vscode)" Yellow
    }

    if (Test-CommandAvailable $settings.editors.intellij) {
        Write-Line "[OK] IntelliJ IDEA - $($settings.editors.intellij)" Green
    } else {
        Write-Line "[AVISO] IntelliJ IDEA nao encontrado: $($settings.editors.intellij)" Yellow
    }

    if ($settings.defaultGitUser.name -and $settings.defaultGitUser.email) {
        Write-Line "[OK] defaultGitUser - $($settings.defaultGitUser.name) <$($settings.defaultGitUser.email)>" Green
    } else {
        Write-Line "[AVISO] defaultGitUser incompleto." Yellow
    }

    Doctor-Repos
}

function Open-ReposMenu {
    $running = $true

    while ($running) {
        Show-Header "Repositorios"
        $option = Select-MenuOption "O que voce quer fazer?" @(
            @{ Label = "Listar repositorios"; Value = "list" },
            @{ Label = "Adicionar repositorio"; Value = "add" },
            @{ Label = "Remover repositorio do cadastro"; Value = "remove" },
            @{ Label = "Clonar repositorio"; Value = "clone" },
            @{ Label = "Abrir repositorio"; Value = "open" },
            @{ Label = "Apagar copia local"; Value = "delete-local" },
            @{ Label = "Ver status de um repositorio"; Value = "status" },
            @{ Label = "Atualizar um repositorio"; Value = "pull" },
            @{ Label = "Ver status de todos"; Value = "status-all" },
            @{ Label = "Atualizar todos"; Value = "pull-all" },
            @{ Label = "Doctor de repositorios"; Value = "doctor" },
            @{ Label = "Voltar"; Value = "back" }
        )

        if (-not $option) { continue }

        Show-Header "Repositorios - $option"

        switch ($option) {
            "list" { List-Repos; Pause-Return }
            "add" { Add-Repo; Pause-Return }
            "remove" { Remove-RepoRegistration; Pause-Return }
            "clone" { Clone-SelectedRepo; Pause-Return }
            "open" { Open-SelectedRepo; Pause-Return }
            "delete-local" { Remove-LocalCopy; Pause-Return }
            "status" { Status-SelectedRepo; Pause-Return }
            "pull" { Pull-SelectedRepo; Pause-Return }
            "status-all" { Status-AllRepos; Pause-Return }
            "pull-all" { Pull-AllRepos; Pause-Return }
            "doctor" { Doctor-Repos; Pause-Return }
            "back" { $running = $false }
        }
    }
}

function Open-WorkspacesMenu {
    $running = $true

    while ($running) {
        Show-Header "Workspaces"
        $option = Select-MenuOption "Escolha uma acao:" @(
            @{ Label = "Gerar workspace padrao"; Value = "default" },
            @{ Label = "Gerar workspace faculdade"; Value = "faculdade" },
            @{ Label = "Gerar todos os workspaces"; Value = "all" },
            @{ Label = "Voltar"; Value = "back" }
        )

        if (-not $option) { continue }

        Show-Header "Workspaces - $option"

        switch ($option) {
            "default" { Generate-Workspace "default"; Pause-Return }
            "faculdade" { Generate-Workspace "faculdade"; Pause-Return }
            "all" { Generate-AllWorkspaces; Pause-Return }
            "back" { $running = $false }
        }
    }
}

function Open-SettingsMenu {
    $running = $true

    while ($running) {
        Show-Header "Configuracoes"
        $option = Select-MenuOption "Escolha uma acao:" @(
            @{ Label = "Ver config atual"; Value = "show" },
            @{ Label = "Editar workspaces"; Value = "workspaces" },
            @{ Label = "Editar Git user"; Value = "git-user" },
            @{ Label = "Editar comandos dos editores"; Value = "editors" },
            @{ Label = "Importar config da CLI"; Value = "import" },
            @{ Label = "Exportar backup"; Value = "backup" },
            @{ Label = "Voltar"; Value = "back" }
        )

        if (-not $option) { continue }

        Show-Header "Configuracoes - $option"

        switch ($option) {
            "show" { Show-Config; Pause-Return }
            "workspaces" { Edit-Workspaces; Pause-Return }
            "git-user" { Edit-GitUser; Pause-Return }
            "editors" { Edit-Editors; Pause-Return }
            "import" { Import-CliConfig; Pause-Return }
            "backup" { Export-ConfigBackup; Pause-Return }
            "back" { $running = $false }
        }
    }
}

function Open-MainMenu {
    $running = $true

    while ($running) {
        Show-Header "Menu principal"
        $settings = Read-Settings
        $repos = Read-Repos
        Write-Line "Base portable: $Script:PortableRoot" DarkGray
        Write-Line "Workspace padrao: $(Get-WorkspacePath "default" $settings)" DarkGray
        Write-Line "Workspace faculdade: $(Get-WorkspacePath "faculdade" $settings)" DarkGray
        Write-Line "Repositorios cadastrados: $($repos.Count)" DarkGray
        Write-Line ""

        $option = Select-MenuOption "O que voce quer fazer?" @(
            @{ Label = "Repositorios"; Value = "repos" },
            @{ Label = "Workspaces"; Value = "workspaces" },
            @{ Label = "Configuracoes"; Value = "settings" },
            @{ Label = "Doctor"; Value = "doctor" },
            @{ Label = "Sair"; Value = "exit" }
        )

        switch ($option) {
            "repos" { Open-ReposMenu }
            "workspaces" { Open-WorkspacesMenu }
            "settings" { Open-SettingsMenu }
            "doctor" { Show-Header "Doctor"; Show-Doctor; Pause-Return }
            "exit" { $running = $false }
        }
    }
}

Initialize-PortableConfig
Open-MainMenu
