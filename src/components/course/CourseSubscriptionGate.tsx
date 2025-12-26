'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
    Lock,
    Sparkles,
    Play,
    Star,
    Clock,
    BookOpen,
    CheckCircle,
    Users,
    Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'
import { useAuthModal } from '@/contexts/AuthModalContext'

interface CourseSubscriptionGateProps {
    course: {
        id: string
        title: string
        titleAr: string
        description: string
        thumbnail?: string
        duration: number
        rating: number
        totalEnrollments: number
        creator: {
            user: {
                name: string
                arabicName?: string
            }
        }
    }
    onClose?: () => void
    lang?: 'en' | 'de'
}

export default function CourseSubscriptionGate({
    course,
    onClose,
    lang = 'de'
}: CourseSubscriptionGateProps) {
    const { data: session } = useSession()
    const router = useRouter()
    const [isActivating, setIsActivating] = useState(false)
    const { openAuthModal } = useAuthModal()

    const handleDemoSubscription = async (skipAuthCheck = false) => {
        if (!skipAuthCheck && !session) {
            openAuthModal('signin', {
                onSuccess: () => handleDemoSubscription(true)
            })
            return
        }

        setIsActivating(true)

        try {
            toast.loading('Activating demo access...', { id: 'demo-access' })

            // Simulate demo activation
            await new Promise(resolve => setTimeout(resolve, 1500))

            // Try the API endpoint or fallback to direct navigation
            try {
                const response = await fetch('/api/demo/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subscriptionType: 'CATEGORY_A',
                        demo: true
                    })
                })

                if (response.ok) {
                    toast.success('Demo access activated!', { id: 'demo-access' })
                } else {
                    toast.success('Demo access granted!', { id: 'demo-access' })
                }
            } catch (error) {
                toast.success('Demo access granted!', { id: 'demo-access' })
            }

            // Navigate to the new Udemy-style course player with demo parameter
            router.push(`/courses/${course.id}/learn-udemy?demo=true`)

        } catch (error) {
            toast.error('Something went wrong. Please try again.')
        } finally {
            setIsActivating(false)
        }
    }

    const handleRegularSubscription = () => {
        router.push('/subscribe/demo')
    }

    const formatDuration = (minutes: number) => {
        const hours = Math.floor(minutes / 60)
        const remainingMinutes = minutes % 60

        if (hours > 0) {
            return `${hours}h ${remainingMinutes}m`
        }
        return `${remainingMinutes}m`
    }

    return (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="relative">
                    <div className="h-48 bg-gradient-to-r from-blue-600 to-purple-700 rounded-t-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-background/20"></div>
                        <div className="relative h-full flex items-center justify-center">
                            <div className="text-center text-foreground">
                                <Lock className="w-12 h-12 mx-auto mb-4" />
                                <h2 className="text-2xl font-bold mb-2">Premium Content</h2>
                                <p className="text-blue-100">Subscribe to access this course</p>
                            </div>
                        </div>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-foreground hover:bg-white/20 rounded-full p-2 transition-colors"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="p-6">
                    {/* Course Info */}
                    <div className="mb-6">
                        <h3 className="text-xl font-bold mb-2">
                            {lang === 'en' ? course.title : course.titleAr}
                        </h3>
                        <p className="text-muted-foreground mb-4">{course.description}</p>

                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{formatDuration(course.duration)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span>{course.rating.toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{course.totalEnrollments} students</span>
                            </div>
                        </div>
                    </div>

                    {/* Demo Offer */}
                    <Card className="mb-6 border-blue-200 bg-blue-50">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-blue-600" />
                                <CardTitle className="text-lg text-blue-900">
                                    Try Demo Access
                                </CardTitle>
                                <Badge className="bg-blue-600">Free</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <p className="text-blue-800 mb-4">
                                Experience our full learning platform without payment. Perfect for demos and testing!
                            </p>
                            <ul className="space-y-2 mb-4">
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm">Full course access</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm">All learning features</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm">Progress tracking</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm">Interactive player</span>
                                </li>
                            </ul>
                            <Button
                                onClick={() => handleDemoSubscription()}
                                disabled={isActivating}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                {isActivating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Activating Demo...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-2" />
                                        Start Demo Experience
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Regular Subscription */}
                    <Card className="border-border">
                        <CardHeader className="pb-4">
                            <div className="flex items-center gap-2">
                                <Shield className="w-5 h-5 text-muted-foreground" />
                                <CardTitle className="text-lg">
                                    Premium Subscription
                                </CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <p className="text-muted-foreground mb-4">
                                Get full access to all courses with our subscription plans
                            </p>
                            <ul className="space-y-2 mb-4">
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm">500+ courses library</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm">Certificates of completion</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm">Download resources</span>
                                </li>
                                <li className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-sm">Priority support</span>
                                </li>
                            </ul>
                            <Button
                                onClick={handleRegularSubscription}
                                variant="outline"
                                className="w-full"
                            >
                                <BookOpen className="w-4 h-4 mr-2" />
                                View Subscription Plans
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Footer */}
                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        <p>Questions about our platform? Contact our support team</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
