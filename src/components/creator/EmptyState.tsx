'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface EmptyStateProps {
    icon: LucideIcon
    title: string
    description: string
    actionLabel?: string
    actionHref?: string
    onAction?: () => void
    className?: string
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    actionHref,
    onAction,
    className = ''
}: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}
        >
            <div className="w-20 h-20 rounded-full bg-accent flex items-center justify-center mb-6">
                <Icon className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground max-w-md mb-6">{description}</p>
            
            {actionLabel && (actionHref || onAction) && (
                actionHref ? (
                    <Link href={actionHref}>
                        <Button className="bg-gradient-to-r from-purple-600 to-pink-600">
                            {actionLabel}
                        </Button>
                    </Link>
                ) : (
                    <Button 
                        onClick={onAction}
                        className="bg-gradient-to-r from-purple-600 to-pink-600"
                    >
                        {actionLabel}
                    </Button>
                )
            )}
        </motion.div>
    )
}

// Preset empty states for common use cases
interface PresetEmptyStateProps {
    locale?: string
    onAction?: () => void
}

export function EmptyCoursesState({ locale = 'en', onAction }: PresetEmptyStateProps) {
    const isArabic = locale === 'ar'
    
    return (
        <EmptyState
            icon={require('lucide-react').BookOpen}
            title={isArabic ? 'لا توجد دورات بعد' : 'No courses yet'}
            description={isArabic 
                ? 'ابدأ بإنشاء أول دورة لك وشارك معرفتك مع العالم'
                : 'Start creating your first course and share your knowledge with the world'}
            actionLabel={isArabic ? 'إنشاء دورة جديدة' : 'Create New Course'}
            actionHref={`/${locale}/creator/courses/create`}
        />
    )
}

export function EmptyContentState({ locale = 'en', onAction }: PresetEmptyStateProps) {
    const isArabic = locale === 'ar'
    
    return (
        <EmptyState
            icon={require('lucide-react').FileText}
            title={isArabic ? 'لا يوجد محتوى بعد' : 'No content yet'}
            description={isArabic 
                ? 'قم بإنشاء منشورات ومحتوى لمتابعيك'
                : 'Create posts and content for your followers'}
            actionLabel={isArabic ? 'إنشاء محتوى' : 'Create Content'}
            onAction={onAction}
        />
    )
}

export function EmptyLiveSessionsState({ locale = 'en', onAction }: PresetEmptyStateProps) {
    const isArabic = locale === 'ar'
    
    return (
        <EmptyState
            icon={require('lucide-react').Video}
            title={isArabic ? 'لا توجد جلسات مباشرة' : 'No live sessions'}
            description={isArabic 
                ? 'قم بجدولة جلسة مباشرة للتفاعل مع متابعيك'
                : 'Schedule a live session to interact with your followers'}
            actionLabel={isArabic ? 'جدولة جلسة' : 'Schedule Session'}
            onAction={onAction}
        />
    )
}

export function EmptyCohortsState({ locale = 'en', onAction }: PresetEmptyStateProps) {
    const isArabic = locale === 'ar'
    
    return (
        <EmptyState
            icon={require('lucide-react').Users}
            title={isArabic ? 'لا توجد مجموعات تعليمية' : 'No cohorts yet'}
            description={isArabic 
                ? 'قم بإنشاء مجموعة تعليمية لتنظيم طلابك'
                : 'Create a cohort to organize your students'}
            actionLabel={isArabic ? 'إنشاء مجموعة' : 'Create Cohort'}
            onAction={onAction}
        />
    )
}

export function EmptyRewardsState({ locale = 'en', onAction }: PresetEmptyStateProps) {
    const isArabic = locale === 'ar'
    
    return (
        <EmptyState
            icon={require('lucide-react').Gift}
            title={isArabic ? 'لا توجد مكافآت' : 'No rewards yet'}
            description={isArabic 
                ? 'قم بإنشاء مكافآت لتحفيز طلابك'
                : 'Create rewards to motivate your students'}
            actionLabel={isArabic ? 'إنشاء مكافأة' : 'Create Reward'}
            onAction={onAction}
        />
    )
}

export function EmptyEarningsState({ locale = 'en' }: PresetEmptyStateProps) {
    const isArabic = locale === 'ar'
    
    return (
        <EmptyState
            icon={require('lucide-react').DollarSign}
            title={isArabic ? 'لا توجد أرباح بعد' : 'No earnings yet'}
            description={isArabic 
                ? 'ستظهر أرباحك هنا عندما تبدأ في تحقيق الإيرادات'
                : 'Your earnings will appear here once you start generating revenue'}
        />
    )
}

export function EmptyCommentsState({ locale = 'en' }: PresetEmptyStateProps) {
    const isArabic = locale === 'ar'
    
    return (
        <EmptyState
            icon={require('lucide-react').MessageSquare}
            title={isArabic ? 'لا توجد تعليقات' : 'No comments yet'}
            description={isArabic 
                ? 'سيظهر هنا التعليقات على محتواك'
                : 'Comments on your content will appear here'}
        />
    )
}

export function EmptyStudentsState({ locale = 'en' }: PresetEmptyStateProps) {
    const isArabic = locale === 'ar'
    
    return (
        <EmptyState
            icon={require('lucide-react').GraduationCap}
            title={isArabic ? 'لا يوجد طلاب بعد' : 'No students yet'}
            description={isArabic 
                ? 'سيظهر هنا طلابك المسجلين'
                : 'Your enrolled students will appear here'}
        />
    )
}
