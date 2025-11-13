$file = "c:\Users\Montag Store\Desktop\egyptian-edtech-platform\src\app\[locale]\courses\[id]\page.tsx"
$allLines = @(Get-Content -LiteralPath $file)

Write-Host "File: $file"
Write-Host "Total lines: $($allLines.Count)"

# Just keep the first 1331 lines (0-1330 in array, which is lines 1-1331)
$keepLines = $allLines[0..1330]

# Write it back
$keepLines | Set-Content -LiteralPath $file -Force

Write-Host "Done! Kept first 1331 lines. File now has $($keepLines.Count) lines."
Write-Host "Check line 1331: $($keepLines[-1])"
