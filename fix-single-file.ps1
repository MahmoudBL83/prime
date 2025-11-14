# Simple approach to fix Next.js 15 params issues
param(
    [string]$filePath
)

$content = Get-Content $filePath | Out-String
$newContent = $content -replace '{ params }: { params: { ([^}]+) } }', '{ params }: { params: Promise<{ $1 }> }'

if ($content -ne $newContent) {
    Set-Content -Path $filePath -Value $newContent -Encoding UTF8
    Write-Host "Fixed: $filePath" -ForegroundColor Green
} else {
    Write-Host "No changes needed: $filePath" -ForegroundColor Yellow
}