import { PrismaClient, UserRole, ConversationType, NotificationType } from '@prisma/client'

const prisma = new PrismaClient()

async function createDemoMessagingData() {
    try {
        console.log('🔧 Setting up demo messaging data...')

        // Get demo users
        const fatma = await prisma.user.findUnique({
            where: { email: 'fatma@demo.com' }
        })

        const sarah = await prisma.user.findUnique({
            where: { email: 'dr.sarah@demo.com' }
        })

        const admin = await prisma.user.findUnique({
            where: { email: 'admin@prime.eg' }
        })

        if (!fatma || !sarah || !admin) {
            console.log('❌ Demo users not found. Please run create-demo-users.ts first.')
            return
        }

        console.log('✅ Found demo users')

        // Create a direct conversation between Fatma and Sarah
        let conversation = await prisma.conversation.findFirst({
            where: {
                type: ConversationType.DIRECT,
                participants: {
                    every: {
                        userId: { in: [fatma.id, sarah.id] }
                    }
                }
            },
            include: { participants: true }
        })

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    type: ConversationType.DIRECT,
                    participants: {
                        create: [
                            { userId: fatma.id, role: 'MEMBER' as const },
                            { userId: sarah.id, role: 'MEMBER' as const }
                        ]
                    }
                },
                include: { participants: true }
            })
            console.log('✅ Created direct conversation between Fatma and Dr. Sarah')
        } else {
            console.log('👤 Direct conversation already exists')
        }

        // Add some demo messages to the conversation
        const messageCount = await prisma.message.count({
            where: { conversationId: conversation.id }
        })

        if (messageCount === 0) {
            const messages = [
                {
                    conversationId: conversation.id,
                    senderId: fatma.id,
                    content: 'Hello Dr. Sarah! I just finished your React course and I have some questions about state management.',
                    messageType: 'TEXT' as const
                },
                {
                    conversationId: conversation.id,
                    senderId: sarah.id,
                    content: 'Hi Fatma! I\'m glad you enjoyed the course. I\'d be happy to help with your questions about state management. What specifically are you struggling with?',
                    messageType: 'TEXT' as const
                },
                {
                    conversationId: conversation.id,
                    senderId: fatma.id,
                    content: 'I\'m having trouble understanding when to use useState vs useReducer. Could you explain the difference with a practical example?',
                    messageType: 'TEXT' as const
                },
                {
                    conversationId: conversation.id,
                    senderId: sarah.id,
                    content: 'Great question! useState is perfect for simple state values, while useReducer is better for complex state logic. Let me give you an example...',
                    messageType: 'TEXT' as const
                },
                {
                    conversationId: conversation.id,
                    senderId: fatma.id,
                    content: 'Thank you so much! That makes perfect sense now. I really appreciate you taking the time to explain this.',
                    messageType: 'TEXT' as const
                }
            ]

            for (const messageData of messages) {
                await prisma.message.create({
                    data: messageData
                })
            }

            console.log('✅ Added demo messages to the conversation')
        } else {
            console.log(`👤 Conversation already has ${messageCount} messages`)
        }

        // Create a study group
        let studyGroup = await prisma.group.findFirst({
            where: { name: 'React Study Group' }
        })

        if (!studyGroup) {
            // First create a group conversation
            const groupConversation = await prisma.conversation.create({
                data: {
                    type: ConversationType.GROUP,
                    title: 'React Study Group',
                    description: 'A group for discussing React concepts and helping each other learn'
                }
            })

            studyGroup = await prisma.group.create({
                data: {
                    conversationId: groupConversation.id,
                    name: 'React Study Group',
                    description: 'A group for discussing React concepts and helping each other learn',
                    privacy: 'PUBLIC',
                    maxMembers: 50,
                    createdBy: sarah.id,
                    members: {
                        create: [
                            { userId: sarah.id, role: 'ADMIN' },
                            { userId: fatma.id, role: 'MEMBER' },
                            { userId: admin.id, role: 'MEMBER' }
                        ]
                    }
                }
            })

            console.log('✅ Created React Study Group')
        } else {
            console.log('👤 Study group already exists')
        }

        // Add messages to the study group
        const groupMessageCount = await prisma.message.count({
            where: { conversationId: studyGroup.conversationId }
        })

        if (groupMessageCount === 0) {
            const groupMessages = [
                {
                    conversationId: studyGroup.conversationId,
                    senderId: sarah.id,
                    content: 'Welcome to the React Study Group! This is a place where we can discuss React concepts, share resources, and help each other learn.',
                    messageType: 'SYSTEM' as const
                },
                {
                    conversationId: studyGroup.conversationId,
                    senderId: sarah.id,
                    content: 'Feel free to ask questions, share your projects, or discuss any React topics you\'re interested in.',
                    messageType: 'TEXT' as const
                },
                {
                    conversationId: studyGroup.conversationId,
                    senderId: fatma.id,
                    content: 'Thanks for creating this group! I\'m excited to learn more about React and connect with other developers.',
                    messageType: 'TEXT' as const
                },
                {
                    conversationId: studyGroup.conversationId,
                    senderId: admin.id,
                    content: 'This looks like a great initiative! I\'ll be monitoring to see if there are any platform features we can add to better support study groups.',
                    messageType: 'TEXT' as const
                }
            ]

            for (const messageData of groupMessages) {
                await prisma.message.create({
                    data: messageData
                })
            }

            console.log('✅ Added demo messages to the study group')
        } else {
            console.log(`👤 Study group already has ${groupMessageCount} messages`)
        }

        // Create some demo notifications
        const notificationCount = await prisma.notification.count({
            where: { userId: fatma.id }
        })

        if (notificationCount === 0) {
            const notifications = [
                {
                    userId: fatma.id,
                    type: NotificationType.MESSAGE,
                    title: 'New message from Dr. Sarah',
                    message: 'I\'d be happy to help with your questions about state management...',
                    data: { conversationId: conversation.id }
                },
                {
                    userId: fatma.id,
                    type: NotificationType.GROUP_INVITE,
                    title: 'You\'ve been added to React Study Group',
                    message: 'Dr. Sarah added you to the React Study Group',
                    data: { groupId: studyGroup.id }
                },
                {
                    userId: sarah.id,
                    type: NotificationType.MESSAGE,
                    title: 'New message from Fatma',
                    message: 'Thank you so much! That makes perfect sense now...',
                    data: { conversationId: conversation.id }
                }
            ]

            for (const notificationData of notifications) {
                await prisma.notification.create({
                    data: notificationData
                })
            }

            console.log('✅ Created demo notifications')
        } else {
            console.log(`👤 User already has ${notificationCount} notifications`)
        }

        console.log('\n🎉 Demo messaging data created successfully!')
        console.log('=====================================')
        console.log('📋 Demo Data Summary:')
        console.log('----------------------------------------')
        console.log(`Direct Conversations: 1 (Fatma ↔ Dr. Sarah)`)
        console.log(`Study Groups: 1 (React Study Group)`)
        console.log(`Messages: ${messageCount + 4} total`)
        console.log(`Notifications: 3 created`)
        console.log('----------------------------------------')
        console.log('\n🚀 Ready for demo!')

    } catch (error) {
        console.error('❌ Error creating demo messaging data:', error)
    } finally {
        await prisma.$disconnect()
    }
}

createDemoMessagingData()