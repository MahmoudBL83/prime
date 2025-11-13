// Temporarily disabled for deployment
// This API route requires next/auth configuration
export async function GET() {
    return Response.json({ error: 'API temporarily disabled' }, { status: 503 })
}

export async function POST() {
    return Response.json({ error: 'API temporarily disabled' }, { status: 503 })
}