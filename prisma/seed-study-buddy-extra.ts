import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Extended student data for a bigger demo pool
const additionalStudents = [
    // More tech students
    { nameEn: 'Amina Saad', nameAr: 'أمينة سعد', interests: ['React', 'JavaScript', 'Frontend Development'], goals: ['Job Promotion', 'Skill Development'], skillLevel: 'INTERMEDIATE', mode: 'online' },
    { nameEn: 'Ibrahim Gamal', nameAr: 'إبراهيم جمال', interests: ['Backend Development', 'Node.js', 'APIs'], goals: ['Career Change into Tech', 'Freelancing'], skillLevel: 'ADVANCED', mode: 'hybrid' },
    { nameEn: 'Leila Anwar', nameAr: 'ليلا أنور', interests: ['Product Management', 'Agile', 'Scrum'], goals: ['Career Advancement', 'Certification'], skillLevel: 'INTERMEDIATE', mode: 'online' },
    { nameEn: 'Badr Mansour', nameAr: 'بدر منصور', interests: ['Quality Assurance', 'Testing', 'Automation'], goals: ['Technical Skills', 'Job Security'], skillLevel: 'INTERMEDIATE', mode: 'hybrid' },
    { nameEn: 'Farah Hosni', nameAr: 'فرح حسني', interests: ['Database Design', 'SQL', 'Data Analysis'], goals: ['Data Career', 'Certification'], skillLevel: 'BEGINNER', mode: 'online' },
    
    // Design students
    { nameEn: 'Hany Kamel', nameAr: 'هاني كامل', interests: ['Motion Graphics', 'Animation', 'Video Editing'], goals: ['Creative Career', 'Portfolio Building'], skillLevel: 'INTERMEDIATE', mode: 'online' },
    { nameEn: 'Mona Farid', nameAr: 'منى فريد', interests: ['Interior Design', '3D Modeling', 'Architecture'], goals: ['Design Career', 'Certification'], skillLevel: 'ADVANCED', mode: 'offline' },
    { nameEn: 'Salam Yehia', nameAr: 'سلام يحيى', interests: ['Brand Identity', 'Logo Design', 'Marketing'], goals: ['Freelancing', 'Business Growth'], skillLevel: 'INTERMEDIATE', mode: 'online' },
    { nameEn: 'Taher Zaki', nameAr: 'طاهر زكي', interests: ['Industrial Design', 'Product Design', '3D Printing'], goals: ['Innovation', 'Product Development'], skillLevel: 'ADVANCED', mode: 'hybrid' },
    
    // Language and culture
    { nameEn: 'Israa Helmy', nameAr: 'إسراء حلمي', interests: ['Chinese Language', 'Asian Culture', 'International Business'], goals: ['Cultural Exchange', 'Career Opportunity'], skillLevel: 'BEGINNER', mode: 'online' },
    { nameEn: 'Adham Sherif', nameAr: 'أدهم شريف', interests: ['Japanese Language', 'Anime Culture', 'Translation'], goals: ['Cultural Interest', 'Language Mastery'], skillLevel: 'INTERMEDIATE', mode: 'online' },
    { nameEn: 'Ghada Emad', nameAr: 'غادة عماد', interests: ['Italian Language', 'European History', 'Travel'], goals: ['Study Abroad', 'Cultural Enrichment'], skillLevel: 'BEGINNER', mode: 'hybrid' },
    
    // Business expansion
    { nameEn: 'Rashad Adel', nameAr: 'رشاد عادل', interests: ['Sales', 'Customer Relations', 'Negotiation'], goals: ['Sales Excellence', 'Leadership'], skillLevel: 'ADVANCED', mode: 'offline' },
    { nameEn: 'Lobna Farouk', nameAr: 'لبنى فاروق', interests: ['Customer Service', 'Communication', 'Problem Solving'], goals: ['Service Excellence', 'Team Leadership'], skillLevel: 'INTERMEDIATE', mode: 'hybrid' },
    { nameEn: 'Essam Rizk', nameAr: 'عصام رزق', interests: ['Import Export', 'International Trade', 'Logistics'], goals: ['Global Business', 'Trade Expertise'], skillLevel: 'INTERMEDIATE', mode: 'online' },
    
    // High school expansion
    { nameEn: 'Layla Ashour', nameAr: 'ليلى عاشور', interests: ['English Literature', 'Creative Writing', 'Drama'], goals: ['University Entrance', 'Creative Expression'], skillLevel: 'ADVANCED', mode: 'hybrid' },
    { nameEn: 'Sharif Nabil', nameAr: 'شريف نبيل', interests: ['Philosophy', 'Critical Thinking', 'Debate'], goals: ['Academic Excellence', 'Intellectual Growth'], skillLevel: 'ADVANCED', mode: 'offline' },
    { nameEn: 'Rahma Said', nameAr: 'رحمة سعيد', interests: ['Environmental Studies', 'Biology', 'Conservation'], goals: ['Environmental Career', 'Research'], skillLevel: 'INTERMEDIATE', mode: 'hybrid' },
    { nameEn: 'Saif Mahmoud', nameAr: 'سيف محمود', interests: ['Robotics', 'Electronics', 'Programming'], goals: ['Engineering School', 'Innovation'], skillLevel: 'ADVANCED', mode: 'online' },
    
    // Creative arts
    { nameEn: 'Nermin Galal', nameAr: 'نيرمين جلال', interests: ['Dance', 'Performance Arts', 'Choreography'], goals: ['Artistic Career', 'Performance Excellence'], skillLevel: 'INTERMEDIATE', mode: 'offline' },
    { nameEn: 'Wael Fouad', nameAr: 'وائل فؤاد', interests: ['Theater', 'Acting', 'Directing'], goals: ['Acting Career', 'Creative Expression'], skillLevel: 'INTERMEDIATE', mode: 'offline' },
    { nameEn: 'Menna Samir', nameAr: 'منة سمير', interests: ['Creative Writing', 'Poetry', 'Literature'], goals: ['Publishing', 'Literary Recognition'], skillLevel: 'ADVANCED', mode: 'online' },
    
    // Health and wellness
    { nameEn: 'Karim Osama', nameAr: 'كريم أسامة', interests: ['Physiotherapy', 'Sports Medicine', 'Rehabilitation'], goals: ['Healthcare Career', 'Specialization'], skillLevel: 'INTERMEDIATE', mode: 'hybrid' },
    { nameEn: 'Nourhan Alaa', nameAr: 'نورهان علاء', interests: ['Nutrition', 'Dietetics', 'Wellness Coaching'], goals: ['Health Career', 'Certification'], skillLevel: 'BEGINNER', mode: 'online' },
    { nameEn: 'Mahmoud Ragab', nameAr: 'محمود رجب', interests: ['Mental Health', 'Counseling Psychology', 'Therapy'], goals: ['Psychology Career', 'Helping Others'], skillLevel: 'INTERMEDIATE', mode: 'hybrid' },
    
    // Additional diverse profiles
    { nameEn: 'Aya Mohsen', nameAr: 'آية محسن', interests: ['Social Work', 'Community Development', 'NGOs'], goals: ['Social Impact', 'Community Service'], skillLevel: 'INTERMEDIATE', mode: 'offline' },
    { nameEn: 'Ahmed Ayman', nameAr: 'أحمد أيمن', interests: ['Law', 'Legal Studies', 'Human Rights'], goals: ['Law Career', 'Justice Advocacy'], skillLevel: 'ADVANCED', mode: 'offline' },
    { nameEn: 'Hala Wafaa', nameAr: 'هالة وفاء', interests: ['Early Childhood Education', 'Child Development', 'Montessori'], goals: ['Teaching Career', 'Child Advocacy'], skillLevel: 'INTERMEDIATE', mode: 'offline' },
    { nameEn: 'Eslam Saad', nameAr: 'إسلام سعد', interests: ['Electrical Engineering', 'Renewable Energy', 'Sustainability'], goals: ['Green Technology', 'Innovation'], skillLevel: 'ADVANCED', mode: 'hybrid' },
    { nameEn: 'Radwa Khaled', nameAr: 'رضوى خالد', interests: ['Veterinary Medicine', 'Animal Care', 'Wildlife'], goals: ['Veterinary Career', 'Animal Welfare'], skillLevel: 'INTERMEDIATE', mode: 'offline' },
    { nameEn: 'Amr Amir', nameAr: 'عمرو أمير', interests: ['Civil Engineering', 'Construction', 'Infrastructure'], goals: ['Engineering Career', 'Urban Development'], skillLevel: 'ADVANCED', mode: 'offline' },
    
    // More technology
    { nameEn: 'Nada Hossam', nameAr: 'ندا حسام', interests: ['Information Security', 'Penetration Testing', 'Compliance'], goals: ['Security Career', 'Ethical Hacking'], skillLevel: 'ADVANCED', mode: 'online' },
    { nameEn: 'Youssef Gamal', nameAr: 'يوسف جمال', interests: ['Software Architecture', 'System Design', 'Microservices'], goals: ['Technical Leadership', 'Architecture'], skillLevel: 'ADVANCED', mode: 'online' },
    { nameEn: 'Rawan Emad', nameAr: 'روان عماد', interests: ['Business Intelligence', 'Analytics', 'Reporting'], goals: ['Data Analysis', 'Business Insights'], skillLevel: 'INTERMEDIATE', mode: 'hybrid' },
    { nameEn: 'Hesham Magdy', nameAr: 'هشام مجدي', interests: ['Network Administration', 'System Administration', 'IT Support'], goals: ['IT Career', 'System Expertise'], skillLevel: 'INTERMEDIATE', mode: 'online' },
    
    // More business
    { nameEn: 'Omniya Tarek', nameAr: 'أمنية طارق', interests: ['Market Research', 'Consumer Behavior', 'Brand Strategy'], goals: ['Marketing Career', 'Brand Management'], skillLevel: 'INTERMEDIATE', mode: 'hybrid' },
    { nameEn: 'Yassin Khaled', nameAr: 'ياسين خالد', interests: ['Corporate Finance', 'Investment Banking', 'Financial Modeling'], goals: ['Finance Career', 'Investment Expertise'], skillLevel: 'ADVANCED', mode: 'online' },
    { nameEn: 'Reham Ashraf', nameAr: 'ريهام أشرف', interests: ['Retail Management', 'Customer Experience', 'Store Operations'], goals: ['Retail Career', 'Management'], skillLevel: 'INTERMEDIATE', mode: 'offline' },
    { nameEn: 'Shady Yasser', nameAr: 'شادي ياسر', interests: ['Insurance', 'Risk Management', 'Actuarial Science'], goals: ['Insurance Career', 'Risk Analysis'], skillLevel: 'INTERMEDIATE', mode: 'hybrid' },
]

function generateEmail(nameEn: string, startIndex: number): string {
    const cleanName = nameEn.toLowerCase().replace(/\s+/g, '.')
    return `${cleanName}.${startIndex}@demo.com`
}

function generatePhone(): string {
    return `+2011${Math.floor(Math.random() * 90000000) + 10000000}`
}

async function main() {
    console.log('🌱 Adding more students to Study Buddy system...')

    const demoPassword = await bcrypt.hash('demo123', 10)
    const existingUsers = await prisma.user.count()
    console.log(`📊 Current users in database: ${existingUsers}`)

    console.log('🎓 Creating additional diverse student profiles...')
    
    const newStudents = []
    for (let i = 0; i < additionalStudents.length; i++) {
        const studentData = additionalStudents[i]
        
        try {
            const student = await prisma.user.create({
                data: {
                    email: generateEmail(studentData.nameEn, existingUsers + i),
                    passwordHash: demoPassword,
                    name: studentData.nameEn,
                    arabicName: studentData.nameAr,
                    role: UserRole.LEARNER,
                    emailVerified: new Date(),
                    phoneVerified: Math.random() > 0.4 ? new Date() : null,
                    phone: generatePhone(),
                    bio: `Passionate about ${studentData.interests.slice(0, 2).join(' and ')}. Eager to connect with study partners who share similar interests.`,
                    interests: studentData.interests.join(','),
                    goals: studentData.goals.join(','),
                    skillLevel: studentData.skillLevel,
                    learningMode: studentData.mode,
                    studyBuddyPreferences: JSON.stringify({
                        preferredStudyTimes: Math.random() > 0.5 ? ['morning', 'afternoon'] : ['evening', 'night'],
                        studyMethods: ['collaboration', 'peer teaching', 'group study'],
                        communicationStyle: Math.random() > 0.5 ? 'structured' : 'flexible'
                    }),
                    onboardingCompleted: true,
                    profileImage: `https://images.unsplash.com/photo-${1600000000 + Math.floor(Math.random() * 100000000)}?w=400&h=400&fit=crop&crop=face&auto=format&q=80`,
                },
            })
            newStudents.push(student)
            console.log(`✅ Created student: ${studentData.nameEn}`)
        } catch (error) {
            console.log(`⚠️ Skipped duplicate: ${studentData.nameEn}`)
        }
    }

    // Get all students for matching
    const allStudents = await prisma.user.findMany({
        where: { role: UserRole.LEARNER },
        select: { id: true, interests: true, goals: true }
    })

    console.log('🤝 Creating additional Study Buddy matches...')
    
    // Create more intelligent matches
    let newMatches = 0
    for (let i = 0; i < newStudents.length; i++) {
        const newStudent = newStudents[i]
        const newStudentData = additionalStudents[i]
        
        // Try to match with existing students
        for (const existingStudent of allStudents) {
            if (existingStudent.id === newStudent.id) continue
            
            const existingInterests = existingStudent.interests?.split(',') || []
            const existingGoals = existingStudent.goals?.split(',') || []
            
            // Check for shared interests/goals
            const hasSharedInterests = newStudentData.interests.some(interest =>
                existingInterests.some(existing => 
                    existing.toLowerCase().includes(interest.toLowerCase()) ||
                    interest.toLowerCase().includes(existing.toLowerCase())
                )
            )
            const hasSharedGoals = newStudentData.goals.some(goal =>
                existingGoals.includes(goal)
            )
            
            if ((hasSharedInterests || hasSharedGoals) && Math.random() < 0.12) {
                try {
                    const matchStatus = Math.random() < 0.4 ? 'accepted' : 
                                      Math.random() < 0.8 ? 'pending' : 'blocked'
                    
                    await prisma.studyBuddyMatch.create({
                        data: {
                            user1Id: newStudent.id,
                            user2Id: existingStudent.id,
                            status: matchStatus,
                            sharedSubjects: newStudentData.interests.slice(0, 2).join(','),
                            sharedGoals: newStudentData.goals.slice(0, 1).join(','),
                            createdAt: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000),
                        },
                    })
                    newMatches++
                } catch (error) {
                    // Skip duplicate matches
                }
            }
        }
    }

    // Final statistics
    const totalUsers = await prisma.user.count({ where: { role: UserRole.LEARNER } })
    const totalMatches = await prisma.studyBuddyMatch.count()
    
    console.log('\n📊 Updated Statistics:')
    console.log(`👥 Total learners: ${totalUsers}`)
    console.log(`🆕 New students added: ${newStudents.length}`)
    console.log(`🤝 Total study buddy matches: ${totalMatches}`)
    console.log(`🆕 New matches created: ${newMatches}`)
    console.log(`📈 Overall match rate: ${(totalMatches / totalUsers * 100).toFixed(1)}%`)
    
    console.log('\n🎯 Updated Demographics:')
    const allLearners = await prisma.user.findMany({
        where: { role: UserRole.LEARNER },
        select: { interests: true, goals: true, skillLevel: true }
    })
    
    const skillLevelCount = {}
    allLearners.forEach(learner => {
        skillLevelCount[learner.skillLevel] = (skillLevelCount[learner.skillLevel] || 0) + 1
    })
    
    console.log('📊 Skill Level Distribution:')
    Object.entries(skillLevelCount).forEach(([level, count]) =>
        console.log(`  ${level}: ${count} learners`)
    )
    
    console.log('\n🔐 Demo Login Examples:')
    console.log('📧 ahmed.hassan0@demo.com / demo123')
    console.log('📧 amina.saad.42@demo.com / demo123')
    console.log('📧 ibrahim.gamal.43@demo.com / demo123')
    
    console.log('\n🚀 Study Buddy system now has a rich pool of diverse learners!')
    console.log('✨ Ready for comprehensive matching and interaction demos!')
}

main()
    .catch((e) => {
        console.error('❌ Error during additional seeding:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })