import { NextRequest } from 'next/server';
import SocketHandler from '@/lib/socket';

export async function GET(req: NextRequest) {
    // This endpoint is just for initialization
    // The actual Socket.io connection will be handled by the SocketHandler
    return new Response('Socket.io endpoint', { status: 200 });
}

export async function POST(req: NextRequest) {
    // Handle Socket.io initialization
    const res = {
        socket: {
            server: {
                io: undefined as any,
            },
        },
        end: () => { },
        status: (code: number) => ({
            end: () => { },
        }),
    };

    // Initialize Socket.io server
    SocketHandler(req as any, res as any);

    return new Response('Socket.io initialized', { status: 200 });
}
