#!/usr/bin/env powershell

# Comprehensive fix for multi-parameter routes in Next.js 15

Write-Host "Fixing multi-parameter routes for Next.js 15..." -ForegroundColor Cyan

# Multi-parameter patterns to fix
$multiParamRoutes = @(
    @{
        Path = "src\app\api\creator\courses\[id]\submissions\[submissionId]\route.ts"
        Pattern = "{ params }: { params: { id: string; submissionId: string } }"
        NewPattern = "{ params }: { params: Promise<{ id: string; submissionId: string }> }"
        Destructure = "const { id, submissionId } = await params;"
    },
    @{
        Path = "src\app\api\creator\courses\[id]\quizzes\[quizId]\route.ts"
        Pattern = "{ params }: { params: { id: string; quizId: string } }"
        NewPattern = "{ params }: { params: Promise<{ id: string; quizId: string }> }"
        Destructure = "const { id, quizId } = await params;"
    },
    @{
        Path = "src\app\api\creator\courses\[id]\assignments\[assignmentId]\route.ts"
        Pattern = "{ params }: { params: { id: string; assignmentId: string } }"
        NewPattern = "{ params }: { params: Promise<{ id: string; assignmentId: string }> }"
        Destructure = "const { id, assignmentId } = await params;"
    },
    @{
        Path = "src\app\api\creator\cohorts\[id]\milestones\[milestoneId]\route.ts"
        Pattern = "{ params }: { params: { id: string; milestoneId: string } }"
        NewPattern = "{ params }: { params: Promise<{ id: string; milestoneId: string }> }"
        Destructure = "const { id, milestoneId } = await params;"
    },
    @{
        Path = "src\app\api\creator\cohorts\[id]\sessions\[sessionId]\route.ts"
        Pattern = "{ params }: { params: { id: string; sessionId: string } }"
        NewPattern = "{ params }: { params: Promise<{ id: string; sessionId: string }> }"
        Destructure = "const { id, sessionId } = await params;"
    },
    @{
        Path = "src\app\api\creator\cohorts\[id]\sessions\[sessionId]\attendance\route.ts"
        Pattern = "{ params }: { params: { id: string; sessionId: string } }"
        NewPattern = "{ params }: { params: Promise<{ id: string; sessionId: string }> }"
        Destructure = "const { id, sessionId } = await params;"
    }
)

$fixCount = 0

foreach ($route in $multiParamRoutes) {
    $file = $route.Path
    
    if (Test-Path $file) {
        Write-Host "Processing multi-param file: $file" -ForegroundColor Yellow
        $content = Get-Content $file -Raw
        $originalContent = $content
        
        # Replace the parameter pattern
        $escapedOld = [regex]::Escape($route.Pattern)
        $content = $content -replace $escapedOld, $route.NewPattern
        
        # Add destructuring after auth checks
        if ($content -ne $originalContent) {
            # Add destructuring after status: 401 patterns
            if ($content -match "status: 401\s*}\s*\)\s*;?\s*}?\s*\n") {
                $content = $content -replace "(status: 401\s*}\s*\)\s*;?\s*}?\s*\n)(\s*)", "`$1`$2$($route.Destructure)`n`$2"
            }
            
            # Replace params.property usage
            $content = $content -replace "params\.id", "id"
            $content = $content -replace "params\.submissionId", "submissionId"
            $content = $content -replace "params\.quizId", "quizId"
            $content = $content -replace "params\.assignmentId", "assignmentId"
            $content = $content -replace "params\.milestoneId", "milestoneId"
            $content = $content -replace "params\.sessionId", "sessionId"
            $content = $content -replace "params\.announcementId", "announcementId"
            
            Set-Content $file -Value $content -Encoding UTF8
            Write-Host "Fixed multi-param file: $file" -ForegroundColor Green
            $fixCount++
        }
    } else {
        Write-Host "Multi-param file not found: $file" -ForegroundColor Red
    }
}

Write-Host "Fixed $fixCount multi-parameter route files" -ForegroundColor Cyan