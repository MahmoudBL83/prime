import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAllSessions() {
    try {
        console.log('🔄 Clearing all user sessions...');

        const result = await prisma.session.deleteMany({});

        console.log(`✅ Successfully deleted ${result.count} sessions`);
        console.log('All users have been signed out.');
    } catch (error) {
        console.error('❌ Error clearing sessions:', error);
    } finally {
        await prisma.$disconnect();
    }
}

clearAllSessions();
