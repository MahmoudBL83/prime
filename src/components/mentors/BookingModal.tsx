'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X,
    Calendar,
    Clock,
    Video,
    Users,
    CheckCircle,
    Crown,
    AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'react-hot-toast'

interface BookingModalProps {
    isOpen: boolean
    onClose: () => void
    mentorId: string
    mentorName: string
    isArabic: boolean
    currentSubscription: string | null
    monthlyPrice?: number // Single tier in EUR
}

interface TimeSlot {
    id: string
    start: string
    end: string
    available: boolean
}

export function BookingModal({
    isOpen,
    onClose,
    mentorId,
    mentorName,
    isArabic,
    currentSubscription,
    monthlyPrice = 29 // Default EUR
}: BookingModalProps) {
    const { data: session } = useSession()
    const [step, setStep] = useState<'type' | 'slots' | 'confirm'>('type')
    const [meetingType, setMeetingType] = useState<'ONE_ON_ONE' | 'GROUP_QA' | 'WORKSHOP'>('ONE_ON_ONE')
    const [selectedDate, setSelectedDate] = useState<string>('')
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
    const [loading, setLoading] = useState(false)
    const [bookingDetails, setBookingDetails] = useState({
        title: '',
        description: ''
    })

    // Calculate session prices based on monthlyPrice (single tier in EUR)
    const oneOnOnePrice = monthlyPrice // Full session price
    const groupQaPrice = Math.round(monthlyPrice * 0.3) // 30% of monthly
    const workshopPrice = Math.round(monthlyPrice * 0.5) // 50% of monthly

    // Meeting type configurations
    const meetingTypes = [
        {
            type: 'ONE_ON_ONE' as const,
            icon: Video,
            title: isArabic ? 'جلسة فردية' : '1:1 Session',
            description: isArabic ? 'جلسة خاصة مع المدرب' : 'Private session with mentor',
            duration: 60,
            price: oneOnOnePrice,
            tier: 'ALL_ACCESS',
            available: !!currentSubscription
        },
        {
            type: 'GROUP_QA' as const,
            icon: Users,
            title: isArabic ? 'جلسة أسئلة جماعية' : 'Group Q&A',
            description: isArabic ? 'جلسة أسئلة وأجوبة مع مجموعة' : 'Q&A session with a group',
            duration: 45,
            price: groupQaPrice,
            tier: 'ALL_ACCESS',
            available: !!currentSubscription
        },
        {
            type: 'WORKSHOP' as const,
            icon: Users,
            title: isArabic ? 'ورشة عمل' : 'Workshop',
            description: isArabic ? 'ورشة عمل جماعية' : 'Group workshop session',
            duration: 90,
            price: workshopPrice,
            tier: 'ALL_ACCESS',
            available: !!currentSubscription
        }
    ]

    const selectedMeetingType = meetingTypes.find(t => t.type === meetingType)

    // Generate next 7 days for date selection
    const getNextDays = () => {
        const days = []
        for (let i = 1; i <= 7; i++) {
            const date = new Date()
            date.setDate(date.getDate() + i)
            days.push({
                value: date.toISOString().split('T')[0],
                label: date.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                })
            })
        }
        return days
    }

    // Fetch available time slots when date is selected
    useEffect(() => {
        if (selectedDate) {
            fetchAvailableSlots()
        }
    }, [selectedDate, meetingType])

    const fetchAvailableSlots = async () => {
        try {
            const response = await fetch(
                `/api/instructors/${mentorId}/meetings/slots?date=${selectedDate}&type=${meetingType}`
            )
            if (response.ok) {
                const data = await response.json()
                setAvailableSlots(data.slots || generateDefaultSlots())
            } else {
                // Fallback to default slots
                setAvailableSlots(generateDefaultSlots())
            }
        } catch (error) {
            console.error('Error fetching slots:', error)
            setAvailableSlots(generateDefaultSlots())
        }
    }

    // Generate default time slots (9 AM - 5 PM)
    const generateDefaultSlots = (): TimeSlot[] => {
        const slots: TimeSlot[] = []
        for (let hour = 9; hour <= 17; hour++) {
            slots.push({
                id: `${selectedDate}-${hour}:00`,
                start: `${hour.toString().padStart(2, '0')}:00`,
                end: `${(hour + 1).toString().padStart(2, '0')}:00`,
                available: true
            })
        }
        return slots
    }

    const handleBooking = async () => {
        if (!session) {
            toast.error(isArabic ? 'يرجى تسجيل الدخول' : 'Please sign in')
            return
        }

        if (!selectedSlot) {
            toast.error(isArabic ? 'يرجى اختيار وقت' : 'Please select a time slot')
            return
        }

        setLoading(true)
        try {
            const scheduledAt = new Date(`${selectedDate}T${selectedSlot.start}`)

            const response = await fetch('/api/meetings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creatorId: mentorId,
                    title: bookingDetails.title || `${selectedMeetingType?.title} with ${mentorName}`,
                    description: bookingDetails.description,
                    scheduledAt: scheduledAt.toISOString(),
                    duration: selectedMeetingType?.duration || 60,
                    meetingType: meetingType,
                    price: selectedMeetingType?.price || 0
                })
            })

            if (response.ok) {
                const data = await response.json()
                toast.success(isArabic ? 'تم الحجز بنجاح!' : 'Booking confirmed!')
                onClose()
                // Redirect to meetings page
                window.location.href = '/dashboard/meetings'
            } else {
                const error = await response.json()
                toast.error(error.error || (isArabic ? 'فشل الحجز' : 'Booking failed'))
            }
        } catch (error) {
            console.error('Booking error:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-background border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-background z-10">
                        <h2 className="text-2xl font-bold text-foreground">
                            {isArabic ? 'حجز جلسة' : 'Book a Session'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-card-hover rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>

                    <div className="p-6">
                        {/* Step 1: Choose Meeting Type */}
                        {step === 'type' && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg text-foreground mb-4">
                                    {isArabic ? 'اختر نوع الجلسة' : 'Choose Session Type'}
                                </h3>
                                <div className="grid gap-4">
                                    {meetingTypes.map((type) => (
                                        <button
                                            key={type.type}
                                            onClick={() => type.available && setMeetingType(type.type)}
                                            disabled={!type.available}
                                            className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                                                meetingType === type.type
                                                    ? 'border-purple-500 bg-purple-500/10'
                                                    : 'border-border hover:border-purple-500/50'
                                            } ${!type.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        >
                                            {!type.available && (
                                                <div className="absolute top-2 right-2">
                                                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                                        <Crown className="w-3 h-3 mr-1" />
                                                        {isArabic ? 'اشترك' : 'Subscribe'}
                                                    </Badge>
                                                </div>
                                            )}
                                            <div className="flex items-start gap-4">
                                                <div className="p-3 rounded-lg bg-purple-500/20">
                                                    <type.icon className="w-6 h-6 text-purple-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-foreground mb-1">{type.title}</h4>
                                                    <p className="text-sm text-muted-foreground mb-2">{type.description}</p>
                                                    <div className="flex items-center gap-4 text-sm">
                                                        <span className="flex items-center gap-1 text-muted-foreground">
                                                            <Clock className="w-4 h-4" />
                                                            {type.duration} {isArabic ? 'دقيقة' : 'min'}
                                                        </span>
                                                        <span className="font-bold text-purple-400">
                                                            €{type.price}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {!currentSubscription && (
                                    <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
                                        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-foreground font-medium mb-1">
                                                {isArabic ? 'اشترك للوصول' : 'Subscribe for Access'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {isArabic
                                                    ? 'اشترك في قناة المدرب لحجز الجلسات والوصول للمحتوى الحصري'
                                                    : 'Subscribe to the mentor\'s channel to book sessions and access exclusive content'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        onClick={onClose}
                                        variant="outline"
                                        className="border-border"
                                    >
                                        {isArabic ? 'إلغاء' : 'Cancel'}
                                    </Button>
                                    <Button
                                        onClick={() => setStep('slots')}
                                        disabled={!selectedMeetingType?.available}
                                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                                    >
                                        {isArabic ? 'التالي' : 'Next'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Choose Date & Time */}
                        {step === 'slots' && (
                            <div className="space-y-6">
                                <button
                                    onClick={() => setStep('type')}
                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                                >
                                    ← {isArabic ? 'رجوع' : 'Back'}
                                </button>

                                <div>
                                    <h3 className="font-semibold text-lg text-foreground mb-4">
                                        {isArabic ? 'اختر التاريخ' : 'Choose Date'}
                                    </h3>
                                    <div className="grid grid-cols-7 gap-2">
                                        {getNextDays().map((day) => (
                                            <button
                                                key={day.value}
                                                onClick={() => setSelectedDate(day.value)}
                                                className={`p-3 rounded-lg text-center text-sm transition-all ${
                                                    selectedDate === day.value
                                                        ? 'bg-purple-500 text-white'
                                                        : 'bg-card hover:bg-card-hover text-foreground'
                                                }`}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {selectedDate && (
                                    <div>
                                        <h3 className="font-semibold text-lg text-foreground mb-4">
                                            {isArabic ? 'اختر الوقت' : 'Choose Time'}
                                        </h3>
                                        <div className="grid grid-cols-4 gap-2">
                                            {availableSlots.map((slot) => (
                                                <button
                                                    key={slot.id}
                                                    onClick={() => slot.available && setSelectedSlot(slot)}
                                                    disabled={!slot.available}
                                                    className={`p-3 rounded-lg text-sm transition-all ${
                                                        selectedSlot?.id === slot.id
                                                            ? 'bg-purple-500 text-white'
                                                            : slot.available
                                                            ? 'bg-card hover:bg-card-hover text-foreground'
                                                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                                                    }`}
                                                >
                                                    {slot.start}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        onClick={() => setStep('type')}
                                        variant="outline"
                                        className="border-border"
                                    >
                                        {isArabic ? 'رجوع' : 'Back'}
                                    </Button>
                                    <Button
                                        onClick={() => setStep('confirm')}
                                        disabled={!selectedSlot}
                                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                                    >
                                        {isArabic ? 'التالي' : 'Next'}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Confirm Booking */}
                        {step === 'confirm' && selectedSlot && (
                            <div className="space-y-6">
                                <button
                                    onClick={() => setStep('slots')}
                                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                                >
                                    ← {isArabic ? 'رجوع' : 'Back'}
                                </button>

                                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                                    <h3 className="font-semibold text-lg text-foreground mb-4">
                                        {isArabic ? 'تأكيد الحجز' : 'Confirm Booking'}
                                    </h3>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">{isArabic ? 'المدرب' : 'Mentor'}</span>
                                            <span className="font-semibold text-foreground">{mentorName}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">{isArabic ? 'نوع الجلسة' : 'Session Type'}</span>
                                            <span className="font-semibold text-foreground">{selectedMeetingType?.title}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">{isArabic ? 'التاريخ' : 'Date'}</span>
                                            <span className="font-semibold text-foreground">
                                                {new Date(selectedDate).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">{isArabic ? 'الوقت' : 'Time'}</span>
                                            <span className="font-semibold text-foreground">{selectedSlot.start}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">{isArabic ? 'المدة' : 'Duration'}</span>
                                            <span className="font-semibold text-foreground">{selectedMeetingType?.duration} {isArabic ? 'دقيقة' : 'min'}</span>
                                        </div>
                                        <div className="flex items-center justify-between pt-3 border-t border-border">
                                            <span className="text-muted-foreground font-semibold">{isArabic ? 'الإجمالي' : 'Total'}</span>
                                            <span className="text-xl font-bold text-purple-400">
                                                €{selectedMeetingType?.price}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <Button
                                        onClick={() => setStep('slots')}
                                        variant="outline"
                                        className="border-border"
                                        disabled={loading}
                                    >
                                        {isArabic ? 'رجوع' : 'Back'}
                                    </Button>
                                    <Button
                                        onClick={handleBooking}
                                        disabled={loading}
                                        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        {loading
                                            ? (isArabic ? 'جاري الحجز...' : 'Booking...')
                                            : (isArabic ? 'تأكيد الحجز' : 'Confirm Booking')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}
