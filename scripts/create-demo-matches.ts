import { prisma } from '../src/lib/prisma'

async function createDemoMatches() {
    try {
        console.log('Creating demo study buddy matches...')
        
        // Get all learner users
        const learners = await prisma.user.findMany({
            where: { role: 'LEARNER' },
            select: { id: true, name: true }
        })
        
        console.log(`Found ${learners.length} learners`)
        
        if (learners.length < 2) {
            console.log('Need at least 2 learners to create matches')
            return
        }
        
        // Create matches between random learners
        const matches = []
        const statuses = ['pending', 'accepted', 'blocked']
        const sharedSubjects = [
            ['Mathematics', 'Physics'],
            ['Web Development', 'JavaScript'],
            ['Data Science', 'Python'],
            ['Language Learning', 'Arabic'],
            ['Business', 'Marketing']
        ]
        const sharedGoals = [
            ['Master React', 'Build projects'],
            ['Learn Arabic', 'Practice speaking'],
            ['Study together', 'Share resources'],
            ['Improve skills', 'Get certified'],
            ['Build portfolio', 'Find job']
        ]
        
        // Create 15 demo matches
        for (let i = 0; i < 15; i++) {
            const user1 = learners[Math.floor(Math.random() * learners.length)]
            let user2 = learners[Math.floor(Math.random() * learners.length)]
            
            // Ensure user2 is different from user1
            while (user2.id === user1.id) {
                user2 = learners[Math.floor(Math.random() * learners.length)]
            }
            
            // Check if match already exists
            const existingMatch = await prisma.studyBuddyMatch.findFirst({
                where: {
                    OR: [
                        { user1Id: user1.id, user2Id: user2.id },
                        { user1Id: user2.id, user2Id: user1.id }
                    ]
                }
            })
            
            if (existingMatch) {
                console.log(`Match already exists between ${user1.name} and ${user2.name}, skipping...`)
                continue
            }
            
            const status = statuses[Math.floor(Math.random() * statuses.length)]
            const subjects = sharedSubjects[Math.floor(Math.random() * sharedSubjects.length)]
            const goals = sharedGoals[Math.floor(Math.random() * sharedGoals.length)]
            
            const match = await prisma.studyBuddyMatch.create({
                data: {
                    user1Id: user1.id,
                    user2Id: user2.id,
                    status: status,
                    sharedSubjects: JSON.stringify(subjects),
                    sharedGoals: JSON.stringify(goals)
                }
            })
            
            matches.push(match)
            console.log(`Created ${status} match between ${user1.name} and ${user2.name}`)
        }
        
        console.log(`\nCreated ${matches.length} demo matches:`)
        
        // Count by status
        const statusCounts = {
            pending: matches.filter(m => m.status === 'pending').length,
            accepted: matches.filter(m => m.status === 'accepted').length,
            blocked: matches.filter(m => m.status === 'blocked').length
        }
        
        console.log(`- Pending: ${statusCounts.pending}`)
        console.log(`- Accepted: ${statusCounts.accepted}`)
        console.log(`- Blocked: ${statusCounts.blocked}`)
        
    } catch (error) {
        console.error('Error creating demo matches:', error)
    } finally {
        await prisma.$disconnect()
        process.exit(0)
    }
}

createDemoMatches()