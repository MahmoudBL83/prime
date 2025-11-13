import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO } from 'socket.io';
import Redis from 'ioredis';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

export type NextApiResponseServerIO = NextApiResponse & {
    socket: {
        server: NetServer & {
            io: ServerIO;
        };
    };
};

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
});

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
    if (res.socket.server.io) {
        console.log('Socket is already running');
    } else {
        console.log('Socket is initializing');
        const io = new ServerIO(res.socket.server, {
            path: '/api/socket',
            addTrailingSlash: false,
            cors: {
                origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
                methods: ['GET', 'POST'],
            },
        });

        // Redis adapter for scaling
        io.adapter(require('socket.io-redis')({
            pubClient: redis,
            subClient: redis.duplicate(),
        }));

        // Authentication middleware
        io.use(async (socket, next) => {
            try {
                const session = await getServerSession(
                    req as any,
                    res as any,
                    authOptions
                );

                if (!session?.user) {
                    return next(new Error('Authentication error'));
                }

                socket.data.user = session.user;
                next();
            } catch (error) {
                next(new Error('Authentication error'));
            }
        });

        // Connection event
        io.on('connection', (socket) => {
            console.log(`User ${socket.data.user?.id} connected`);

            // Join user to their personal room
            socket.join(`user:${socket.data.user?.id}`);

            // Handle joining conversation
            socket.on('join_conversation', (conversationId: string) => {
                socket.join(`conversation:${conversationId}`);
                console.log(`User ${socket.data.user?.id} joined conversation ${conversationId}`);
            });

            // Handle leaving conversation
            socket.on('leave_conversation', (conversationId: string) => {
                socket.leave(`conversation:${conversationId}`);
                console.log(`User ${socket.data.user?.id} left conversation ${conversationId}`);
            });

            // Handle joining group
            socket.on('join_group', (groupId: string) => {
                socket.join(`group:${groupId}`);
                console.log(`User ${socket.data.user?.id} joined group ${groupId}`);
            });

            // Handle leaving group
            socket.on('leave_group', (groupId: string) => {
                socket.leave(`group:${groupId}`);
                console.log(`User ${socket.data.user?.id} left group ${groupId}`);
            });

            // Handle sending message
            socket.on('send_message', async (data: {
                conversationId: string;
                content: string;
                messageType?: string;
                replyToId?: string;
            }) => {
                try {
                    // Emit to conversation room
                    socket.to(`conversation:${data.conversationId}`).emit('message_sent', {
                        id: Date.now().toString(), // Temporary ID
                        conversationId: data.conversationId,
                        senderId: socket.data.user?.id,
                        content: data.content,
                        messageType: data.messageType || 'TEXT',
                        replyToId: data.replyToId,
                        createdAt: new Date().toISOString(),
                    });

                    // Emit typing stop
                    socket.to(`conversation:${data.conversationId}`).emit('typing_stop', {
                        userId: socket.data.user?.id,
                        conversationId: data.conversationId,
                    });
                } catch (error) {
                    socket.emit('error', { message: 'Failed to send message' });
                }
            });

            // Handle typing indicators
            socket.on('typing_start', (conversationId: string) => {
                socket.to(`conversation:${conversationId}`).emit('typing_start', {
                    userId: socket.data.user?.id,
                    conversationId,
                });
            });

            socket.on('typing_stop', (conversationId: string) => {
                socket.to(`conversation:${conversationId}`).emit('typing_stop', {
                    userId: socket.data.user?.id,
                    conversationId,
                });
            });

            // Handle message reactions
            socket.on('message_reaction', (data: {
                messageId: string;
                emoji: string;
            }) => {
                // Broadcast to conversation
                socket.to(`conversation:${data.messageId}`).emit('message_reaction', {
                    messageId: data.messageId,
                    userId: socket.data.user?.id,
                    emoji: data.emoji,
                });
            });

            // Handle user online status
            socket.on('user_online', () => {
                socket.broadcast.emit('user_online', {
                    userId: socket.data.user?.id,
                });
            });

            // Handle disconnect
            socket.on('disconnect', () => {
                console.log(`User ${socket.data.user?.id} disconnected`);
                socket.broadcast.emit('user_offline', {
                    userId: socket.data.user?.id,
                });
            });
        });

        res.socket.server.io = io;
    }

    res.end();
};

export default SocketHandler;