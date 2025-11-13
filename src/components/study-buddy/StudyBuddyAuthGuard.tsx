import React from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserPlus, Users, MessageSquare } from 'lucide-react'
import Link from 'next/link'

interface AuthGuardProps {
    children: React.ReactNode
}

export function StudyBuddyAuthGuard({ children }: AuthGuardProps) {
    const { data: session, status } = useSession()

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        )
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-foreground mb-4">
                            Find Your Perfect Study Buddy
                        </h1>
                        <p className="text-xl text-muted-foreground mb-8">
                            Connect with fellow learners, share knowledge, and achieve your goals together
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                        <Card className="text-center">
                            <CardHeader>
                                <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                                <CardTitle>Smart Matching</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    Our advanced algorithm matches you with compatible study partners based on your interests, goals, and learning style.
                                </CardDescription>
                            </CardContent>
                        </Card>

                        <Card className="text-center">
                            <CardHeader>
                                <MessageSquare className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                                <CardTitle>Collaborative Learning</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    Chat, schedule study sessions, and work together with video calls and screen sharing.
                                </CardDescription>
                            </CardContent>
                        </Card>

                        <Card className="text-center">
                            <CardHeader>
                                <UserPlus className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                                <CardTitle>Track Progress</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <CardDescription>
                                    Monitor your learning progress, earn achievements, and stay motivated with your study buddy.
                                </CardDescription>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="max-w-md mx-auto">
                        <CardHeader className="text-center">
                            <CardTitle>Ready to Get Started?</CardTitle>
                            <CardDescription>
                                Join thousands of learners already studying together
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Link href="/auth/login" className="w-full">
                                <Button className="w-full" size="lg">
                                    Sign In to Find Study Buddies
                                </Button>
                            </Link>
                            <Link href="/auth/register" className="w-full">
                                <Button variant="outline" className="w-full" size="lg">
                                    Create New Account
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return <>{children}</>
}