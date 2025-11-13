/**
 * Create Test Users for Live Session Testing
 * 
 * This script creates test users with different subscription tiers to test
 * the live session access control system.
 * 
 * Creates:
 * - 3 test members (Bronze, Silver, Gold tier)
 * - 1 test creator with a channel and active live session
 * - Subscriptions linking members to the creator's channel
 * 
 * Usage:
 * npx tsx scripts/create-session-test-users.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Creating test users for live session testing...\n');

    // 1. Create Test Creator
    console.log('📝 Creating test creator...');
    const creatorPassword = await bcrypt.hash('creator123', 10);
    
    const creator = await prisma.user.upsert({
        where: { email: 'session-creator@test.com' },
        update: {},
        create: {
            email: 'session-creator@test.com',
            name: 'Session Test Creator',
            passwordHash: creatorPassword,
            role: 'CREATOR',
            onboardingCompleted: true,
            profileImage: 'https://ui-avatars.com/api/?name=Session+Creator&background=8b5cf6&color=fff'
        }
    });
    console.log(`✅ Creator created: ${creator.email} (ID: ${creator.id})`);

    //  2. Create Creator's Channel
    console.log('\n📺 Creating creator channel...');
    
    // Check if channel already exists
    const existingChannel = await prisma.creatorChannel.findFirst({
        where: { creatorId: creator.id }
    });
    
    const channel = existingChannel || await prisma.creatorChannel.create({
        data: {
            creatorId: creator.id,
            name: 'Live Session Test Channel',
            nameAr: 'قناة اختبار الجلسة المباشرة',
            description: 'Channel for testing live session features',
            descriptionAr: 'قناة لاختبار ميزات الجلسة المباشرة',
            tiers: JSON.stringify(['BRONZE', 'SILVER', 'GOLD'])
        }
    });
    console.log(`✅ Channel created: ${channel.name} (ID: ${channel.id})`);

    // 3. Create Test Members with Different Tiers
    const members = [
        {
            email: 'bronze-member@test.com',
            name: 'Bronze Member',
            tier: 'BRONZE' as const,
            color: 'cd7f32'
        },
        {
            email: 'silver-member@test.com',
            name: 'Silver Member',
            tier: 'SILVER' as const,
            color: 'c0c0c0'
        },
        {
            email: 'gold-member@test.com',
            name: 'Gold Member',
            tier: 'GOLD' as const,
            color: 'ffd700'
        }
    ];

    console.log('\n👥 Creating test members...');
    const memberPassword = await bcrypt.hash('member123', 10);
    
    for (const memberData of members) {
        const member = await prisma.user.upsert({
            where: { email: memberData.email },
            update: {},
            create: {
                email: memberData.email,
                name: memberData.name,
                passwordHash: memberPassword,
                role: 'USER',
                onboardingCompleted: true,
                profileImage: `https://ui-avatars.com/api/?name=${memberData.name.replace(' ', '+')}&background=${memberData.color}&color=000`
            }
        });

        // Create active subscription for this member
        const subscription = await prisma.subscription.upsert({
            where: {
                userId_channelId: {
                    userId: member.id,
                    channelId: channel.id
                }
            },
            update: {
                tier: memberData.tier,
                status: 'ACTIVE',
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            },
            create: {
                userId: member.id,
                channelId: channel.id,
                tier: memberData.tier,
                status: 'ACTIVE',
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });

        console.log(`✅ ${memberData.tier} Member: ${member.email} - Subscription ID: ${subscription.id}`);
    }

    // 4. Create Demo Live Sessions with Different Tier Requirements
    console.log('\n🎥 Creating demo live sessions...');
    
    const sessions = [
        {
            title: 'Free Session - All Tiers Welcome',
            titleAr: 'جلسة مجانية - جميع المستويات مرحب بها',
            tier: 'ALL' as const,
            status: 'LIVE' as const,
            description: 'This session is available to all subscribers regardless of tier',
            descriptionAr: 'هذه الجلسة متاحة لجميع المشتركين بغض النظر عن المستوى'
        },
        {
            title: 'Bronze+ Session - Basic Content',
            titleAr: 'جلسة برونزية+ - محتوى أساسي',
            tier: 'BRONZE' as const,
            status: 'LIVE' as const,
            description: 'Requires Bronze tier or higher',
            descriptionAr: 'يتطلب مستوى البرونز أو أعلى'
        },
        {
            title: 'Silver+ Session - Intermediate Content',
            titleAr: 'جلسة فضية+ - محتوى متوسط',
            tier: 'SILVER' as const,
            status: 'LIVE' as const,
            description: 'Requires Silver tier or higher',
            descriptionAr: 'يتطلب مستوى الفضة أو أعلى'
        },
        {
            title: 'Gold Exclusive - Premium Content',
            titleAr: 'جلسة ذهبية حصرية - محتوى متميز',
            tier: 'GOLD' as const,
            status: 'LIVE' as const,
            description: 'Exclusive for Gold tier members only',
            descriptionAr: 'حصري لأعضاء المستوى الذهبي فقط'
        },
        {
            title: 'Upcoming Silver Session',
            titleAr: 'جلسة فضية قادمة',
            tier: 'SILVER' as const,
            status: 'SCHEDULED' as const,
            description: 'This session is scheduled for later',
            descriptionAr: 'هذه الجلسة مجدولة لوقت لاحق'
        }
    ];

    const now = new Date();
    const scheduled = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

    for (const sessionData of sessions) {
        const session = await prisma.liveSession.create({
            data: {
                channelId: channel.id,
                title: sessionData.title,
                titleAr: sessionData.titleAr,
                description: sessionData.description,
                descriptionAr: sessionData.descriptionAr,
                tier: sessionData.tier,
                status: sessionData.status,
                scheduledAt: sessionData.status === 'SCHEDULED' ? scheduled : now,
                actualStartAt: sessionData.status === 'LIVE' ? now : null,
                duration: 60, // 60 minutes
                maxAttendees: sessionData.tier === 'GOLD' ? 10 : null, // Gold session has limit
                streamUrl: `rtmp://stream.example.com/live/${Math.random().toString(36).substring(7)}`,
                streamKey: Math.random().toString(36).substring(7),
                viewCount: Math.floor(Math.random() * 50)
            }
        });

        console.log(`✅ ${sessionData.tier} ${sessionData.status} Session: ${session.title} (ID: ${session.id})`);
    }

    console.log('\n✨ Test data creation complete!\n');
    console.log('📋 Summary:');
    console.log('━'.repeat(60));
    console.log('👤 Creator Account:');
    console.log('   Email: session-creator@test.com');
    console.log('   Password: creator123');
    console.log('');
    console.log('👥 Member Accounts:');
    console.log('   🥉 Bronze: bronze-member@test.com / member123');
    console.log('   🥈 Silver: silver-member@test.com / member123');
    console.log('   🥇 Gold:   gold-member@test.com / member123');
    console.log('');
    console.log('🎥 Live Sessions:');
    console.log('   ✅ 1x ALL tier (everyone can join)');
    console.log('   ✅ 1x BRONZE tier (Bronze, Silver, Gold can join)');
    console.log('   ✅ 1x SILVER tier (Silver, Gold can join)');
    console.log('   ✅ 1x GOLD tier (Gold only, max 10 attendees)');
    console.log('   📅 1x SCHEDULED (Silver+, not yet live)');
    console.log('');
    console.log('🧪 Testing Instructions:');
    console.log('━'.repeat(60));
    console.log('1. Sign in as different members');
    console.log('2. Navigate to live sessions via creator channel');
    console.log('3. Test access control:');
    console.log('   - Bronze member should access: ALL, BRONZE sessions');
    console.log('   - Silver member should access: ALL, BRONZE, SILVER sessions');
    console.log('   - Gold member should access: ALL sessions');
    console.log('4. Test join/leave and duration tracking');
    console.log('5. Test max attendees limit on GOLD session');
    console.log('6. Test scheduled session (should show not live)');
    console.log('');
    console.log('🔗 Quick Links:');
    console.log(`   Channel: /creators/${creator.id}`);
    console.log('   Live Sessions: Check creator\'s channel page');
    console.log('━'.repeat(60));
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
