# Comprehensive theme system update script
# This updates all components to use CSS variables for easy color changes

Write-Host "Applying Theme System..." -ForegroundColor Cyan

$replacements = @{
    # Background colors
    'bg-black(?!\w)' = 'bg-background'
    'bg-white(?![\/\w])' = 'bg-background'
    'bg-\[#0a0a0a\]' = 'bg-background'
    'bg-\[#111\]' = 'bg-card'
    'bg-\[#1a1a1a\]' = 'bg-muted'
    'bg-gray-900(?![\/\w])' = 'bg-background'
    'bg-gray-950' = 'bg-background'
    'bg-gray-800(?![\/\w])' = 'bg-card'
    'bg-gray-100' = 'bg-muted'
    'bg-gray-50' = 'bg-background'
    
    # Text colors
    'text-white(?![\/\w])' = 'text-foreground'
    'text-gray-900(?![\/\w])' = 'text-foreground'
    'text-black(?![\/\w])' = 'text-foreground'
    'text-gray-300' = 'text-muted-foreground'
    'text-gray-400' = 'text-muted-foreground'
    'text-gray-500' = 'text-muted-foreground'
    'text-gray-600' = 'text-muted-foreground'
    'text-gray-700' = 'text-foreground'
    
    # Border colors
    'border-white\/10' = 'border-border'
    'border-white\/20' = 'border-border'
    'border-gray-800' = 'border-border'
    'border-gray-700' = 'border-border'
    'border-gray-200' = 'border-border'
    'border-gray-300' = 'border-border'
    
    # Hover states
    'hover:bg-gray-800\/50' = 'hover:bg-card-hover'
    'hover:bg-gray-100' = 'hover:bg-card-hover'
    'hover:text-white(?![\/\w])' = 'hover:text-foreground'
    'hover:border-gray-700' = 'hover:border-border-hover'
}

$files = Get-ChildItem -Path "src" -Include "*.tsx","*.ts" -Recurse -File |
    Where-Object { $_.FullName -notlike "*node_modules*" -and $_.FullName -notlike "*backup*" }

$updatedCount = 0
$totalReplacements = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    $fileReplacements = 0
    
    foreach ($pattern in $replacements.Keys) {
        $replacement = $replacements[$pattern]
        $matches = [regex]::Matches($content, $pattern)
        if ($matches.Count -gt 0) {
            $content = $content -replace $pattern, $replacement
            $fileReplacements += $matches.Count
        }
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $updatedCount++
        $totalReplacements += $fileReplacements
        Write-Host "  Updated: $($file.Name) - $fileReplacements changes" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Theme System Applied!" -ForegroundColor Cyan
Write-Host "Files Updated: $updatedCount" -ForegroundColor Yellow
Write-Host "Total Replacements: $totalReplacements" -ForegroundColor Yellow
Write-Host ""
Write-Host "To change colors, edit: src/app/globals.css" -ForegroundColor Magenta
Write-Host "Look for the :root and .dark sections" -ForegroundColor Magenta
