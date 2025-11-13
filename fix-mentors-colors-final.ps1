# Comprehensive fix for mentors page light mode colors
# This script fixes ALL remaining color issues

$ErrorActionPreference = "Stop"
$file = "src\app\[locale]\mentors\page.tsx"

Write-Host "Reading mentors page..." -ForegroundColor Cyan
$lines = Get-Content $file -Encoding UTF8

Write-Host "Applying color fixes..." -ForegroundColor Yellow

$patterns = @{
    'text-white"' = 'text-foreground"'
    "text-white'" = "text-foreground'"
    'text-white ' = 'text-foreground '
    'text-gray-200' = 'text-muted-foreground'
    'text-gray-300' = 'text-muted-foreground'
    'text-gray-400' = 'text-muted-foreground'
    'text-gray-500' = 'text-muted-foreground'
    'text-gray-600' = 'text-muted-foreground'
    'bg-white/\[0\.02\]' = 'bg-card-hover'
    'hover:bg-white/\[0\.02\]' = 'hover:bg-card-hover'
    'border-white/10' = 'border-border'
    'border-white/20' = 'border-border'
    'divide-white/10' = 'divide-border'
    'border-2 border-black' = 'border-2 border-background'
}

$changes = 0
for ($i = 0; $i -lt $lines.Length; $i++) {
    $line = $lines[$i]
    $originalLine = $line
    
    foreach ($pattern in $patterns.Keys) {
        $replacement = $patterns[$pattern]
        if ($line -match [regex]::Escape($pattern)) {
            $line = $line -replace [regex]::Escape($pattern), $replacement
        }
    }
    
    if ($line -ne $originalLine) {
        $lines[$i] = $line
        $changes++
    }
}

Write-Host "Writing changes..." -ForegroundColor Green
$lines | Set-Content $file -Encoding UTF8

Write-Host ""
Write-Host "Complete! Fixed $changes lines" -ForegroundColor Green
Write-Host "Mentors page is now light-mode ready!" -ForegroundColor Cyan
