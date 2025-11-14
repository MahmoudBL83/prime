#!/usr/bin/env powershell

Write-Host "Fixing Next.js 15 params compatibility issues..." -ForegroundColor Green

# Pattern to match and replace
$oldPattern = '{ params }: { params: { ([^}]+) } }'
$newPattern = '{ params }: { params: Promise<{ $1 }> }'

# Get all API route files with dynamic parameters
$files = Get-ChildItem -Path "src/app/api" -Recurse -Include "route.ts" | Where-Object {
    $_.FullName -match '\[[^\]]+\]'
}

$totalFixed = 0
$totalFiles = 0

foreach ($file in $files) {
    $totalFiles++
    $content = Get-Content $file.FullName -Raw
    
    if ($content -match $oldPattern) {
        Write-Host "Fixing file: $($file.FullName)" -ForegroundColor Yellow
        
        # Replace the pattern
        $newContent = $content -replace $oldPattern, $newPattern
        
        # Also need to handle the usage of params - add await where needed
        # Look for direct params.propertyName usage and replace with destructured version
        $lines = $newContent -split "`n"
        $inFunction = $false
        $functionName = ""
        $paramProps = @()
        $modifiedLines = @()
        
        for ($i = 0; $i -lt $lines.Length; $i++) {
            $line = $lines[$i]
            
            # Check if we're entering a function that uses Promise params
            if ($line -match 'export async function (GET|POST|PUT|DELETE|PATCH)') {
                $inFunction = $true
                $functionName = $matches[1]
                $paramProps = @()
                
                # Look ahead for params type to extract property names
                for ($j = $i; $j -lt [Math]::Min($i + 10, $lines.Length); $j++) {
                    if ($lines[$j] -match '{ params }: { params: Promise<{ ([^}]+) }>') {
                        $paramString = $matches[1]
                        $paramProps = $paramString -split '[,;]' | ForEach-Object { 
                            ($_ -split ':')[0].Trim() 
                        }
                        break
                    }
                }
            }
            
            # If we're in a function with Promise params, add destructuring after session check
            if ($inFunction -and $paramProps.Count -gt 0 -and ($line.Trim() -eq '}' -and $lines[$i-1] -match 'status: 401')) {
                $modifiedLines += $line
                $modifiedLines += ""
                $destructuring = "    const { " + ($paramProps -join ', ') + " } = await params;"
                $modifiedLines += $destructuring
            }
            # Replace direct params usage with destructured variables
            elseif ($inFunction -and $paramProps.Count -gt 0) {
                foreach ($prop in $paramProps) {
                    $line = $line -replace "params\.$prop", $prop
                }
                $modifiedLines += $line
            }
            else {
                $modifiedLines += $line
            }
            
            # Check if we're exiting the function
            if ($inFunction -and $line -match '^}\s*$' -and $i -gt 0 -and $lines[$i-1] -match '^\s*}\s*$') {
                $inFunction = $false
                $functionName = ""
                $paramProps = @()
            }
        }
        
        $newContent = $modifiedLines -join "`n"
        
        # Write the fixed content back to file
        Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
        $totalFixed++
        Write-Host "Fixed: $($file.FullName)" -ForegroundColor Green
    }
}

Write-Host "`nProcessed $totalFiles files, fixed $totalFixed files" -ForegroundColor Cyan
Write-Host "Next.js 15 params compatibility fix completed!" -ForegroundColor Green