const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function createComprehensiveDemoCourse() {
    try {
        // Check if demo course already exists
        const existingCourse = await prisma.course.findFirst({
            where: { title: { contains: 'Complete Digital Marketing Mastery' } }
        })

        if (existingCourse) {
            console.log('Deleting existing demo course to create new one...')
            await prisma.lesson.deleteMany({
                where: { courseId: existingCourse.id }
            })
            await prisma.course.delete({
                where: { id: existingCourse.id }
            })
        }

        // Find any existing creator user
        const demoUser = await prisma.user.findFirst({
            where: { role: 'CREATOR' },
            include: { creator: true }
        })

        if (!demoUser) {
            console.log('No creator users found. Please create a creator user first.')
            return
        }

        let demoCreator = demoUser.creator
        if (!demoCreator) {
            demoCreator = await prisma.creator.create({
                data: {
                    userId: demoUser.id,
                    kycStatus: 'VERIFIED',
                    expertise: 'Digital Marketing Expert',
                    teachingGoals: 'Help students master digital marketing skills',
                    contractSigned: true
                }
            })
        }

        // Create comprehensive demo course with mixed content types
        const demoCourse = await prisma.course.create({
            data: {
                title: 'Complete Digital Marketing Mastery',
                titleAr: 'إتقان التسويق الرقمي الشامل',
                description: 'Master digital marketing from fundamentals to advanced strategies. This comprehensive course includes videos, interactive quizzes, hands-on assignments, and extensive reading materials.',
                descriptionAr: 'أتقن التسويق الرقمي من الأساسيات إلى الاستراتيجيات المتقدمة. يتضمن هذا المنهج الشامل مقاطع فيديو واختبارات تفاعلية ومهام عملية ومواد قراءة واسعة.',
                thumbnail: '/images/courses/digital-marketing-course.jpg',
                demoVideoUrl: 'https://sample-videos.com/zip/10/mp4/720/SampleVideo_720x480_1mb.mp4',
                creatorId: demoCreator.id,
                category: 'CATEGORY_A',
                skillLevel: 'Beginner to Advanced',
                duration: 240, // 4 hours
                language: 'Arabic/English',
                price: 299.99,
                syllabus: {
                    modules: [
                        {
                            title: 'Digital Marketing Fundamentals',
                            titleAr: 'أساسيات التسويق الرقمي',
                            lessons: ['Introduction to Digital Marketing', 'Market Research Quiz', 'SWOT Analysis Assignment']
                        },
                        {
                            title: 'Content Marketing & SEO',
                            titleAr: 'تسويق المحتوى وتحسين محركات البحث',
                            lessons: ['Content Strategy Guide', 'SEO Basics Video', 'Keyword Research Assignment']
                        },
                        {
                            title: 'Social Media Marketing',
                            titleAr: 'التسويق عبر وسائل التواصل الاجتماعي',
                            lessons: ['Platform Overview', 'Engagement Strategies', 'Campaign Planning Quiz']
                        }
                    ]
                },
                status: 'PUBLISHED',
                publishedAt: new Date(),
                totalViews: 1250,
                totalEnrollments: 89,
                rating: 4.8
            }
        })

        // Create lessons with different types
        const lessons = [
            // Module 1: Digital Marketing Fundamentals
            {
                title: 'Introduction to Digital Marketing',
                titleAr: 'مقدمة في التسويق الرقمي',
                description: 'Learn the fundamentals of digital marketing and understand the digital landscape.',
                type: 'video',
                videoUrl: 'https://sample-videos.com/zip/10/mp4/720/SampleVideo_720x480_1mb.mp4',
                duration: 15 * 60, // 15 minutes
                order: 1,
                objectives: [
                    { text: 'Understand digital marketing basics', textAr: 'فهم أساسيات التسويق الرقمي' },
                    { text: 'Learn about different digital channels', textAr: 'تعلم عن القنوات الرقمية المختلفة' }
                ],
                resources: [
                    {
                        title: 'Digital Marketing Guide PDF',
                        titleAr: 'دليل التسويق الرقمي PDF',
                        type: 'pdf',
                        url: '/documents/digital-marketing-guide.pdf',
                        description: 'Comprehensive guide to digital marketing'
                    }
                ]
            },
            {
                title: 'Market Research Fundamentals',
                titleAr: 'أساسيات بحوث السوق',
                description: 'Deep dive into market research techniques and methodologies.',
                type: 'reading',
                duration: 20 * 60, // 20 minutes
                order: 2,
                reading: {
                    content: `
                        <h2>Understanding Market Research</h2>
                        <p>Market research is the process of gathering, analyzing, and interpreting information about a market, a product or service to be offered for sale in that market, and about the past, present and potential customers for the product or service.</p>
                        
                        <h3>Types of Market Research</h3>
                        <ul>
                            <li><strong>Primary Research:</strong> Original research conducted for a specific purpose</li>
                            <li><strong>Secondary Research:</strong> Analysis of existing data and studies</li>
                            <li><strong>Qualitative Research:</strong> Understanding motivations and opinions</li>
                            <li><strong>Quantitative Research:</strong> Numerical data and statistical analysis</li>
                        </ul>

                        <h3>Research Methods</h3>
                        <p>There are various methods to conduct market research:</p>
                        <ul>
                            <li>Surveys and questionnaires</li>
                            <li>Focus groups</li>
                            <li>Interviews</li>
                            <li>Observation studies</li>
                            <li>Online analytics</li>
                        </ul>

                        <h3>Key Benefits</h3>
                        <p>Market research provides numerous benefits including risk reduction, trend identification, customer insights, and competitive analysis.</p>

                        <h3>Best Practices</h3>
                        <p>Always define clear objectives, choose the right methodology, ensure sample representativeness, and validate your findings through multiple sources.</p>
                    `,
                    contentAr: `
                        <h2>فهم بحوث السوق</h2>
                        <p>بحوث السوق هي عملية جمع وتحليل وتفسير المعلومات حول السوق والمنتج أو الخدمة المقدمة للبيع في ذلك السوق.</p>
                        
                        <h3>أنواع بحوث السوق</h3>
                        <ul>
                            <li><strong>البحث الأولي:</strong> بحث أصلي يُجرى لغرض محدد</li>
                            <li><strong>البحث الثانوي:</strong> تحليل البيانات والدراسات الموجودة</li>
                            <li><strong>البحث النوعي:</strong> فهم الدوافع والآراء</li>
                            <li><strong>البحث الكمي:</strong> البيانات الرقمية والتحليل الإحصائي</li>
                        </ul>

                        <h3>طرق البحث</h3>
                        <p>هناك طرق مختلفة لإجراء بحوث السوق:</p>
                        <ul>
                            <li>الاستبيانات والاستطلاعات</li>
                            <li>مجموعات التركيز</li>
                            <li>المقابلات</li>
                            <li>دراسات الملاحظة</li>
                            <li>التحليلات الرقمية</li>
                        </ul>
                    `,
                    estimatedReadingTime: 20,
                    keyPoints: [
                        { text: 'Market research reduces business risks', textAr: 'بحوث السوق تقلل مخاطر العمل' },
                        { text: 'Both qualitative and quantitative methods are important', textAr: 'الطرق النوعية والكمية مهمة معاً' },
                        { text: 'Clear objectives lead to better results', textAr: 'الأهداف الواضحة تؤدي لنتائج أفضل' }
                    ],
                    resources: [
                        {
                            title: 'Market Research Templates',
                            titleAr: 'قوالب بحوث السوق',
                            url: '/documents/market-research-templates.pdf',
                            type: 'pdf',
                            description: 'Ready-to-use templates for market research'
                        }
                    ]
                }
            },
            {
                title: 'Market Research Knowledge Check',
                titleAr: 'اختبار معرفة بحوث السوق',
                description: 'Test your understanding of market research concepts.',
                type: 'quiz',
                duration: 10 * 60, // 10 minutes
                order: 3,
                quiz: {
                    questions: [
                        {
                            id: 'q1',
                            question: 'What is the main purpose of market research?',
                            questionAr: 'ما هو الهدف الرئيسي من بحوث السوق؟',
                            type: 'multiple-choice',
                            options: [
                                {
                                    id: 'a',
                                    text: 'To increase sales immediately',
                                    textAr: 'لزيادة المبيعات فوراً',
                                    isCorrect: false
                                },
                                {
                                    id: 'b',
                                    text: 'To gather information for better decision making',
                                    textAr: 'لجمع المعلومات لاتخاذ قرارات أفضل',
                                    isCorrect: true
                                },
                                {
                                    id: 'c',
                                    text: 'To copy competitors',
                                    textAr: 'لتقليد المنافسين',
                                    isCorrect: false
                                },
                                {
                                    id: 'd',
                                    text: 'To reduce marketing costs',
                                    textAr: 'لتقليل تكاليف التسويق',
                                    isCorrect: false
                                }
                            ],
                            explanation: 'Market research helps businesses gather valuable information to make informed decisions about their products, services, and strategies.',
                            explanationAr: 'تساعد بحوث السوق الشركات على جمع معلومات قيمة لاتخاذ قرارات مدروسة حول منتجاتها وخدماتها واستراتيجياتها.'
                        },
                        {
                            id: 'q2',
                            question: 'Which of the following is a primary research method?',
                            questionAr: 'أي مما يلي هو طريقة بحث أولية؟',
                            type: 'multiple-choice',
                            options: [
                                {
                                    id: 'a',
                                    text: 'Reading industry reports',
                                    textAr: 'قراءة تقارير الصناعة',
                                    isCorrect: false
                                },
                                {
                                    id: 'b',
                                    text: 'Conducting surveys',
                                    textAr: 'إجراء الاستطلاعات',
                                    isCorrect: true
                                },
                                {
                                    id: 'c',
                                    text: 'Analyzing government data',
                                    textAr: 'تحليل البيانات الحكومية',
                                    isCorrect: false
                                },
                                {
                                    id: 'd',
                                    text: 'Studying competitor websites',
                                    textAr: 'دراسة مواقع المنافسين',
                                    isCorrect: false
                                }
                            ],
                            explanation: 'Primary research involves collecting original data directly from sources, such as through surveys, interviews, or observations.',
                            explanationAr: 'البحث الأولي يتضمن جمع البيانات الأصلية مباشرة من المصادر، مثل الاستطلاعات أو المقابلات أو المراقبة.'
                        },
                        {
                            id: 'q3',
                            question: 'Qualitative research focuses on understanding numbers and statistics.',
                            questionAr: 'البحث النوعي يركز على فهم الأرقام والإحصائيات.',
                            type: 'true-false',
                            correctAnswer: 'false',
                            explanation: 'Qualitative research focuses on understanding motivations, opinions, and behaviors, while quantitative research deals with numbers and statistics.',
                            explanationAr: 'البحث النوعي يركز على فهم الدوافع والآراء والسلوكيات، بينما البحث الكمي يتعامل مع الأرقام والإحصائيات.'
                        }
                    ],
                    passingScore: 70
                }
            },
            {
                title: 'SWOT Analysis Assignment',
                titleAr: 'مهمة تحليل نقاط القوة والضعف والفرص والتهديدات',
                description: 'Create a comprehensive SWOT analysis for a business of your choice.',
                type: 'assignment',
                duration: 45 * 60, // 45 minutes
                order: 4,
                assignment: {
                    title: 'SWOT Analysis Assignment',
                    titleAr: 'مهمة تحليل SWOT',
                    description: 'Conduct a thorough SWOT analysis for a real or fictional business.',
                    descriptionAr: 'قم بإجراء تحليل SWOT شامل لشركة حقيقية أو خيالية.',
                    instructions: `Create a comprehensive SWOT analysis that includes:

1. **Strengths**: Internal positive factors that give the business an advantage
2. **Weaknesses**: Internal negative factors that put the business at a disadvantage  
3. **Opportunities**: External positive factors that could benefit the business
4. **Threats**: External negative factors that could harm the business

**Requirements:**
- Choose a business (can be real or fictional)
- Provide at least 3-5 points for each SWOT category
- Include brief explanations for each point
- Suggest 2-3 strategic recommendations based on your analysis
- Format your submission clearly with headings

**Evaluation Criteria:**
- Accuracy of SWOT categorization (25%)
- Depth of analysis (25%)
- Quality of strategic recommendations (25%)
- Presentation and formatting (25%)`,
                    instructionsAr: `قم بإنشاء تحليل SWOT شامل يتضمن:

1. **نقاط القوة**: العوامل الداخلية الإيجابية التي تمنح الشركة ميزة
2. **نقاط الضعف**: العوامل الداخلية السلبية التي تضع الشركة في وضع غير مواتٍ
3. **الفرص**: العوامل الخارجية الإيجابية التي يمكن أن تفيد الشركة
4. **التهديدات**: العوامل الخارجية السلبية التي يمكن أن تضر بالشركة

**المتطلبات:**
- اختر شركة (يمكن أن تكون حقيقية أو خيالية)
- قدم 3-5 نقاط على الأقل لكل فئة من فئات SWOT
- قدم شروحاً موجزة لكل نقطة
- اقترح 2-3 توصيات استراتيجية بناءً على تحليلك
- قم بتنسيق مقدمتك بوضوح مع العناوين`,
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
                    maxPoints: 100,
                    allowedFileTypes: ['pdf', 'doc', 'docx', 'txt'],
                    maxFileSize: 10, // 10MB
                    resources: [
                        {
                            title: 'SWOT Analysis Template',
                            titleAr: 'قالب تحليل SWOT',
                            url: '/documents/swot-template.pdf',
                            type: 'pdf'
                        },
                        {
                            title: 'SWOT Analysis Examples',
                            titleAr: 'أمثلة على تحليل SWOT',
                            url: '/documents/swot-examples.pdf',
                            type: 'pdf'
                        }
                    ]
                }
            },
            // Module 2: Content Marketing & SEO
            {
                title: 'Content Marketing Strategy',
                titleAr: 'استراتيجية تسويق المحتوى',
                description: 'Learn how to develop an effective content marketing strategy.',
                type: 'video',
                videoUrl: 'https://sample-videos.com/zip/10/mp4/720/SampleVideo_720x480_1mb.mp4',
                duration: 18 * 60, // 18 minutes
                order: 5,
                objectives: [
                    { text: 'Define content marketing strategy', textAr: 'تعريف استراتيجية تسويق المحتوى' },
                    { text: 'Learn content planning techniques', textAr: 'تعلم تقنيات تخطيط المحتوى' }
                ]
            },
            {
                title: 'SEO Fundamentals',
                titleAr: 'أساسيات تحسين محركات البحث',
                description: 'Master the basics of Search Engine Optimization.',
                type: 'video',
                videoUrl: 'https://sample-videos.com/zip/10/mp4/720/SampleVideo_720x480_1mb.mp4',
                duration: 22 * 60, // 22 minutes
                order: 6,
                objectives: [
                    { text: 'Understand SEO principles', textAr: 'فهم مبادئ تحسين محركات البحث' },
                    { text: 'Learn keyword research', textAr: 'تعلم بحث الكلمات المفتاحية' }
                ]
            },
            // Module 3: Social Media Marketing
            {
                title: 'Social Media Platforms Overview',
                titleAr: 'نظرة عامة على منصات وسائل التواصل الاجتماعي',
                description: 'Understand different social media platforms and their audiences.',
                type: 'reading',
                duration: 25 * 60, // 25 minutes
                order: 7,
                reading: {
                    content: `
                        <h2>Social Media Platform Overview</h2>
                        <p>Understanding different social media platforms is crucial for effective digital marketing. Each platform has its unique characteristics, audience demographics, and content formats.</p>
                        
                        <h3>Facebook</h3>
                        <p>The largest social media platform with diverse demographics. Great for community building, advertising, and content sharing.</p>
                        
                        <h3>Instagram</h3>
                        <p>Visual-focused platform popular among younger audiences. Perfect for lifestyle brands, visual storytelling, and influencer marketing.</p>
                        
                        <h3>Twitter</h3>
                        <p>Real-time communication platform ideal for news, customer service, and thought leadership.</p>
                        
                        <h3>LinkedIn</h3>
                        <p>Professional networking platform excellent for B2B marketing, recruitment, and industry expertise sharing.</p>

                        <h3>TikTok</h3>
                        <p>Short-form video platform with explosive growth, particularly popular among Gen Z users.</p>
                    `,
                    contentAr: `
                        <h2>نظرة عامة على منصات وسائل التواصل الاجتماعي</h2>
                        <p>فهم منصات وسائل التواصل الاجتماعي المختلفة أمر بالغ الأهمية للتسويق الرقمي الفعال.</p>
                        
                        <h3>فيسبوك</h3>
                        <p>أكبر منصة وسائل التواصل الاجتماعي مع تنوع ديموغرافي. رائعة لبناء المجتمع والإعلان ومشاركة المحتوى.</p>
                    `,
                    estimatedReadingTime: 25,
                    keyPoints: [
                        { text: 'Each platform has unique audience characteristics', textAr: 'كل منصة لها خصائص جمهور فريدة' },
                        { text: 'Content format varies by platform', textAr: 'تنسيق المحتوى يختلف حسب المنصة' }
                    ]
                }
            },
            {
                title: 'Social Media Strategy Quiz',
                titleAr: 'اختبار استراتيجية وسائل التواصل الاجتماعي',
                description: 'Test your knowledge of social media marketing strategies.',
                type: 'quiz',
                duration: 15 * 60, // 15 minutes
                order: 8,
                quiz: {
                    questions: [
                        {
                            id: 'q1',
                            question: 'Which platform is best for B2B marketing?',
                            questionAr: 'أي منصة هي الأفضل للتسويق بين الشركات؟',
                            type: 'multiple-choice',
                            options: [
                                { id: 'a', text: 'Instagram', textAr: 'إنستغرام', isCorrect: false },
                                { id: 'b', text: 'TikTok', textAr: 'تيك توك', isCorrect: false },
                                { id: 'c', text: 'LinkedIn', textAr: 'لينكد إن', isCorrect: true },
                                { id: 'd', text: 'Snapchat', textAr: 'سناب شات', isCorrect: false }
                            ],
                            explanation: 'LinkedIn is the premier professional networking platform, making it ideal for B2B marketing and reaching decision-makers.',
                            explanationAr: 'لينكد إن هو منصة التواصل المهني الرائدة، مما يجعله مثالياً للتسويق بين الشركات والوصول لصناع القرار.'
                        }
                    ],
                    passingScore: 80
                }
            }
        ]

        // Create all lessons
        for (const lessonData of lessons) {
            await prisma.lesson.create({
                data: {
                    courseId: demoCourse.id,
                    title: lessonData.title,
                    titleAr: lessonData.titleAr,
                    description: lessonData.description,
                    videoUrl: lessonData.videoUrl || '',
                    duration: lessonData.duration,
                    order: lessonData.order,
                    resources: lessonData.resources ? JSON.stringify(lessonData.resources) : null,
                    transcript: lessonData.transcript || null
                }
            })
        }

        console.log('✅ Comprehensive demo course created successfully!')
        console.log(`Course ID: ${demoCourse.id}`)
        console.log(`Course Title: ${demoCourse.title}`)
        console.log(`Total Lessons: ${lessons.length}`)
        console.log(`Lesson Types: Video (${lessons.filter(l => l.type === 'video').length}), Quiz (${lessons.filter(l => l.type === 'quiz').length}), Assignment (${lessons.filter(l => l.type === 'assignment').length}), Reading (${lessons.filter(l => l.type === 'reading').length})`)
        console.log(`Access URL: http://localhost:3000/courses/${demoCourse.id}/learn-udemy`)
        console.log(`Demo subscription: http://localhost:3000/subscribe/demo`)

    } catch (error) {
        console.error('Error creating demo course:', error)
    } finally {
        await prisma.$disconnect()
    }
}

createComprehensiveDemoCourse()
