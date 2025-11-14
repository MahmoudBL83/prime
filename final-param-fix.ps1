#!/usr/bin/env powershell

# Fix remaining critical parameter compatibility issues

Write-Host "Fixing remaining Next.js 15 parameter issues..." -ForegroundColor Cyan

# Simple regex patterns to fix the main issues
$files = Get-ChildItem -Path "src\app\api" -Recurse -Include "*.ts" | Where-Object { 
    $content = Get-Content $_.FullName -Raw
    $content -match '{ params }: { params: { [^}]+: [^}]+ }'
}

$fixCount = 0

foreach ($file in $files) {
    Write-Host "Processing: $($file.FullName)" -ForegroundColor Yellow
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Fix all parameter patterns
    $content = $content -replace '{ params }: { params: { id: string } }', '{ params }: { params: Promise<{ id: string }> }'
    $content = $content -replace '{ params }: { params: { code: string } }', '{ params }: { params: Promise<{ code: string }> }'
    $content = $content -replace '{ params }: { params: { inviteCode: string } }', '{ params }: { params: Promise<{ inviteCode: string }> }'
    $content = $content -replace '{ params }: { params: { certificateNumber: string } }', '{ params }: { params: Promise<{ certificateNumber: string }> }'
    
    # Add simple await destructuring after auth check patterns
    if ($content -ne $originalContent) {
        # Look for auth check patterns and add destructuring
        if ($content -match 'status: 401\s*}\s*\)\s*;?\s*}?\s*\n\s*') {
            # Add id destructuring if Promise<{ id: string }> is present
            if ($content -match 'Promise<\{ id: string \}>') {
                $content = $content -replace '(status: 401\s*}\s*\)\s*;?\s*}?\s*\n)(\s*)', "`$1`$2const { id } = await params;`n`$2"
            }
            # Add code destructuring if Promise<{ code: string }> is present
            if ($content -match 'Promise<\{ code: string \}>') {
                $content = $content -replace '(status: 401\s*}\s*\)\s*;?\s*}?\s*\n)(\s*)', "`$1`$2const { code } = await params;`n`$2"
            }
            # Add inviteCode destructuring if Promise<{ inviteCode: string }> is present
            if ($content -match 'Promise<\{ inviteCode: string \}>') {
                $content = $content -replace '(status: 401\s*}\s*\)\s*;?\s*}?\s*\n)(\s*)', "`$1`$2const { inviteCode } = await params;`n`$2"
            }
            # Add certificateNumber destructuring if Promise<{ certificateNumber: string }> is present
            if ($content -match 'Promise<\{ certificateNumber: string \}>') {
                $content = $content -replace '(status: 401\s*}\s*\)\s*;?\s*}?\s*\n)(\s*)', "`$1`$2const { certificateNumber } = await params;`n`$2"
            }
        }
        
        # Replace direct params usage
        $content = $content -replace 'params\.id', 'id'
        $content = $content -replace 'params\.code', 'code'
        $content = $content -replace 'params\.inviteCode', 'inviteCode'
        $content = $content -replace 'params\.certificateNumber', 'certificateNumber'
        
        Set-Content $file.FullName -Value $content -Encoding UTF8
        Write-Host "Fixed: $($file.FullName)" -ForegroundColor Green
        $fixCount++
    }
}

Write-Host "Fixed $fixCount files with parameter issues" -ForegroundColor Cyan