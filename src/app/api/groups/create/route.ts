import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { ConversationType, ParticipantRole, GroupPrivacy, GroupRole, ChannelType } from '@prisma/client';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, description, members, cohortId } = body;

        if (!name) {
            return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
        }

        // Create transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Conversation
            const conversation = await tx.conversation.create({
                data: {
                    type: ConversationType.GROUP,
                    title: name,
                    description: description,
                }
            });

            // 2. Create Group
            const group = await tx.group.create({
                data: {
                    conversationId: conversation.id,
                    name: name,
                    description: description,
                    privacy: GroupPrivacy.PRIVATE, // Default to PRIVATE
                    createdBy: session.user.id,
                }
            });

            // 3. Add members as Participants
            const allMemberIds = Array.from(new Set([session.user.id, ...(members || [])]));

            // Note: Prisma createMany doesn't return the created objects in some adapters,
            // but for PostgreSQL/Vercel Postgres it works. 
            // We use simple mapping here.
            await tx.conversationParticipant.createMany({
                data: allMemberIds.map(userId => ({
                    conversationId: conversation.id,
                    userId,
                    role: userId === session.user.id ? ParticipantRole.ADMIN : ParticipantRole.MEMBER,
                }))
            });

            // 4. Add members as GroupMembers
            await tx.groupMember.createMany({
                data: allMemberIds.map(userId => ({
                    groupId: group.id,
                    userId,
                    role: userId === session.user.id ? GroupRole.ADMIN : GroupRole.MEMBER,
                }))
            });

            // 5. Create default 'general' channel
            await tx.groupChannel.create({
                data: {
                    groupId: group.id,
                    name: 'general',
                    description: 'General discussion',
                    channelType: ChannelType.TEXT,
                    createdBy: session.user.id,
                }
            });

            return { conversation, group };
        });

        return NextResponse.json({
            success: true,
            conversationId: result.conversation.id,
            groupId: result.group.id
        });

    } catch (error: any) {
        console.error('Error creating group:', error);
        return NextResponse.json({ error: error.message || 'Failed to create group' }, { status: 500 });
    }
}
