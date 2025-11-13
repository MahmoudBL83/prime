# Seed Creators Script

Write-Host "🌱 Starting creators seed..." -ForegroundColor Cyan

# Run the seed script
npx ts-node --compiler-options "{\""module\"":\""commonjs\""}" prisma/seed-creators.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Creators seeded successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Seed failed!" -ForegroundColor Red
}
