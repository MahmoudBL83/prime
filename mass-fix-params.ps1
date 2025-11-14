#!/usr/bin/env powershell

# Fix specific files with Next.js 15 params compatibility
$filesToFix = @(
    "src\app\api\study-buddy\matches\[id]\route.ts",
    "src\app\api\student\cohorts\[id]\route.ts", 
    "src\app\api\messages\[conversationId]\route.ts",
    "src\app\api\messages\delete\[messageId]\route.ts",
    "src\app\api\mentor-subscriptions\[id]\route.ts",
    "src\app\api\live-sessions\[id]\route.ts",
    "src\app\api\lessons\[id]\bookmarks\route.ts",
    "src\app\api\live-sessions\[id]\leave\route.ts",
    "src\app\api\live-sessions\[id]\stats\route.ts"
)

$fixCount = 0

foreach ($file in $filesToFix) {
    if (Test-Path $file) {
        Write-Host "Processing: $file" -ForegroundColor Yellow
        $content = Get-Content $file -Raw
        
        # Store original content to check if changes were made
        $originalContent = $content
        
        # Fix parameter patterns
        $content = $content -replace '{ params }: { params: { id: string } }', '{ params }: { params: Promise<{ id: string }> }'
        $content = $content -replace '{ params }: { params: { conversationId: string } }', '{ params }: { params: Promise<{ conversationId: string }> }'
        $content = $content -replace '{ params }: { params: { messageId: string } }', '{ params }: { params: Promise<{ messageId: string }> }'
        
        # Fix direct params usage patterns
        $content = $content -replace 'params\.id', 'resolvedId'
        $content = $content -replace 'params\.conversationId', 'resolvedConversationId'
        $content = $content -replace 'params\.messageId', 'resolvedMessageId'
        
        # Add param resolution after auth checks
        if ($content -match 'status: 401\s*}\s*\)\s*;?\s*}?\s*\n') {
            # For id parameter
            if ($content -match 'Promise<\{ id: string \}>') {
                $content = $content -replace '(status: 401\s*}\s*\)\s*;?\s*}?\s*\n\s*)', "`$1`n    const { id } = await params;`n    const resolvedId = id;`n"
            }
            # For conversationId parameter
            if ($content -match 'Promise<\{ conversationId: string \}>') {
                $content = $content -replace '(status: 401\s*}\s*\)\s*;?\s*}?\s*\n\s*)', "`$1`n    const { conversationId } = await params;`n    const resolvedConversationId = conversationId;`n"
            }
            # For messageId parameter
            if ($content -match 'Promise<\{ messageId: string \}>') {
                $content = $content -replace '(status: 401\s*}\s*\)\s*;?\s*}?\s*\n\s*)', "`$1`n    const { messageId } = await params;`n    const resolvedMessageId = messageId;`n"
            }
        }
        
        # Check if content changed and write back
        if ($content -ne $originalContent) {
            Set-Content $file -Value $content -Encoding UTF8
            Write-Host "Fixed: $file" -ForegroundColor Green
            $fixCount++
        } else {
            Write-Host "No changes needed: $file" -ForegroundColor Gray
        }
    } else {
        Write-Host "File not found: $file" -ForegroundColor Red
    }
}

Write-Host "Fixed $fixCount files" -ForegroundColor Cyan