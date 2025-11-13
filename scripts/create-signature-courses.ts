import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSignatureCourses() {
  console.log('🎓 Creating Signature Courses for Demo...\n');

  try {
    // Get or create a creator for signature courses
    let creator = await prisma.creator.findFirst({
      where: {
        user: {
          role: 'CREATOR'
        }
      },
      include: {
        user: true
      }
    });

    if (!creator) {
      console.log('Creating a demo creator first...');
      const creatorUser = await prisma.user.create({
        data: {
          email: 'signature.instructor@edtech.com',
          name: 'Dr. Ahmed Hassan',
          arabicName: 'د. أحمد حسن',
          passwordHash: '$2a$10$dummyhashfordemopurposes',
          role: 'CREATOR',
          emailVerified: new Date(),
          bio: 'Expert instructor with 15+ years of experience in technology and business education.',
          profileImage: '/images/instructors/instructor-1.jpg',
        }
      });

      creator = await prisma.creator.create({
        data: {
          userId: creatorUser.id,
          bio: 'Expert instructor specializing in signature courses',
          expertise: JSON.stringify(['Technology', 'Business', 'Leadership', 'Data Science']),
          verified: true,
          rating: 4.9,
          totalStudents: 15000,
          totalCourses: 8,
          earnings: 250000,
        }
      });
    }

    console.log(`✅ Using creator: ${creator.user.name}\n`);

    // Define signature courses
    const signatureCourses = [
      {
        title: 'Full-Stack Web Development Mastery',
        titleAr: 'إتقان تطوير الويب الشامل',
        description: 'Master modern web development from front-end to back-end. Build production-ready applications with React, Node.js, and cloud deployment. Includes comprehensive workbook, weekly cohort sessions, and expert Q&A.',
        descriptionAr: 'أتقن تطوير الويب الحديث من الواجهة الأمامية إلى الخلفية. قم ببناء تطبيقات جاهزة للإنتاج باستخدام React و Node.js والنشر السحابي. يتضمن كتاب عمل شامل وجلسات جماعية أسبوعية وأسئلة الخبراء.',
        thumbnail: '/images/courses/IMG-20251009-WA0078.jpg',
        category: 'Technology',
        categoryAr: 'التكنولوجيا',
        skillLevel: 'Advanced',
        skillLevelAr: 'متقدم',
        duration: 240, // 240 hours
        price: 2999,
        rating: 4.9,
        totalEnrollments: 1250,
        genres: JSON.stringify(['Web Development', 'JavaScript', 'React', 'Node.js']),
        cast: JSON.stringify(['Dr. Ahmed Hassan', 'Senior Engineers']),
        syllabus: {
          modules: [
            {
              title: 'Modern Frontend Development',
              lessons: ['React Fundamentals', 'State Management', 'Component Architecture', 'Testing']
            },
            {
              title: 'Backend Development',
              lessons: ['Node.js & Express', 'Database Design', 'API Development', 'Authentication']
            },
            {
              title: 'DevOps & Deployment',
              lessons: ['Docker', 'CI/CD', 'Cloud Services', 'Monitoring']
            },
            {
              title: 'Capstone Project',
              lessons: ['Project Planning', 'Development Sprint', 'Code Review', 'Deployment']
            }
          ]
        }
      },
      {
        title: 'AI & Machine Learning Engineering',
        titleAr: 'هندسة الذكاء الاصطناعي والتعلم الآلي',
        description: 'Deep dive into AI and Machine Learning with hands-on projects. Learn neural networks, deep learning, and deploy ML models to production. Includes Python workbook, cohort learning, and industry expert sessions.',
        descriptionAr: 'غوص عميق في الذكاء الاصطناعي والتعلم الآلي مع مشاريع عملية. تعلم الشبكات العصبية والتعلم العميق ونشر نماذج التعلم الآلي للإنتاج. يتضمن كتاب عمل Python والتعلم الجماعي وجلسات خبراء الصناعة.',
        thumbnail: '/images/courses/IMG-20251009-WA0079.jpg',
        category: 'Data Science',
        categoryAr: 'علوم البيانات',
        skillLevel: 'Advanced',
        skillLevelAr: 'متقدم',
        duration: 280,
        price: 3499,
        rating: 4.8,
        totalEnrollments: 980,
        genres: JSON.stringify(['AI', 'Machine Learning', 'Python', 'Deep Learning']),
        cast: JSON.stringify(['Dr. Ahmed Hassan', 'AI Researchers']),
        syllabus: {
          modules: [
            {
              title: 'Foundations of ML',
              lessons: ['Python for ML', 'NumPy & Pandas', 'Data Preprocessing', 'Model Evaluation']
            },
            {
              title: 'Deep Learning',
              lessons: ['Neural Networks', 'CNNs', 'RNNs', 'Transfer Learning']
            },
            {
              title: 'Production ML',
              lessons: ['MLOps', 'Model Deployment', 'Monitoring', 'Scaling']
            },
            {
              title: 'Capstone: AI Application',
              lessons: ['Problem Definition', 'Model Development', 'Deployment', 'Presentation']
            }
          ]
        }
      },
      {
        title: 'Digital Marketing Strategy & Analytics',
        titleAr: 'استراتيجية التسويق الرقمي والتحليلات',
        description: 'Comprehensive digital marketing course covering SEO, SEM, social media, and data analytics. Build real campaigns with cohort feedback and expert mentorship. Includes marketing workbook and live campaign analysis.',
        descriptionAr: 'دورة شاملة في التسويق الرقمي تغطي SEO و SEM ووسائل التواصل الاجتماعي وتحليلات البيانات. قم ببناء حملات حقيقية مع ملاحظات المجموعة والتوجيه من الخبراء. يتضمن كتاب عمل التسويق وتحليل الحملات المباشرة.',
        thumbnail: '/images/courses/IMG-20251009-WA0080.jpg',
        category: 'Marketing',
        categoryAr: 'التسويق',
        skillLevel: 'Intermediate',
        skillLevelAr: 'متوسط',
        duration: 180,
        price: 2499,
        rating: 4.7,
        totalEnrollments: 1850,
        genres: JSON.stringify(['Marketing', 'SEO', 'Analytics', 'Social Media']),
        cast: JSON.stringify(['Marketing Experts', 'Industry Leaders']),
        syllabus: {
          modules: [
            {
              title: 'Digital Marketing Foundations',
              lessons: ['Marketing Strategy', 'Customer Journey', 'Brand Positioning', 'Market Research']
            },
            {
              title: 'SEO & Content Marketing',
              lessons: ['SEO Fundamentals', 'Content Strategy', 'Link Building', 'Technical SEO']
            },
            {
              title: 'Paid Advertising',
              lessons: ['Google Ads', 'Facebook Ads', 'Campaign Optimization', 'ROI Analysis']
            },
            {
              title: 'Marketing Analytics',
              lessons: ['Google Analytics', 'Data Visualization', 'A/B Testing', 'Reporting']
            }
          ]
        }
      },
      {
        title: 'UX/UI Design Masterclass',
        titleAr: 'ماستر كلاس تصميم تجربة المستخدم والواجهات',
        description: 'Become a complete UX/UI designer with this hands-on masterclass. Learn user research, wireframing, prototyping, and visual design. Work on real client projects with cohort collaboration and expert feedback.',
        descriptionAr: 'كن مصمم UX/UI متكامل مع هذا الماستر كلاس العملي. تعلم بحث المستخدم والإطارات السلكية والنماذج الأولية والتصميم المرئي. اعمل على مشاريع عملاء حقيقية مع التعاون الجماعي وملاحظات الخبراء.',
        thumbnail: '/images/courses/IMG-20251009-WA0081.jpg',
        category: 'Design',
        categoryAr: 'التصميم',
        skillLevel: 'Intermediate',
        skillLevelAr: 'متوسط',
        duration: 200,
        price: 2799,
        rating: 4.9,
        totalEnrollments: 1420,
        genres: JSON.stringify(['UX Design', 'UI Design', 'Figma', 'Design Thinking']),
        cast: JSON.stringify(['Lead Designers', 'UX Researchers']),
        syllabus: {
          modules: [
            {
              title: 'UX Research & Strategy',
              lessons: ['User Research Methods', 'Personas', 'User Journey Mapping', 'Information Architecture']
            },
            {
              title: 'Wireframing & Prototyping',
              lessons: ['Sketching', 'Wireframing', 'Interactive Prototypes', 'Usability Testing']
            },
            {
              title: 'Visual Design',
              lessons: ['Design Systems', 'Typography', 'Color Theory', 'Responsive Design']
            },
            {
              title: 'Portfolio Project',
              lessons: ['Client Brief', 'Research Phase', 'Design Execution', 'Case Study']
            }
          ]
        }
      },
      {
        title: 'Business Leadership & Management',
        titleAr: 'القيادة والإدارة التنفيذية',
        description: 'Develop executive leadership skills for modern business environments. Learn strategic thinking, team management, and organizational change. Includes case studies, peer learning cohorts, and executive coaching sessions.',
        descriptionAr: 'طور مهارات القيادة التنفيذية لبيئات الأعمال الحديثة. تعلم التفكير الاستراتيجي وإدارة الفريق والتغيير التنظيمي. يتضمن دراسات حالة ومجموعات تعلم الأقران وجلسات تدريب تنفيذية.',
        thumbnail: '/images/courses/IMG-20251009-WA0078.jpg',
        category: 'Business',
        categoryAr: 'الأعمال',
        skillLevel: 'Advanced',
        skillLevelAr: 'متقدم',
        duration: 160,
        price: 3299,
        rating: 4.8,
        totalEnrollments: 890,
        genres: JSON.stringify(['Leadership', 'Management', 'Strategy', 'Business']),
        cast: JSON.stringify(['Business Leaders', 'Executive Coaches']),
        syllabus: {
          modules: [
            {
              title: 'Strategic Leadership',
              lessons: ['Vision & Mission', 'Strategic Planning', 'Decision Making', 'Change Management']
            },
            {
              title: 'Team Management',
              lessons: ['Building Teams', 'Performance Management', 'Conflict Resolution', 'Coaching']
            },
            {
              title: 'Business Operations',
              lessons: ['Process Optimization', 'Financial Management', 'Risk Management', 'Innovation']
            },
            {
              title: 'Leadership Capstone',
              lessons: ['Strategy Project', 'Team Challenge', 'Presentation', 'Peer Review']
            }
          ]
        }
      },
      {
        title: 'Cloud Architecture & DevOps',
        titleAr: 'هندسة السحابة والعمليات التطويرية',
        description: 'Master cloud infrastructure and DevOps practices with AWS, Azure, and Kubernetes. Build scalable, secure systems with cohort-based learning and real-world scenarios. Includes infrastructure workbook and certification prep.',
        descriptionAr: 'أتقن البنية التحتية السحابية وممارسات DevOps مع AWS و Azure و Kubernetes. قم ببناء أنظمة قابلة للتطوير وآمنة مع التعلم الجماعي والسيناريوهات الواقعية. يتضمن كتاب عمل البنية التحتية والإعداد للشهادة.',
        thumbnail: '/images/courses/IMG-20251009-WA0079.jpg',
        category: 'Technology',
        categoryAr: 'التكنولوجيا',
        skillLevel: 'Advanced',
        skillLevelAr: 'متقدم',
        duration: 220,
        price: 3199,
        rating: 4.9,
        totalEnrollments: 765,
        genres: JSON.stringify(['Cloud', 'DevOps', 'AWS', 'Kubernetes']),
        cast: JSON.stringify(['Cloud Architects', 'DevOps Engineers']),
        syllabus: {
          modules: [
            {
              title: 'Cloud Fundamentals',
              lessons: ['Cloud Models', 'AWS Services', 'Azure Overview', 'Cost Optimization']
            },
            {
              title: 'Infrastructure as Code',
              lessons: ['Terraform', 'CloudFormation', 'Ansible', 'Configuration Management']
            },
            {
              title: 'Container Orchestration',
              lessons: ['Docker Advanced', 'Kubernetes', 'Service Mesh', 'Monitoring']
            },
            {
              title: 'Production Systems',
              lessons: ['High Availability', 'Disaster Recovery', 'Security', 'Compliance']
            }
          ]
        }
      },
      {
        title: 'Data Science & Analytics',
        titleAr: 'علوم البيانات والتحليلات',
        description: 'Complete data science journey from statistics to advanced analytics. Master Python, SQL, data visualization, and predictive modeling. Includes hands-on projects, cohort learning, and industry datasets.',
        descriptionAr: 'رحلة كاملة في علوم البيانات من الإحصاء إلى التحليلات المتقدمة. أتقن Python و SQL وتصور البيانات والنمذجة التنبؤية. يتضمن مشاريع عملية والتعلم الجماعي ومجموعات بيانات الصناعة.',
        thumbnail: '/images/courses/IMG-20251009-WA0080.jpg',
        category: 'Data Science',
        categoryAr: 'علوم البيانات',
        skillLevel: 'Intermediate',
        skillLevelAr: 'متوسط',
        duration: 250,
        price: 2899,
        rating: 4.8,
        totalEnrollments: 1340,
        genres: JSON.stringify(['Data Science', 'Python', 'SQL', 'Analytics']),
        cast: JSON.stringify(['Data Scientists', 'Analytics Experts']),
        syllabus: {
          modules: [
            {
              title: 'Data Foundations',
              lessons: ['Statistics', 'Python Basics', 'SQL', 'Data Cleaning']
            },
            {
              title: 'Data Analysis',
              lessons: ['Pandas', 'NumPy', 'Exploratory Analysis', 'Hypothesis Testing']
            },
            {
              title: 'Visualization',
              lessons: ['Matplotlib', 'Seaborn', 'Plotly', 'Dashboards']
            },
            {
              title: 'Predictive Modeling',
              lessons: ['Machine Learning', 'Model Selection', 'Feature Engineering', 'Production']
            }
          ]
        }
      },
      {
        title: 'Cybersecurity & Ethical Hacking',
        titleAr: 'الأمن السيبراني والاختراق الأخلاقي',
        description: 'Learn offensive and defensive security techniques. Master penetration testing, security analysis, and threat mitigation. Includes lab environment, expert Q&A sessions, and certification preparation.',
        descriptionAr: 'تعلم تقنيات الأمان الهجومية والدفاعية. أتقن اختبار الاختراق وتحليل الأمان وتخفيف التهديدات. يتضمن بيئة معمل وجلسات أسئلة الخبراء والإعداد للشهادة.',
        thumbnail: '/images/courses/IMG-20251009-WA0081.jpg',
        category: 'Technology',
        categoryAr: 'التكنولوجيا',
        skillLevel: 'Advanced',
        skillLevelAr: 'متقدم',
        duration: 200,
        price: 3399,
        rating: 4.9,
        totalEnrollments: 680,
        genres: JSON.stringify(['Security', 'Hacking', 'Penetration Testing', 'Network Security']),
        cast: JSON.stringify(['Security Experts', 'Ethical Hackers']),
        syllabus: {
          modules: [
            {
              title: 'Security Fundamentals',
              lessons: ['Security Principles', 'Network Basics', 'Cryptography', 'Security Tools']
            },
            {
              title: 'Penetration Testing',
              lessons: ['Reconnaissance', 'Scanning', 'Exploitation', 'Post-Exploitation']
            },
            {
              title: 'Defensive Security',
              lessons: ['Incident Response', 'Threat Hunting', 'SIEM', 'Forensics']
            },
            {
              title: 'Advanced Topics',
              lessons: ['Web Security', 'Mobile Security', 'Cloud Security', 'IoT Security']
            }
          ]
        }
      }
    ];

    console.log(`📚 Creating ${signatureCourses.length} signature courses...\n`);

    for (const courseData of signatureCourses) {
      const course = await prisma.course.create({
        data: {
          creatorId: creator.id,
          title: courseData.title,
          titleAr: courseData.titleAr,
          description: courseData.description,
          descriptionAr: courseData.descriptionAr,
          thumbnail: courseData.thumbnail,
          category: courseData.category,
          categoryAr: courseData.categoryAr,
          skillLevel: courseData.skillLevel,
          skillLevelAr: courseData.skillLevelAr,
          duration: courseData.duration,
          price: courseData.price,
          contentCategory: 'CATEGORY_B', // Signature courses
          language: 'en',
          status: 'PUBLISHED',
          publishedAt: new Date(),
          rating: courseData.rating,
          totalEnrollments: courseData.totalEnrollments,
          totalViews: courseData.totalEnrollments * 3,
          genres: courseData.genres,
          cast: courseData.cast,
          syllabus: courseData.syllabus,
        }
      });

      // Create workbook for each signature course
      await prisma.signatureCourseWorkbook.create({
        data: {
          courseId: course.id,
          title: `${courseData.title} - Complete Workbook`,
          content: JSON.stringify({
            sections: [
              { title: 'Introduction', pages: 5 },
              { title: 'Exercises', pages: 20 },
              { title: 'Projects', pages: 15 },
              { title: 'Resources', pages: 10 }
            ],
            totalPages: 50
          }),
          version: 1,
        }
      });

      // Create upcoming cohort
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 14); // Starts in 2 weeks
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 90); // 3 months duration

      await prisma.signatureCourseCohort.create({
        data: {
          courseId: course.id,
          name: `${courseData.title} - Fall 2025`,
          startDate,
          endDate,
          maxStudents: 50,
          currentSize: Math.floor(Math.random() * 30) + 10, // 10-40 students enrolled
          status: 'UPCOMING',
          schedule: JSON.stringify({
            weeklyMeetings: 'Tuesdays & Thursdays, 7:00 PM GMT+2',
            duration: '90 minutes per session'
          }),
        }
      });

      console.log(`✅ Created: ${courseData.title}`);
    }

    console.log(`\n🎉 Successfully created ${signatureCourses.length} signature courses!`);
    console.log('📊 Each course includes:');
    console.log('   - Course content with detailed syllabus');
    console.log('   - Comprehensive workbook');
    console.log('   - Upcoming cohort session');
    console.log('\n✨ Ready for demo at /en/signature-courses');

  } catch (error) {
    console.error('❌ Error creating signature courses:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSignatureCourses();
