# PowerShell script to permanently add Node.js to PATH
Write-Host "Fixing Node.js PATH configuration..." -ForegroundColor Green

# Get current user PATH
$currentUserPath = [Environment]::GetEnvironmentVariable("PATH", [EnvironmentVariableTarget]::User)
$nodePath = "C:\Program Files\nodejs"

# Check if Node.js path is already in user PATH
if ($currentUserPath -notlike "*$nodePath*") {
    Write-Host "Adding Node.js to user PATH..." -ForegroundColor Yellow
    $newUserPath = $currentUserPath + ";" + $nodePath
    [Environment]::SetEnvironmentVariable("PATH", $newUserPath, [EnvironmentVariableTarget]::User)
    Write-Host "✓ Node.js added to user PATH" -ForegroundColor Green
} else {
    Write-Host "✓ Node.js already in user PATH" -ForegroundColor Green
}

# Try to add to system PATH (requires admin)
try {
    $currentSystemPath = [Environment]::GetEnvironmentVariable("PATH", [EnvironmentVariableTarget]::Machine)
    if ($currentSystemPath -notlike "*$nodePath*") {
        Write-Host "Attempting to add Node.js to system PATH (requires admin)..." -ForegroundColor Yellow
        [Environment]::SetEnvironmentVariable("PATH", $currentSystemPath + ";" + $nodePath, [EnvironmentVariableTarget]::Machine)
        Write-Host "✓ Node.js added to system PATH" -ForegroundColor Green
    } else {
        Write-Host "✓ Node.js already in system PATH" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ Could not modify system PATH (admin required). User PATH has been configured." -ForegroundColor Yellow
    Write-Host "For system-wide access, run this script as administrator." -ForegroundColor Yellow
}

# Refresh current session PATH
$env:PATH = [Environment]::GetEnvironmentVariable("PATH", [EnvironmentVariableTarget]::User) + ";" + [Environment]::GetEnvironmentVariable("PATH", [EnvironmentVariableTarget]::Machine)

# Test npm availability
Write-Host "`nTesting npm availability..." -ForegroundColor Blue
try {
    $npmVersion = npm --version
    Write-Host "✓ npm is working! Version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm still not available. You may need to restart your terminal." -ForegroundColor Red
}

Write-Host "`nPATH configuration completed!" -ForegroundColor Green
Write-Host "You may need to restart your terminal or IDE for changes to take effect." -ForegroundColor Yellow
