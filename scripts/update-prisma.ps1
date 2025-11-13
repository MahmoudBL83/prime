# PowerShell script to update Prisma schema
Write-Host "Updating Prisma schema..." -ForegroundColor Cyan

# Navigate to project directory
Set-Location "C:\Users\Montag Store\Desktop\egyptian-edtech-platform"

# Create migration
Write-Host "`nCreating migration..." -ForegroundColor Yellow
npx prisma migrate dev --name add_notification_types

# Generate Prisma client
Write-Host "`nGenerating Prisma client..." -ForegroundColor Yellow
npx prisma generate

Write-Host "`n✅ Prisma schema updated successfully!" -ForegroundColor Green
Write-Host "You can now restart your dev server.`n" -ForegroundColor Cyan
