'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { PaymentInterface } from '@/components/payments/PaymentInterface'
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
    CreditCard,
    Smartphone,
    Lock,
    Headphones,
    TrendingUp,
    Clock,
    X
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface FAQItem {
    question: string
    answer: string
}

interface Testimonial {
    name: string
    role: string
    content: string
    rating: number
}

const faqItems: FAQItem[] = [
    {
        question: "What's included in the All-Access Library?",
        answer: "The All-Access Library gives you unlimited access to all Category A courses, including premium content, downloadable resources, certificates of completion, and new courses added monthly."
    },
    {
        question: "How do Creator Channel subscriptions work?",
        answer: "Creator Channel subscriptions allow you to support individual educators while getting exclusive content, direct interaction, early access to new materials, and personalized learning experiences."
    },
    {
        question: "What payment methods do you accept?",
        answer: "We accept all major Egyptian payment methods including credit/debit cards through Paymob, Fawry payments, and Meeza digital wallet."
    },
    {
        question: "Can I cancel my subscription anytime?",
        answer: "Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your current billing period."
    },
    {
        question: "Is there a money-back guarantee?",
        answer: "Yes, we offer a 7-day money-back guarantee. If you're not satisfied with your subscription, contact us within 7 days for a full refund."
    },
    {
        question: "Do you offer student discounts?",
        answer: "Yes, we offer special pricing for students with valid .edu email addresses. Contact our support team to activate your student discount."
    }
]

const testimonials: Testimonial[] = [
    {
        name: "Ahmed Mohamed",
        role: "Engineering Student",
        content: "The All-Access Library transformed my learning experience. I've completed 12 courses in 6 months and landed my dream internship!",
        rating: 5
    },
    {
        name: "Sarah Hassan",
        role: "Professional Developer",
        content: "Creator Channels provide exactly what I need - specialized content from experts I trust. Worth every pound!",
        rating: 5
    },
    {
        name: "Mohamed Ali",
        role: "High School Student",
        content: "The platform helped me prepare for Thanaweya Amma exams. The content is comprehensive and easy to understand.",
        rating: 4
    }
]

export default function SubscribePage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [showPayment, setShowPayment] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<'CATEGORY_A' | 'CATEGORY_C'>('CATEGORY_A')
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
    const [openFAQ, setOpenFAQ] = useState<number | null>(null)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/login?callbackUrl=/subscribe')
            return
        }
    }, [status, router])

    const handleSubscribe = (plan: 'CATEGORY_A' | 'CATEGORY_C') => {
        setSelectedPlan(plan)
        setShowPayment(true)
    }

    const toggleFAQ = (index: number) => {
        setOpenFAQ(openFAQ === index ? null : index)
    }

    const getCategoryAPrice = () => {
        return billingCycle === 'monthly' ? 199 : 1910 // 20% discount for yearly
    }

    const getCategoryCPrice = () => {
        return billingCycle === 'monthly' ? 79 : 760 // 20% discount for yearly
    }

    if (showPayment) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <PaymentInterface
                    onSuccess={() => {
                        setShowPayment(false)
                        // Refresh page to show updated subscription status
                        window.location.reload()
                    }}
                    onError={(error: string) => {
                        console.error('Payment error:', error)
                        setShowPayment(false)
                    }}
                />
            </div>
        )
    }

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p>Loading subscription options...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-700 text-foreground">
                <div className="absolute inset-0 bg-background opacity-10"></div>
                <div className="relative max-w-6xl mx-auto px-4 py-20 text-center">
                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                        Unlock Your Learning Potential
                    </h1>
                    <p className="text-xl md:text-2xl mb-8 text-blue-100">
                        Choose the perfect plan for your educational journey
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            <span>Secure Payment</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            <span>7-Day Money Back</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Headphones className="w-5 h-5" />
                            <span>24/7 Support</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex items-center justify-center gap-4 mb-8">
                    <span className={`text-lg font-medium ${billingCycle === 'monthly' ? 'text-blue-600' : 'text-muted-foreground'}`}>
                        Monthly
                    </span>
                    <button
                        onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                        className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                    <span className={`text-lg font-medium ${billingCycle === 'yearly' ? 'text-blue-600' : 'text-muted-foreground'}`}>
                        Yearly <Badge className="ml-2 bg-green-600">Save 20%</Badge>
                    </span>
                </div>

                {/* Pricing Tiers */}
                <div className="grid gap-8 lg:grid-cols-2 mb-16">
                    {/* Category A - All-Access Library */}
                    <Card className="relative overflow-hidden border-2 border-blue-200 hover:border-blue-400 transition-all duration-300">
                        <div className="absolute top-0 right-0 bg-blue-600 text-foreground px-4 py-1 rounded-bl-lg">
                            <Badge className="bg-blue-600">Most Popular</Badge>
                        </div>
                        <CardHeader className="text-center pb-8">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="w-8 h-8 text-blue-600" />
                            </div>
                            <CardTitle className="text-2xl font-bold">All-Access Library</CardTitle>
                            <p className="text-muted-foreground">Complete access to premium learning content</p>
                            <div className="mt-4">
                                <span className="text-4xl font-bold">EGP {getCategoryAPrice()}</span>
                                <span className="text-muted-foreground">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span>Unlimited access to 500+ courses</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span>Premium certificates of completion</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span>Downloadable resources & materials</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span>New courses added monthly</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span>Mobile app access</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span>Priority customer support</span>
                                </li>
                            </ul>
                            <Button
                                onClick={() => handleSubscribe('CATEGORY_A')}
                                className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
                                size="lg"
                            >
                                Subscribe Now
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Category C - Creator Channels */}
                    <Card className="relative overflow-hidden border-2 border-green-200 hover:border-green-400 transition-all duration-300">
                        <CardHeader className="text-center pb-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-green-600" />
                            </div>
                            <CardTitle className="text-2xl font-bold">Creator Channels</CardTitle>
                            <p className="text-muted-foreground">Support creators, get exclusive content</p>
                            <div className="mt-4">
                                <span className="text-4xl font-bold">EGP {getCategoryCPrice()}</span>
                                <span className="text-muted-foreground">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-3">
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span>Exclusive creator content</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span>Direct creator interaction</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span>Early access to new content</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span>Live Q&A sessions</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span>Community access</span>
                                </li>
                                <li className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span>Support independent educators</span>
                                </li>
                            </ul>
                            <Button
                                onClick={() => handleSubscribe('CATEGORY_C')}
                                className="w-full mt-6 bg-green-600 hover:bg-green-700"
                                size="lg"
                            >
                                Subscribe Now
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Feature Comparison */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-center mb-8">Compare Plans</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-border rounded-lg overflow-hidden">
                            <thead>
                                <tr className="bg-background">
                                    <th className="border border-border px-6 py-4 text-left">Features</th>
                                    <th className="border border-border px-6 py-4 text-center">All-Access Library</th>
                                    <th className="border border-border px-6 py-4 text-center">Creator Channels</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border border-border px-6 py-4">Course Access</td>
                                    <td className="border border-border px-6 py-4 text-center">500+ courses</td>
                                    <td className="border border-border px-6 py-4 text-center">Creator-specific content</td>
                                </tr>
                                <tr className="bg-background">
                                    <td className="border border-border px-6 py-4">Price Range</td>
                                    <td className="border border-border px-6 py-4 text-center">EGP 199/month</td>
                                    <td className="border border-border px-6 py-4 text-center">EGP 79/month</td>
                                </tr>
                                <tr>
                                    <td className="border border-border px-6 py-4">Certificates</td>
                                    <td className="border border-border px-6 py-4 text-center">✅ Premium certificates</td>
                                    <td className="border border-border px-6 py-4 text-center">✅ Creator certificates</td>
                                </tr>
                                <tr className="bg-background">
                                    <td className="border border-border px-6 py-4">Creator Interaction</td>
                                    <td className="border border-border px-6 py-4 text-center">Limited</td>
                                    <td className="border border-border px-6 py-4 text-center">✅ Direct access</td>
                                </tr>
                                <tr>
                                    <td className="border border-border px-6 py-4">Downloadable Content</td>
                                    <td className="border border-border px-6 py-4 text-center">✅ Unlimited</td>
                                    <td className="border border-border px-6 py-4 text-center">✅ Creator content</td>
                                </tr>
                                <tr className="bg-background">
                                    <td className="border border-border px-6 py-4">Mobile Access</td>
                                    <td className="border border-border px-6 py-4 text-center">✅ Full app access</td>
                                    <td className="border border-border px-6 py-4 text-center">✅ Full app access</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Trust Indicators */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-center mb-8">Trusted by Egyptian Learners</h2>
                    <div className="grid gap-8 md:grid-cols-3 mb-12">
                        {testimonials.map((testimonial, index) => (
                            <Card key={index} className="text-center">
                                <CardContent className="pt-6">
                                    <div className="flex justify-center mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-5 h-5 ${i < testimonial.rating ? 'text-yellow-500 fill-current' : 'text-muted-foreground'}`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
                                    <div>
                                        <p className="font-semibold">{testimonial.name}</p>
                                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Payment methods logos removed as requested */}
                </div>

                {/* FAQ Section */}
                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
                    <div className="max-w-3xl mx-auto space-y-4">
                        {faqItems.map((faq, index) => (
                            <Card key={index} className="cursor-pointer">
                                <CardContent
                                    className="pt-6"
                                    onClick={() => toggleFAQ(index)}
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-semibold">{faq.question}</h3>
                                        <Button variant="ghost" size="sm">
                                            {openFAQ === index ? (
                                                <X className="w-4 h-4" />
                                            ) : (
                                                <TrendingUp className="w-4 h-4" />
                                            )}
                                        </Button>
                                    </div>
                                    {openFAQ === index && (
                                        <p className="text-muted-foreground mt-4">{faq.answer}</p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* Final CTA */}
                <div className="text-center bg-gradient-to-r from-blue-600 to-purple-700 text-foreground rounded-2xl p-12 mb-16">
                    <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
                    <p className="text-xl mb-8 text-blue-100">
                        Join thousands of Egyptian students advancing their education
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button
                            onClick={() => handleSubscribe('CATEGORY_A')}
                            size="lg"
                            variant="secondary"
                            className="bg-background text-blue-600 hover:bg-card-hover"
                        >
                            Get All-Access Library
                        </Button>
                        <Button
                            onClick={() => handleSubscribe('CATEGORY_C')}
                            size="lg"
                            variant="outline"
                            className="border-white text-foreground hover:bg-background hover:text-blue-600"
                        >
                            Explore Creator Channels
                        </Button>
                    </div>
                    <p className="mt-6 text-sm text-blue-200">
                        7-day money-back guarantee • Cancel anytime • Secure payment
                    </p>
                </div>
            </div>
        </div>
    )
}
