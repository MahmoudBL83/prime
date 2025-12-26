/**
 * PostgreSQL to MySQL Data Migration Script
 * 
 * Migrates ALL tables from Neon PostgreSQL to Hostinger MySQL
 * 
 * Usage: npx ts-node scripts/migrate-pg-to-mysql.ts
 */

const { Client } = require('pg');
const { PrismaClient } = require('@prisma/client');

// PostgreSQL connection (Neon)
const pgConfig = {
    connectionString: 'postgresql://neondb_owner:npg_ZAqBOVc26iNT@ep-curly-morning-ahnd1cm0-pooler.c-3.us-east-1.aws.neon.tech/main2?sslmode=require',
    ssl: { rejectUnauthorized: false }
};

// MySQL Prisma Client (uses DATABASE_URL from .env)
const mysql = new PrismaClient();

async function migrateTable(pgClient: any, tableName: string, modelName: string) {
    console.log(`\n📦 Migrating table: ${tableName}`);

    try {
        // Get all data from PostgreSQL table
        const result = await pgClient.query(`SELECT * FROM "${tableName}"`);
        const rows = result.rows;

        if (rows.length === 0) {
            console.log(`   ⏭️  No data in ${tableName}, skipping...`);
            return { table: tableName, count: 0, status: 'empty' };
        }

        console.log(`   📊 Found ${rows.length} rows`);

        // Get the Prisma model dynamically
        const model = (mysql as any)[modelName];

        if (!model) {
            console.log(`   ⚠️  Model ${modelName} not found in Prisma client, skipping...`);
            return { table: tableName, count: 0, status: 'model_not_found' };
        }

        let successCount = 0;
        let errorCount = 0;

        // Insert each row
        for (const row of rows) {
            try {
                // Use upsert to handle existing records
                await model.upsert({
                    where: { id: row.id },
                    create: row,
                    update: row,
                });
                successCount++;
            } catch (error: any) {
                errorCount++;
                if (errorCount <= 5) {
                    console.log(`   ❌ Error inserting row ${row.id}: ${error.message?.substring(0, 150)}`);
                }
            }
        }

        console.log(`   ✅ Migrated ${successCount}/${rows.length} rows (${errorCount} errors)`);
        return { table: tableName, count: successCount, errors: errorCount, status: 'done' };

    } catch (error: any) {
        console.log(`   ❌ Error migrating ${tableName}: ${error.message?.substring(0, 150)}`);
        return { table: tableName, count: 0, status: 'error', error: error.message };
    }
}

async function main() {
    console.log('🚀 Starting PostgreSQL to MySQL Migration');
    console.log('==========================================\n');

    // Connect to PostgreSQL
    const pgClient = new Client(pgConfig);

    try {
        console.log('📡 Connecting to PostgreSQL (Neon)...');
        await pgClient.connect();
        console.log('✅ Connected to PostgreSQL\n');

        console.log('📡 Connecting to MySQL (Hostinger)...');
        await mysql.$connect();
        console.log('✅ Connected to MySQL\n');

        // ALL tables to migrate (in order respecting foreign key dependencies)
        // Format: { table: 'PostgreSQLTableName', model: 'prismaModelName' }
        const tablesToMigrate = [
            // Core User tables (no dependencies)
            { table: 'User', model: 'user' },
            { table: 'Session', model: 'session' },

            // Creator and related
            { table: 'Creator', model: 'creator' },
            { table: 'CreatorCredential', model: 'creatorCredential' },
            { table: 'InstructorAvailability', model: 'instructorAvailability' },
            { table: 'InstructorFollow', model: 'instructorFollow' },

            // Course related
            { table: 'Course', model: 'course' },
            { table: 'Lesson', model: 'lesson' },
            { table: 'LessonProgress', model: 'lessonProgress' },
            { table: 'Enrollment', model: 'enrollment' },
            { table: 'Review', model: 'review' },
            { table: 'CourseReview', model: 'courseReview' },
            { table: 'CourseInteraction', model: 'courseInteraction' },
            { table: 'Certificate', model: 'certificate' },

            // Quiz and Assignments
            { table: 'Quiz', model: 'quiz' },
            { table: 'QuizQuestion', model: 'quizQuestion' },
            { table: 'QuizAttempt', model: 'quizAttempt' },
            { table: 'Assignment', model: 'assignment' },
            { table: 'AssignmentSubmission', model: 'assignmentSubmission' },

            // Channel and Subscription
            { table: 'CreatorChannel', model: 'creatorChannel' },
            { table: 'MembershipTier', model: 'membershipTier' },
            { table: 'Subscription', model: 'subscription' },
            { table: 'ChannelSubscription', model: 'channelSubscription' },
            { table: 'PaymentTransaction', model: 'paymentTransaction' },

            // Content and Posts
            { table: 'ChannelPost', model: 'channelPost' },
            { table: 'MemberMessage', model: 'memberMessage' },
            { table: 'MemberPoll', model: 'memberPoll' },
            { table: 'MemberGroup', model: 'memberGroup' },

            // Coaching
            { table: 'CoachingToken', model: 'coachingToken' },
            { table: 'CoachingSession', model: 'coachingSession' },
            { table: 'Meeting', model: 'meeting' },
            { table: 'MentorSubscription', model: 'mentorSubscription' },

            // Video related
            { table: 'VideoAsset', model: 'videoAsset' },
            { table: 'VideoPlaylist', model: 'videoPlaylist' },
            { table: 'PlaylistItem', model: 'playlistItem' },
            { table: 'VideoNote', model: 'videoNote' },
            { table: 'VideoBookmark', model: 'videoBookmark' },
            { table: 'VideoProgress', model: 'videoProgress' },
            { table: 'VideoComment', model: 'videoComment' },
            { table: 'VideoCommentLike', model: 'videoCommentLike' },
            { table: 'VideoReaction', model: 'videoReaction' },
            { table: 'VideoAnalytics', model: 'videoAnalytics' },
            { table: 'VideoWatchHistory', model: 'videoWatchHistory' },

            // Study Buddy
            { table: 'StudyPreferences', model: 'studyPreferences' },
            { table: 'StudyBuddyMatch', model: 'studyBuddyMatch' },
            { table: 'SwipeAction', model: 'swipeAction' },
            { table: 'StudySession', model: 'studySession' },
            { table: 'StudyWorkspace', model: 'studyWorkspace' },
            { table: 'WorkspaceNote', model: 'workspaceNote' },
            { table: 'WorkspaceResource', model: 'workspaceResource' },
            { table: 'WorkspaceGoal', model: 'workspaceGoal' },
            { table: 'CoWatchSession', model: 'coWatchSession' },
            { table: 'VideoCallSession', model: 'videoCallSession' },

            // Messaging
            { table: 'Conversation', model: 'conversation' },
            { table: 'ConversationParticipant', model: 'conversationParticipant' },
            { table: 'Message', model: 'message' },
            { table: 'MessageReaction', model: 'messageReaction' },
            { table: 'MessageRequest', model: 'messageRequest' },
            { table: 'BlockedUser', model: 'blockedUser' },

            // Groups
            { table: 'Group', model: 'group' },
            { table: 'GroupChannel', model: 'groupChannel' },
            { table: 'GroupMember', model: 'groupMember' },

            // Notifications
            { table: 'Notification', model: 'notification' },
            { table: 'NotificationSetting', model: 'notificationSetting' },

            // Onboarding and Progress
            { table: 'OnboardingProgress', model: 'onboardingProgress' },
            { table: 'GuardianLink', model: 'guardianLink' },
            { table: 'UserVerification', model: 'userVerification' },

            // Achievements and Gamification
            { table: 'Achievement', model: 'achievement' },
            { table: 'UserXP', model: 'userXP' },
            { table: 'Badge', model: 'badge' },
            { table: 'UserBadge', model: 'userBadge' },
            { table: 'LeaderboardEntry', model: 'leaderboardEntry' },
            { table: 'Reward', model: 'reward' },
            { table: 'RewardWinner', model: 'rewardWinner' },

            // Cohorts and Projects
            { table: 'Cohort', model: 'cohort' },
            { table: 'CohortMember', model: 'cohortMember' },
            { table: 'CapstoneProject', model: 'capstoneProject' },
            { table: 'ProjectSubmission', model: 'projectSubmission' },
            { table: 'PeerReview', model: 'peerReview' },

            // Signature Courses
            { table: 'SignatureCourseProposal', model: 'signatureCourseProposal' },
            { table: 'SignatureCohort', model: 'signatureCourseCohort' },
            { table: 'SignatureCourseWorkbook', model: 'signatureCourseWorkbook' },
            { table: 'SignatureCourseInvitation', model: 'signatureCourseInvitation' },
            { table: 'ExpertQASession', model: 'expertQASession' },

            // Payments and Earnings
            { table: 'CreatorEarnings', model: 'creatorEarnings' },
            { table: 'CreatorPayout', model: 'creatorPayout' },
            { table: 'Payout', model: 'payout' },
            { table: 'PaymentLink', model: 'paymentLink' },

            // Analytics
            { table: 'CreatorAnalytics', model: 'creatorAnalytics' },

            // Live Sessions
            { table: 'LiveSession', model: 'liveSession' },
            { table: 'SessionAttendee', model: 'sessionAttendee' },
            { table: 'SessionAttendance', model: 'sessionAttendance' },

            // Moderation and Safety
            { table: 'UserBan', model: 'userBan' },
            { table: 'Appeal', model: 'appeal' },
            { table: 'UserBlock', model: 'userBlock' },
            { table: 'Report', model: 'report' },
            { table: 'ModerationEvent', model: 'moderationEvent' },
            { table: 'FlaggedChannel', model: 'flaggedChannel' },
            { table: 'DMCARequest', model: 'dMCARequest' },

            // Admin
            { table: 'AdminAssignment', model: 'adminAssignment' },
            { table: 'AdminAuditLog', model: 'adminAuditLog' },
            { table: 'FeatureFlag', model: 'featureFlag' },

            // Email Templates
            { table: 'EmailTemplate', model: 'emailTemplate' },
            { table: 'EmailAnalytics', model: 'emailAnalytics' },

            // Scholarships
            { table: 'ScholarshipCampaign', model: 'scholarshipCampaign' },
            { table: 'ScholarshipApplication', model: 'scholarshipApplication' },

            // Featured Content
            { table: 'FeaturedContent', model: 'featuredContent' },

            // Support
            { table: 'SupportTicket', model: 'supportTicket' },
            { table: 'SupportTicketMessage', model: 'supportTicketMessage' },

            // Community Resources
            { table: 'CommunityResource', model: 'communityResource' },

            // Polls
            { table: 'PollVote', model: 'pollVote' },

            // Post interactions
            { table: 'PostBookmark', model: 'postBookmark' },
            { table: 'PostComment', model: 'postComment' },
        ];

        const results: any[] = [];

        // Migrate each table
        for (const { table, model } of tablesToMigrate) {
            const result = await migrateTable(pgClient, table, model);
            results.push(result);
        }

        // Print summary
        console.log('\n\n📊 Migration Summary');
        console.log('====================');

        let totalMigrated = 0;
        let totalErrors = 0;
        const failedTables: string[] = [];

        for (const result of results) {
            const status = result.status === 'done' ? '✅' : result.status === 'empty' ? '⏭️' : '❌';
            console.log(`${status} ${result.table}: ${result.count || 0} rows${result.errors ? ` (${result.errors} errors)` : ''}`);
            totalMigrated += result.count || 0;
            totalErrors += result.errors || 0;
            if (result.status === 'error') {
                failedTables.push(result.table);
            }
        }

        console.log(`\n🏁 Total: ${totalMigrated} rows migrated, ${totalErrors} errors`);

        if (failedTables.length > 0) {
            console.log(`\n⚠️  Failed tables: ${failedTables.join(', ')}`);
        }

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await pgClient.end();
        await mysql.$disconnect();
        console.log('\n👋 Connections closed');
    }
}

main();
