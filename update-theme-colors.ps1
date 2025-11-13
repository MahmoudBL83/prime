# PowerShell script to update hardcoded colors to theme-aware classes
# This makes colors easily changeable in the future

$files = Get-ChildItem -Path "src" -Include "*.tsx","*.ts" -Recurse -File

$replacements = @{
    # Background colors
    'bg-black(?!\w)' = 'bg-background'
    'bg-white(?!\/)' = 'bg-background'
    'bg-\[#0a0a0a\]' = 'bg-background'
    'bg-\[#111\]' = 'bg-card'
    'bg-\[#1a1a1a\]' = 'bg-muted'
    'bg-gray-900' = 'bg-background'
    'bg-gray-950' = 'bg-background'
    
    # Text colors
    'text-white(?!\/)' = 'text-foreground'
    'text-gray-900' = 'text-foreground'
    'text-black(?!\w)' = 'text-foreground'
    'text-gray-300' = 'text-muted-foreground'
    'text-gray-400' = 'text-muted-foreground'
    
    # Border colors
    'border-white\/10' = 'border-border'
    'border-white\/20' = 'border-border'
    'border-gray-800' = 'border-border'
    'border-gray-700' = 'border-border'
    
    # Card backgrounds
    'bg-white\/5' = 'bg-card'
    'bg-white\/10' = 'bg-card'
    'bg-gray-800' = 'bg-card'
    'bg-gray-800\/50' = 'bg-card hover:bg-card-hover'
}

$count = 0

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    foreach ($pattern in $replacements.Keys) {
        $replacement = $replacements[$pattern]
        $content = $content -replace $pattern, $replacement
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        $count++
        Write-Host "Updated: $($file.FullName)" -ForegroundColor Green
    }
}

Write-Host "`nTotal files updated: $count" -ForegroundColor Cyan
Write-Host "Theme system is now active! Colors can be changed in src/app/globals.css" -ForegroundColor Yellow
