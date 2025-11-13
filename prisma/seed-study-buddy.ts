import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Egyptian names and data for realistic study buddy profiles
const studentsData = [
    // Technology enthusiasts
    { nameEn: 'Ahmed Hassan', nameAr: 'أحمد حسن', interests: ['Programming', 'Web Development', 'Mobile Apps'], goals: ['Career Change into Tech', 'Freelancing'], skillLevel: 'BEGINNER', mode: 'online' },
    { nameEn: 'Fatma Mohamed', nameAr: 'فاطمة محمد', interests: ['Data Science', 'Python Programming', 'Machine Learning'], goals: ['Job Promotion', 'Skill Development'], skillLevel: 'INTERMEDIATE', mode: 'hybrid' },
    { nameEn: 'Omar Ali', nameAr: 'عمر علي', interests: ['Cybersecurity', 'Networking', 'Ethical Hacking'], goals: ['Certification', 'Career Change into Tech'], skillLevel: 'ADVANCED', mode: 'online' },
    { nameEn: 'Nour Ibrahim', nameAr: 'نور إبراهيم', interests: ['UI/UX Design', 'Graphic Design', 'Web Development'], goals: ['Freelancing', 'Portfolio Building'], skillLevel: 'BEGINNER', mode: 'online' },
    { nameEn: 'Khaled Mahmoud', nameAr: 'خالد محمود', interests: ['Mobile Apps', 'React Native', 'Flutter'], goals: ['Starting a Business', 'Skill Development'], skillLevel: 'INTERMEDIATE', mode: 'hybrid' },
    
    // Business and Marketing students
    { nameEn: 'Sarah Ahmed', nameAr: 'سارة أحمد', interests: ['Digital Marketing', 'Social Media Marketing', 'E-commerce'], goals: ['Job Promotion', 'Side Income'], skillLevel: 'BEGINNER', mode: 'online' },
    { nameEn: 'Mohamed Farouk', nameAr: 'محمد فاروق', interests: ['Business Strategy', 'Entrepreneurship', 'Finance'], goals: ['Starting a Business', 'MBA Preparation'], skillLevel: 'INTERMEDIATE', mode: 'offline' },
    { nameEn: 'Yasmin Khaled', nameAr: 'ياسمين خالد', interests: ['Content Creation', 'Social Media Marketing', 'Photography'], goals: ['Freelancing', 'Personal Branding'], skillLevel: 'BEGINNER', mode: 'online' },
    { nameEn: 'Amr Youssef', nameAr: 'عمرو يوسف', interests: ['Project Management', 'Business Analysis', 'Leadership'], goals: ['Job Promotion', 'Certification'], skillLevel: 'ADVANCED', mode: 'hybrid' },
    { nameEn: 'Rana Mostafa', nameAr: 'رنا مصطفى', interests: ['E-commerce', 'Amazon FBA', 'Online Business'], goals: ['Side Income', 'Starting a Business'], skillLevel: 'BEGINNER', mode: 'online' },
    
    // Language learners
    { nameEn: 'Heba Salah', nameAr: 'هبة صلاح', interests: ['English Language', 'IELTS Preparation', 'Translation'], goals: ['Study Abroad', 'Job Promotion'], skillLevel: 'INTERMEDIATE', mode: 'hybrid' },
    { nameEn: 'Tamer Hassan', nameAr: 'تامر حسن', interests: ['German Language', 'European Culture', 'Translation'], goals: ['Study Abroad', 'Immigration'], skillLevel: 'BEGINNER', mode: 'online' },
    { nameEn: 'Dina Adel', nameAr: 'دينا عادل', interests: ['French Language', 'International Relations', 'Diplomacy'], goals: ['Career Development', 'Cultural Exchange'], skillLevel: 'INTERMEDIATE', mode: 'offline' },
    { nameEn: 'Karim Nabil', nameAr: 'كريم نبيل', interests: ['Spanish Language', 'Latin Culture', 'Travel'], goals: ['Personal Growth', 'Travel Preparation'], skillLevel: 'BEGINNER', mode: 'online' },
    
    // Medical and Science students
    { nameEn: 'Maryam Sayed', nameAr: 'مريم سيد', interests: ['Medicine', 'Biology', 'Research'], goals: ['Medical School', 'USMLE Preparation'], skillLevel: 'ADVANCED', mode: 'hybrid' },
    { nameEn: 'Youssef Omar', nameAr: 'يوسف عمر', interests: ['Pharmacy', 'Chemistry', 'Drug Development'], goals: ['Pharmacy School', 'Research'], skillLevel: 'INTERMEDIATE', mode: 'offline' },
    { nameEn: 'Laila Abdel Rahman', nameAr: 'ليلى عبدالرحمن', interests: ['Psychology', 'Mental Health', 'Counseling'], goals: ['Graduate Studies', 'Professional Practice'], skillLevel: 'INTERMEDIATE', mode: 'hybrid' },
    { nameEn: 'Hassan Mahmoud', nameAr: 'حسن محمود', interests: ['Engineering', 'Mathematics', 'Physics'], goals: ['University Entrance', 'Scholarship'], skillLevel: 'ADVANCED', mode: 'offline' },
    
    // High school students
    { nameEn: 'Jana Mohamed', nameAr: 'جنا محمد', interests: ['Mathematics', 'Physics', 'Computer Science'], goals: ['Thanaweya Amma Prep', 'University Entrance'], skillLevel: 'INTERMEDIATE', mode: 'hybrid' },
    { nameEn: 'Ziad Ahmed', nameAr: 'زياد أحمد', interests: ['Chemistry', 'Biology', 'Medicine'], goals: ['Thanaweya Amma Prep', 'Medical School'], skillLevel: 'INTERMEDIATE', mode: 'offline' },
    { nameEn: 'Salma Hassan', nameAr: 'سلمى حسن', interests: ['Literature', 'History', 'Arabic Language'], goals: ['University Entrance', 'Academic Excellence'], skillLevel: 'ADVANCED', mode: 'hybrid' },
    { nameEn: 'Mostafa Ali', nameAr: 'مصطفى علي', interests: ['Geography', 'Economics', 'Political Science'], goals: ['University Entrance', 'Social Studies'], skillLevel: 'INTERMEDIATE', mode: 'online' },
    
    // Additional diverse profiles
    { nameEn: 'Reem Farid', nameAr: 'ريم فريد', interests: ['Art', 'Design', 'Creativity'], goals: ['Portfolio Building', 'Art School'], skillLevel: 'BEGINNER', mode: 'hybrid' },
    { nameEn: 'Adam Sherif', nameAr: 'آدم شريف', interests: ['Music', 'Audio Production', 'Sound Engineering'], goals: ['Creative Career', 'Skill Development'], skillLevel: 'INTERMEDIATE', mode: 'online' },
    { nameEn: 'Lina Tarek', nameAr: 'لينا طارق', interests: ['Fashion Design', 'Business', 'E-commerce'], goals: ['Starting a Business', 'Fashion Industry'], skillLevel: 'BEGINNER', mode: 'online' },
    { nameEn: 'Mahmoud Essam', nameAr: 'محمود عصام', interests: ['Sports Science', 'Fitness', 'Nutrition'], goals: ['Certification', 'Fitness Career'], skillLevel: 'INTERMEDIATE', mode: 'offline' },
    { nameEn: 'Nouran Wael', nameAr: 'نوران وائل', interests: ['Environmental Science', 'Sustainability', 'Climate Change'], goals: ['Graduate Studies', 'Environmental Career'], skillLevel: 'ADVANCED', mode: 'hybrid' },
    { nameEn: 'Seif Hany', nameAr: 'سيف هاني', interests: ['Architecture', 'Urban Planning', 'Design'], goals: ['Architecture School', 'Creative Portfolio'], skillLevel: 'INTERMEDIATE', mode: 'offline' },
    
    // More technology profiles
    { nameEn: 'Marwan Taha', nameAr: 'مروان طه', interests: ['Game Development', 'Unity', '3D Modeling'], goals: ['Game Industry', 'Indie Development'], skillLevel: 'INTERMEDIATE', mode: 'online' },
    { nameEn: 'Habiba Nour', nameAr: 'حبيبة نور', interests: ['Artificial Intelligence', 'Machine Learning', 'Data Science'], goals: ['Research', 'Tech Career'], skillLevel: 'ADVANCED', mode: 'hybrid' },
    { nameEn: 'Kareem Magdy', nameAr: 'كريم مجدي', interests: ['Blockchain', 'Cryptocurrency', 'FinTech'], goals: ['Innovation', 'Startup'], skillLevel: 'ADVANCED', mode: 'online' },
    { nameEn: 'Malak Ashraf', nameAr: 'ملك أشرف', interests: ['DevOps', 'Cloud Computing', 'AWS'], goals: ['Cloud Certification', 'Career Advancement'], skillLevel: 'INTERMEDIATE', mode: 'online' },
    
    // Business expansion
    { nameEn: 'Hazem Gamal', nameAr: 'حازم جمال', interests: ['Real Estate', 'Investment', 'Property Management'], goals: ['Investment', 'Wealth Building'], skillLevel: 'INTERMEDIATE', mode: 'offline' },
    { nameEn: 'Nada Fouad', nameAr: 'ندا فؤاد', interests: ['Human Resources', 'Organizational Behavior', 'Training'], goals: ['HR Career', 'Certification'], skillLevel: 'INTERMEDIATE', mode: 'hybrid' },
    { nameEn: 'Yara Medhat', nameAr: 'يارا مدحت', interests: ['Accounting', 'Finance', 'Auditing'], goals: ['CPA Certification', 'Financial Career'], skillLevel: 'ADVANCED', mode: 'offline' },
    { nameEn: 'Fares Samir', nameAr: 'فارس سمير', interests: ['Supply Chain', 'Logistics', 'Operations'], goals: ['Operations Management', 'Certification'], skillLevel: 'INTERMEDIATE', mode: 'hybrid' },
    
    // Creative and media
    { nameEn: 'Rania Karam', nameAr: 'رانيا كرم', interests: ['Journalism', 'Media', 'Communication'], goals: ['Media Career', 'Storytelling'], skillLevel: 'INTERMEDIATE', mode: 'hybrid' },
    { nameEn: 'Tarek Nasser', nameAr: 'طارق ناصر', interests: ['Video Production', 'Filmmaking', 'Editing'], goals: ['Film Industry', 'Creative Projects'], skillLevel: 'INTERMEDIATE', mode: 'online' },
    { nameEn: 'Arwa Said', nameAr: 'أروى سعيد', interests: ['Public Relations', 'Event Management', 'Marketing'], goals: ['PR Career', 'Event Planning'], skillLevel: 'BEGINNER', mode: 'hybrid' },
    { nameEn: 'Samy Reda', nameAr: 'سامي رضا', interests: ['Photography', 'Visual Arts', 'Digital Media'], goals: ['Photography Business', 'Artistic Expression'], skillLevel: 'INTERMEDIATE', mode: 'online' },
    
    // Education and training
    { nameEn: 'Sherihan Waleed', nameAr: 'شريهان وليد', interests: ['Education', 'Teaching Methods', 'Child Psychology'], goals: ['Teaching Career', 'Educational Leadership'], skillLevel: 'ADVANCED', mode: 'offline' },
    { nameEn: 'Abdel Rahman Hosny', nameAr: 'عبدالرحمن حسني', interests: ['Educational Technology', 'E-learning', 'Training'], goals: ['EdTech Career', 'Training Specialist'], skillLevel: 'INTERMEDIATE', mode: 'online' },
]

function generateEmail(nameEn: string, index: number): string {
    const cleanName = nameEn.toLowerCase().replace(/\s+/g, '.')
    return `${cleanName}${index}@demo.com`
}

function generatePhone(): string {
    return `+2010${Math.floor(Math.random() * 90000000) + 10000000}`
}

async function main() {
    console.log('🌱 Starting Study Buddy focused seed...')

    const demoPassword = await bcrypt.hash('demo123', 10)

    console.log('🎓 Creating diverse student profiles for Study Buddy...')
    
    const students = []
    for (let i = 0; i < studentsData.length; i++) {
        const studentData = studentsData[i]
        
        try {
            const student = await prisma.user.create({
                data: {
                    email: generateEmail(studentData.nameEn, i),
                    passwordHash: demoPassword,
                    name: studentData.nameEn,
                    arabicName: studentData.nameAr,
                    role: UserRole.LEARNER,
                    emailVerified: new Date(),
                    phoneVerified: Math.random() > 0.3 ? new Date() : null,
                    phone: generatePhone(),
                    bio: `Student passionate about ${studentData.interests.slice(0, 2).join(' and ')}. Looking to connect with like-minded learners.`,
                    interests: studentData.interests.join(','),
                    goals: studentData.goals.join(','),
                    skillLevel: studentData.skillLevel,
                    learningMode: studentData.mode,
                    studyBuddyPreferences: JSON.stringify({
                        preferredStudyTimes: ['morning', 'evening'],
                        studyMethods: ['discussion', 'practice', 'teaching'],
                        communicationStyle: 'collaborative'
                    }),
                    onboardingCompleted: true,
                    profileImage: `https://images.unsplash.com/photo-${1500000000 + Math.floor(Math.random() * 100000000)}?w=400&h=400&fit=crop&crop=face&auto=format&q=80`,
                },
            })
            students.push(student)
            console.log(`✅ Created student: ${studentData.nameEn}`)
        } catch (error) {
            console.log(`⚠️ Skipped duplicate: ${studentData.nameEn}`)
        }
    }

    console.log('🤝 Creating Study Buddy matches...')
    
    // Create intelligent study buddy matches based on shared interests and goals
    const matches = []
    for (let i = 0; i < students.length; i++) {
        for (let j = i + 1; j < students.length; j++) {
            const user1 = students[i]
            const user2 = students[j]
            
            const user1Interests = studentsData[i].interests
            const user2Interests = studentsData[j].interests
            const user1Goals = studentsData[i].goals
            const user2Goals = studentsData[j].goals
            
            // Find shared interests and goals
            const sharedInterests = user1Interests.filter(interest => 
                user2Interests.some(otherInterest => 
                    otherInterest.toLowerCase().includes(interest.toLowerCase()) ||
                    interest.toLowerCase().includes(otherInterest.toLowerCase())
                )
            )
            const sharedGoals = user1Goals.filter(goal => user2Goals.includes(goal))
            
            // Create a match if they have shared interests or goals
            if (sharedInterests.length > 0 || sharedGoals.length > 0) {
                // Only create some matches to avoid overwhelming the database
                if (Math.random() < 0.15) { // 15% chance to create a match
                    try {
                        const matchStatus = Math.random() < 0.3 ? 'accepted' : 
                                          Math.random() < 0.8 ? 'pending' : 'blocked'
                        
                        const match = await prisma.studyBuddyMatch.create({
                            data: {
                                user1Id: user1.id,
                                user2Id: user2.id,
                                status: matchStatus,
                                sharedSubjects: sharedInterests.slice(0, 3).join(','),
                                sharedGoals: sharedGoals.slice(0, 2).join(','),
                                createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Within last week
                            },
                        })
                        matches.push(match)
                    } catch (error) {
                        // Skip duplicates
                    }
                }
            }
        }
    }

    console.log('📊 Final Statistics:')
    console.log(`👥 Students created: ${students.length}`)
    console.log(`🤝 Study buddy matches: ${matches.length}`)
    console.log(`📈 Match rate: ${(matches.length / students.length * 100).toFixed(1)}%`)
    
    console.log('\n🎯 Study Buddy Demographics:')
    const interestStats = {}
    const goalStats = {}
    const skillStats = {}
    
    studentsData.forEach(student => {
        student.interests.forEach(interest => {
            interestStats[interest] = (interestStats[interest] || 0) + 1
        })
        student.goals.forEach(goal => {
            goalStats[goal] = (goalStats[goal] || 0) + 1
        })
        skillStats[student.skillLevel] = (skillStats[student.skillLevel] || 0) + 1
    })
    
    console.log('\n📚 Top Interests:')
    Object.entries(interestStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([interest, count]) => console.log(`  ${interest}: ${count} students`))
    
    console.log('\n🎯 Top Goals:')
    Object.entries(goalStats)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([goal, count]) => console.log(`  ${goal}: ${count} students`))
    
    console.log('\n📊 Skill Levels:')
    Object.entries(skillStats).forEach(([level, count]) => 
        console.log(`  ${level}: ${count} students`)
    )
    
    console.log('\n🔐 Demo Login (any student):')
    console.log('📧 Email: [any_student_name.surname0-39@demo.com]')
    console.log('🔑 Password: demo123')
    console.log('\nExample:')
    console.log('📧 ahmed.hassan0@demo.com / demo123')
    console.log('📧 fatma.mohamed1@demo.com / demo123')
    
    console.log('\n🚀 Study Buddy system is now ready with diverse, realistic profiles!')
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })