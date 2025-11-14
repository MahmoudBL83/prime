# PowerShell script to fix Next.js 15 compatibility issues

# Fix next-auth imports
Write-Host "Fixing next-auth imports..."
Get-ChildItem -Recurse -Path "src" -Filter "*.ts" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -match "import \{ getServerSession \} from 'next-auth'") {
        $content = $content -replace "import \{ getServerSession \} from 'next-auth'", "import { getServerSession } from 'next-auth/next'"
        Set-Content $_.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($_.FullName)"
    }
}

# Fix params Promise types in API routes
Write-Host "Fixing params Promise types..."
Get-ChildItem -Recurse -Path "src/app/api" -Filter "*.ts" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $originalContent = $content
    
    # Fix function parameter types for routes with [id] or similar dynamic segments
    $content = $content -replace "\{ params \}: \{ params: \{ ([^}]+) \} \}", "{ params }: { params: Promise<{ `$1 }> }"
    
    # Add await params resolution after the function signature
    if ($content -match "\{ params \}: \{ params: Promise<") {
        # Look for the pattern and add resolvedParams
        $content = $content -replace "(export async function \w+\([^)]+\) \{\s*try \{\s*)", "`$1`n    const resolvedParams = await params;"
        
        # Replace params. references with resolvedParams.
        $content = $content -replace "params\.(\w+)", "resolvedParams.`$1"
    }
    
    if ($content -ne $originalContent) {
        Set-Content $_.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($_.FullName)"
    }
}

Write-Host "All fixes completed!"