/**
 * PostgreSQL to MySQL Data Migration Script
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
                if (errorCount <= 3) {
                    console.log(`   ❌ Error inserting row ${row.id}: ${error.message?.substring(0, 100)}`);
                }
            }
        }

        console.log(`   ✅ Migrated ${successCount}/${rows.length} rows (${errorCount} errors)`);
        return { table: tableName, count: successCount, errors: errorCount, status: 'done' };

    } catch (error: any) {
        console.log(`   ❌ Error migrating ${tableName}: ${error.message?.substring(0, 100)}`);
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

        // Tables to migrate (model name mapping)
        const tablesToMigrate = [
            { table: 'User', model: 'user' },
            { table: 'Creator', model: 'creator' },
            { table: 'Course', model: 'course' },
            { table: 'Lesson', model: 'lesson' },
            { table: 'CreatorChannel', model: 'creatorChannel' },
            { table: 'Subscription', model: 'subscription' },
            { table: 'Enrollment', model: 'enrollment' },
            { table: 'LessonProgress', model: 'lessonProgress' },
            { table: 'Review', model: 'review' },
            { table: 'Certificate', model: 'certificate' },
            { table: 'OnboardingProgress', model: 'onboardingProgress' },
            { table: 'StudyPreferences', model: 'studyPreferences' },
            { table: 'Notification', model: 'notification' },
            { table: 'Session', model: 'session' },
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

        for (const result of results) {
            const status = result.status === 'done' ? '✅' : result.status === 'empty' ? '⏭️' : '❌';
            console.log(`${status} ${result.table}: ${result.count || 0} rows${result.errors ? ` (${result.errors} errors)` : ''}`);
            totalMigrated += result.count || 0;
            totalErrors += result.errors || 0;
        }

        console.log(`\n🏁 Total: ${totalMigrated} rows migrated, ${totalErrors} errors`);

    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await pgClient.end();
        await mysql.$disconnect();
        console.log('\n👋 Connections closed');
    }
}

main();
