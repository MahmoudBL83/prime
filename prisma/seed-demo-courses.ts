import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding demo courses...')

  // Create a demo user if doesn't exist
  let demoUser = await prisma.user.findFirst({
    where: { email: 'demo@example.com' }
  })

  if (!demoUser) {
    demoUser = await prisma.user.create({
      data: {
        email: 'demo@example.com',
        passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: "password"
        name: 'Demo User',
        arabicName: 'مستخدم تجريبي',
        skillLevel: 'Intermediate',
        interests: 'Web Development, Mobile Apps',
        goals: 'Learn new technologies, Build projects'
      }
    })
    console.log('✅ Created demo user')
  }

  // Create a demo creator
  let demoCreator = await prisma.creator.findFirst({
    where: { userId: demoUser.id }
  })

  if (!demoCreator) {
    demoCreator = await prisma.creator.create({
      data: {
        userId: demoUser.id,
        kycStatus: 'VERIFIED',
        expertise: 'Web Development, React, Node.js',
        teachingGoals: 'Help students learn modern web development',
        contractSigned: true,
        contractSignedAt: new Date()
      }
    })
    console.log('✅ Created demo creator')
  }

  // Demo Course 1: Advanced React Development
  const reactCourse = await prisma.course.create({
    data: {
      title: 'Advanced React Development: From Basics to Mastery',
      titleAr: 'تطوير ريكت المتقدم: من الأساسيات إلى الإتقان',
      description: 'Master React with this comprehensive course covering hooks, context, performance optimization, and modern patterns. Build real-world projects and deploy to production.',
      descriptionAr: 'أتقن ريكت مع هذه الدورة الشاملة التي تغطي الخطافات والسياق وتحسين الأداء والأنماط الحديثة. قم ببناء مشاريع حقيقية وانشرها في الإنتاج.',
      creatorId: demoCreator!.id,
      category: 'CATEGORY_A',
      skillLevel: 'Intermediate',
      duration: 480, // 8 hours
      language: 'English,Arabic',
      price: 200,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop',
      syllabus: JSON.stringify([
        {
          title: 'React Fundamentals',
          titleAr: 'أساسيات ريكت',
          lessons: [
            'Introduction to React',
            'Components and Props',
            'State and Lifecycle',
            'Handling Events'
          ]
        },
        {
          title: 'Advanced React Patterns',
          titleAr: 'أنماط ريكت المتقدمة',
          lessons: [
            'React Hooks Deep Dive',
            'Context API',
            'Custom Hooks',
            'Error Boundaries'
          ]
        },
        {
          title: 'Performance Optimization',
          titleAr: 'تحسين الأداء',
          lessons: [
            'React.memo and useMemo',
            'Code Splitting',
            'Lazy Loading',
            'Production Builds'
          ]
        }
      ])
    }
  })

  // Create lessons for React course
  const reactLessons = await Promise.all([
    prisma.lesson.create({
      data: {
        title: 'Introduction to React and Modern Web Development',
        titleAr: 'مقدمة في ريكت وتطوير الويب الحديث',
        description: 'Learn what React is, why it\'s popular, and set up your development environment.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        duration: 930, // 15:30
        order: 0,
        courseId: reactCourse.id,
        resources: JSON.stringify([
          {
            id: '1',
            title: 'React Documentation',
            titleAr: 'وثائق ريكت',
            type: 'link',
            url: 'https://reactjs.org',
            description: 'Official React documentation'
          },
          {
            id: '2',
            title: 'Development Setup Guide',
            titleAr: 'دليل إعداد التطوير',
            type: 'pdf',
            url: '/files/react-setup.pdf',
            size: '2.4 MB',
            description: 'Step-by-step setup instructions'
          }
        ]),
        transcript: `Welcome to Advanced React Development! In this first lesson, we'll explore what makes React so powerful and why it has become the go-to library for modern web development.

React is a JavaScript library for building user interfaces, particularly single-page applications where data changes over time. It was created by Facebook and has since become one of the most popular frontend frameworks.

What makes React special? Let's break it down:

1. **Component-Based Architecture**: React lets you build encapsulated components that manage their own state, then compose them to make complex UIs.

2. **Virtual DOM**: React uses a virtual DOM to improve performance. Instead of manipulating the browser's DOM directly, React creates a virtual representation in memory and syncs it with the real DOM.

3. **Unidirectional Data Flow**: Data flows down from parent to child components via props, making your app more predictable and easier to debug.

4. **JSX**: React uses JSX, a syntax extension that lets you write HTML-like code in JavaScript, making your components more readable and expressive.

In this course, we'll start with the fundamentals and gradually work our way up to advanced topics like hooks, context, performance optimization, and modern React patterns.

By the end of this course, you'll be able to:
- Build complex React applications from scratch
- Use React hooks effectively
- Optimize React applications for performance
- Implement modern React patterns and best practices
- Deploy React applications to production

Let's get started on this exciting journey into React development!`
      }
    }),
    prisma.lesson.create({
      data: {
        title: 'React Components and Props: Building Blocks of UI',
        titleAr: 'مكونات ريكت والخصائص: لبنات بناء واجهة المستخدم',
        description: 'Deep dive into React components, functional vs class components, and how to pass data with props.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        duration: 1260, // 21:00
        order: 1,
        courseId: reactCourse.id,
        resources: JSON.stringify([
          {
            id: '3',
            title: 'Component Examples',
            titleAr: 'أمثلة المكونات',
            type: 'link',
            url: 'https://reactjs.org/docs/components-and-props.html',
            description: 'Official component documentation'
          },
          {
            id: '4',
            title: 'Props Cheatsheet',
            titleAr: 'ورقة غش للخصائص',
            type: 'pdf',
            url: '/files/props-cheatsheet.pdf',
            size: '1.2 MB',
            description: 'Quick reference for props usage'
          }
        ]),
        transcript: `In this lesson, we're going to explore the fundamental building blocks of React: components and props.

Components are the heart and soul of React. A component is a JavaScript function or class that optionally accepts inputs called props and returns a React element that describes how a section of the UI should appear.

There are two types of components in React:

1. **Functional Components**: These are simply JavaScript functions that accept props and return React elements. They're simpler and easier to test.

2. **Class Components**: These are ES6 classes that extend React.Component and have a render method that returns React elements. They can have state and lifecycle methods.

Let's look at a functional component:

function Welcome(props) {
  return <h1>Hello, {props.name}</h1>;
}

And here's the same component as a class:

class Welcome extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}

Props (short for properties) are how components talk to each other. They're read-only and allow you to pass data from a parent component to a child component.

Key points about props:
- Props are immutable (read-only)
- Props allow components to be reusable
- Props can be any JavaScript value (strings, numbers, objects, arrays, functions)
- Props enable the composition of complex UIs from simple components

When building React applications, you'll spend most of your time creating and composing components. The key is to think of your UI as a tree of components, where each component is responsible for a specific piece of the interface.

In the next lesson, we'll dive deeper into state and lifecycle methods, which will give our components the ability to change over time and respond to user interactions.`
      }
    }),
    prisma.lesson.create({
      data: {
        title: 'State and Lifecycle: Making Components Dynamic',
        titleAr: 'الحالة ودورة الحياة: جعل المكونات ديناميكية',
        description: 'Learn how to add state to components and understand the component lifecycle methods.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        duration: 1380, // 23:00
        order: 2,
        courseId: reactCourse.id,
        resources: JSON.stringify([
          {
            id: '5',
            title: 'State Management Guide',
            titleAr: 'دليل إدارة الحالة',
            type: 'pdf',
            url: '/files/state-management.pdf',
            size: '3.1 MB',
            description: 'Comprehensive guide to React state'
          }
        ]),
        transcript: `Now we're getting to one of the most important concepts in React: state and lifecycle.

While props allow components to talk to each other, state allows components to talk to themselves. State is data that changes over time, usually in response to user actions.

State has several important characteristics:
- State is mutable (can be changed)
- State is private to the component
- Changes to state trigger re-renders
- State should be updated using the setState method

Let's look at a simple counter component with state:

class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
  }

  render() {
    return (
      <div>
        <p>You clicked {this.state.count} times</p>
        <button onClick={() => this.setState({ count: this.state.count + 1 })}>
          Click me
        </button>
      </div>
    );
  }
}

Lifecycle methods are special methods that get called at different points in a component's life. The most important ones are:

1. **componentDidMount**: Called after the component is rendered to the DOM
2. **componentDidUpdate**: Called after the component updates
3. **componentWillUnmount**: Called before the component is removed from the DOM

These methods allow you to run code at specific times, like fetching data when a component mounts or cleaning up when it unmounts.

Understanding state and lifecycle is crucial because:
- It makes your components dynamic and interactive
- It allows you to manage side effects (API calls, subscriptions)
- It helps you optimize performance by controlling when components update
- It's essential for building complex applications

In modern React, we often use hooks (useState, useEffect) instead of class-based state and lifecycle methods, but understanding these concepts is still fundamental to how React works under the hood.

Next up, we'll explore event handling in React and see how to make our components truly interactive!`
      }
    }),
    prisma.lesson.create({
      data: {
        title: 'Handling Events and User Interactions',
        titleAr: 'معالجة الأحداث وتفاعلات المستخدم',
        description: 'Master event handling in React and create truly interactive user interfaces.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        duration: 1020, // 17:00
        order: 3,
        courseId: reactCourse.id,
        resources: JSON.stringify([
          {
            id: '6',
            title: 'Event Handling Examples',
            titleAr: 'أمثلة معالجة الأحداث',
            type: 'link',
            url: 'https://reactjs.org/docs/handling-events.html',
            description: 'Official event handling documentation'
          }
        ]),
        transcript: `Events are what make web applications interactive. In React, handling events is similar to handling events in regular JavaScript, but with some important differences.

The main differences in React event handling are:
1. Events are named using camelCase (onClick, onMouseOver)
2. You pass a function as the event handler
3. You can't return false to prevent default behavior (must call preventDefault explicitly)

Let's look at a simple button click handler:

function ActionLink() {
  function handleClick(e) {
    e.preventDefault();
    console.log('The link was clicked.');
  }

  return (
    <a href="#" onClick={handleClick}>
      Click me
    </a>
  );
}

Common events you'll work with:
- onClick: Mouse clicks
- onChange: Form input changes
- onSubmit: Form submissions
- onKeyDown/onKeyUp: Keyboard events
- onMouseOver/onMouseOut: Mouse hover events

When working with forms in React, you'll often use controlled components. A controlled component is an input form element whose value is controlled by React:

class NameForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: '' };
  }

  handleChange(event) {
    this.setState({ value: event.target.value });
  }

  handleSubmit(event) {
    alert('A name was submitted: ' + this.state.value);
    event.preventDefault();
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          Name:
          <input type="text" value={this.state.value} onChange={this.handleChange} />
        </label>
        <input type="submit" value="Submit" />
      </form>
    );
  }
}

Key best practices for event handling:
1. Use arrow functions or bind this in class components
2. Keep event handlers simple and focused
3. Use controlled components for forms
4. Prevent default behavior explicitly when needed
5. Consider performance for frequently firing events (like scroll or resize)

Event handling is crucial because:
- It's how users interact with your application
- It enables dynamic UI updates
- It's essential for form handling and user input
- It allows you to create responsive and engaging user experiences

In the next module, we'll dive into React Hooks, which will revolutionize how we write React components!`
      }
    })
  ])

  // Demo Course 2: Node.js Backend Development
  const nodeCourse = await prisma.course.create({
    data: {
      title: 'Node.js Backend Development',
      titleAr: 'تطوير الواجهة الخلفية Node.js',
      description: 'Build scalable backend applications with Node.js, Express, and MongoDB.',
      descriptionAr: 'ابني تطبيقات الواجهة الخلفية القابلة للتوسع مع Node.js و Express و MongoDB.',
      creatorId: demoCreator!.id,
      category: 'CATEGORY_A',
      skillLevel: 'Intermediate',
      duration: 360, // 6 hours
      language: 'English,Arabic',
      price: 180,
      status: 'PUBLISHED',
      publishedAt: new Date(),
      thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=450&fit=crop',
      syllabus: JSON.stringify([
        {
          title: 'Node.js Fundamentals',
          titleAr: 'أساسيات Node.js',
          lessons: [
            'Introduction to Node.js',
            'NPM and Package Management',
            'Modules and Require',
            'Event Loop'
          ]
        },
        {
          title: 'Express Framework',
          titleAr: 'إطار العمل Express',
          lessons: [
            'Setting Up Express',
            'Routing and Middleware',
            'RESTful APIs',
            'Error Handling'
          ]
        }
      ])
    }
  })

  // Create lessons for Node.js course
  await Promise.all([
    prisma.lesson.create({
      data: {
        title: 'Introduction to Node.js and Server-Side JavaScript',
        titleAr: 'مقدمة في Node.js وجافا سكريبت من جانب الخادم',
        description: 'Learn what Node.js is, how it works, and why it\'s revolutionizing backend development.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        duration: 900, // 15:00
        order: 0,
        courseId: nodeCourse.id,
        resources: JSON.stringify([
          {
            id: '7',
            title: 'Node.js Official Site',
            titleAr: 'موقع Node.js الرسمي',
            type: 'link',
            url: 'https://nodejs.org',
            description: 'Official Node.js documentation and downloads'
          }
        ]),
        transcript: `Welcome to Node.js Backend Development! In this first lesson, we'll explore what makes Node.js so powerful and why it has become a dominant force in backend development.

Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine. It allows you to run JavaScript on the server side, which opens up incredible possibilities for full-stack JavaScript development.

What makes Node.js special?

1. **Non-blocking I/O**: Node.js uses an event-driven, non-blocking I/O model that makes it lightweight and efficient, perfect for data-intensive real-time applications.

2. **Single-threaded with Event Loop**: Unlike traditional server-side environments that create new threads for each connection, Node.js operates on a single-threaded event loop, which can handle thousands of concurrent connections with minimal overhead.

3. **NPM Ecosystem**: Node.js comes with npm (Node Package Manager), the largest ecosystem of open-source libraries in the world, with over a million packages available.

4. **Full-stack JavaScript**: With Node.js, developers can use JavaScript for both frontend and backend development, creating a unified development experience.

Key use cases for Node.js:
- Real-time applications (chat apps, gaming)
- REST APIs and microservices
- Streaming applications
- Command-line tools
- IoT applications

In this course, we'll cover everything from setting up your development environment to building scalable backend applications with Express, working with databases, and implementing authentication.

By the end of this course, you'll be able to:
- Build RESTful APIs with Node.js and Express
- Work with databases (MongoDB, PostgreSQL)
- Implement authentication and authorization
- Handle file uploads and streaming
- Optimize Node.js applications for performance
- Deploy Node.js applications to production

Let's start this exciting journey into backend development with Node.js!`
      }
    }),
    prisma.lesson.create({
      data: {
        title: 'Building RESTful APIs with Express',
        titleAr: 'بناء واجهات برمجة التطبيقات RESTful مع Express',
        description: 'Learn how to build robust RESTful APIs using Express framework.',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        duration: 1200, // 20:00
        order: 1,
        courseId: nodeCourse.id,
        resources: JSON.stringify([
          {
            id: '8',
            title: 'Express Documentation',
            titleAr: 'وثائق Express',
            type: 'link',
            url: 'https://expressjs.com',
            description: 'Official Express framework documentation'
          }
        ]),
        transcript: `In this lesson, we're going to dive into building RESTful APIs with Express, one of the most popular Node.js frameworks.

Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications. It makes building APIs much simpler than using raw Node.js.

Let's start by setting up a basic Express server:

const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Welcome to our API!');
});

app.listen(port, () => {
  console.log(\`Server running at http://localhost:\${port}\`);
});

Now, let's build a RESTful API for managing users. We'll implement the CRUD operations:

// GET all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET a single user
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST a new user
app.post('/api/users', async (req, res) => {
  try {
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      age: req.body.age
    });
    const newUser = await user.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT (update) a user
app.put('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.age = req.body.age || user.age;
    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE a user
app.delete('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    await user.remove();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

Key concepts in RESTful API design:
1. **HTTP Methods**: GET (retrieve), POST (create), PUT/PATCH (update), DELETE (remove)
2. **Resources**: Nouns that represent your data (users, products, orders)
3. **Status Codes**: 200 (success), 201 (created), 400 (bad request), 404 (not found), 500 (server error)
4. **JSON**: The standard data format for APIs
5. **Versioning**: Include API version in URL (/api/v1/users)

Best practices for building APIs:
- Use proper HTTP status codes
- Implement input validation
- Add authentication and authorization
- Use consistent response formats
- Implement rate limiting
- Add comprehensive error handling
- Document your API endpoints

Building RESTful APIs with Express is fundamental because:
- It's the backbone of modern web applications
- It enables communication between frontend and backend
- It's essential for mobile app development
- It allows for integration with third-party services

In the next lesson, we'll explore database integration with MongoDB and Mongoose!`
      }
    })
  ])

  console.log('✅ Created demo courses')
  console.log('📊 Demo Courses Created:')
  console.log(`   1. ${reactCourse.title} (${reactLessons.length} lessons)`)
  console.log(`   2. ${nodeCourse.title} (2 lessons)`)

  // Create demo enrollment for the demo user
  const enrollment = await prisma.enrollment.create({
    data: {
      userId: demoUser.id,
      courseId: reactCourse.id,
      progress: 25, // 25% progress (1 out of 4 lessons completed)
      completedLessons: JSON.stringify([reactLessons[0].id]), // First lesson completed
      lastAccessedAt: new Date()
    }
  })
  console.log('✅ Created demo enrollment with progress')

  // Create demo reviews for courses
  console.log('🌟 Adding demo reviews...')
  
  const reviewsData = [
    {
      userId: demoUser.id,
      courseId: reactCourse.id,
      rating: 5,
      title: 'Excellent React Course!',
      comment: 'This course exceeded my expectations! The instructor explains complex React concepts in a very clear and understandable way. The practical projects helped me solidify my learning. I highly recommend this course to anyone wanting to master React.',
      helpful: 24,
      verified: true
    },
    {
      userId: demoUser.id,
      courseId: nodeCourse.id,
      rating: 5,
      title: 'Perfect for Backend Development',
      comment: 'Amazing course for learning Node.js! The content is well-structured and covers all essential topics. The real-world examples and projects make it easy to understand. Great job by the instructor!',
      helpful: 18,
      verified: true
    }
  ]

  // Create additional demo users for more diverse reviews
  const reviewer1 = await prisma.user.create({
    data: {
      email: 'reviewer1@example.com',
      passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      name: 'Ahmed Mohamed',
      arabicName: 'أحمد محمد',
      skillLevel: 'Beginner',
      interests: 'Web Development',
      goals: 'Learn React'
    }
  })

  const reviewer2 = await prisma.user.create({
    data: {
      email: 'reviewer2@example.com',
      passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      name: 'Fatima Ali',
      arabicName: 'فاطمة علي',
      skillLevel: 'Intermediate',
      interests: 'Frontend Development',
      goals: 'Master React Development'
    }
  })

  const reviewer3 = await prisma.user.create({
    data: {
      email: 'reviewer3@example.com',
      passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      name: 'Mohamed Ahmed',
      arabicName: 'محمد أحمد',
      skillLevel: 'Advanced',
      interests: 'Full Stack Development',
      goals: 'Build Complete Applications'
    }
  })

  const reviewer4 = await prisma.user.create({
    data: {
      email: 'reviewer4@example.com',
      passwordHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
      name: 'Mariam Hassan',
      arabicName: 'مريم حسن',
      skillLevel: 'Beginner',
      interests: 'Web Development, Design',
      goals: 'Career Change into Tech'
    }
  })

  const allReviewsData = [
    ...reviewsData,
    {
      userId: reviewer1.id,
      courseId: reactCourse.id,
      rating: 5,
      title: 'كورس ممتاز جداً!',
      comment: 'كورس ممتاز جداً! استفدت كثيراً من المحتوى والأمثلة العملية. المدرب محترف وطريقة شرحه واضحة ومبسطة. أنصح بشدة بهذا الكورس لكل من يريد تعلم React.',
      helpful: 32,
      verified: true
    },
    {
      userId: reviewer2.id,
      courseId: reactCourse.id,
      rating: 5,
      title: 'من أفضل الكورسات',
      comment: 'من أفضل الكورسات اللي خدتها في React. المحتوى محدث ومفيد جداً، والمشاريع العملية ساعدتني أطبق اللي اتعلمته. شكراً للمدرب على المجهود الرائع.',
      helpful: 28,
      verified: true
    },
    {
      userId: reviewer3.id,
      courseId: reactCourse.id,
      rating: 4,
      title: 'كورس جيد بشكل عام',
      comment: 'كورس جيد بشكل عام. المحتوى مفيد والشرح واضح، لكن كنت أتمنى لو كان فيه أمثلة أكثر من مشاريع حقيقية. بشكل عام راضي عن الكورس وأنصح بيه.',
      helpful: 15,
      verified: true
    },
    {
      userId: reviewer4.id,
      courseId: reactCourse.id,
      rating: 5,
      title: 'استثنائي!',
      comment: 'استثنائي! المدرب خبير حقيقي في المجال. الكورس غطى كل المواضيع المهمة في React بشكل عملي ومفصل. الشهادة كمان معتمدة ومفيدة للسيرة الذاتية.',
      helpful: 22,
      verified: true
    },
    {
      userId: reviewer1.id,
      courseId: nodeCourse.id,
      rating: 5,
      title: 'تجربة تعليمية رائعة!',
      comment: 'تجربة تعليمية رائعة! الكورس منظم بشكل ممتاز، والمحتوى قيم جداً. استطعت تطبيق اللي اتعلمته في شغلي فوراً وشفت نتائج إيجابية. شكراً جداً!',
      helpful: 19,
      verified: true
    },
    {
      userId: reviewer2.id,
      courseId: nodeCourse.id,
      rating: 4,
      title: 'كورس مفيد ومحتوى قوي',
      comment: 'كورس مفيد ومحتوى قوي. المدرب يشرح بطريقة مبسطة ومفهومة. الفيديوهات جودتها عالية والصوت واضح. أنصح بالكورس لكل المهتمين بـ Node.js.',
      helpful: 12,
      verified: true
    }
  ]

  // Create all reviews
  await Promise.all(allReviewsData.map(review => 
    prisma.review.create({ data: review })
  ))

  // Update course ratings based on reviews
  const reactReviews = allReviewsData.filter(r => r.courseId === reactCourse.id)
  const reactAvgRating = reactReviews.reduce((sum, r) => sum + r.rating, 0) / reactReviews.length

  const nodeReviews = allReviewsData.filter(r => r.courseId === nodeCourse.id)
  const nodeAvgRating = nodeReviews.reduce((sum, r) => sum + r.rating, 0) / nodeReviews.length

  await Promise.all([
    prisma.course.update({
      where: { id: reactCourse.id },
      data: { rating: Math.round(reactAvgRating * 10) / 10 } // Round to 1 decimal
    }),
    prisma.course.update({
      where: { id: nodeCourse.id },
      data: { rating: Math.round(nodeAvgRating * 10) / 10 }
    })
  ])

  console.log(`✅ Created ${allReviewsData.length} demo reviews`)
  console.log(`✅ Updated course ratings: React (${Math.round(reactAvgRating * 10) / 10}), Node.js (${Math.round(nodeAvgRating * 10) / 10})`)

  console.log('✅ Created demo enrollment with progress')

  console.log('🎉 Demo data seeding completed!')
  console.log('')
  console.log('🚀 Ready for demo! You can now:')
  console.log('   1. Navigate to http://localhost:3000/courses')
  console.log('   2. View the demo courses')
  console.log('   3. Click "Start Learning" on the React course')
  console.log('   4. Experience the video player and progress tracking')
  console.log('')
  console.log('🔑 Demo Credentials:')
  console.log('   Email: demo@example.com')
  console.log('   Password: password')
  console.log('')
  console.log('📱 Demo Features to Highlight:')
  console.log('   ✅ Video player with quality selection (1080p, 720p, 480p)')
  console.log('   ✅ Subtitle support (Arabic/English)')
  console.log('   ✅ Progress tracking and auto-save')
  console.log('   ✅ Lesson completion with interactive checkboxes')
  console.log('   ✅ Course navigation with progress indicators')
  console.log('   ✅ Bilingual support (English/Arabic)')
  console.log('   ✅ Responsive design for mobile')
  console.log('   ✅ Keyboard shortcuts and accessibility')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding demo data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
