'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Gift, Award, Trophy, DollarSign, Star, Loader2, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'react-hot-toast'

interface Reward {
    id: string
    title: string
    titleAr?: string
    description: string
    descriptionAr?: string
    type: 'SCHOLARSHIP' | 'PRIZE' | 'BADGE' | 'CERTIFICATE'
    value?: number
    currency?: string
    maxWinners?: number
    startDate?: string
    endDate?: string
    isActive: boolean
    status: 'UPCOMING' | 'ACTIVE' | 'ENDED'
    currentWinners: number
    courseId?: string
    courseTitle?: string
    courseTitleAr?: string
    imageUrl?: string
}

interface CreateRewardModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    isArabic?: boolean
    rewardToEdit?: Reward | null
}

type RewardType = 'SCHOLARSHIP' | 'PRIZE' | 'BADGE' | 'CERTIFICATE'

export default function CreateRewardModal({ isOpen, onClose, onSuccess, isArabic = false, rewardToEdit }: CreateRewardModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        titleAr: '',
        description: '',
        descriptionAr: '',
        type: 'PRIZE' as RewardType,
        value: '',
        currency: 'EGP',
        maxWinners: '',
        courseId: ''
    })

    useEffect(() => {
        if (isOpen) {
            if (rewardToEdit) {
                setFormData({
                    title: rewardToEdit.title || '',
                    titleAr: rewardToEdit.titleAr || '',
                    description: rewardToEdit.description || '',
                    descriptionAr: rewardToEdit.descriptionAr || '',
                    type: rewardToEdit.type as RewardType,
                    value: rewardToEdit.value ? rewardToEdit.value.toString() : '',
                    currency: rewardToEdit.currency || 'EGP',
                    maxWinners: rewardToEdit.maxWinners ? rewardToEdit.maxWinners.toString() : '',
                    courseId: rewardToEdit.courseId || ''
                })
            } else {
                // Reset for create mode
                setFormData({
                    title: '',
                    titleAr: '',
                    description: '',
                    descriptionAr: '',
                    type: 'PRIZE',
                    value: '',
                    currency: 'EGP',
                    maxWinners: '',
                    courseId: ''
                })
            }
        }
    }, [isOpen, rewardToEdit])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.title || !formData.description) {
            toast.error(isArabic ? 'يرجى ملء الحقول المطلوبة' : 'Please fill required fields')
            return
        }

        setIsLoading(true)
        try {
            const url = rewardToEdit
                ? `/api/creator/rewards/${rewardToEdit.id}`
                : '/api/creator/rewards'

            const method = rewardToEdit ? 'PATCH' : 'POST'

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    value: formData.value ? parseFloat(formData.value) : undefined,
                    maxWinners: formData.maxWinners ? parseInt(formData.maxWinners) : undefined
                })
            })

            if (response.ok) {
                toast.success(
                    isArabic
                        ? (rewardToEdit ? 'تم تحديث المكافأة بنجاح' : 'تم إنشاء المكافأة بنجاح')
                        : (rewardToEdit ? 'Reward updated successfully' : 'Reward created successfully')
                )
                onSuccess()
                onClose()
            } else {
                throw new Error('Failed to save reward')
            }
        } catch (error) {
            console.error('Save reward error:', error)
            toast.error(
                isArabic
                    ? (rewardToEdit ? 'فشل تحديث المكافأة' : 'فشل إنشاء المكافأة')
                    : (rewardToEdit ? 'Failed to update reward' : 'Failed to create reward')
            )
        } finally {
            setIsLoading(false)
        }
    }

    const getTypeIcon = (type: RewardType) => {
        switch (type) {
            case 'SCHOLARSHIP': return <DollarSign className="w-5 h-5" />
            case 'PRIZE': return <Gift className="w-5 h-5" />
            case 'BADGE': return <Award className="w-5 h-5" />
            case 'CERTIFICATE': return <Trophy className="w-5 h-5" />
            default: return <Star className="w-5 h-5" />
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden"
                        dir={isArabic ? 'rtl' : 'ltr'}
                    >
                        <div className="flex items-center justify-between p-6 border-b border-gray-800">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                {rewardToEdit ? (
                                    <Edit className="w-5 h-5 text-purple-500" />
                                ) : (
                                    <Gift className="w-5 h-5 text-purple-500" />
                                )}
                                {isArabic
                                    ? (rewardToEdit ? 'تعديل المكافأة' : 'إنشاء مكافأة جديدة')
                                    : (rewardToEdit ? 'Edit Reward' : 'Create New Reward')}
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'العنوان (EN)' : 'Title (EN)'} *</Label>
                                    <Input
                                        value={formData.title}
                                        onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                        placeholder="e.g., Top Student Prize"
                                        className="bg-gray-800 border-gray-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'العنوان (عربي)' : 'Title (Ar)'}</Label>
                                    <Input
                                        value={formData.titleAr}
                                        onChange={e => setFormData(prev => ({ ...prev, titleAr: e.target.value }))}
                                        placeholder="مثال: جائزة الطالب المتفوق"
                                        className="bg-gray-800 border-gray-700 text-right"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>{isArabic ? 'الوصف' : 'Description'} *</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Describe criteria for winning this reward..."
                                    className="bg-gray-800 border-gray-700 min-h-[80px]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'النوع' : 'Type'}</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(val: RewardType) => setFormData(prev => ({ ...prev, type: val }))}
                                    >
                                        <SelectTrigger className="bg-gray-800 border-gray-700">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="PRIZE">Prize / Gift</SelectItem>
                                            <SelectItem value="SCHOLARSHIP">Scholarship</SelectItem>
                                            <SelectItem value="BADGE">Digital Badge</SelectItem>
                                            <SelectItem value="CERTIFICATE">Certificate</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'الحد الأقصى للفائزين' : 'Max Winners'}</Label>
                                    <Input
                                        type="number"
                                        value={formData.maxWinners}
                                        onChange={e => setFormData(prev => ({ ...prev, maxWinners: e.target.value }))}
                                        placeholder="Optional"
                                        className="bg-gray-800 border-gray-700"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'القيمة' : 'Value'}</Label>
                                    <Input
                                        type="number"
                                        value={formData.value}
                                        onChange={e => setFormData(prev => ({ ...prev, value: e.target.value }))}
                                        placeholder="0.00"
                                        className="bg-gray-800 border-gray-700"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>{isArabic ? 'العملة' : 'Currency'}</Label>
                                    <Select
                                        value={formData.currency}
                                        onValueChange={(val) => setFormData(prev => ({ ...prev, currency: val }))}
                                    >
                                        <SelectTrigger className="bg-gray-800 border-gray-700">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="EGP">EGP</SelectItem>
                                            <SelectItem value="USD">USD</SelectItem>
                                            <SelectItem value="EUR">EUR</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={onClose}
                                >
                                    {isArabic ? 'إلغاء' : 'Cancel'}
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        isArabic
                                            ? (rewardToEdit ? 'تحديث' : 'إنشاء')
                                            : (rewardToEdit ? 'Update' : 'Create')
                                    )}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
