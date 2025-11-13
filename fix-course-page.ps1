$file = Get-Item "c:\Users\Montag Store\Desktop\egyptian-edtech-platform\src\app\*\courses\*\page.tsx"
$content = Get-Content $file.FullName -Raw
# Find the position of the last proper closing brace
$lastBrace = $content.LastIndexOf("}

                            seeAllLink")
if ($lastBrace -gt 0) {
    $fixedContent = $content.Substring(0, $lastBrace + 1)
    $fixedContent | Set-Content $file.FullName -NoNewline -Force
    Write-Host "Fixed! Removed orphaned code after closing brace."
} else {
    Write-Host "Could not find orphaned code pattern."
}
