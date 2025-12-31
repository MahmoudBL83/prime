'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    X,
    Clock,
    Video,
    Users,
    CheckCircle,
    AlertCircle
} from 'lucide-react'
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
            description: isArabic ? 'جلسة أسئلة وأجوبة مع مجموعة' : 'Group Q&A session',
            duration: 45,
            price: groupQaPrice,
            tier: 'ALL_ACCESS',
            available: !!currentSubscription
        },
        {
            type: 'WORKSHOP' as const,
            icon: Users,
            title: isArabic ? 'ورشة عمل' : 'Workshop',
            description: isArabic ? 'ورشة عمل جماعية' : 'Group workshop',
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

    const handleClose = () => {
        setStep('type')
        onClose()
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center font-sans">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="absolute inset-0 bg-black/95"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ opacity: 0, y: 40, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 40, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="relative z-10 w-full max-w-xl mx-4 my-8 bg-[#1a1a1a] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-[#2d2d2d]">
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {isArabic ? 'حجز جلسة' : 'Book a Session'}
                            </h2>
                            <p className="text-[#86868b] text-sm mt-1">
                                {step === 'type' && (isArabic ? 'اختر نوع الجلسة' : 'Choose session type')}
                                {step === 'slots' && (isArabic ? 'اختر الموعد' : 'Select date & time')}
                                {step === 'confirm' && (isArabic ? 'تأكيد الحجز' : 'Confirm details')}
                            </p>
                        </div>
                        <button
                            onClick={handleClose}
                            className="w-8 h-8 rounded-full bg-[#2d2d2d] hover:bg-[#3d3d3d] flex items-center justify-center transition-all"
                        >
                            <X className="w-4 h-4 text-white/80" />
                        </button>
                    </div>

                    {/* Content Scrollable Area */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-[#3d3d3d] scrollbar-track-transparent">

                        {/* Step 1: Choose Meeting Type */}
                        {step === 'type' && (
                            <div className="space-y-4">
                                {meetingTypes.map((type) => (
                                    <button
                                        key={type.type}
                                        onClick={() => type.available && setMeetingType(type.type)}
                                        disabled={!type.available}
                                        className={`w-full relative p-4 rounded-xl border transition-all text-left flex items-start gap-4 hover:shadow-lg ${meetingType === type.type
                                            ? 'bg-[#2d2d2d] border-[#0071e3] shadow-[0_0_15px_rgba(0,113,227,0.15)]'
                                            : 'bg-[#252525] border-[#333] hover:border-[#444]'
                                            } ${!type.available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <div className={`p-3 rounded-lg ${meetingType === type.type ? 'bg-[#0071e3]/20' : 'bg-[#333]'
                                            }`}>
                                            <type.icon className={`w-6 h-6 ${meetingType === type.type ? 'text-[#0071e3]' : 'text-[#86868b]'
                                                }`} />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-1">
                                                <h4 className={`font-semibold ${meetingType === type.type ? 'text-white' : 'text-gray-300'
                                                    }`}>{type.title}</h4>
                                                <span className="font-bold text-[#0071e3]">€{type.price}</span>
                                            </div>
                                            <p className="text-sm text-[#86868b] mb-2">{type.description}</p>
                                            <div className="flex items-center gap-2 text-xs text-[#666]">
                                                <Clock className="w-3 h-3" />
                                                {type.duration} {isArabic ? 'دقيقة' : 'min'}
                                            </div>
                                        </div>
                                        {!type.available && (
                                            <div className="absolute top-4 right-4 bg-[#2d2d2d] border border-[#3d3d3d] px-2 py-1 rounded-md text-[10px] text-[#86868b]">
                                                LOCKED
                                            </div>
                                        )}
                                    </button>
                                ))}

                                {!currentSubscription && (
                                    <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-200/80 text-sm mt-4">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div>
                                            {isArabic
                                                ? 'يجب الاشتراك مع المدرب لحجز الجلسات'
                                                : 'You must be subscribed to this mentor to book sessions.'}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Choose Date & Time */}
                        {step === 'slots' && (
                            <div className="space-y-6">
                                {/* Date Selection */}
                                <div>
                                    <h3 className="text-sm font-medium text-[#86868b] mb-3 uppercase tracking-wider">
                                        {isArabic ? 'التاريخ' : 'Date'}
                                    </h3>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                        {getNextDays().map((day) => (
                                            <button
                                                key={day.value}
                                                onClick={() => setSelectedDate(day.value)}
                                                className={`p-3 rounded-lg text-center text-sm transition-all border ${selectedDate === day.value
                                                    ? 'bg-[#0071e3] border-[#0071e3] text-white'
                                                    : 'bg-[#2d2d2d] border-[#3d3d3d] text-[#86868b] hover:bg-[#3d3d3d]'
                                                    }`}
                                            >
                                                {day.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Time Selection */}
                                {selectedDate && (
                                    <div>
                                        <h3 className="text-sm font-medium text-[#86868b] mb-3 uppercase tracking-wider">
                                            {isArabic ? 'الوقت المتاح' : 'Available Slots'}
                                        </h3>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                            {availableSlots.map((slot) => (
                                                <button
                                                    key={slot.id}
                                                    onClick={() => slot.available && setSelectedSlot(slot)}
                                                    disabled={!slot.available}
                                                    className={`p-3 rounded-lg text-sm transition-all border ${selectedSlot?.id === slot.id
                                                        ? 'bg-[#0071e3] border-[#0071e3] text-white'
                                                        : slot.available
                                                            ? 'bg-[#2d2d2d] border-[#3d3d3d] text-white hover:bg-[#3d3d3d]'
                                                            : 'bg-[#252525] border-[#2d2d2d] text-[#666] cursor-not-allowed opacity-50'
                                                        }`}
                                                >
                                                    {slot.start}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Confirm */}
                        {step === 'confirm' && selectedSlot && (
                            <div className="bg-[#2d2d2d] rounded-xl border border-[#3d3d3d] p-6 space-y-4">
                                <div className="flex items-center justify-between pb-4 border-b border-[#3d3d3d]">
                                    <span className="text-[#86868b]">{isArabic ? 'المدرب' : 'Mentor'}</span>
                                    <span className="font-semibold text-white">{mentorName}</span>
                                </div>
                                <div className="flex items-center justify-between pb-4 border-b border-[#3d3d3d]">
                                    <span className="text-[#86868b]">{isArabic ? 'النوع' : 'Type'}</span>
                                    <span className="font-semibold text-white">{selectedMeetingType?.title}</span>
                                </div>
                                <div className="flex items-center justify-between pb-4 border-b border-[#3d3d3d]">
                                    <span className="text-[#86868b]">{isArabic ? 'التاريخ' : 'Date'}</span>
                                    <span className="font-semibold text-white">
                                        {new Date(selectedDate).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
                                            weekday: 'short', month: 'short', day: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between pb-4 border-b border-[#3d3d3d]">
                                    <span className="text-[#86868b]">{isArabic ? 'الوقت' : 'Time'}</span>
                                    <span className="font-semibold text-white">{selectedSlot.start}</span>
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                    <span className="text-white font-medium">{isArabic ? 'الإجمالي' : 'Total'}</span>
                                    <span className="text-2xl font-bold text-[#0071e3]">€{selectedMeetingType?.price}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-[#2d2d2d] flex gap-3">
                        {step !== 'type' && (
                            <button
                                onClick={() => setStep(step === 'confirm' ? 'slots' : 'type')}
                                disabled={loading}
                                className="px-6 py-3.5 rounded-xl border border-[#3d3d3d] text-white hover:bg-[#2d2d2d] transition-all font-semibold disabled:opacity-50"
                            >
                                {isArabic ? 'رجوع' : 'Back'}
                            </button>
                        )}
                        <button
                            onClick={() => {
                                if (step === 'type') setStep('slots')
                                else if (step === 'slots') setStep('confirm')
                                else handleBooking()
                            }}
                            disabled={
                                (step === 'type' && !selectedMeetingType?.available) ||
                                (step === 'slots' && !selectedSlot) ||
                                loading
                            }
                            className={`flex-1 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white py-3.5 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {loading
                                ? (isArabic ? 'جاري المعالجة...' : 'Processing...')
                                : step === 'confirm'
                                    ? (isArabic ? 'تأكيد الحجز' : 'Confirm Booking')
                                    : (isArabic ? 'التالي' : 'Next')
                            }
                        </button>
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    )
}
