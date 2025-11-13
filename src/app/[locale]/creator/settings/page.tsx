'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import {
    ArrowLeft,
    Home,
    Bell,
    User,
    CreditCard,
    Shield,
    Globe,
    Mail,
    Loader2,
    Save,
    CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'

export default function CreatorSettings() {
    const { data: session } = useSession()
    const router = useRouter()
    const params = useParams()
    const locale = params.locale as string
    const isArabic = locale === 'ar'

    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [activeTab, setActiveTab] = useState('profile')

    // Profile settings
    const [bio, setBio] = useState('')
    const [expertise, setExpertise] = useState('')
    const [languages, setLanguages] = useState('')
    const [timezone, setTimezone] = useState('')

    // Notification settings
    const [emailNotifications, setEmailNotifications] = useState(true)
    const [enrollmentNotifications, setEnrollmentNotifications] = useState(true)
    const [reviewNotifications, setReviewNotifications] = useState(true)
    const [payoutNotifications, setPayoutNotifications] = useState(true)

    // Payout settings
    const [bankName, setBankName] = useState('')
    const [bankAccountIBAN, setBankAccountIBAN] = useState('')

    const handleSaveProfile = async () => {
        setSaving(true)
        try {
            const response = await fetch('/api/creator/settings/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    expertise,
                    languages,
                    timezone
                })
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم حفظ الإعدادات' : 'Settings saved')
            } else {
                toast.error(isArabic ? 'فشل الحفظ' : 'Failed to save')
            }
        } catch (error) {
            console.error('Failed to save settings:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setSaving(false)
        }
    }

    const handleSaveNotifications = async () => {
        setSaving(true)
        try {
            const response = await fetch('/api/creator/settings/notifications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    emailNotifications,
                    enrollmentNotifications,
                    reviewNotifications,
                    payoutNotifications
                })
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم حفظ الإعدادات' : 'Settings saved')
            } else {
                toast.error(isArabic ? 'فشل الحفظ' : 'Failed to save')
            }
        } catch (error) {
            console.error('Failed to save settings:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setSaving(false)
        }
    }

    const handleSavePayout = async () => {
        setSaving(true)
        try {
            const response = await fetch('/api/creator/settings/payout', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bankName,
                    bankAccountIBAN
                })
            })

            if (response.ok) {
                toast.success(isArabic ? 'تم حفظ معلومات الدفع' : 'Payout information saved')
            } else {
                toast.error(isArabic ? 'فشل الحفظ' : 'Failed to save')
            }
        } catch (error) {
            console.error('Failed to save payout settings:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setSaving(false)
        }
    }

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-card border-b border-border">
                <div className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-accent rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => router.push(`/${locale}`)}
                            className="p-2 hover:bg-accent rounded-full transition-colors"
                        >
                            <Home className="w-5 h-5" />
                        </button>
                        <div className="h-6 w-px bg-border" />
                        <h1 className="text-xl font-bold">
                            {isArabic ? 'الإعدادات' : 'Settings'}
                        </h1>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className="w-64 min-h-screen bg-card border-r border-border sticky top-16">
                    <nav className="p-4 space-y-1">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                activeTab === 'profile'
                                    ? 'bg-accent text-foreground font-semibold'
                                    : 'text-muted-foreground hover:bg-accent/50'
                            }`}
                        >
                            <User className="w-5 h-5" />
                            <span>{isArabic ? 'الملف الشخصي' : 'Profile'}</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                activeTab === 'notifications'
                                    ? 'bg-accent text-foreground font-semibold'
                                    : 'text-muted-foreground hover:bg-accent/50'
                            }`}
                        >
                            <Bell className="w-5 h-5" />
                            <span>{isArabic ? 'الإشعارات' : 'Notifications'}</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('payout')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                activeTab === 'payout'
                                    ? 'bg-accent text-foreground font-semibold'
                                    : 'text-muted-foreground hover:bg-accent/50'
                            }`}
                        >
                            <CreditCard className="w-5 h-5" />
                            <span>{isArabic ? 'معلومات الدفع' : 'Payout Info'}</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('security')}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                                activeTab === 'security'
                                    ? 'bg-accent text-foreground font-semibold'
                                    : 'text-muted-foreground hover:bg-accent/50'
                            }`}
                        >
                            <Shield className="w-5 h-5" />
                            <span>{isArabic ? 'الأمان' : 'Security'}</span>
                        </button>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-8">
                    <div className="max-w-4xl mx-auto">
                        {/* Profile Tab */}
                        {activeTab === 'profile' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">
                                        {isArabic ? 'معلومات الملف الشخصي' : 'Profile Information'}
                                    </h2>
                                    <p className="text-muted-foreground">
                                        {isArabic ? 'قم بتحديث معلومات ملفك الشخصي' : 'Update your profile information'}
                                    </p>
                                </div>

                                <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">
                                            {isArabic ? 'الخبرة' : 'Expertise'}
                                        </label>
                                        <input
                                            type="text"
                                            value={expertise}
                                            onChange={(e) => setExpertise(e.target.value)}
                                            placeholder={isArabic ? 'مثال: تطوير الويب، التصميم...' : 'e.g., Web Development, Design...'}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">
                                            {isArabic ? 'اللغات' : 'Languages'}
                                        </label>
                                        <input
                                            type="text"
                                            value={languages}
                                            onChange={(e) => setLanguages(e.target.value)}
                                            placeholder={isArabic ? 'مثال: العربية، الإنجليزية' : 'e.g., Arabic, English'}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">
                                            {isArabic ? 'المنطقة الزمنية' : 'Timezone'}
                                        </label>
                                        <select
                                            value={timezone}
                                            onChange={(e) => setTimezone(e.target.value)}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        >
                                            <option value="">{isArabic ? 'اختر المنطقة الزمنية' : 'Select timezone'}</option>
                                            <option value="Africa/Cairo">Cairo (GMT+2)</option>
                                            <option value="Asia/Dubai">Dubai (GMT+4)</option>
                                            <option value="Asia/Riyadh">Riyadh (GMT+3)</option>
                                            <option value="Europe/London">London (GMT)</option>
                                            <option value="America/New_York">New York (GMT-5)</option>
                                        </select>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button
                                            onClick={handleSaveProfile}
                                            disabled={saving}
                                            className="bg-gradient-to-r from-purple-600 to-pink-600"
                                        >
                                            {saving ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    {isArabic ? 'جاري الحفظ...' : 'Saving...'}
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4 mr-2" />
                                                    {isArabic ? 'حفظ التغييرات' : 'Save Changes'}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Notifications Tab */}
                        {activeTab === 'notifications' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">
                                        {isArabic ? 'إعدادات الإشعارات' : 'Notification Settings'}
                                    </h2>
                                    <p className="text-muted-foreground">
                                        {isArabic ? 'اختر كيفية تلقي الإشعارات' : 'Choose how you receive notifications'}
                                    </p>
                                </div>

                                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                                    <label className="flex items-center justify-between p-4 border border-border rounded-lg cursor-pointer hover:bg-accent">
                                        <div>
                                            <p className="font-semibold">
                                                {isArabic ? 'الإشعارات عبر البريد الإلكتروني' : 'Email Notifications'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {isArabic ? 'تلقي الإشعارات عبر البريد الإلكتروني' : 'Receive notifications via email'}
                                            </p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={emailNotifications}
                                            onChange={(e) => setEmailNotifications(e.target.checked)}
                                            className="w-5 h-5"
                                        />
                                    </label>

                                    <label className="flex items-center justify-between p-4 border border-border rounded-lg cursor-pointer hover:bg-accent">
                                        <div>
                                            <p className="font-semibold">
                                                {isArabic ? 'إشعارات التسجيل' : 'Enrollment Notifications'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {isArabic ? 'عند تسجيل طالب جديد في دورتك' : 'When a student enrolls in your course'}
                                            </p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={enrollmentNotifications}
                                            onChange={(e) => setEnrollmentNotifications(e.target.checked)}
                                            className="w-5 h-5"
                                        />
                                    </label>

                                    <label className="flex items-center justify-between p-4 border border-border rounded-lg cursor-pointer hover:bg-accent">
                                        <div>
                                            <p className="font-semibold">
                                                {isArabic ? 'إشعارات التقييمات' : 'Review Notifications'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {isArabic ? 'عند تلقي تقييم جديد' : 'When you receive a new review'}
                                            </p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={reviewNotifications}
                                            onChange={(e) => setReviewNotifications(e.target.checked)}
                                            className="w-5 h-5"
                                        />
                                    </label>

                                    <label className="flex items-center justify-between p-4 border border-border rounded-lg cursor-pointer hover:bg-accent">
                                        <div>
                                            <p className="font-semibold">
                                                {isArabic ? 'إشعارات الدفع' : 'Payout Notifications'}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {isArabic ? 'عند معالجة الدفعات' : 'When payouts are processed'}
                                            </p>
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={payoutNotifications}
                                            onChange={(e) => setPayoutNotifications(e.target.checked)}
                                            className="w-5 h-5"
                                        />
                                    </label>

                                    <div className="flex justify-end pt-4">
                                        <Button
                                            onClick={handleSaveNotifications}
                                            disabled={saving}
                                            className="bg-gradient-to-r from-purple-600 to-pink-600"
                                        >
                                            {saving ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    {isArabic ? 'جاري الحفظ...' : 'Saving...'}
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4 mr-2" />
                                                    {isArabic ? 'حفظ التغييرات' : 'Save Changes'}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payout Tab */}
                        {activeTab === 'payout' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">
                                        {isArabic ? 'معلومات الدفع' : 'Payout Information'}
                                    </h2>
                                    <p className="text-muted-foreground">
                                        {isArabic ? 'قم بتحديث معلومات الحساب البنكي' : 'Update your bank account information'}
                                    </p>
                                </div>

                                <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">
                                            {isArabic ? 'اسم البنك' : 'Bank Name'}
                                        </label>
                                        <input
                                            type="text"
                                            value={bankName}
                                            onChange={(e) => setBankName(e.target.value)}
                                            placeholder={isArabic ? 'مثال: البنك الأهلي المصري' : 'e.g., National Bank of Egypt'}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">
                                            {isArabic ? 'رقم الحساب البنكي (IBAN)' : 'Bank Account IBAN'}
                                        </label>
                                        <input
                                            type="text"
                                            value={bankAccountIBAN}
                                            onChange={(e) => setBankAccountIBAN(e.target.value)}
                                            placeholder="EG00 0000 0000 0000 0000 0000 000"
                                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>

                                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                            {isArabic 
                                                ? '⚠️ تأكد من صحة معلومات البنك لتجنب تأخير الدفعات'
                                                : '⚠️ Ensure your bank information is correct to avoid payout delays'}
                                        </p>
                                    </div>

                                    <div className="flex justify-end">
                                        <Button
                                            onClick={handleSavePayout}
                                            disabled={saving}
                                            className="bg-gradient-to-r from-purple-600 to-pink-600"
                                        >
                                            {saving ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    {isArabic ? 'جاري الحفظ...' : 'Saving...'}
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4 mr-2" />
                                                    {isArabic ? 'حفظ التغييرات' : 'Save Changes'}
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">
                                        {isArabic ? 'الأمان' : 'Security'}
                                    </h2>
                                    <p className="text-muted-foreground">
                                        {isArabic ? 'إدارة إعدادات الأمان الخاصة بك' : 'Manage your security settings'}
                                    </p>
                                </div>

                                <div className="bg-card border border-border rounded-xl p-6">
                                    <p className="text-muted-foreground text-center py-8">
                                        {isArabic ? 'إعدادات الأمان قريباً' : 'Security settings coming soon'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
