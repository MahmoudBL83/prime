# Quick fix for Next.js 15 params issues
$files = @(
    "src\app\api\study-buddy\matches\[id]\route.ts",
    "src\app\api\study-buddy\sessions\[id]\route.ts", 
    "src\app\api\student\cohorts\[id]\route.ts",
    "src\app\api\sessions\[id]\route.ts",
    "src\app\api\signature-courses\[courseId]\watch\route.ts",
    "src\app\api\signature-courses\[courseId]\progress\route.ts",
    "src\app\api\sessions\[id]\join\route.ts",
    "src\app\api\sessions\[id]\leave\route.ts",
    "src\app\api\messages\[conversationId]\route.ts",
    "src\app\api\messages\delete\[messageId]\route.ts",
    "src\app\api\mentor-subscriptions\[id]\route.ts",
    "src\app\api\live-sessions\[id]\join\route.ts",
    "src\app\api\live-sessions\[id]\leave\route.ts"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Fixing: $file" -ForegroundColor Yellow
        $content = Get-Content $file -Raw
        
        # Fix id parameter
        $content = $content -replace '{ params }: { params: { id: string } }', '{ params }: { params: Promise<{ id: string }> }'
        # Fix courseId parameter
        $content = $content -replace '{ params }: { params: { courseId: string } }', '{ params }: { params: Promise<{ courseId: string }> }'
        # Fix conversationId parameter  
        $content = $content -replace '{ params }: { params: { conversationId: string } }', '{ params }: { params: Promise<{ conversationId: string }> }'
        # Fix messageId parameter
        $content = $content -replace '{ params }: { params: { messageId: string } }', '{ params }: { params: Promise<{ messageId: string }> }'
        
        # Add await params destructuring after session check (simple approach)
        $content = $content -replace 'params\.id', 'resolvedParams.id'
        $content = $content -replace 'params\.courseId', 'resolvedParams.courseId' 
        $content = $content -replace 'params\.conversationId', 'resolvedParams.conversationId'
        $content = $content -replace 'params\.messageId', 'resolvedParams.messageId'
        
        # Add params resolution after auth check
        if ($content -match 'status: 401') {
            $content = $content -replace '(\s+}\s*\n)(\s+)(.*)', "`$1`$2`$3`n`$2const resolvedParams = await params;"
        }
        
        Set-Content $file -Value $content -Encoding UTF8
        Write-Host "Fixed: $file" -ForegroundColor Green
    }
}

Write-Host "Parameter fixes completed!" -ForegroundColor Cyan