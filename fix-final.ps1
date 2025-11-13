$fileItem = Get-Item "c:\Users\Montag Store\Desktop\egyptian-edtech-platform\src\app\*\courses\*\page.tsx"
$file = $fileItem.FullName
$lines = Get-Content $file

Write-Host "Original file has $($lines.Count) lines"

# Find the line with "seeAllLink" - this is where the orphaned code starts
$orphanStartIndex = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "seeAllLink") {
        $orphanStartIndex = $i
        Write-Host "Found orphaned code starting at line $($i + 1): $($lines[$i])"
        break
    }
}

if ($orphanStartIndex -gt 0) {
    # Keep everything before the orphaned code
    $cleanLines = $lines[0..($orphanStartIndex - 1)]
    $cleanLines | Set-Content $file -Force
    Write-Host "SUCCESS! Removed orphaned code. File now has $($cleanLines.Count) lines (was $($lines.Count))."
    Write-Host "Removed $($lines.Count - $cleanLines.Count) lines."
} else {
    Write-Host "Could not find orphaned code pattern 'seeAllLink'"
}
