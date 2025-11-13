import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        // Check if this is a mock course ID
        if (id.startsWith('cm2k3x8y1')) {
            // Return mock course data for demo purposes
            const mockCourseMap: { [key: string]: any } = {
                'cm2k3x8y10000z8pq1k2m3n4p': {
                    title: 'Complete Web Development Bootcamp',
                    description: 'Master modern web development from scratch with HTML, CSS, JavaScript, React, Node.js and more',
                    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400',
                },
                'cm2k3x8y10001z8pq5r6s7t8u': {
                    title: 'Advanced React & TypeScript',
                    description: 'Build scalable enterprise applications with React 18, TypeScript, Redux Toolkit and best practices',
                    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400',
                },
                'cm2k3x8y10002z8pq9v0w1x2y': {
                    title: 'Python for Data Science',
                    description: 'Master Python programming for data analysis, visualization, and machine learning with pandas, numpy',
                    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=400',
                },
                'cm2k3x8y10003z8pq3z4a5b6c': {
                    title: 'Full Stack JavaScript Development',
                    description: 'Learn MERN stack development with MongoDB, Express.js, React, and Node.js',
                    thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400',
                },
                'cm2k3x8y10004z8pq7d8e9f0g': {
                    title: 'Mobile App Development with React Native',
                    description: 'Build cross-platform mobile apps for iOS and Android using React Native',
                    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400',
                },
                'cm2k3x8y10005z8pq1h2i3j4k': {
                    title: 'Cloud Computing with AWS',
                    description: 'Master Amazon Web Services, deploy scalable applications, and get AWS certified',
                    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400',
                },
                'cm2k3x8y10006z8pq5l6m7n8o': {
                    title: 'Business Strategy Masterclass',
                    description: 'Learn strategic business planning, competitive analysis, and growth strategies from industry experts',
                    thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400',
                },
                'cm2k3x8y10007z8pq9p0q1r2s': {
                    title: 'Financial Management & Analysis',
                    description: 'Master corporate finance, financial statements, budgeting, and investment analysis',
                    thumbnail: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400',
                },
                'cm2k3x8y10008z8pq3t4u5v6w': {
                    title: 'Entrepreneurship & Startup Fundamentals',
                    description: 'Launch your startup with business planning, funding strategies, and growth tactics',
                    thumbnail: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400',
                },
                'cm2k3x8y10009z8pq7x8y9z0a': {
                    title: 'Project Management Professional',
                    description: 'Master project management methodologies, Agile, Scrum, and prepare for PMP certification',
                    thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400',
                },
                'cm2k3x8y10010z8pq1b2c3d4e': {
                    title: 'Leadership & Management Skills',
                    description: 'Develop essential leadership skills, team management, and organizational behavior',
                    thumbnail: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400',
                },
                'cm2k3x8y10011z8pq5f6g7h8i': {
                    title: 'UI/UX Design Fundamentals',
                    description: 'Create beautiful user experiences with design thinking, wireframing, prototyping and user testing',
                    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400',
                },
                'cm2k3x8y10012z8pq9j0k1l2m': {
                    title: 'Graphic Design Masterclass',
                    description: 'Master Adobe Creative Suite: Photoshop, Illustrator, InDesign for professional design',
                    thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400',
                },
                'cm2k3x8y10013z8pq3n4o5p6q': {
                    title: 'Motion Graphics & Animation',
                    description: 'Create stunning animations with After Effects, Premiere Pro, and motion design principles',
                    thumbnail: 'https://images.unsplash.com/photo-1626785774625-ddcddc3445e9?w=400',
                },
                'cm2k3x8y10014z8pq7r8s9t0u': {
                    title: '3D Design with Blender',
                    description: 'Master 3D modeling, texturing, lighting, and rendering with Blender',
                    thumbnail: 'https://images.unsplash.com/photo-1633409361554-e97b0219fbc8?w=400',
                },
                'cm2k3x8y10015z8pq1v2w3x4y': {
                    title: 'Web Design & Figma',
                    description: 'Design modern websites and mobile apps using Figma, design systems, and prototyping',
                    thumbnail: 'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=400',
                },
                'cm2k3x8y10016z8pq5z6a7b8c': {
                    title: 'Digital Marketing Complete Guide',
                    description: 'Master digital marketing strategies including SEO, social media, email marketing and analytics',
                    thumbnail: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400',
                },
                'cm2k3x8y10017z8pq9d0e1f2g': {
                    title: 'SEO & Content Marketing',
                    description: 'Boost your online presence with search engine optimization and content strategy',
                    thumbnail: 'https://images.unsplash.com/photo-1432888622747-4eb9a8f2c293?w=400',
                },
                'cm2k3x8y10018z8pq3h4i5j6k': {
                    title: 'Social Media Marketing Mastery',
                    description: 'Grow your brand on Facebook, Instagram, Twitter, TikTok, and LinkedIn',
                    thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400',
                },
                'cm2k3x8y10019z8pq7l8m9n0o': {
                    title: 'Email Marketing & Automation',
                    description: 'Build email campaigns, automate workflows, and increase conversions',
                    thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400',
                },
                'cm2k3x8y10020z8pq1p2q3r4s': {
                    title: 'Growth Hacking & Analytics',
                    description: 'Learn data-driven marketing, A/B testing, conversion optimization, and growth strategies',
                    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400',
                },
            };

            const mockData = mockCourseMap[id];
            if (mockData) {
                return NextResponse.json({
                    id,
                    ...mockData,
                    status: 'PUBLISHED',
                    contentType: 'SERIES',
                    rating: 4.8,
                    totalEnrollments: 10000,
                    totalSeasons: 2,
                    totalEpisodes: 12,
                    releaseYear: 2024,
                    maturityRating: 'All Ages',
                    genres: JSON.stringify(['Education', 'Technology']),
                    cast: JSON.stringify(['Expert Instructor', 'Industry Professional']),
                    trailer: '/videos/demo/course-promo.mp4',
                    lessons: [], // Will be populated by the frontend
                    creator: {
                        user: {
                            id: 'mock-creator',
                            name: 'Expert Instructor',
                            arabicName: 'مدرب خبير',
                            email: 'instructor@example.com',
                            bio: 'Industry expert with 10+ years of experience',
                            profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400',
                        }
                    },
                    currency: 'EGP',
                });
            }
        }
        
        const course = await prisma.course.findUnique({
            where: {
                id: id,
                status: 'PUBLISHED',
            },
            include: {
                lessons: {
                    orderBy: {
                        order: 'asc',
                    },
                    select: {
                        id: true,
                        title: true,
                        titleAr: true,
                        description: true,
                        descriptionAr: true,
                        order: true,
                        duration: true,
                        seasonNumber: true,
                        episodeNumber: true,
                        videoUrl: true,
                    },
                },
                creator: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                arabicName: true,
                                email: true,
                                bio: true,
                                profileImage: true,
                            },
                        },
                    },
                },
            },
        })

        if (!course) {
            return NextResponse.json({ error: 'Course not found' }, { status: 404 })
        }

        // Transform course data for the frontend
        const transformedCourse = {
            ...course,
            currency: 'EGP',
        }

        return NextResponse.json(transformedCourse)
    } catch (error) {
        console.error('Course fetch error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch course' },
            { status: 500 }
        )
    }
}
