import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addInstructorAuthenticData() {
    console.log('🎓 Adding authentic instructor data (reviews, detailed certifications, etc.)')

    try {
        // Get all instructors
        const instructors = await prisma.creator.findMany({
            where: {
                kycStatus: 'VERIFIED'
            },
            include: {
                user: true,
                courses: true
            }
        })

        console.log(`Found ${instructors.length} instructors to enhance`)

        // Update instructor certifications with more realistic data
        for (const instructor of instructors) {
            let certifications: any[] = []
            let updatedData: any = {}

            switch (instructor.user.name) {
                case 'Ahmed Hassan':
                    certifications = [
                        {
                            name: "Meta React Developer Professional Certificate",
                            issuer: "Meta (Facebook)",
                            year: 2023,
                            credential: "META-RD-2023-AH847"
                        },
                        {
                            name: "AWS Certified Solutions Architect",
                            issuer: "Amazon Web Services",
                            year: 2022,
                            credential: "AWS-CSA-2022-4829"
                        },
                        {
                            name: "Google Cloud Professional Developer",
                            issuer: "Google Cloud",
                            year: 2021,
                            credential: "GCP-PD-2021-7392"
                        },
                        {
                            name: "Microsoft Certified: Azure Developer Associate",
                            issuer: "Microsoft",
                            year: 2023,
                            credential: "MS-AZ204-2023-8472"
                        }
                    ]
                    updatedData = {
                        teachingGoals: "My mission is to transform complex React concepts into digestible, practical lessons that empower developers to build scalable web applications. I believe in hands-on learning with real-world projects that mirror industry standards.",
                        totalEarnings: 125000,
                        totalSubscribers: 3420,
                        hourlyRate: 85,
                        languages: "Arabic, English",
                        timezone: "Asia/Dubai (GMT+4)",
                        socialLinks: {
                            github: "https://github.com/ahmed-hassan-dev",
                            linkedin: "https://linkedin.com/in/ahmedhassan-react",
                            twitter: "https://twitter.com/ahmed_react_dev",
                            youtube: "https://youtube.com/@reactwithahmed"
                        }
                    }
                    break

                case 'Fatima Al-Zahra':
                    certifications = [
                        {
                            name: "Google UX Design Professional Certificate",
                            issuer: "Google",
                            year: 2023,
                            credential: "GOOG-UX-2023-FZ924"
                        },
                        {
                            name: "Adobe Certified Expert (ACE) - Photoshop",
                            issuer: "Adobe",
                            year: 2022,
                            credential: "ACE-PS-2022-8273"
                        },
                        {
                            name: "Figma Design Systems Certification",
                            issuer: "Figma",
                            year: 2023,
                            credential: "FIG-DS-2023-4829"
                        },
                        {
                            name: "Human Computer Interaction Specialization",
                            issuer: "UC San Diego (Coursera)",
                            year: 2021,
                            credential: "UCSD-HCI-2021-7392"
                        }
                    ]
                    updatedData = {
                        teachingGoals: "I'm passionate about creating inclusive, accessible designs that solve real user problems. My teaching focuses on design thinking, user research, and creating pixel-perfect interfaces that users love.",
                        totalEarnings: 98000,
                        totalSubscribers: 2890,
                        hourlyRate: 75,
                        languages: "Arabic, English, French",
                        timezone: "Africa/Cairo (GMT+2)",
                        socialLinks: {
                            behance: "https://behance.net/fatima-alzahra-design",
                            dribbble: "https://dribbble.com/fatima-ux",
                            linkedin: "https://linkedin.com/in/fatima-alzahra-ux",
                            instagram: "https://instagram.com/designwithfatima"
                        }
                    }
                    break

                case 'Mohamed Saeed':
                    certifications = [
                        {
                            name: "AWS Certified DevOps Engineer - Professional",
                            issuer: "Amazon Web Services",
                            year: 2023,
                            credential: "AWS-DOP-2023-MS847"
                        },
                        {
                            name: "Kubernetes Certified Application Developer (CKAD)",
                            issuer: "CNCF",
                            year: 2022,
                            credential: "CNCF-CKAD-2022-8472"
                        },
                        {
                            name: "Docker Certified Associate (DCA)",
                            issuer: "Docker Inc.",
                            year: 2021,
                            credential: "DOCK-DCA-2021-4829"
                        },
                        {
                            name: "Terraform Associate Certification",
                            issuer: "HashiCorp",
                            year: 2023,
                            credential: "HASH-TF-2023-7392"
                        }
                    ]
                    updatedData = {
                        teachingGoals: "I help developers bridge the gap between development and operations through practical DevOps implementations. My courses focus on automation, scalability, and building robust CI/CD pipelines.",
                        totalEarnings: 142000,
                        totalSubscribers: 4150,
                        hourlyRate: 95,
                        languages: "Arabic, English",
                        timezone: "Asia/Dubai (GMT+4)",
                        socialLinks: {
                            github: "https://github.com/mohamed-saeed-devops",
                            linkedin: "https://linkedin.com/in/mohamed-saeed-devops",
                            medium: "https://medium.com/@mohamed-devops",
                            youtube: "https://youtube.com/@devopswithmohamed"
                        }
                    }
                    break

                case 'Dr. Sarah Ahmed':
                    certifications = [
                        {
                            name: "TensorFlow Developer Certificate",
                            issuer: "TensorFlow",
                            year: 2023,
                            credential: "TF-DEV-2023-SA924"
                        },
                        {
                            name: "Machine Learning Engineering for Production (MLOps) Specialization",
                            issuer: "Stanford University (Coursera)",
                            year: 2022,
                            credential: "STAN-MLOps-2022-8472"
                        },
                        {
                            name: "AWS Certified Machine Learning - Specialty",
                            issuer: "Amazon Web Services",
                            year: 2023,
                            credential: "AWS-MLS-2023-4829"
                        },
                        {
                            name: "Deep Learning Specialization",
                            issuer: "deeplearning.ai (Coursera)",
                            year: 2021,
                            credential: "DL-AI-2021-7392"
                        }
                    ]
                    updatedData = {
                        teachingGoals: "I demystify artificial intelligence and machine learning for developers and data scientists. My approach combines theoretical foundations with practical implementations using industry-standard tools and frameworks.",
                        totalEarnings: 165000,
                        totalSubscribers: 5280,
                        hourlyRate: 120,
                        languages: "Arabic, English",
                        timezone: "Africa/Cairo (GMT+2)",
                        socialLinks: {
                            linkedin: "https://linkedin.com/in/dr-sarah-ahmed-ai",
                            github: "https://github.com/dr-sarah-ai",
                            researchgate: "https://researchgate.net/profile/Sarah-Ahmed-AI",
                            kaggle: "https://kaggle.com/drsarahahmed"
                        }
                    }
                    break

                case 'Omar Khaled':
                    certifications = [
                        {
                            name: "Google Associate Android Developer",
                            issuer: "Google",
                            year: 2023,
                            credential: "GOOG-AND-2023-OK847"
                        },
                        {
                            name: "iOS Development with Swift Specialization",
                            issuer: "University of Toronto (Coursera)",
                            year: 2022,
                            credential: "UTOR-iOS-2022-8472"
                        },
                        {
                            name: "React Native Certified Developer",
                            issuer: "React Native Community",
                            year: 2023,
                            credential: "RN-DEV-2023-4829"
                        },
                        {
                            name: "Flutter Certified Application Developer",
                            issuer: "Google",
                            year: 2022,
                            credential: "GOOG-FLT-2022-7392"
                        }
                    ]
                    updatedData = {
                        teachingGoals: "I specialize in cross-platform mobile development, helping developers create beautiful, performant apps for both iOS and Android. My teaching emphasizes best practices, user experience, and deployment strategies.",
                        totalEarnings: 118000,
                        totalSubscribers: 3850,
                        hourlyRate: 90,
                        languages: "Arabic, English",
                        timezone: "Asia/Dubai (GMT+4)",
                        socialLinks: {
                            github: "https://github.com/omar-khaled-mobile",
                            linkedin: "https://linkedin.com/in/omar-khaled-mobile-dev",
                            twitter: "https://twitter.com/omar_mobile_dev",
                            youtube: "https://youtube.com/@mobilewithomar"
                        }
                    }
                    break
            }

            // Update instructor with enhanced data
            await prisma.creator.update({
                where: { id: instructor.id },
                data: {
                    ...updatedData,
                    certifications: JSON.stringify(certifications)
                }
            })

            console.log(`✅ Enhanced data for ${instructor.user.name}`)
        }

        // Add realistic reviews for each instructor
        await addRealisticReviews()

        console.log('✅ Successfully added authentic instructor data!')

    } catch (error) {
        console.error('❌ Error adding instructor data:', error)
        throw error
    } finally {
        await prisma.$disconnect()
    }
}

async function addRealisticReviews() {
    console.log('📝 Adding realistic student reviews...')

    // Get all instructors with their courses
    const instructors = await prisma.creator.findMany({
        where: { kycStatus: 'VERIFIED' },
        include: {
            user: true,
            courses: {
                include: {
                    enrollments: {
                        include: {
                            user: true
                        }
                    }
                }
            }
        }
    })

    // Sample realistic review data
    const reviewTemplates = [
        {
            ratings: [5, 5, 5, 4, 5],
            comments: [
                "Exceptional instructor! The course content was well-structured and the practical examples really helped me understand complex concepts.",
                "Amazing teaching style! I went from beginner to confidently building projects. Highly recommended!",
                "The best course I've taken this year. Clear explanations, great projects, and excellent support.",
                "Outstanding quality! Every lesson was valuable and the instructor responds quickly to questions.",
                "Incredible depth of knowledge. The instructor breaks down complex topics into digestible pieces."
            ]
        },
        {
            ratings: [4, 5, 4, 5, 4],
            comments: [
                "Great course with practical examples. The instructor knows their stuff and explains it well.",
                "Very informative and well-paced. I appreciate the real-world applications covered.",
                "Solid content and good teaching approach. Would definitely take another course from this instructor.",
                "Clear explanations and good project structure. Learned a lot and enjoyed the experience.",
                "Excellent instructor with industry experience. The course exceeded my expectations."
            ]
        }
    ]

    for (const instructor of instructors) {
        if (!instructor.courses.length) continue

        for (const course of instructor.courses.slice(0, 2)) { // Limit reviews per instructor
            const template = reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)]
            
            // Add 3-5 reviews per course
            const numReviews = Math.floor(Math.random() * 3) + 3
            
            for (let i = 0; i < numReviews; i++) {
                // Create a sample reviewer if needed
                const reviewerEmail = `reviewer${Date.now()}_${i}@example.com`
                const reviewerName = [
                    'Yasmin Ali', 'Khaled Mohamed', 'Nour Hassan', 'Amira Saeed',
                    'Tariq Ahmed', 'Layla Omar', 'Farid Nasser', 'Dina Mahmoud'
                ][Math.floor(Math.random() * 8)]

                let reviewer = await prisma.user.findUnique({
                    where: { email: reviewerEmail }
                })

                if (!reviewer) {
                    reviewer = await prisma.user.create({
                        data: {
                            email: reviewerEmail,
                            name: reviewerName,
                            arabicName: reviewerName,
                            role: 'LEARNER',
                            onboardingCompleted: true,
                            passwordHash: 'demo-password-hash' // Placeholder for demo users
                        }
                    })
                }

                // Create review
                await prisma.review.create({
                    data: {
                        rating: template.ratings[i % template.ratings.length],
                        comment: template.comments[i % template.comments.length],
                        userId: reviewer.id,
                        courseId: course.id,
                        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
                    }
                })
            }

            console.log(`✅ Added ${numReviews} reviews for course: ${course.title}`)
        }
    }

    console.log('✅ Reviews added successfully!')
}

if (require.main === module) {
    addInstructorAuthenticData()
        .then(() => {
            console.log('🎉 Instructor enhancement complete!')
            process.exit(0)
        })
        .catch((error) => {
            console.error('Failed to enhance instructors:', error)
            process.exit(1)
        })
}

export default addInstructorAuthenticData