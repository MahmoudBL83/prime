# Course Player System Implementation Plan

## 🎯 **Implementation Overview**

This plan implements a complete course player system with Mux integration for the Egyptian EdTech platform. Each task is designed to be completed independently with clear verification steps.

**Total Estimated Time**: 2-3 weeks
**Priority**: HIGH (Core learning experience)

---

## 📋 **TASK 1: Environment Setup & Mux Integration**

**Duration**: 4-6 hours
**Dependencies**: None
**Difficulty**: Medium

### **1.1 Install Required Dependencies**

```bash
# Install Mux and video-related packages
npm install @mux/mux-video-react
npm install @mux/mux-player-react
npm install react-player
npm install @types/react-player

# Install additional UI components
npm install @radix-ui/react-progress
npm install @radix-ui/react-slider
npm install @radix-ui/react-tooltip
npm install react-hotkeys-hook
```

### **1.2 Environment Variables Setup**

Add to `.env.local`:

```env
# Mux Configuration
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret
MUX_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_MUX_ENV_KEY=your_mux_environment_key
```

### **1.3 Create Mux Service**

Create `src/lib/mux.ts`:

```typescript
import Mux from '@mux/mux-node'

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
})

export { mux }
```

### **Verification Steps:**

- [ ] All packages install without errors
- [ ] Environment variables are set
- [ ] Can import Mux components without errors
- [ ] TypeScript compiles successfully

---

## 📋 **TASK 2: Database Schema Updates**

**Duration**: 2-3 hours
**Dependencies**: Task 1
**Difficulty**: Easy

### **2.1 Update Lesson Model**

Update `prisma/schema.prisma`:

```prisma
model Lesson {
  id             String   @id @default(cuid())
  courseId       String
  course         Course   @relation(fields: [courseId], references: [id])
  
  title          String
  titleAr        String
  description    String?
  descriptionAr  String?
  
  // Mux Integration
  muxAssetId     String?  // Mux asset ID
  muxPlaybackId  String?  // Mux playback ID
  videoUrl       String?  // Fallback for non-Mux videos
  
  duration       Int      // in seconds
  order          Int
  
  // Learning Resources
  resources      Json?    // Array of resource URLs
  transcript     String?  @db.Text
  
  // Content Control
  isPreview      Boolean  @default(false)
  requiresSubscription Boolean @default(true)
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  // Relations
  progress       LessonProgress[]
}

model LessonProgress {
  id           String   @id @default(cuid())
  userId       String
  lessonId     String
  
  user         User     @relation(fields: [userId], references: [id])
  lesson       Lesson   @relation(fields: [lessonId], references: [id])
  
  watchTime    Int      @default(0) // seconds watched
  completed    Boolean  @default(false)
  lastPosition Int      @default(0) // last watched position in seconds
  
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  @@unique([userId, lessonId])
}
```

### **2.2 Update User Model**

Add to User model:

```prisma
model User {
  // ... existing fields
  
  // Relations
  lessonProgress LessonProgress[]
  // ... other existing relations
}
```

### **2.3 Run Migration**

```bash
npx prisma migrate dev --name add_lesson_progress
npx prisma generate
```

### **Verification Steps:**

- [ ] Migration runs successfully
- [ ] New tables visible in Prisma Studio
- [ ] TypeScript types updated
- [ ] No compilation errors

---

## 📋 **TASK 3: Video Upload API**

**Duration**: 6-8 hours
**Dependencies**: Task 2
**Difficulty**: Hard

### **3.1 Create Video Upload API Route**

Create `src/app/api/lessons/[id]/upload-video/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { mux } from '@/lib/mux'
import { z } from 'zod'

const uploadSchema = z.object({
  videoUrl: z.string().url(),
  title: z.string().min(1),
  titleAr: z.string().min(1),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'CREATOR') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lessonId = params.id
    const body = await req.json()
    const validation = uploadSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      )
    }

    // Check if lesson exists and user owns it
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        course: {
          creator: {
            userId: session.user.id,
          },
        },
      },
      include: {
        course: {
          include: {
            creator: true,
          },
        },
      },
    })

    if (!lesson) {
      return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
    }

    // Create Mux asset
    const asset = await mux.video.assets.create({
      input: validation.data.videoUrl,
      playback_policy: ['signed'],
      mp4_support: 'standard',
    })

    // Update lesson with Mux data
    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        muxAssetId: asset.id,
        muxPlaybackId: asset.playback_ids?.[0]?.id,
        title: validation.data.title,
        titleAr: validation.data.titleAr,
      },
    })

    return NextResponse.json({
      message: 'Video uploaded successfully',
      lesson: updatedLesson,
      muxAssetId: asset.id,
    })
  } catch (error) {
    console.error('Video upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    )
  }
}
```

### **3.2 Create Video Upload Status API**

Create `src/app/api/lessons/[id]/video-status/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { mux } from '@/lib/mux'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lessonId = params.id

    // Get lesson with Mux asset ID
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: {
        muxAssetId: true,
        muxPlaybackId: true,
        title: true,
        duration: true,
      },
    })

    if (!lesson || !lesson.muxAssetId) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Get asset status from Mux
    const asset = await mux.video.assets.retrieve(lesson.muxAssetId)

    return NextResponse.json({
      status: asset.status,
      duration: asset.duration,
      playbackId: lesson.muxPlaybackId,
      ready: asset.status === 'ready',
    })
  } catch (error) {
    console.error('Video status error:', error)
    return NextResponse.json(
      { error: 'Failed to get video status' },
      { status: 500 }
    )
  }
}
```

### **Verification Steps:**

- [ ] API routes created successfully
- [ ] Can upload video URL to Mux
- [ ] Mux asset creation works
- [ ] Video status checking works
- [ ] Error handling works correctly

---

## 📋 **TASK 4: Basic Course Player Component**

**Duration**: 8-10 hours
**Dependencies**: Task 3
**Difficulty**: Hard

### **4.1 Create Course Player Component**

Create `src/components/course/CoursePlayer.tsx`:

```typescript
'use client'

import { useState, useEffect, useRef } from 'react'
import MuxPlayer from '@mux/mux-player-react'
import { useSession } from 'next-auth/react'
import { Play, Pause, Volume2, Settings, Maximize } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Lesson {
  id: string
  title: string
  titleAr: string
  muxPlaybackId: string | null
  duration: number
  order: number
  isPreview: boolean
  requiresSubscription: boolean
}

interface CoursePlayerProps {
  lesson: Lesson
  courseId: string
  lessons: Lesson[]
  userHasAccess: boolean
  onProgress?: (lessonId: string, currentTime: number, duration: number) => void
  onComplete?: (lessonId: string) => void
}

export function CoursePlayer({
  lesson,
  courseId,
  lessons,
  userHasAccess,
  onProgress,
  onComplete,
}: CoursePlayerProps) {
  const { data: session } = useSession()
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const playerRef = useRef<HTMLVideoElement>(null)

  // Check if user can watch this lesson
  const canWatch = lesson.isPreview || userHasAccess || !lesson.requiresSubscription

  useEffect(() => {
    if (!session?.user) return

    // Load saved progress
    loadProgress()
  }, [lesson.id, session])

  const loadProgress = async () => {
    try {
      const response = await fetch(`/api/lessons/${lesson.id}/progress`)
      if (response.ok) {
        const data = await response.json()
        if (data.lastPosition) {
          setCurrentTime(data.lastPosition)
        }
      }
    } catch (error) {
      console.error('Failed to load progress:', error)
    }
  }

  const saveProgress = async (currentTime: number, duration: number) => {
    if (!session?.user) return

    try {
      await fetch(`/api/lessons/${lesson.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          watchTime: Math.floor(currentTime),
          lastPosition: Math.floor(currentTime),
          completed: currentTime / duration > 0.9, // 90% completion
        }),
      })

      onProgress?.(lesson.id, currentTime, duration)

      // Check if lesson is completed
      if (currentTime / duration > 0.9) {
        onComplete?.(lesson.id)
        toast.success('Lesson completed! 🎉')
      }
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }

  const handleTimeUpdate = () => {
    if (!playerRef.current) return

    const current = playerRef.current.currentTime
    const total = playerRef.current.duration

    setCurrentTime(current)
    setDuration(total)

    // Save progress every 10 seconds
    if (Math.floor(current) % 10 === 0) {
      saveProgress(current, total)
    }
  }

  const handleLoadedData = () => {
    setIsLoading(false)
    if (currentTime > 0 && playerRef.current) {
      playerRef.current.currentTime = currentTime
    }
  }

  if (!canWatch) {
    return (
      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white p-8">
            <h3 className="text-xl font-semibold mb-4">
              Subscribe to Continue Learning
            </h3>
            <p className="text-gray-300 mb-6">
              This lesson requires an active subscription to access.
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium">
              Subscribe Now - 150 EGP/month
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!lesson.muxPlaybackId) {
    return (
      <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Video is being processed...</p>
      </div>
    )
  }

  return (
    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      )}

      <MuxPlayer
        ref={playerRef}
        playbackId={lesson.muxPlaybackId}
        streamType="on-demand"
        autoPlay={false}
        muted={false}
        onTimeUpdate={handleTimeUpdate}
        onLoadedData={handleLoadedData}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="w-full h-full"
        style={{ aspectRatio: '16/9' }}
      />

      {/* Custom Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center gap-4 text-white">
          <button
            onClick={() => {
              if (isPlaying) {
                playerRef.current?.pause()
              } else {
                playerRef.current?.play()
              }
            }}
            className="hover:bg-white/20 p-2 rounded"
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>

          <div className="flex-1">
            <div className="text-sm mb-1">
              {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')} / 
              {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Volume2 size={20} />
            <Settings size={20} />
            <Maximize size={20} />
          </div>
        </div>
      </div>
    </div>
  )
}
```

### **Verification Steps:**

- [ ] Component renders without errors
- [ ] Mux player displays video correctly
- [ ] Custom controls work
- [ ] Progress tracking functions
- [ ] Subscription gate displays for restricted content

---

## 📋 **TASK 5: Lesson Navigation Component**

**Duration**: 4-6 hours
**Dependencies**: Task 4
**Difficulty**: Medium

### **5.1 Create Lesson Navigation Sidebar**

Create `src/components/course/LessonNavigation.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { CheckCircle, PlayCircle, Lock, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Lesson {
  id: string
  title: string
  titleAr: string
  duration: number
  order: number
  isPreview: boolean
  requiresSubscription: boolean
}

interface LessonProgress {
  lessonId: string
  completed: boolean
  watchTime: number
}

interface LessonNavigationProps {
  lessons: Lesson[]
  currentLessonId: string
  progress: LessonProgress[]
  userHasAccess: boolean
  onLessonSelect: (lesson: Lesson) => void
}

export function LessonNavigation({
  lessons,
  currentLessonId,
  progress,
  userHasAccess,
  onLessonSelect,
}: LessonNavigationProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const getLessonProgress = (lessonId: string) => {
    return progress.find(p => p.lessonId === lessonId)
  }

  const canAccessLesson = (lesson: Lesson) => {
    return lesson.isPreview || userHasAccess || !lesson.requiresSubscription
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
  }

  const sortedLessons = lessons.sort((a, b) => a.order - b.order)

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 transition-all duration-300",
      isCollapsed ? "w-16" : "w-80"
    )}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h3 className="font-semibold text-gray-900">Course Content</h3>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
        
        {!isCollapsed && (
          <div className="mt-2 text-sm text-gray-600">
            {progress.filter(p => p.completed).length} of {lessons.length} lessons completed
          </div>
        )}
      </div>

      <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
        {sortedLessons.map((lesson, index) => {
          const lessonProgress = getLessonProgress(lesson.id)
          const isCompleted = lessonProgress?.completed || false
          const isCurrentLesson = lesson.id === currentLessonId
          const canAccess = canAccessLesson(lesson)

          return (
            <button
              key={lesson.id}
              onClick={() => canAccess && onLessonSelect(lesson)}
              disabled={!canAccess}
              className={cn(
                "w-full p-4 text-left hover:bg-gray-50 border-b border-gray-100 transition-colors",
                isCurrentLesson && "bg-blue-50 border-r-4 border-r-blue-600",
                !canAccess && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {!canAccess ? (
                    <Lock className="w-5 h-5 text-gray-400" />
                  ) : isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : isCurrentLesson ? (
                    <PlayCircle className="w-5 h-5 text-blue-600" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                </div>

                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-gray-500 font-medium">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {lesson.isPreview && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                          Preview
                        </span>
                      )}
                    </div>

                    <h4 className={cn(
                      "font-medium text-sm mb-1 line-clamp-2",
                      isCurrentLesson ? "text-blue-900" : "text-gray-900"
                    )}>
                      {lesson.title}
                    </h4>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(lesson.duration)}</span>
                    </div>

                    {lessonProgress && lessonProgress.watchTime > 0 && !isCompleted && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div
                            className="bg-blue-600 h-1 rounded-full"
                            style={{
                              width: `${(lessonProgress.watchTime / lesson.duration) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

### **Verification Steps:**

- [ ] Navigation sidebar displays correctly
- [ ] Lessons show in correct order
- [ ] Progress indicators work
- [ ] Lock icons show for restricted content
- [ ] Collapse/expand functionality works

---

## 📋 **TASK 6: Progress Tracking API**

**Duration**: 4-5 hours
**Dependencies**: Task 4
**Difficulty**: Medium

### **6.1 Create Progress Tracking API**

Create `src/app/api/lessons/[id]/progress/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const progressSchema = z.object({
  watchTime: z.number().min(0),
  lastPosition: z.number().min(0),
  completed: z.boolean().optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lessonId = params.id

    const progress = await prisma.lessonProgress.findUnique({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: lessonId,
        },
      },
    })

    return NextResponse.json({
      progress: progress || {
        watchTime: 0,
        lastPosition: 0,
        completed: false,
      },
    })
  } catch (error) {
    console.error('Progress fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const lessonId = params.id
    const body = await req.json()
    const validation = progressSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors },
        { status: 400 }
      )
    }

    const { watchTime, lastPosition, completed } = validation.data

    // Upsert progress
    const progress = await prisma.lessonProgress.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: lessonId,
        },
      },
      update: {
        watchTime: Math.max(watchTime, 0),
        lastPosition,
        completed: completed || false,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        lessonId: lessonId,
        watchTime,
        lastPosition,
        completed: completed || false,
      },
    })

    // Update course enrollment progress if lesson completed
    if (completed) {
      await updateCourseProgress(session.user.id, lessonId)
    }

    return NextResponse.json({
      message: 'Progress saved successfully',
      progress,
    })
  } catch (error) {
    console.error('Progress save error:', error)
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    )
  }
}

async function updateCourseProgress(userId: string, lessonId: string) {
  try {
    // Get the lesson and its course
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { course: true },
    })

    if (!lesson) return

    // Get all lessons in the course
    const totalLessons = await prisma.lesson.count({
      where: { courseId: lesson.courseId },
    })

    // Get completed lessons count
    const completedLessons = await prisma.lessonProgress.count({
      where: {
        userId,
        completed: true,
        lesson: {
          courseId: lesson.courseId,
        },
      },
    })

    // Calculate progress percentage
    const progressPercentage = (completedLessons / totalLessons) * 100

    // Update enrollment progress
    await prisma.enrollment.updateMany({
      where: {
        userId,
        courseId: lesson.courseId,
      },
      data: {
        progress: progressPercentage,
        completedAt: progressPercentage >= 100 ? new Date() : null,
      },
    })
  } catch (error) {
    console.error('Course progress update error:', error)
  }
}
```

### **Verification Steps:**

- [ ] Can save lesson progress
- [ ] Can retrieve saved progress
- [ ] Course progress updates correctly
- [ ] Completion status works
- [ ] Error handling works

---

## 📋 **TASK 7: Complete Course Player Page**

**Duration**: 6-8 hours
**Dependencies**: Tasks 4, 5, 6
**Difficulty**: Hard

### **7.1 Create Course Player Page**

Create `src/app/courses/[id]/watch/page.tsx`:

```typescript
import { notFound, redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CoursePlayerContainer } from '@/components/course/CoursePlayerContainer'

interface CourseWatchPageProps {
  params: { id: string }
  searchParams: { lesson?: string }
}

export default async function CourseWatchPage({
  params,
  searchParams,
}: CourseWatchPageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/login')
  }

  // Get course with lessons and check access
  const course = await prisma.course.findUnique({
    where: { id: params.id },
    include: {
      creator: {
        include: {
          user: true,
        },
      },
      lessons: {
        orderBy: { order: 'asc' },
      },
      enrollments: {
        where: { userId: session.user.id },
      },
    },
  })

  if (!course) {
    notFound()
  }

  // Check if user has access to the course
  const isEnrolled = course.enrollments.length > 0
  const userHasAccess = isEnrolled || course.creator.userId === session.user.id

  // Get user's subscription status (for premium content)
  const userSubscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: 'active',
      type: 'CATEGORY_A',
    },
  })

  const hasActiveSubscription = !!userSubscription

  // Get current lesson (from search params or first lesson)
  const currentLessonId = searchParams.lesson || course.lessons[0]?.id
  const currentLesson = course.lessons.find(l => l.id === currentLessonId)

  if (!currentLesson) {
    notFound()
  }

  // Get user's progress for all lessons
  const progressData = await prisma.lessonProgress.findMany({
    where: {
      userId: session.user.id,
      lessonId: { in: course.lessons.map(l => l.id) },
    },
  })

  return (
    <CoursePlayerContainer
      course={course}
      currentLesson={currentLesson}
      lessons={course.lessons}
      userHasAccess={userHasAccess || hasActiveSubscription}
      progressData={progressData}
    />
  )
}
```

### **7.2 Create Course Player Container**

Create `src/components/course/CoursePlayerContainer.tsx`:

```typescript
'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CoursePlayer } from './CoursePlayer'
import { LessonNavigation } from './LessonNavigation'
import { CourseHeader } from './CourseHeader'
import { toast } from 'react-hot-toast'

interface CoursePlayerContainerProps {
  course: any // Full course object
  currentLesson: any
  lessons: any[]
  userHasAccess: boolean
  progressData: any[]
}

export function CoursePlayerContainer({
  course,
  currentLesson,
  lessons,
  userHasAccess,
  progressData,
}: CoursePlayerContainerProps) {
  const router = useRouter()
  const [selectedLesson, setSelectedLesson] = useState(currentLesson)

  const handleLessonSelect = useCallback((lesson: any) => {
    setSelectedLesson(lesson)
    router.push(`/courses/${course.id}/watch?lesson=${lesson.id}`, {
      scroll: false,
    })
  }, [course.id, router])

  const handleProgress = useCallback((lessonId: string, currentTime: number, duration: number) => {
    // Progress is automatically saved by the CoursePlayer component
    console.log(`Progress: ${Math.round((currentTime / duration) * 100)}%`)
  }, [])

  const handleComplete = useCallback((lessonId: string) => {
    // Find next lesson
    const currentIndex = lessons.findIndex(l => l.id === lessonId)
    const nextLesson = lessons[currentIndex + 1]

    if (nextLesson) {
      toast.success('Moving to next lesson...', {
        icon: '🎉',
      })
      setTimeout(() => {
        handleLessonSelect(nextLesson)
      }, 2000)
    } else {
      toast.success('Course completed! 🎊', {
        duration: 5000,
      })
    }
  }, [lessons, handleLessonSelect])

  return (
    <div className="min-h-screen bg-gray-50">
      <CourseHeader course={course} currentLesson={selectedLesson} />
      
      <div className="flex">
        <LessonNavigation
          lessons={lessons}
          currentLessonId={selectedLesson.id}
          progress={progressData}
          userHasAccess={userHasAccess}
          onLessonSelect={handleLessonSelect}
        />
        
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <CoursePlayer
              lesson={selectedLesson}
              courseId={course.id}
              lessons={lessons}
              userHasAccess={userHasAccess}
              onProgress={handleProgress}
              onComplete={handleComplete}
            />
            
            <div className="mt-6 bg-white rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                {selectedLesson.title}
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {selectedLesson.description || 'No description available.'}
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
```

### **Verification Steps:**

- [ ] Course player page loads correctly
- [ ] Navigation between lessons works
- [ ] Progress tracking persists
- [ ] Auto-advance to next lesson works
- [ ] Subscription gates work correctly

---

## 📋 **TASK 8: Testing & Polish**

**Duration**: 4-6 hours
**Dependencies**: Task 7
**Difficulty**: Medium

### **8.1 Create Test Data**

Update `prisma/seed.ts` to include lesson data:

```typescript
// Add to existing seed file
const demoLessons = [
  {
    title: 'Introduction to Web Development',
    titleAr: 'مقدمة في تطوير الويب',
    description: 'Learn the basics of web development',
    descriptionAr: 'تعلم أساسيات تطوير الويب',
    duration: 600, // 10 minutes
    order: 1,
    isPreview: true,
    requiresSubscription: false,
  },
  {
    title: 'HTML Fundamentals',
    titleAr: 'أساسيات HTML',
    description: 'Understanding HTML structure and elements',
    descriptionAr: 'فهم هيكل وعناصر HTML',
    duration: 900, // 15 minutes
    order: 2,
    isPreview: false,
    requiresSubscription: true,
  },
  // Add more lessons...
]
```

### **8.2 Manual Testing Checklist**

- [ ] Video player loads and plays correctly
- [ ] Progress tracking saves and restores
- [ ] Lesson navigation works smoothly
- [ ] Subscription gates display correctly
- [ ] Mobile responsive design works
- [ ] Arabic text displays correctly (RTL)
- [ ] Auto-advance to next lesson functions
- [ ] Completion notifications appear
- [ ] Video quality adaptation works

### **8.3 Performance Optimization**

- [ ] Implement lazy loading for lesson list
- [ ] Add loading states for video player
- [ ] Optimize database queries
- [ ] Add error boundaries
- [ ] Implement retry logic for failed requests

---

## 🎯 **VERIFICATION & TESTING**

### **Complete System Test:**

1. **Upload Test Video**: Creator uploads video via Mux
2. **Student Access**: Student can watch with proper subscription
3. **Progress Tracking**: Progress saves and restores correctly
4. **Navigation**: Can navigate between lessons smoothly
5. **Completion Flow**: Lessons mark as complete and advance automatically

### **Egyptian Market Specific Tests:**

1. **Slow Internet**: Video adapts quality automatically
2. **Mobile Usage**: Player works on mobile devices
3. **Arabic Content**: RTL text displays correctly
4. **Payment Gates**: Subscription prompts work correctly

---

## 🚀 **DEPLOYMENT CHECKLIST**

- [ ] Environment variables configured
- [ ] Mux webhook endpoints set up
- [ ] Database migrations applied
- [ ] Error monitoring configured
- [ ] Performance monitoring enabled
- [ ] CDN configured for optimal Egyptian delivery

---

## 📈 **SUCCESS METRICS**

After implementation, you should be able to measure:

- Video completion rates
- User engagement time
- Lesson progression patterns
- Subscription conversion from preview lessons
- Technical performance (buffering, loading times)

This implementation provides a complete course player system that rivals professional platforms like Coursera or Udemy, optimized specifically for the Egyptian market with Mux's robust video infrastructure.
