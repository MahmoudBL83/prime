import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
    // Socket.io is not supported in Vercel's serverless environment
    // Real-time features require a persistent server (Railway, Render, etc.)
    return new Response(JSON.stringify({
        error: 'Real-time features not available',
        message: 'Socket.io requires a persistent server. Deploy the socket server separately on Railway or Render.',
        status: 'disabled'
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}

export async function POST(req: NextRequest) {
    // Socket.io initialization disabled for Vercel
    return new Response(JSON.stringify({
        error: 'Real-time features not available',
        message: 'Socket.io server cannot run in Vercel serverless environment.',
        status: 'disabled'
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}
