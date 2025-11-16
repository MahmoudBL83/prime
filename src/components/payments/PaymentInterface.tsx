'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import dynamic from 'next/dynamic'

// Dynamic icon imports for better performance
const IconComponents = {
    CreditCard: dynamic(() => import('lucide-react').then(mod => ({ default: mod.CreditCard })), {
        ssr: false,
        loading: () => <div className="w-4 h-4 animate-pulse bg-gray-300 rounded" />
    }),
    Loader2: dynamic(() => import('lucide-react').then(mod => ({ default: mod.Loader2 })), {
        ssr: false,
        loading: () => <div className="w-4 h-4 animate-pulse bg-gray-300 rounded" />
    }),
    CheckCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.CheckCircle })), {
        ssr: false,
        loading: () => <div className="w-4 h-4 animate-pulse bg-gray-300 rounded" />
    }),
    XCircle: dynamic(() => import('lucide-react').then(mod => ({ default: mod.XCircle })), {
        ssr: false,
        loading: () => <div className="w-4 h-4 animate-pulse bg-gray-300 rounded" />
    }),
}

const paymentSchema = z.object({
    subscriptionType: z.enum(['CATEGORY_A', 'CATEGORY_C']),
    channelId: z.string().optional(),
    amount: z.number().min(1, 'Amount must be greater than 0'),
    currency: z.string(),
})

type PaymentForm = {
    subscriptionType: 'CATEGORY_A' | 'CATEGORY_C'
    channelId?: string
    amount: number
    currency: string
}

interface PaymentInterfaceProps {
    onSuccess?: () => void
    onError?: (error: string) => void
}

export function PaymentInterface({ onSuccess, onError }: PaymentInterfaceProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success' | 'error'>('form')
    const [paymentData, setPaymentData] = useState<any>(null)
    const [iframeUrl, setIframeUrl] = useState<string>('')

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        setValue,
    } = useForm<PaymentForm>({
        resolver: zodResolver(paymentSchema),
        defaultValues: {
            subscriptionType: 'CATEGORY_A',
            channelId: '',
            amount: 99, // Default amount for Category A
            currency: 'EGP',
        },
    })

    const subscriptionType = watch('subscriptionType')

    // Update amount based on subscription type
    const handleSubscriptionTypeChange = (type: 'CATEGORY_A' | 'CATEGORY_C') => {
        setValue('subscriptionType', type)
        setValue('amount', type === 'CATEGORY_A' ? 99 : 49) // Different pricing for categories
    }

    const onSubmit = async (data: PaymentForm) => {
        setIsLoading(true)
        try {
            const response = await fetch('/api/payments/initiate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to initiate payment')
            }

            setPaymentData(result)
            setIframeUrl(result.iframeUrl)
            setPaymentStep('processing')

            // Set up message listener for iframe communication
            window.addEventListener('message', handlePaymentMessage)

            // Open payment in new window for better UX
            const paymentWindow = window.open(result.iframeUrl, '_blank', 'width=600,height=700')

            if (!paymentWindow) {
                // Fallback: show iframe in modal
                setPaymentStep('processing')
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Payment initiation failed'
            toast.error(errorMessage)
            onError?.(errorMessage)
            setPaymentStep('error')
        } finally {
            setIsLoading(false)
        }
    }

    const handlePaymentMessage = (event: MessageEvent) => {
        // Verify the message origin (security check)
        if (!event.origin.includes('paymob.com')) {
            return
        }

        try {
            const data = JSON.parse(event.data)

            if (data.success) {
                setPaymentStep('success')
                onSuccess?.()
                toast.success('Payment successful! Your subscription is now active.')
                setTimeout(() => router.push('/dashboard'), 2000)
            } else {
                setPaymentStep('error')
                onError?.('Payment failed')
                toast.error('Payment failed. Please try again.')
            }

            // Clean up event listener
            window.removeEventListener('message', handlePaymentMessage)
        } catch (error) {
            console.error('Error processing payment message:', error)
        }
    }

    const checkPaymentStatus = async () => {
        if (!paymentData?.orderId) return

        try {
            const response = await fetch('/api/payments/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ transactionId: paymentData.orderId }),
            })

            const result = await response.json()

            if (result.success) {
                setPaymentStep('success')
                onSuccess?.()
                toast.success('Payment successful! Your subscription is now active.')
                setTimeout(() => router.push('/dashboard'), 2000)
            }
        } catch (error) {
            console.error('Error checking payment status:', error)
        }
    }

    const resetPayment = () => {
        setPaymentStep('form')
        setPaymentData(null)
        setIframeUrl('')
    }

    if (paymentStep === 'processing') {
        return (
            <div className="max-w-md w-full mx-auto p-6 bg-background rounded-lg shadow-lg">
                <div className="text-center">
                    <Suspense fallback={<div className="w-12 h-12 animate-pulse bg-gray-300 rounded mx-auto mb-4" />}>
                        <IconComponents.Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-blue-600" />
                    </Suspense>
                    <h3 className="text-lg font-semibold mb-2">Processing Payment</h3>
                    <p className="text-muted-foreground mb-4">
                        Please complete your payment in the new window. Do not close this page.
                    </p>

                    {iframeUrl && (
                        <div className="mt-4">
                            <p className="text-sm text-muted-foreground mb-2">
                                If the payment window didn't open, you can pay here:
                            </p>
                            <button
                                onClick={() => window.open(iframeUrl, '_blank')}
                                className="w-full bg-blue-600 text-foreground py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Open Payment Window
                            </button>
                        </div>
                    )}

                    <div className="mt-6 space-y-2">
                        <button
                            onClick={checkPaymentStatus}
                            className="w-full bg-green-600 text-foreground py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                        >
                            I've Completed Payment
                        </button>

                        <button
                            onClick={resetPayment}
                            className="w-full bg-gray-600 text-foreground py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                        >
                            Cancel Payment
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (paymentStep === 'success') {
        return (
            <div className="max-w-md w-full mx-auto p-6 bg-background rounded-lg shadow-lg">
                <div className="text-center">
                    <Suspense fallback={<div className="w-16 h-16 animate-pulse bg-gray-300 rounded mx-auto mb-4" />}>
                        <IconComponents.CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
                    </Suspense>
                    <h3 className="text-xl font-semibold mb-2 text-green-600">Payment Successful!</h3>
                    <p className="text-muted-foreground mb-4">
                        Your subscription has been activated successfully.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Redirecting to dashboard...
                    </p>
                </div>
            </div>
        )
    }

    if (paymentStep === 'error') {
        return (
            <div className="max-w-md w-full mx-auto p-6 bg-background rounded-lg shadow-lg">
                <div className="text-center">
                    <Suspense fallback={<div className="w-16 h-16 animate-pulse bg-gray-300 rounded mx-auto mb-4" />}>
                        <IconComponents.XCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
                    </Suspense>
                    <h3 className="text-xl font-semibold mb-2 text-red-600">Payment Failed</h3>
                    <p className="text-muted-foreground mb-4">
                        There was an issue processing your payment. Please try again.
                    </p>
                    <button
                        onClick={resetPayment}
                        className="w-full bg-blue-600 text-foreground py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-md w-full mx-auto p-6 bg-background rounded-lg shadow-lg">
            <div className="text-center mb-6">
                <Suspense fallback={<div className="w-12 h-12 animate-pulse bg-gray-300 rounded mx-auto mb-4" />}>
                    <IconComponents.CreditCard className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                </Suspense>
                <h3 className="text-xl font-semibold">Complete Your Subscription</h3>
                <p className="text-muted-foreground">Choose your subscription plan and proceed to payment</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
                {/* Subscription Type Selection */}
                <div>
                    <label className="block text-sm font-medium text-foreground mb-3">
                        Subscription Type
                    </label>
                    <div className="space-y-3">
                        <button
                            type="button"
                            onClick={() => handleSubscriptionTypeChange('CATEGORY_A')}
                            className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${subscriptionType === 'CATEGORY_A'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-border hover:border-border'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold">All-Access Library</h4>
                                    <p className="text-sm text-muted-foreground">Access to all Category A courses</p>
                                    <p className="text-lg font-bold text-blue-600 mt-1">EGP 99/month</p>
                                </div>
                                {subscriptionType === 'CATEGORY_A' && (
                                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-background rounded-full"></div>
                                    </div>
                                )}
                            </div>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleSubscriptionTypeChange('CATEGORY_C')}
                            className={`w-full p-4 border-2 rounded-lg text-left transition-colors ${subscriptionType === 'CATEGORY_C'
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-border hover:border-border'
                                }`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h4 className="font-semibold">Mentor Channel</h4>
                                    <p className="text-sm text-muted-foreground">Access to specific mentor content</p>
                                    <p className="text-lg font-bold text-blue-600 mt-1">EGP 49/month</p>
                                </div>
                                {subscriptionType === 'CATEGORY_C' && (
                                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                        <div className="w-2 h-2 bg-background rounded-full"></div>
                                    </div>
                                )}
                            </div>
                        </button>
                    </div>
                </div>

                {/* Channel Selection (only for Category C) */}
                {subscriptionType === 'CATEGORY_C' && (
                    <div>
                        <label htmlFor="channelId" className="block text-sm font-medium text-foreground">
                            Select Mentor Channel
                        </label>
                        <select
                            {...register('channelId', { required: subscriptionType === 'CATEGORY_C' })}
                            className="mt-1 block w-full border border-border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Choose a channel...</option>
                            {/* This should be populated with available channels */}
                            <option value="channel-1">Example Mentor Channel</option>
                            <option value="channel-2">Another Mentor Channel</option>
                        </select>
                        {errors.channelId && (
                            <p className="mt-1 text-sm text-red-600">{errors.channelId.message}</p>
                        )}
                    </div>
                )}

                {/* Amount Display */}
                <div>
                    <label className="block text-sm font-medium text-foreground">
                        Amount
                    </label>
                    <div className="mt-1 relative">
                        <span className="absolute left-3 top-2 text-muted-foreground">EGP</span>
                        <input
                            type="number"
                            {...register('amount', { required: true, min: 1 })}
                            className="block w-full pl-12 pr-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            readOnly
                        />
                    </div>
                    {errors.amount && (
                        <p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
                    )}
                </div>

                {/* Hidden currency field */}
                <input type="hidden" {...register('currency')} />

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-foreground bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <>
                            <Suspense fallback={<div className="w-4 h-4 animate-pulse bg-gray-300 rounded mr-2" />}>
                                <IconComponents.Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            </Suspense>
                            Processing...
                        </>
                    ) : (
                        <>
                            <Suspense fallback={<div className="w-4 h-4 animate-pulse bg-gray-300 rounded mr-2" />}>
                                <IconComponents.CreditCard className="w-4 h-4 mr-2" />
                            </Suspense>
                            Proceed to Payment
                        </>
                    )}
                </button>

                {/* Security Note */}
                <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                        🔒 Secure payment powered by Paymob. Your payment information is encrypted and secure.
                    </p>
                </div>
            </form>
        </div>
    )
}
