import {
    PrismaClient,
    UserRole,
    KYCStatus,
    ContentStatus,
    ConversationType,
    ParticipantRole,
    MessageType,
    SubscriptionTier,
    BillingPeriod,
    SubscriptionStatus,
    PaymentStatus,
} from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const EN_FIRST_NAMES = [
    'Ahmed', 'Mohamed', 'Ali', 'Omar', 'Khaled', 'Youssef', 'Ibrahim', 'Hassan', 'Mahmoud', 'Mostafa',
    'Fatma', 'Sarah', 'Nour', 'Mariam', 'Lina', 'Dina', 'Rana', 'Reem', 'Heba', 'Yasmin',
]

const AR_FIRST_NAMES = [
    'أحمد', 'محمد', 'علي', 'عمر', 'خالد', 'يوسف', 'إبراهيم', 'حسن', 'محمود', 'مصطفى',
    'فاطمة', 'سارة', 'نور', 'مريم', 'لينا', 'دينا', 'رنا', 'ريم', 'هبة', 'ياسمين',
]

const EN_LAST_NAMES = [
    'Hassan', 'Ibrahim', 'Mahmoud', 'Fahmy', 'Nasr', 'Ashraf', 'Farouk', 'El-Sayed', 'El-Adly', 'Soliman',
    'Adel', 'Sherif', 'Gamal', 'Saad', 'Mostafa', 'Zaky', 'Tarek', 'Reda', 'Samir', 'Lotfy',
]

const AR_LAST_NAMES = [
    'حسن', 'إبراهيم', 'محمود', 'فهمي', 'نصر', 'أشرف', 'فاروق', 'السيد', 'العدلي', 'سليمان',
    'عادل', 'شريف', 'جمال', 'سعد', 'مصطفى', 'زكي', 'طارق', 'رضا', 'سمير', 'لطفي',
]

const LEARNING_INTERESTS = [
    'Programming', 'Web Development', 'Mobile Apps', 'Data Analysis', 'Artificial Intelligence',
    'Digital Marketing', 'E-commerce', 'Business Strategy', 'Entrepreneurship', 'Finance',
    'Graphic Design', 'UI/UX', 'Photography', 'Video Production', 'Content Creation',
    'English Language', 'French Language', 'German Language', 'IELTS Preparation', 'Public Speaking',
]

const LEARNING_GOALS = [
    'Career Change', 'Job Promotion', 'Skill Development', 'University Entrance', 'Certification',
    'Freelancing', 'Starting a Business', 'Side Income', 'Personal Growth', 'Academic Excellence',
]

const MENTOR_SPECIALTIES = [
    'Web Development & React',
    'Mobile Development & Flutter',
    'Data Science & AI',
    'Digital Marketing & Growth',
    'Business Strategy & Operations',
    'Entrepreneurship & Startups',
    'Graphic Design & Branding',
    'UI/UX & Product Design',
    'IELTS & English Skills',
    'Finance & Investing',
]

const COURSE_THEMES = [
    { title: 'Complete Web Development Bootcamp', category: 'Technology' },
    { title: 'Modern Mobile Apps from Scratch', category: 'Technology' },
    { title: 'Data Science with Python', category: 'Technology' },
    { title: 'Digital Marketing Mastery', category: 'Marketing' },
    { title: 'Business Launch Blueprint', category: 'Business' },
    { title: 'Graphic Design Foundations', category: 'Design' },
    { title: 'UX Research & Product Strategy', category: 'Design' },
    { title: 'IELTS Complete Guide', category: 'Languages' },
    { title: 'Finance for Founders', category: 'Business' },
]

const STUDY_METHODS = ['discussion', 'practice', 'teaching', 'note sharing', 'accountability']
const COMMUNICATION_STYLES = ['structured', 'flexible', 'collaborative']
const TIME_SLOTS = ['morning', 'afternoon', 'evening', 'late night']

const MENTOR_MESSAGES = [
    'Thanks for reaching out! Let me know which lesson you are stuck on.',
    'I recorded a quick Loom explaining the concept—check your dashboard.',
    'Great progress so far. Focus on solidifying your fundamentals this week.',
    'Book a quick call if you need help before the assignment deadline.',
    'I shared a couple of curated resources that match your goal.',
    'Remember to push your project repo before our next chat.',
    'Fantastic job on the last submission. Let’s level it up even more.',
]

const STUDY_BUDDY_MESSAGES = [
    'Want to review the chapter later tonight?',
    'I summarized today’s lecture—sending it your way.',
    'Let’s keep each other accountable for the mock exam this weekend.',
    'Do you want to split the topics? I can take algorithms if you handle databases.',
    'I booked a shared Pomodoro room for 8 PM. Join if you are free!',
    'The practice quiz was tough. Maybe we can solve it together tomorrow.',
    'Looping you in on a great YouTube playlist that explains this better.',
]

const TARGET_MENTORS = Number(process.env.SEED_MENTORS || 24)
const TARGET_LEARNERS = Number(process.env.SEED_LEARNERS || 220)

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickOne<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)]
}

function pickMany<T>(arr: T[], count: number): T[] {
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy.slice(0, Math.min(count, arr.length))
}

function buildEmail(first: string, last: string, suffix: string) {
    const cleanFirst = first.toLowerCase().replace(/[^a-z]/g, '')
    const cleanLast = last.toLowerCase().replace(/[^a-z]/g, '')
    return `${cleanFirst}.${cleanLast}.${suffix}@prime-demo.eg`
}

function buildPhone() {
    return `+201${randomInt(0, 2)}${randomInt(100000000, 999999999)}`
}

function buildAvatar(seed: number) {
    const base = 1500000000 + seed + randomInt(100000, 900000)
    return `https://images.unsplash.com/photo-${base}?w=400&h=400&fit=crop&crop=face&auto=format&q=80`
}

function generateMessages(userA: string, userB: string, type: 'mentor' | 'buddy') {
    const templates = type === 'mentor' ? MENTOR_MESSAGES : STUDY_BUDDY_MESSAGES
    const exchanges = randomInt(4, 9)
    const start = Date.now() - randomInt(2, 10) * 24 * 60 * 60 * 1000
    const messageData = []
    let sender = Math.random() > 0.5 ? userA : userB

    for (let i = 0; i < exchanges; i++) {
        const createdAt = new Date(start + i * randomInt(10, 60) * 60 * 1000)
        messageData.push({
            senderId: sender,
            content: pickOne(templates),
            messageType: MessageType.TEXT,
            createdAt,
            updatedAt: createdAt,
        })
        sender = sender === userA ? userB : userA
    }

    return messageData
}

async function createMentors(passwordHash: string) {
    const mentors: Array<{ userId: string; creatorId: string; courseIds: string[] }> = []

    for (let i = 0; i < TARGET_MENTORS; i++) {
        const firstEn = pickOne(EN_FIRST_NAMES)
        const lastEn = pickOne(EN_LAST_NAMES)
        const firstAr = pickOne(AR_FIRST_NAMES)
        const lastAr = pickOne(AR_LAST_NAMES)
        const email = buildEmail(firstEn, lastEn, `mentor${Date.now()}_${i}`)

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name: `${firstEn} ${lastEn}`,
                arabicName: `${firstAr} ${lastAr}`,
                role: UserRole.CREATOR,
                emailVerified: new Date(),
                phone: buildPhone(),
                bio: `Expert mentor focused on ${pickOne(MENTOR_SPECIALTIES)}.`,
                profileImage: buildAvatar(i + 10),
                onboardingCompleted: true,
            },
        })

        const creator = await prisma.creator.create({
            data: {
                userId: user.id,
                kycStatus: KYCStatus.VERIFIED,
                expertise: pickOne(MENTOR_SPECIALTIES),
                teachingGoals: 'Help learners stay accountable and land real wins.',
                contractSigned: true,
                contractSignedAt: new Date(),
                totalSubscribers: randomInt(120, 1200),
                totalEarnings: randomInt(5000, 50000),
                hourlyRate: randomInt(40, 120),
                availableForMeetings: true,
                languages: 'Arabic,English',
            },
        })

        const ownedCourses: string[] = []
        const courseCount = randomInt(2, 4)

        for (let idx = 0; idx < courseCount; idx++) {
            const theme = pickOne(COURSE_THEMES)
            const course = await prisma.course.create({
                data: {
                    title: `${theme.title} ${randomInt(1, 50)}`,
                    description: 'Deep-dive training with projects, templates, and accountability.',
                    descriptionAr: 'تدريب متكامل مع مشاريع وقوالب ودعم مستمر.',
                    creatorId: creator.id,
                    category: theme.category,
                    skillLevel: pickOne(['Beginner', 'Intermediate', 'Advanced']),
                    duration: randomInt(600, 3200),
                    language: 'ar',
                    price: randomInt(120, 350),
                    status: ContentStatus.PUBLISHED,
                    publishedAt: new Date(),
                    totalViews: randomInt(300, 8000),
                    totalEnrollments: randomInt(30, 900),
                    rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10,
                    thumbnail: buildAvatar(i * 7 + idx * 3 + 20),
                    syllabus: {
                        modules: [
                            {
                                title: 'Mindset & Fundamentals',
                                lessons: ['Overview', 'What to avoid', 'Weekly plan'],
                            },
                            {
                                title: 'Deep Practice',
                                lessons: ['Project brief', 'Implementation', 'Review'],
                            },
                        ],
                    },
                },
            })
            ownedCourses.push(course.id)
        }

        mentors.push({ userId: user.id, creatorId: creator.id, courseIds: ownedCourses })
    }

    return mentors
}

async function createLearners(passwordHash: string) {
    const learners: Array<{ userId: string; interests: string[]; goals: string[] }> = []

    for (let i = 0; i < TARGET_LEARNERS; i++) {
        const firstEn = pickOne(EN_FIRST_NAMES)
        const lastEn = pickOne(EN_LAST_NAMES)
        const firstAr = pickOne(AR_FIRST_NAMES)
        const lastAr = pickOne(AR_LAST_NAMES)
        const email = buildEmail(firstEn, lastEn, `learner${Date.now()}_${i}`)
        const interests = pickMany(LEARNING_INTERESTS, randomInt(2, 5))
        const goals = pickMany(LEARNING_GOALS, randomInt(1, 3))

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name: `${firstEn} ${lastEn}`,
                arabicName: `${firstAr} ${lastAr}`,
                role: UserRole.LEARNER,
                emailVerified: new Date(),
                phone: buildPhone(),
                bio: `Learner laser-focused on ${interests.slice(0, 2).join(' & ')}.`,
                interests: interests.join(','),
                goals: goals.join(','),
                skillLevel: pickOne(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
                learningMode: pickOne(['online', 'offline', 'hybrid']),
                onboardingCompleted: true,
                studyBuddyPreferences: JSON.stringify({
                    preferredStudyTimes: pickMany(TIME_SLOTS, 2),
                    studyMethods: pickMany(STUDY_METHODS, 2),
                    communicationStyle: pickOne(COMMUNICATION_STYLES),
                }),
            },
        })

        try {
            await prisma.studyPreferences.create({
                data: {
                    userId: user.id,
                    preferredStudyTimes: JSON.stringify(pickMany(TIME_SLOTS, 2)),
                    communicationStyle: pickOne(COMMUNICATION_STYLES),
                    learningStyle: pickOne(['visual', 'auditory', 'reading']),
                    subjectExpertise: JSON.stringify(pickMany(interests, 2)),
                    subjectsToLearn: JSON.stringify(pickMany(interests, 2)),
                    studyGoalType: pickOne(['exam_prep', 'skill_building', 'project_work']),
                },
            })
        } catch (error) {
            // Ignore duplicates when re-running
        }

        learners.push({ userId: user.id, interests, goals })
    }

    return learners
}

async function createEnrollments(learners: Array<{ userId: string; interests: string[] }>, courses: string[]) {
    for (const learner of learners) {
        const picks = pickMany(courses, randomInt(3, 6))
        for (const courseId of picks) {
            try {
                await prisma.enrollment.create({
                    data: {
                        userId: learner.userId,
                        courseId,
                        progress: randomInt(5, 95),
                        lastAccessedAt: new Date(Date.now() - randomInt(1, 20) * 24 * 60 * 60 * 1000),
                    },
                })
            } catch (error) {
                // Ignore duplicates
            }
        }
    }
}

async function createMentorSubscriptions(
    learners: Array<{ userId: string }>,
    mentors: Array<{ userId: string; creatorId: string }>,
) {
    const subscriptions: Array<{ studentId: string; mentorUserId: string; creatorId: string }> = []

    for (const learner of learners) {
        const mentorSample = pickMany(mentors, randomInt(1, 3))
        for (const mentor of mentorSample) {
            try {
                await prisma.mentorSubscription.create({
                    data: {
                        studentId: learner.userId,
                        creatorId: mentor.creatorId,
                        tier: pickOne([SubscriptionTier.BASIC, SubscriptionTier.PREMIUM, SubscriptionTier.VIP]),
                        billingPeriod: pickOne([BillingPeriod.MONTHLY, BillingPeriod.YEARLY]),
                        price: randomInt(80, 260),
                        status: SubscriptionStatus.ACTIVE,
                        startDate: new Date(Date.now() - randomInt(5, 45) * 24 * 60 * 60 * 1000),
                        endDate: new Date(Date.now() + randomInt(25, 90) * 24 * 60 * 60 * 1000),
                        autoRenew: true,
                        paymentStatus: PaymentStatus.PAID,
                        monthlyMessages: randomInt(4, 20),
                        monthlyMeetings: randomInt(1, 4),
                        meetingDuration: pickOne([30, 45, 60]),
                        accessToContent: true,
                        prioritySupport: Math.random() > 0.6,
                    },
                })
                subscriptions.push({ studentId: learner.userId, mentorUserId: mentor.userId, creatorId: mentor.creatorId })
            } catch (error) {
                // Unique constraint hit – already subscribed
            }
        }
    }

    return subscriptions
}

async function createStudyBuddyMatches(learners: Array<{ userId: string; interests: string[]; goals: string[] }>) {
    const matches: Array<{ userIds: [string, string]; status: string }> = []
    const attempts = TARGET_LEARNERS * 3
    const seenPairs = new Set<string>()

    for (let i = 0; i < attempts; i++) {
        const left = pickOne(learners)
        const right = pickOne(learners)
        if (left.userId === right.userId) continue

        const pairKey = [left.userId, right.userId].sort().join(':')
        if (seenPairs.has(pairKey)) continue
        seenPairs.add(pairKey)

        const sharedSubjects = left.interests.filter((interest) => right.interests.includes(interest))
        const sharedGoals = left.goals.filter((goal) => right.goals.includes(goal))
        const status = Math.random() > 0.45 ? 'accepted' : Math.random() > 0.5 ? 'pending' : 'blocked'

        try {
            await prisma.studyBuddyMatch.create({
                data: {
                    user1Id: left.userId,
                    user2Id: right.userId,
                    status,
                    sharedSubjects: sharedSubjects.slice(0, 3).join(','),
                    sharedGoals: sharedGoals.slice(0, 2).join(','),
                },
            })
            matches.push({ userIds: [left.userId, right.userId], status })
        } catch (error) {
            // Skip duplicates
        }
    }

    return matches
}

async function createConversations(
    pairs: Array<{ userIds: [string, string]; type: 'mentor' | 'buddy' }>,
) {
    for (const pair of pairs) {
        try {
            await prisma.conversation.create({
                data: {
                    type: ConversationType.DIRECT,
                    participants: {
                        create: [
                            {
                                userId: pair.userIds[0],
                                role: ParticipantRole.MEMBER,
                                isActive: true,
                                lastReadAt: new Date(),
                            },
                            {
                                userId: pair.userIds[1],
                                role: ParticipantRole.MEMBER,
                                isActive: true,
                                lastReadAt: Math.random() > 0.5 ? new Date() : null,
                            },
                        ],
                    },
                    messages: {
                        create: generateMessages(pair.userIds[0], pair.userIds[1], pair.type),
                    },
                },
            })
        } catch (error) {
            // Ignore if conversation already exists
        }
    }
}

async function main() {
    console.log('🚀 Seeding large messaging dataset...')

    const passwordHash = await bcrypt.hash(process.env.SEED_PASSWORD || 'demo123', 10)

    const mentorRecords = await createMentors(passwordHash)
    const learnerRecords = await createLearners(passwordHash)
    const allCourses = mentorRecords.flatMap((mentor) => mentor.courseIds)

    await createEnrollments(learnerRecords, allCourses)
    const subscriptions = await createMentorSubscriptions(learnerRecords, mentorRecords)
    const studyMatches = await createStudyBuddyMatches(learnerRecords)

    const mentorPairs = subscriptions.map((sub) => ({ userIds: [sub.studentId, sub.mentorUserId] as [string, string], type: 'mentor' as const }))
    const buddyPairs = studyMatches
        .filter((match) => match.status === 'accepted')
        .map((match) => ({ userIds: match.userIds, type: 'buddy' as const }))

    await createConversations([...mentorPairs, ...buddyPairs])

    const [userCount, courseCount, enrollmentCount, subscriptionCount, matchCount, conversationCount, messageCount] = await Promise.all([
        prisma.user.count(),
        prisma.course.count(),
        prisma.enrollment.count(),
        prisma.mentorSubscription.count(),
        prisma.studyBuddyMatch.count(),
        prisma.conversation.count(),
        prisma.message.count(),
    ])

    console.log('✅ Seeding complete!')
    console.log(`👤 Users: ${userCount}`)
    console.log(`📚 Courses: ${courseCount}`)
    console.log(`📝 Enrollments: ${enrollmentCount}`)
    console.log(`🧑‍🏫 Mentor subscriptions: ${subscriptionCount}`)
    console.log(`🤝 Study buddy matches: ${matchCount}`)
    console.log(`💬 Conversations: ${conversationCount}`)
    console.log(`✉️ Messages: ${messageCount}`)
}

main()
    .catch((error) => {
        console.error('❌ Seeding failed:', error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
