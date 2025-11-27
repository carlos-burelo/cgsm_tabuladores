param(
    [Parameter(Position=0)]
    [string]$Command,
    [Parameter(Position=1)]
    [string]$Arg1
)

$ErrorActionPreference = "Stop"
$ZIT_VERSION = "1.0.1"

function Write-Log {
    param(
        [string]$Message,
        [string]$Type = "info"
    )
    $timestamp = Get-Date -Format "HH:mm:ss"
    switch ($Type) {
        "success" { Write-Host "[$timestamp] ✅ $Message" -ForegroundColor Green }
        "error" { Write-Host "[$timestamp] ❌ $Message" -ForegroundColor Red }
        "warning" { Write-Host "[$timestamp] ⚠️  $Message" -ForegroundColor Yellow }
        "info" { Write-Host "[$timestamp] ℹ️  $Message" -ForegroundColor Cyan }
        "step" { Write-Host "[$timestamp] 🔄 $Message" -ForegroundColor Magenta }
        default { Write-Host "[$timestamp] $Message" }
    }
}

function Get-RemoteEnvSetup {
    return "export PATH=`"`$HOME/.local/share/pnpm:`$HOME/.local/share/fnm:`$HOME/.fnm:`$PATH`"; . ~/.bashrc 2>/dev/null || true; . ~/.profile 2>/dev/null || true; if command -v fnm >/dev/null 2>&1; then eval `"`$(fnm env --shell bash)`"; fi"
}

function Get-PackageJson {
    if (-not (Test-Path "package.json")) {
        throw "package.json no encontrado en el directorio actual"
    }
    try {
        return Get-Content "package.json" -Raw | ConvertFrom-Json
    } catch {
        throw "Error al parsear package.json: $_"
    }
}

function Get-ZitConfig {
    if (-not (Test-Path ".zitconfig")) {
        throw ".zitconfig no encontrado. Ejecuta: .\zit.ps1 config"
    }
    $config = @{}
    Get-Content ".zitconfig" | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#") -and $line -match '^\s*([^=]+)\s*=\s*(.+)\s*$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"').Trim("'")
            $config[$key] = $value
        }
    }
    
    if (-not $config.SSH_ALIAS) {
        throw "SSH_ALIAS no definido en .zitconfig"
    }
    
    if (-not $config.BRANCH) { $config.BRANCH = "main" }
    
    return $config
}

function Invoke-SSH {
    param(
        [string]$Alias,
        [string]$Command,
        [switch]$IgnoreError
    )
    
    $result = @{
        Output = ""
        Success = $true
        ExitCode = 0
    }
    
    try {
        $output = ssh -o ConnectTimeout=5 -o BatchMode=yes -o ServerAliveInterval=15 -o ServerAliveCountMax=3 $Alias $Command 2>&1
        $result.Output = $output -join "`n"
        $result.ExitCode = $LASTEXITCODE
        
        if ($LASTEXITCODE -ne 0 -and -not $IgnoreError) {
            $result.Success = $false
            throw "Comando SSH falló (código $LASTEXITCODE): $($result.Output)"
        }
    } catch {
        $result.Success = $false
        if (-not $IgnoreError) {
            throw $_
        }
    }
    
    return $result
}

function Test-SSHConnection {
    param([string]$Alias)
    
    Write-Log "Verificando conexión SSH..." "step"
    
    try {
        $result = Invoke-SSH $Alias "echo 'OK'"
        if ($result.Output -match "OK") {
            Write-Log "Conexión SSH establecida correctamente" "success"
            return $true
        }
    } catch {
        Write-Log "Error al conectar por SSH: $_" "error"
        return $false
    }
    
    return $false
}

function Test-RemoteDependencies {
    param([string]$Alias)
    
    Write-Log "Verificando dependencias remotas..." "step"
    
    $envSetup = Get-RemoteEnvSetup
    
    $deps = @{
        git = "git --version"
        node = "$envSetup; node --version"
        pnpm = "$envSetup; pnpm --version"
        pm2 = "$envSetup; pm2 --version"
    }
    
    $missing = @()
    
    foreach ($dep in $deps.GetEnumerator()) {
        $result = Invoke-SSH $Alias $dep.Value -IgnoreError
        if ($result.Success -and $result.Output -and $result.Output -notmatch "not found" -and $result.Output -notmatch "command not found") {
            Write-Log "$($dep.Key): $($result.Output.Trim())" "info"
        } else {
            Write-Log "$($dep.Key): NO INSTALADO (Output: '$($result.Output.Trim())')" "warning"
            $missing += $dep.Key
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Log "Dependencias faltantes: $($missing -join ', ')" "warning"
        $response = Read-Host "¿Continuar de todos modos? (y/N)"
        if ($response -ne "y") {
            throw "Inicialización cancelada por el usuario"
        }
    } else {
        Write-Log "Todas las dependencias están instaladas" "success"
    }
}

function Update-RemoteHook {
    Write-Log "Generando hook post-receive..." "step"
    
    $config = Get-ZitConfig
    $package = Get-PackageJson
    
    $packageName = if ($config.APP_NAME) { $config.APP_NAME } else { $package.name }
    $branch = $config.BRANCH
    $sshAlias = $config.SSH_ALIAS
    
    $repoPath = "/repos/$packageName.git"
    $appPath = "/apps/$packageName"
    
    $buildCommand = if ($package.scripts.build) { "pnpm build" } else { "" }
    
    $hookScript = @"
#!/usr/bin/env bash
set -e

APP_PATH="$appPath"
APP_NAME="$packageName"
BRANCH="$branch"

echo "=========================================="
echo "🚀 Zit Deploy - `$APP_NAME"
echo "🌿 Branch: `$BRANCH"
echo "📅 `$(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

export GIT_WORK_TREE="`$APP_PATH"
export GIT_DIR="$repoPath"

if ! git show-ref --verify --quiet refs/heads/`$BRANCH; then
    echo "❌ Branch `$BRANCH no existe"
    exit 1
fi

echo "📦 Extrayendo archivos..."
git checkout -f `$BRANCH

cd "`$APP_PATH"

echo "🔧 Cargando entorno..."
export PATH="`$HOME/.local/share/pnpm:`$HOME/.local/share/fnm:`$HOME/.fnm:`$PATH"
. ~/.bashrc 2>/dev/null || true
. ~/.profile 2>/dev/null || true
if command -v fnm >/dev/null 2>&1; then
    eval "`$(fnm env --shell bash)"
fi

echo "📋 Versiones:"
echo "  Node: `$(node -v 2>/dev/null || echo 'no disponible')"
echo "  pnpm: `$(pnpm -v 2>/dev/null || echo 'no disponible')"
echo "  PM2: `$(pm2 -v 2>/dev/null || echo 'no disponible')"

    if [ -f ".env" ]; then
    set -a
    source .env 2>/dev/null || true
    set +a
    echo "✅ Variables de entorno cargadas"
fi

# Forzamos instalación de devDependencies para tener acceso a Prisma CLI y herramientas de build
export NODE_ENV=development

echo "📦 Instalando dependencias..."
if ! pnpm install --frozen-lockfile; then
    echo "⚠️  Instalación con frozen-lockfile falló, intentando sin frozen..."
    pnpm install
fi

if [ -f "prisma/schema.prisma" ]; then
    echo "🗄️ Generando cliente Prisma..."
    # Usamos pnpm exec para asegurar que usamos la versión local de prisma y no la última de npx
    pnpm exec prisma generate
fi

# Restauramos NODE_ENV a production para el build
export NODE_ENV=production

$(if ($buildCommand) { @"
echo "🔨 Construyendo proyecto..."
if ! $buildCommand; then
    echo "❌ Build falló"
    exit 1
fi
"@ })

echo "🔄 Gestionando proceso PM2..."
pm2 delete `$APP_NAME 2>/dev/null || echo "  No hay proceso previo"

# Establecemos producción para la ejecución
export NODE_ENV=production

pm2 start pnpm --name "`$APP_NAME" -- start
pm2 save --force

echo "✅ Deploy completado exitosamente"
echo ""
pm2 info `$APP_NAME 2>/dev/null || true
"@

    $hookScriptUnix = $hookScript -replace "`r`n", "`n"
    $hookScriptUnix = $hookScriptUnix -replace "`r", ""
    
    $tempFile = [System.IO.Path]::GetTempFileName()
    [System.IO.File]::WriteAllText($tempFile, $hookScriptUnix, [System.Text.UTF8Encoding]::new($false))
    
    scp $tempFile "${sshAlias}:$repoPath/hooks/post-receive"
    Invoke-SSH $sshAlias "chmod +x $repoPath/hooks/post-receive" | Out-Null
    
    Remove-Item $tempFile -Force
    Write-Log "Hook actualizado" "success"
}

function Initialize-Zit {
    Write-Log "Zit Deploy v$ZIT_VERSION - Inicialización" "info"
    Write-Log "========================================" "info"
    
    try {
        $package = Get-PackageJson
    } catch {
        Write-Log $_.Exception.Message "error"
        throw
    }
    
    try {
        $config = Get-ZitConfig
    } catch {
        Write-Log $_.Exception.Message "error"
        Write-Log "Creando .zitconfig interactivo..." "info"
        New-ZitConfig
        $config = Get-ZitConfig
    }
    
    $packageName = if ($config.APP_NAME) { $config.APP_NAME } else { $package.name }
    $branch = $config.BRANCH
    $sshAlias = $config.SSH_ALIAS
    
    if (-not $package.scripts.start) {
        throw "package.json debe tener un script 'start' definido"
    }
    
    Write-Log "Proyecto: $packageName" "info"
    Write-Log "Branch: $branch" "info"
    Write-Log "SSH Alias: $sshAlias" "info"
    
    if (-not (Test-SSHConnection $sshAlias)) {
        throw "No se pudo establecer conexión SSH"
    }
    
    Test-RemoteDependencies $sshAlias
    
    $repoPath = "/repos/$packageName.git"
    $appPath = "/apps/$packageName"
    
    Write-Log "Creando directorios remotos..." "step"
    Invoke-SSH $sshAlias "mkdir -p $repoPath $appPath" | Out-Null
    
    Write-Log "Inicializando repositorio git bare..." "step"
    Invoke-SSH $sshAlias "cd $repoPath && git init --bare --quiet" | Out-Null
    
    Write-Log "Comandos detectados:" "info"
    if ($package.scripts.build) {
        Write-Log "  Build: pnpm build" "info"
    } else {
        Write-Log "  Build: (no definido)" "warning"
    }
    Write-Log "  Start: pnpm start" "info"
    
    Update-RemoteHook
    
    Write-Log "Limpiando configuración git previa..." "step"
    git remote remove production 2>$null | Out-Null
    
    Write-Log "Configurando git remote 'production'..." "step"
    $remoteUrl = "${sshAlias}:${repoPath}"
    git remote add production $remoteUrl
    
    $verifyRemote = git remote get-url production
    Write-Log "Remote configurado: $verifyRemote" "info"
    
    Write-Log "Creando archivo .env de ejemplo..." "step"
    $envExample = "NODE_ENV=production`nPORT=3000"
    $envExample | ssh $sshAlias "cat > $appPath/.env.example"
    
    Write-Log "========================================" "success"
    Write-Log "Inicialización completada" "success"
    Write-Log "========================================" "success"
    Write-Log "" "info"
    Write-Log "Próximos pasos:" "info"
    Write-Log "1. Edita variables: .\zit.ps1 env edit" "info"
    Write-Log "2. Despliega: .\zit.ps1 deploy `"mensaje`"" "info"
    Write-Log "3. Estado: .\zit.ps1 status" "info"
}

function Deploy-Zit {
    param([string]$Message, [switch]$AllowEmpty)
    
    if (-not $Message) {
        throw "Debes proporcionar un mensaje de commit"
    }
    
    Write-Log "Iniciando deploy..." "info"
    Write-Log "========================================" "info"
    
    $config = Get-ZitConfig
    $package = Get-PackageJson
    $branch = $config.BRANCH
    
    Write-Log "Branch: $branch" "info"
    
    Write-Log "Validando package.json..." "step"
    if (-not $package.name) {
        throw "package.json debe tener un nombre definido"
    }
    if (-not $package.scripts.start) {
        throw "package.json debe tener un script 'start' definido"
    }
    
    Write-Log "Verificando remote git..." "step"
    $currentRemote = git remote get-url production 2>$null
    if (-not $currentRemote) {
        Write-Log "Remote 'production' no configurado, ejecuta: .\zit.ps1 init" "error"
        throw "Remote no configurado"
    }
    Write-Log "Remote: $currentRemote" "info"
    
    Write-Log "Agregando cambios..." "step"
    git add . 2>&1 | Out-Null
    
    Write-Log "Creando commit..." "step"
    if ($AllowEmpty) {
        git commit --allow-empty -m $Message 2>&1 | Out-Null
    } else {
        $status = git status --porcelain
        if (-not $status) {
            Write-Log "No hay cambios para commit" "warning"
            $response = Read-Host "¿Hacer push sin cambios? (y/N)"
            if ($response -ne "y") {
                return
            }
        }
        git commit -m $Message 2>&1 | Out-Null
    }
    
    if ($LASTEXITCODE -ne 0 -and -not $AllowEmpty) {
        Write-Log "No hay cambios para commit" "warning"
        return
    }
    
    Write-Log "Pusheando a production ($branch)..." "step"
    Write-Log "========================================" "info"
    
    try {
        $pushOutput = git push production $branch 2>&1
        $pushOutput | ForEach-Object {
            Write-Host $_
        }
        
        if ($LASTEXITCODE -ne 0) {
            throw "Git push falló con código $LASTEXITCODE"
        }
        
        Write-Log "========================================" "success"
        Write-Log "Deploy completado" "success"
        Write-Log "========================================" "success"
        Write-Log "" "info"
        Write-Log "Comandos útiles:" "info"
        Write-Log "  .\zit.ps1 logs" "info"
        Write-Log "  .\zit.ps1 status" "info"
        Write-Log "  .\zit.ps1 restart" "info"
        
    } catch {
        Write-Log "Deploy falló: $_" "error"
        Write-Log "Ver logs: .\zit.ps1 logs" "info"
        throw
    }
}

function Get-RemoteStatus {
    $config = Get-ZitConfig
    $package = Get-PackageJson
    $sshAlias = $config.SSH_ALIAS
    $packageName = if ($config.APP_NAME) { $config.APP_NAME } else { $package.name }
    
    Write-Log "Estado: $packageName" "info"
    Write-Log "========================================" "info"
    
    $envSetup = Get-RemoteEnvSetup
    $pmInfo = Invoke-SSH $sshAlias "$envSetup; pm2 jlist" -IgnoreError
    
    if ($pmInfo.Success -and $pmInfo.Output) {
        try {
            $processes = $pmInfo.Output | ConvertFrom-Json
            $app = $processes | Where-Object { $_.name -eq $packageName }
            
            if ($app) {
                Write-Log "Estado: $($app.pm2_env.status)" "info"
                Write-Log "Uptime: $([TimeSpan]::FromMilliseconds($app.pm2_env.pm_uptime).ToString())" "info"
                Write-Log "CPU: $($app.monit.cpu)%" "info"
                Write-Log "Memoria: $([Math]::Round($app.monit.memory / 1MB, 2)) MB" "info"
                Write-Log "Reinicios: $($app.pm2_env.restart_time)" "info"
                Write-Log "PID: $($app.pid)" "info"
            } else {
                Write-Log "Aplicación no encontrada en PM2" "warning"
            }
        } catch {
            Write-Log "Error al parsear información de PM2" "error"
        }
    } else {
        Write-Log "No se pudo obtener información de PM2" "warning"
    }
}

function Get-RemoteLogs {
    param([string]$Lines = "50")
    
    $config = Get-ZitConfig
    $package = Get-PackageJson
    $sshAlias = $config.SSH_ALIAS
    $packageName = if ($config.APP_NAME) { $config.APP_NAME } else { $package.name }
    
    Write-Log "Logs de $packageName" "info"
    Write-Log "========================================" "info"
    
    $envSetup = Get-RemoteEnvSetup
    $result = Invoke-SSH $sshAlias "$envSetup; pm2 logs $packageName --lines $Lines --nostream" -IgnoreError
    
    if ($result.Success) {
        Write-Host $result.Output
    } else {
        Write-Log "No se pudieron obtener los logs" "error"
    }
}

function Restart-RemoteApp {
    $config = Get-ZitConfig
    $package = Get-PackageJson
    $sshAlias = $config.SSH_ALIAS
    $packageName = if ($config.APP_NAME) { $config.APP_NAME } else { $package.name }
    
    Write-Log "Reiniciando $packageName..." "step"
    
    $envSetup = Get-RemoteEnvSetup
    $result = Invoke-SSH $sshAlias "$envSetup; pm2 restart $packageName"
    
    if ($result.Success) {
        Write-Log "Aplicación reiniciada" "success"
        Start-Sleep -Seconds 2
        Get-RemoteStatus
    } else {
        Write-Log "Error al reiniciar" "error"
    }
}

function Stop-RemoteApp {
    $config = Get-ZitConfig
    $package = Get-PackageJson
    $sshAlias = $config.SSH_ALIAS
    $packageName = if ($config.APP_NAME) { $config.APP_NAME } else { $package.name }
    
    Write-Log "Deteniendo $packageName..." "step"
    
    $envSetup = Get-RemoteEnvSetup
    $result = Invoke-SSH $sshAlias "$envSetup; pm2 stop $packageName"
    
    if ($result.Success) {
        Write-Log "Aplicación detenida" "success"
    } else {
        Write-Log "Error al detener" "error"
    }
}

function Start-RemoteApp {
    $config = Get-ZitConfig
    $package = Get-PackageJson
    $sshAlias = $config.SSH_ALIAS
    $packageName = if ($config.APP_NAME) { $config.APP_NAME } else { $package.name }
    
    Write-Log "Iniciando $packageName..." "step"
    
    $envSetup = Get-RemoteEnvSetup
    $result = Invoke-SSH $sshAlias "$envSetup; pm2 start $packageName"
    
    if ($result.Success) {
        Write-Log "Aplicación iniciada" "success"
    } else {
        Write-Log "Error al iniciar" "error"
    }
}

function Edit-RemoteEnv {
    $config = Get-ZitConfig
    $package = Get-PackageJson
    $sshAlias = $config.SSH_ALIAS
    $packageName = if ($config.APP_NAME) { $config.APP_NAME } else { $package.name }
    
    $envPath = "/apps/$packageName/.env"
    $tempFile = [System.IO.Path]::GetTempFileName()
    
    Write-Log "Descargando .env..." "step"
    
    scp "${sshAlias}:$envPath" $tempFile 2>$null
    
    if ($LASTEXITCODE -ne 0) {
        Write-Log ".env no encontrado, creando nuevo..." "warning"
        "NODE_ENV=production`nPORT=3000" | Out-File -FilePath $tempFile -Encoding UTF8
    }
    
    Write-Log "Abriendo editor..." "info"
    Start-Process -FilePath "notepad.exe" -ArgumentList $tempFile -Wait
    
    Write-Log "Subiendo .env..." "step"
    scp $tempFile "${sshAlias}:$envPath"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log ".env actualizado" "success"
        Write-Log "Ejecuta .\zit.ps1 restart para aplicar cambios" "info"
    } else {
        Write-Log "Error al subir .env" "error"
    }
    
    Remove-Item $tempFile -Force
}

function Show-RemoteEnv {
    $config = Get-ZitConfig
    $package = Get-PackageJson
    $sshAlias = $config.SSH_ALIAS
    $packageName = if ($config.APP_NAME) { $config.APP_NAME } else { $package.name }
    
    Write-Log "Variables de entorno:" "info"
    Write-Log "========================================" "info"
    
    $result = Invoke-SSH $sshAlias "cat /apps/$packageName/.env 2>/dev/null || echo '.env no encontrado'" -IgnoreError
    
    Write-Host $result.Output
}

function Repair-App {
    $config = Get-ZitConfig
    $package = Get-PackageJson
    $sshAlias = $config.SSH_ALIAS
    $packageName = if ($config.APP_NAME) { $config.APP_NAME } else { $package.name }
    
    Write-Log "⚠️  ADVERTENCIA: ESTO BORRARÁ TODO EN EL SERVIDOR" "warning"
    Write-Log "Se eliminarán:" "warning"
    Write-Log "  - Proceso PM2: $packageName" "warning"
    Write-Log "  - Directorio App: /apps/$packageName" "warning"
    Write-Log "  - Repositorio Git: /repos/$packageName.git" "warning"
    
    $response = Read-Host "¿Estás seguro? (escribe 'borrar' para confirmar)"
    if ($response -ne "borrar") {
        Write-Log "Operación cancelada" "warning"
        return
    }
    
    Write-Log "Deteniendo y eliminando proceso PM2..." "step"
    $envSetup = Get-RemoteEnvSetup
    Invoke-SSH $sshAlias "$envSetup; pm2 delete $packageName" -IgnoreError | Out-Null
    
    Write-Log "Eliminando directorios remotos (esto puede tardar)..." "step"
    
    Write-Log "  Eliminando /apps/$packageName..." "info"
    Invoke-SSH $sshAlias "timeout 120s rm -rf /apps/$packageName" | Out-Null
    
    Write-Log "  Eliminando /repos/$packageName.git..." "info"
    Invoke-SSH $sshAlias "timeout 60s rm -rf /repos/$packageName.git" | Out-Null
    
    Write-Log "Limpiando estado local..." "step"
    git remote remove production 2>$null | Out-Null
    
    Write-Log "Reinicializando todo..." "step"
    Initialize-Zit
}

function New-ZitConfig {
    Write-Log "Configuración de Zit" "info"
    Write-Log "========================================" "info"
    
    $sshAlias = Read-Host "Alias SSH configurado (ej: cgsm)"
    
    $appName = Read-Host "Nombre de app (vacío = usar package.json)"
    
    $branch = Read-Host "Branch [main]"
    if (-not $branch) { $branch = "main" }
    
    $configContent = @"
SSH_ALIAS=$sshAlias
$(if ($appName) { "APP_NAME=$appName" })
BRANCH=$branch
"@
    
    $configContent | Out-File -FilePath ".zitconfig" -Encoding UTF8
    
    Write-Log ".zitconfig creado" "success"
}

function Show-Help {
    Write-Host @"

Zit Deploy Tool v$ZIT_VERSION
========================================

Uso: .\zit.ps1 <comando> [args]

Comandos:

  config              Crear configuración
  init                Inicializar en servidor
  repair              Borrar todo y reinicializar (Hard Reset)
  deploy <mensaje>    Desplegar cambios
  retry <mensaje>     Forzar deploy (commit vacío)
  
  status              Estado de la app
  restart             Reiniciar app
  stop                Detener app
  start               Iniciar app
  
  logs [n]            Ver logs (n líneas)
  env show            Ver variables
  env edit            Editar variables
  
  help                Esta ayuda
  version             Versión

Ejemplos:

  .\zit.ps1 config
  .\zit.ps1 init
  .\zit.ps1 repair
  .\zit.ps1 deploy "Nueva feature"
  .\zit.ps1 retry "Forzar redeploy"
  .\zit.ps1 logs 100
  .\zit.ps1 env edit

.zitconfig:

  SSH_ALIAS=cgsm
  APP_NAME=mi-app (opcional)
  BRANCH=main

"@ -ForegroundColor Cyan
}

try {
    switch ($Command) {
        "config" { New-ZitConfig }
        "init" { Initialize-Zit }
        "repair" { Repair-App }
        "deploy" { Deploy-Zit -Message $Arg1 }
        "retry" { Deploy-Zit -Message $Arg1 -AllowEmpty }
        "status" { Get-RemoteStatus }
        "logs" { 
            $lines = if ($Arg1) { $Arg1 } else { "50" }
            Get-RemoteLogs -Lines $lines
        }
        "restart" { Restart-RemoteApp }
        "stop" { Stop-RemoteApp }
        "start" { Start-RemoteApp }
        "env" {
            switch ($Arg1) {
                "edit" { Edit-RemoteEnv }
                "show" { Show-RemoteEnv }
                default {
                    Write-Log "Uso: .\zit.ps1 env <edit|show>" "error"
                }
            }
        }
        "version" {
            Write-Host "Zit Deploy Tool v$ZIT_VERSION" -ForegroundColor Cyan
        }
        "help" { Show-Help }
        default { Show-Help }
    }
} catch {
    Write-Log $_.Exception.Message "error"
    exit 1
}