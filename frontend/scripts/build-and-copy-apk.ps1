param(
    [string]$targetDir = 'C:\Users\claudio.fontanarosa\OneDrive - Accenture\Lavoro\prj Copilot\salon-booking-app\'
)

Write-Host "Using target directory: $targetDir"

# Ensure target directory exists
if (-not (Test-Path -Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

$frontendRoot = Resolve-Path "$(Split-Path -Parent $MyInvocation.MyCommand.Path)\.."
Set-Location $frontendRoot

Write-Host "Running Ionic production build..."
ionic build --prod
if ($LASTEXITCODE -ne 0) { throw "ionic build failed with exit code $LASTEXITCODE" }

Write-Host "Syncing Capacitor (android)..."
Set-Location (Resolve-Path "$(Split-Path -Parent $frontendRoot)\")
npx cap sync android
if ($LASTEXITCODE -ne 0) { throw "npx cap sync android failed with exit code $LASTEXITCODE" }

Write-Host "Building Android APK (Gradle)..."
Set-Location (Resolve-Path "$frontendRoot\android")
.\gradlew assembleDebug
if ($LASTEXITCODE -ne 0) { throw "gradle assembleDebug failed with exit code $LASTEXITCODE" }

$builtApk = Join-Path -Path $PWD -ChildPath "app\build\outputs\apk\debug\app-debug.apk"
if (-not (Test-Path -Path $builtApk)) {
    throw "APK not found at expected path: $builtApk"
}

Write-Host "APK built at: $builtApk"

# Copy APK to targetDir (keep timestamped archive and a latest copy)
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archiveDir = Join-Path -Path $targetDir -ChildPath "apks"
if (-not (Test-Path -Path $archiveDir)) { New-Item -ItemType Directory -Path $archiveDir | Out-Null }

$archivePath = Join-Path -Path $archiveDir -ChildPath "app-debug-$timestamp.apk"
Copy-Item -Path $builtApk -Destination $archivePath -Force

$latestPath = Join-Path -Path $targetDir -ChildPath "app-debug-latest.apk"
Copy-Item -Path $builtApk -Destination $latestPath -Force

Write-Host "Copied APK to: $archivePath"
Write-Host "Also copied latest APK to: $latestPath"

Write-Host "Build and copy completed successfully."
