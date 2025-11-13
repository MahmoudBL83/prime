# Fix mentors page specific color issues for light mode

$file = "src\app\[locale]\mentors\page.tsx"
Write-Host "Fixing mentors page colors..." -ForegroundColor Cyan

$content = Get-Content $file -Raw

# Keep gradient badge text white (it's on colored backgrounds)
# But fix regular text colors

$patterns = @{
    # Text colors (but not in gradients or colored backgrounds)
    'className="font-bold text-white hover:underline' = 'className="font-bold text-foreground hover:underline'
    'className="text-white mb-3 cursor-pointer hover:bg-white/\[0\.02\]' = 'className="text-foreground mb-3 cursor-pointer hover:bg-card-hover'
    'text-gray-500' = 'text-muted-foreground'
    'text-gray-300' = 'text-muted-foreground'
    'text-gray-400' = 'text-muted-foreground'
    
    # Borders
    'border-white/10' = 'border-border'
    'border-white/20' = 'border-border'
    
    # Backgrounds
    'hover:bg-white/\[0\.02\]' = 'hover:bg-card-hover'
    'bg-white/\[0\.02\]' = 'bg-card-hover'
    
    # Specific fixes for active states
    "bg-purple-500/20 text-white'" = "bg-purple-500/20 text-foreground'"
    'hover:bg-white/\[0\.02\] text-gray-300' = 'hover:bg-card-hover text-muted-foreground'
}

$changeCount = 0
foreach ($pattern in $patterns.Keys) {
    $replacement = $patterns[$pattern]
    $before = $content
    $content = $content -replace [regex]::Escape($pattern), $replacement
    if ($content -ne $before) {
        $changeCount++
        Write-Host "  Applied: $pattern" -ForegroundColor Green
    }
}

Set-Content -Path $file -Value $content -NoNewline

Write-Host ""
Write-Host "Completed! Made $changeCount pattern replacements" -ForegroundColor Yellow
Write-Host "Light mode colors fixed for mentors page" -ForegroundColor Green
