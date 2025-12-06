import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const ADMIN_EMAIL = 'admin@prime.eg';
const ADMIN_PASSWORD = 'demo123';

async function ensureAdminUser() {
    try {
        console.log('🔍 Ensuring admin user exists...');

        const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

        const adminUser = await prisma.user.upsert({
            where: { email: ADMIN_EMAIL },
            update: {
                passwordHash,
                role: UserRole.ADMIN,
                name: 'Prime Admin',
                arabicName: 'مدير برايم',
                emailVerified: new Date(),
            },
            create: {
                email: ADMIN_EMAIL,
                passwordHash,
                role: UserRole.ADMIN,
                name: 'Prime Admin',
                arabicName: 'مدير برايم',
                emailVerified: new Date(),
                bio: 'Platform Administrator for Prime',
            },
        });

        console.log('✅ Admin user is ready:', {
            id: adminUser.id,
            email: adminUser.email,
            role: adminUser.role,
        });
    } catch (error) {
        console.error('❌ Failed to ensure admin user:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

ensureAdminUser();
