$fileItem = Get-Item "c:\Users\Montag Store\Desktop\egyptian-edtech-platform\src\app\*\courses\*\page.tsx"
$file = $fileItem.FullName
$lines = Get-Content $file
$newLines = @()
$foundEnd = $false
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "^\}$" -and $i -gt 1320 -and -not $foundEnd) {
        $newLines += $lines[$i]
        $foundEnd = $true
        Write-Host "Found end at line $($i+1), stopping here"
        break
    }
    $newLines += $lines[$i]
}
$newLines | Set-Content $file -Force
Write-Host "Done! File now has $($newLines.Count) lines (was $($lines.Count))."
