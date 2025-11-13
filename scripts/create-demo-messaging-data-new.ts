import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createMessagingDemoData() {
    try {
        console.log('Creating messaging demo data...');

        // Get existing users
        const users = await prisma.user.findMany({
            take: 5,
            select: {
                id: true,
                name: true,
                email: true,
            },
        });

        if (users.length < 2) {
            console.error('Need at least 2 users to create conversations');
            return;
        }

        console.log(`Found ${users.length} users`);

        // Create demo conversations
        const conversations = [];

        // Direct conversation 1
        const directConv1 = await prisma.conversation.create({
            data: {
                type: 'DIRECT',
                participants: {
                    create: [
                        {
                            userId: users[0].id,
                            role: 'MEMBER',
                        },
                        {
                            userId: users[1].id,
                            role: 'MEMBER',
                        },
                    ],
                },
            },
            include: {
                participants: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        conversations.push(directConv1);
        console.log('Created direct conversation 1');

        // Direct conversation 2
        if (users.length > 2) {
            const directConv2 = await prisma.conversation.create({
                data: {
                    type: 'DIRECT',
                    participants: {
                        create: [
                            {
                                userId: users[0].id,
                                role: 'MEMBER',
                            },
                            {
                                userId: users[2].id,
                                role: 'MEMBER',
                            },
                        ],
                    },
                },
                include: {
                    participants: {
                        include: {
                            user: true,
                        },
                    },
                },
            });

            conversations.push(directConv2);
            console.log('Created direct conversation 2');
        }

        // Group conversation
        if (users.length > 3) {
            const groupConv = await prisma.conversation.create({
                data: {
                    type: 'GROUP',
                    title: 'Study Group - Programming',
                    description: 'A group for discussing programming topics and sharing resources',
                    participants: {
                        create: [
                            {
                                userId: users[0].id,
                                role: 'ADMIN',
                            },
                            {
                                userId: users[1].id,
                                role: 'MEMBER',
                            },
                            {
                                userId: users[2].id,
                                role: 'MEMBER',
                            },
                            {
                                userId: users[3].id,
                                role: 'MEMBER',
                            },
                        ],
                    },
                },
                include: {
                    participants: {
                        include: {
                            user: true,
                        },
                    },
                },
            });

            conversations.push(groupConv);
            console.log('Created group conversation');
        }

        // Create demo messages for each conversation
        for (const conversation of conversations) {
            const participants = conversation.participants;
            const messageCount = Math.floor(Math.random() * 10) + 5; // 5-15 messages

            for (let i = 0; i < messageCount; i++) {
                const randomParticipant = participants[Math.floor(Math.random() * participants.length)];
                const createdAt = new Date();
                createdAt.setHours(createdAt.getHours() - Math.floor(Math.random() * 48)); // Random time in last 48 hours

                const demoMessages = [
                    "Hey there! How are you doing?",
                    "I have a question about the upcoming assignment",
                    "Thanks for your help earlier!",
                    "Can we schedule a meeting for next week?",
                    "I found some great resources for our project",
                    "What do you think about the new course material?",
                    "Let's work together on this problem",
                    "Good morning! Ready for today's lesson?",
                    "I'll send you the notes from yesterday",
                    "Great job on the presentation!",
                    "Do you have time to review my code?",
                    "The deadline is approaching fast",
                    "I need some clarification on this topic",
                    "Thanks for sharing that article",
                    "Looking forward to our collaboration"
                ];

                const randomMessage = demoMessages[Math.floor(Math.random() * demoMessages.length)];

                await prisma.message.create({
                    data: {
                        content: randomMessage,
                        messageType: 'TEXT',
                        conversationId: conversation.id,
                        senderId: randomParticipant.userId,
                        createdAt,
                    },
                });
            }

            // Update conversation updatedAt
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: { updatedAt: new Date() },
            });

            console.log(`Created ${messageCount} messages for conversation ${conversation.id}`);
        }

        console.log('✅ Successfully created messaging demo data!');
        console.log(`Created ${conversations.length} conversations with messages`);

    } catch (error) {
        console.error('Error creating messaging demo data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run if called directly
createMessagingDemoData();

export { createMessagingDemoData };