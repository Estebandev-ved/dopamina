# Script para arrancar el Backend de Dopamina Crew automáticamente
# Descarga un Maven portable si no tienes uno instalado y corre el servidor.

$mavenVersion = '3.9.6'
$projectRoot = 'C:\Users\Lenovo\Desktop\dopamina-crew'
$mavenDir = $projectRoot + '\.maven'
$mvnPath = $mavenDir + '\apache-maven-' + $mavenVersion + '\bin\mvn.cmd'

# 1. Liberar el puerto 8080 si está ocupado (previene conflicto con el IDE)
Write-Host '=========================================' -ForegroundColor Cyan
Write-Host '  Liberando puerto 8080...' -ForegroundColor Cyan
Write-Host '=========================================' -ForegroundColor Cyan
$conn = Get-NetTCPConnection -LocalPort 8080 -State Listen -ErrorAction SilentlyContinue
if ($conn) {
    $oldPid = $conn.OwningProcess
    Stop-Process -Id $oldPid -Force -ErrorAction SilentlyContinue
    Write-Host "  Proceso anterior (PID $oldPid) terminado." -ForegroundColor Yellow
    Start-Sleep -Seconds 2
} else {
    Write-Host '  Puerto 8080 libre.' -ForegroundColor Green
}

# 2. Validar y descargar Maven si no existe
if (-not (Test-Path $mvnPath)) {
    Write-Host '=========================================' -ForegroundColor Cyan
    Write-Host '  Instalando Maven localmente para ti... ' -ForegroundColor Cyan
    Write-Host '=========================================' -ForegroundColor Cyan
    
    if (-not (Test-Path $mavenDir)) {
        New-Item -ItemType Directory -Force -Path $mavenDir | Out-Null
    }
    
    $zipPath = $mavenDir + '\maven.zip'
    $downloadUrl = 'https://archive.apache.org/dist/maven/maven-3/' + $mavenVersion + '/binaries/apache-maven-' + $mavenVersion + '-bin.zip'
    
    Write-Host 'Descargando Apache Maven...' -ForegroundColor Yellow
    Invoke-WebRequest -Uri $downloadUrl -OutFile $zipPath
    
    Write-Host 'Extrayendo archivos...' -ForegroundColor Yellow
    Expand-Archive -Path $zipPath -DestinationPath $mavenDir -Force
    
    Write-Host 'Limpiando temporales...' -ForegroundColor Yellow
    Remove-Item -Force $zipPath
    
    Write-Host '✔ Maven listo.' -ForegroundColor Green
}

# 3. Compilar y arrancar Spring Boot
Write-Host '=========================================' -ForegroundColor Cyan
Write-Host '  Compilando y Levantando Spring Boot... ' -ForegroundColor Cyan
Write-Host '=========================================' -ForegroundColor Cyan

$pomPath = $projectRoot + '\backend\pom.xml'
& $mvnPath -f $pomPath clean spring-boot:run
