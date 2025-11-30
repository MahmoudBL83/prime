'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useLocaleSafe } from '@/hooks/useTranslationsSafe'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  const locale = useLocaleSafe()
  const isArabic = locale === 'ar'
  const [verifying, setVerifying] = useState(true)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    
    if (!sessionId) {
      router.push(`/${locale}/courses`)
      return
    }

    // Verify payment
    const verifyPayment = async () => {
      try {
        const response = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId }),
        })

        if (response.ok) {
          setVerified(true)
          setVerifying(false)
          
          // Redirect to My Learning after 3 seconds
          setTimeout(() => {
            router.push(`/${locale}/my-learning`)
          }, 3000)
        } else {
          setVerifying(false)
        }
      } catch (error) {
        console.error('Payment verification error:', error)
        setVerifying(false)
      }
    }

    verifyPayment()
  }, [searchParams, router, locale])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {verifying ? (
          <div className="text-center space-y-4">
            <Loader2 className="w-16 h-16 mx-auto text-[#0a84ff] animate-spin" />
            <h1 className="text-2xl font-bold text-foreground">
              {isArabic ? 'جاري التحقق من الدفع...' : 'Verifying Payment...'}
            </h1>
            <p className="text-muted-foreground">
              {isArabic ? 'يرجى الانتظار بينما نؤكد اشتراكك' : 'Please wait while we confirm your subscription'}
            </p>
          </div>
        ) : verified ? (
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-foreground">
                {isArabic ? 'مرحباً بك في Prime!' : 'Welcome to Prime!'}
              </h1>
              <p className="text-lg text-muted-foreground">
                {isArabic ? 'اشتراكك الآن نشط' : 'Your subscription is now active'}
              </p>
            </div>
            
            <div className="bg-[#0a84ff]/10 border border-[#0a84ff]/20 rounded-xl p-6 space-y-3">
              <h2 className="font-semibold text-foreground">
                {isArabic ? 'لديك الآن وصول غير محدود إلى:' : 'You now have unlimited access to:'}
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground text-left">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{isArabic ? 'جميع الدورات ومسارات التعلم' : 'All courses and learning paths'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{isArabic ? 'جلسات مباشرة مع المدربين' : 'Live sessions with instructors'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{isArabic ? 'أدوات تفاعلية ومجتمع' : 'Interactive tools and community'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{isArabic ? 'شهادات احترافية' : 'Professional certificates'}</span>
                </li>
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">
              {isArabic ? 'جاري إعادة التوجيه إلى صفحة التعلم الخاصة بك...' : 'Redirecting to your learning dashboard...'}
            </p>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
              <span className="text-4xl">❌</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {isArabic ? 'فشل التحقق' : 'Verification Failed'}
            </h1>
            <p className="text-muted-foreground">
              {isArabic ? 'لم نتمكن من التحقق من دفعتك. يرجى الاتصال بالدعم.' : "We couldn't verify your payment. Please contact support."}
            </p>
            <button
              onClick={() => router.push(`/${locale}/courses`)}
              className="px-6 py-3 bg-[#0a84ff] text-white rounded-full font-semibold hover:bg-[#0a84ff]/90 transition-colors"
            >
              {isArabic ? 'العودة إلى الدورات' : 'Back to Courses'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
