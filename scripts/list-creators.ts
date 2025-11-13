import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listCreators() {
    try {
        const creators = await prisma.creator.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        arabicName: true
                    }
                },
                channels: true
            }
        })

        console.log('\n📚 CREATOR ACCOUNTS IN DATABASE:\n')
        console.log('='.repeat(60))
        
        if (creators.length === 0) {
            console.log('❌ No creators found in database.')
            console.log('\nRun one of these scripts to create demo creators:')
            console.log('  npm run seed')
            console.log('  npx ts-node scripts/create-demo-creator-channels.ts')
        } else {
            creators.forEach((creator, i) => {
                console.log(`\n${i + 1}. ${creator.user.name} (${creator.user.arabicName || 'No Arabic name'})`)
                console.log(`   📧 Email: ${creator.user.email}`)
                console.log(`   👤 Password: password123 (default for all demo accounts)`)
                console.log(`   🎭 Role: ${creator.user.role}`)
                console.log(`   ✅ KYC Status: ${creator.kycStatus}`)
                console.log(`   📺 Channels: ${creator.channels.length}`)
                console.log(`   🔗 Login URL: http://localhost:3000/en/auth/login`)
            })
            
            console.log('\n' + '='.repeat(60))
            console.log(`\n✅ Total Creators: ${creators.length}`)
            console.log('\n💡 To test creator features:')
            console.log('   1. Login with any creator email above')
            console.log('   2. Use password: password123')
            console.log('   3. Visit: http://localhost:3000/en/creator/dashboard')
        }
    } catch (error) {
        console.error('Error:', error)
    } finally {
        await prisma.$disconnect()
    }
}

listCreators()
