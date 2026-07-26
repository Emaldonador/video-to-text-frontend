# VideoATexto - Frontend launcher con log
$logFile = Join-Path $PSScriptRoot "frontend_debug.log"
$frontendPath = Join-Path $PSScriptRoot "videoatexto\frontend"

function Log($msg) {
    $ts = Get-Date -Format "HH:mm:ss"
    $line = "[$ts] $msg"
    Write-Host $line
    Add-Content -Path $logFile -Value $line -Encoding UTF8
}

Set-Content -Path $logFile -Value "=== Log de inicio frontend $(Get-Date) ===" -Encoding UTF8

Log "Node version: $(node --version 2>&1)"
Log "npm version: $(npm --version 2>&1)"
Log "Carpeta frontend: $frontendPath"
Log "La carpeta existe: $(Test-Path $frontendPath)"

if (-not (Test-Path $frontendPath)) {
    Log "[ERROR] No existe la carpeta frontend"
    Read-Host "Enter para cerrar"
    exit 1
}

Set-Location $frontendPath
Log "Directorio actual: $(Get-Location)"
Log "package.json existe: $(Test-Path package.json)"

Log "--- Iniciando npm install ---"
$npmOutput = npm install 2>&1
$npmOutput | ForEach-Object { Log $_ }
Log "npm install exit code: $LASTEXITCODE"

if ($LASTEXITCODE -ne 0) {
    Log "[ERROR] npm install fallo"
    Read-Host "Presiona Enter para cerrar"
    exit 1
}

Log "--- Iniciando npm run dev ---"
npm run dev 2>&1 | ForEach-Object { Log $_; Write-Host $_ }

Read-Host "Presiona Enter para cerrar"
