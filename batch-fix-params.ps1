#!/usr/bin/env powershell

# Script to fix all remaining Next.js 15 parameter issues

$filesToFix = @(
    @{Path="src\app\api\groups\invite-info\[inviteCode]\route.ts"; Param="inviteCode"},
    @{Path="src\app\api\discussions\[id]\notifications\route.ts"; Param="id"},
    @{Path="src\app\api\discussions\[id]\replies\route.ts"; Param="id"},
    @{Path="src\app\api\discussions\[id]\vote\route.ts"; Param="id"},
    @{Path="src\app\api\discussions\[id]\best-answer\route.ts"; Param="id"},
    @{Path="src\app\api\discussions\[id]\bookmark\route.ts"; Param="id"},
    @{Path="src\app\api\creators\[id]\subscription-tiers\route.ts"; Param="id"},
    @{Path="src\app\api\creator\rewards\[id]\route.ts"; Param="id"},
    @{Path="src\app\api\creator\rewards\[id]\select-winners\route.ts"; Param="id"}
)

$totalFixed = 0

foreach ($fileInfo in $filesToFix) {
    $file = $fileInfo.Path
    $param = $fileInfo.Param
    
    if (Test-Path $file) {
        Write-Host "Processing: $file" -ForegroundColor Yellow
        $content = Get-Content $file -Raw
        
        # Fix the parameter type
        $oldPattern = "{ params }: { params: { $param`: string } }"
        $newPattern = "{ params }: { params: Promise<{ $param`: string }> }"
        $content = $content -replace [regex]::Escape($oldPattern), $newPattern
        
        # Add await params destructuring after auth checks
        if ($content -match $newPattern) {
            # Find patterns like "status: 401" and add destructuring after
            if ($content -match "status: 401\s*}\s*\)\s*;?\s*}?\s*\n") {
                $destructuring = "`n    const { $param } = await params;"
                $content = $content -replace "(status: 401\s*}\s*\)\s*;?\s*}?\s*\n)", "`$1$destructuring`n"
            }
            
            # Replace direct params usage
            $content = $content -replace "params\.$param", $param
        }
        
        Set-Content $file -Value $content -Encoding UTF8
        Write-Host "Fixed: $file" -ForegroundColor Green
        $totalFixed++
    } else {
        Write-Host "File not found: $file" -ForegroundColor Red
    }
}

Write-Host "Fixed $totalFixed files with Next.js 15 parameter compatibility" -ForegroundColor Cyan