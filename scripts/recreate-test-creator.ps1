# PowerShell script to recreate test creator user
Write-Host "🔧 Recreating test creator user..." -ForegroundColor Cyan

# Check if tsx is installed
$tsxInstalled = Get-Command tsx -ErrorAction SilentlyContinue
if (-not $tsxInstalled) {
    Write-Host "❌ tsx not found. Installing..." -ForegroundColor Yellow
    npm install -g tsx
}

# Run the script
Write-Host ""
npx tsx scripts/recreate-test-creator.ts

Write-Host ""
Write-Host "✨ Done! Now:" -ForegroundColor Green
Write-Host "   1. Sign out of the application" -ForegroundColor Yellow
Write-Host "   2. Sign in with: test@creator.com / password123" -ForegroundColor Yellow
Write-Host "   3. Try accessing creator settings again" -ForegroundColor Yellow
