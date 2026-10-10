'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    CheckCircle,
    Shield,
    Star,
    Users,
    BookOpen,
    Award,
    Sparkles,
    Clock,
    Play,
    Download
} from 'lucide-react'
import { toast } from 'react-hot-toast'

export const dynamic = 'force-dynamic'

export default function DemoSubscribePage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [isSubscribing, setIsSubscribing] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<'CATEGORY_A' | 'CATEGORY_C'>('CATEGORY_A')

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login?callbackUrl=/subscribe/demo')
            return
        }
    }, [status, router])

    const handleDemoSubscribe = async (plan: 'CATEGORY_A' | 'CATEGORY_C') => {
        if (!session) return

        setIsSubscribing(true)
        setSelectedPlan(plan)

        // Simulate subscription process
        try {
            toast.loading('Processing your demo subscription...', { id: 'demo-sub' })

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 2000))

            // Mock successful subscription
            const response = await fetch('/api/demo/subscribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    subscriptionType: plan,
                    demo: true
                })
            })

            if (response.ok) {
                toast.success('Demo subscription activated!', { id: 'demo-sub' })
                // Redirect to a demo course
                router.push('/courses?demo=true')
            } else {
                // Fallback: just redirect without actual subscription
                toast.success('Demo access granted!', { id: 'demo-sub' })
                router.push('/courses?demo=true')
            }
        } catch (error) {
            toast.success('Demo access granted!', { id: 'demo-sub' })
            router.push('/courses?demo=true')
        } finally {
            setIsSubscribing(false)
        }
    }

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p>Loading demo options...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-700 text-foreground">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-purple-700/90"></div>
                </div>
                <div className="relative max-w-4xl mx-auto px-6 py-16 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2 mb-6">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-medium">Demo Experience</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Experience Premium Learning
                    </h1>
                    <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                        Get instant access to our complete learning platform. No payment required for this demo.
                    </p>
                    <div className="flex flex-wrap justify-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            <span>Instant Access</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>Full Demo Experience</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Play className="w-4 h-4" />
                            <span>Interactive Content</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 py-12">
                {/* Demo Plans */}
                <div className="grid gap-8 lg:grid-cols-2 mb-16">
                    {/* All-Access Library Demo */}
                    <Card className="relative overflow-hidden border-2 border-blue-200 hover:border-blue-400 transition-all duration-300 hover:shadow-xl">
                        <div className="absolute top-0 right-0 bg-blue-600 text-foreground px-4 py-1 rounded-bl-lg">
                            <Badge className="bg-blue-600 text-foreground">Most Popular</Badge>
                        </div>
                        <CardHeader className="text-center pb-8">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="w-8 h-8 text-blue-600" />
                            </div>
                            <CardTitle className="text-2xl font-bold">All-Access Library</CardTitle>
                            <p className="text-muted-foreground">Complete access to all premium courses</p>
                            <div className="mt-4">
                                <span className="text-4xl font-bold text-blue-600">Demo</span>
                                <p className="text-sm text-muted-foreground mt-2">Full platform experience</p>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <span>Access to 500+ courses</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <span>Premium video content</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <span>Interactive exercises</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <span>Progress tracking</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <span>Certificate downloads</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <span>Mobile-friendly interface</span>
                                </li>
                            </ul>
                            <Button
                                onClick={() => handleDemoSubscribe('CATEGORY_A')}
                                disabled={isSubscribing}
                                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-foreground"
                                size="lg"
                            >
                                {isSubscribing && selectedPlan === 'CATEGORY_A' ? (
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

                    {/* Creator Channels Demo */}
                    <Card className="relative overflow-hidden border-2 border-green-200 hover:border-green-400 transition-all duration-300 hover:shadow-xl">
                        <CardHeader className="text-center pb-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-green-600" />
                            </div>
                            <CardTitle className="text-2xl font-bold">Creator Channels</CardTitle>
                            <p className="text-muted-foreground">Exclusive creator content experience</p>
                            <div className="mt-4">
                                <span className="text-4xl font-bold text-green-600">Demo</span>
                                <p className="text-sm text-muted-foreground mt-2">Creator interaction preview</p>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <span>Exclusive creator content</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <span>Direct creator interaction</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <span>Live session access</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <span>Community features</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <span>Priority support</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    <span>Behind-the-scenes content</span>
                                </li>
                            </ul>
                            <Button
                                onClick={() => handleDemoSubscribe('CATEGORY_C')}
                                disabled={isSubscribing}
                                className="w-full mt-6 bg-green-600 hover:bg-green-700 text-foreground"
                                size="lg"
                            >
                                {isSubscribing && selectedPlan === 'CATEGORY_C' ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Activating Demo...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4 mr-2" />
                                        Explore Creator Demo
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Demo Features */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-bold mb-8">What You'll Experience</h2>
                    <div className="grid gap-8 md:grid-cols-3">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Play className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Interactive Learning</h3>
                            <p className="text-muted-foreground">
                                Experience our video player, progress tracking, and interactive content system
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Award className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Complete Platform</h3>
                            <p className="text-muted-foreground">
                                Navigate through courses, modules, and lessons just like a real subscription
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Download className="w-8 h-8 text-purple-600" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Full Features</h3>
                            <p className="text-muted-foreground">
                                Access all platform features including downloads, certificates, and progress tracking
                            </p>
                        </div>
                    </div>
                </div>

                {/* Trust Indicators */}
                <div className="text-center bg-gradient-to-r from-blue-600 to-purple-700 text-foreground rounded-2xl p-8">
                    <h2 className="text-2xl font-bold mb-4">Experience Egyptian EdTech Innovation</h2>
                    <p className="text-xl mb-6 text-blue-100">
                        See why thousands choose our platform for their educational journey
                    </p>
                    <div className="flex justify-center items-center gap-8 flex-wrap text-sm">
                        <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-yellow-400" />
                            <span>4.9/5 Student Rating</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>50,000+ Active Learners</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            <span>500+ Expert Courses</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
