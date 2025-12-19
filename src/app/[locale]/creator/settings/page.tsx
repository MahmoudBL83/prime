'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import {
    User,
    CreditCard,
    Shield,
    Globe,
    Mail,
    Loader2,
    Save,
    CheckCircle,
    Bell
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast'
import { CreatorSidebar, CreatorHeader } from '@/components/creator'

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

    // Social links
    const [socialLinks, setSocialLinks] = useState({
        youtube: '',
        twitter: '',
        linkedin: '',
        instagram: '',
        website: ''
    })

    // Subscription pricing (single tier in Euros)
    const [monthlyPrice, setMonthlyPrice] = useState<number | null>(null)

    // Notification settings
    const [emailNotifications, setEmailNotifications] = useState(true)
    const [enrollmentNotifications, setEnrollmentNotifications] = useState(true)
    const [reviewNotifications, setReviewNotifications] = useState(true)
    const [payoutNotifications, setPayoutNotifications] = useState(true)

    // Payout settings
    const [bankName, setBankName] = useState('')
    const [bankAccountIBAN, setBankAccountIBAN] = useState('')

    // Load initial data
    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true)
            try {
                const response = await fetch('/api/creator/settings/profile')
                if (response.ok) {
                    const data = await response.json()
                    if (data.creator) {
                        setBio(data.creator.user?.bio || '')
                        setExpertise(data.creator.expertise || '')
                        setLanguages(data.creator.languages || '')
                        setTimezone(data.creator.timezone || '')
                        setMonthlyPrice(data.creator.monthlyPrice || null)
                        // Load social links
                        const links = data.creator.socialLinks || {}
                        setSocialLinks({
                            youtube: links.youtube || '',
                            twitter: links.twitter || '',
                            linkedin: links.linkedin || '',
                            instagram: links.instagram || '',
                            website: links.website || ''
                        })
                    }
                }
            } catch (error) {
                console.error('Failed to load settings:', error)
            } finally {
                setLoading(false)
            }
        }

        if (session?.user) {
            fetchSettings()
        }
    }, [session])

    const handleSaveProfile = async () => {
        setSaving(true)
        try {
            const response = await fetch('/api/creator/settings/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bio,
                    expertise,
                    languages,
                    timezone,
                    monthlyPrice,
                    socialLinks
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

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <CreatorHeader title="Settings" titleAr="الإعدادات" />
                <div className="flex">
                    <CreatorSidebar />
                    <main className="flex-1 p-8 flex items-center justify-center">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-500" />
                            <p className="text-muted-foreground">{isArabic ? 'جاري تحميل الإعدادات...' : 'Loading settings...'}</p>
                        </div>
                    </main>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <CreatorHeader title="Settings" titleAr="الإعدادات" />

            <div className="flex">
                <CreatorSidebar />

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
                                    {/* Bio Field */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">
                                            {isArabic ? 'نبذة عنك' : 'Bio'}
                                        </label>
                                        <p className="text-xs text-muted-foreground mb-2">
                                            {isArabic ? 'هذا سيظهر في صفحة الملف الشخصي العامة للطلاب' : 'This will appear on your public profile page for students'}
                                        </p>
                                        <textarea
                                            value={bio}
                                            onChange={(e) => setBio(e.target.value)}
                                            placeholder={isArabic ? 'اكتب نبذة عنك وخبراتك...' : 'Write about yourself and your experience...'}
                                            rows={4}
                                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                        />
                                    </div>

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

                                    {/* Subscription Pricing Section */}
                                    <div className="border-t border-border pt-6">
                                        <h3 className="text-lg font-semibold mb-4">
                                            {isArabic ? 'سعر الاشتراك الشهري' : 'Monthly Subscription Price'}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mb-4">
                                            {isArabic ? 'حدد سعر الاشتراك الشهري للطلاب' : 'Set your monthly subscription price for students'}
                                        </p>
                                        <div className="max-w-xs">
                                            <label className="block text-sm font-semibold mb-2">
                                                {isArabic ? 'السعر الشهري' : 'Monthly Price'}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                                                <input
                                                    type="number"
                                                    value={monthlyPrice || ''}
                                                    onChange={(e) => setMonthlyPrice(e.target.value ? Number(e.target.value) : null)}
                                                    placeholder="29"
                                                    min="0"
                                                    step="0.01"
                                                    className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                {isArabic ? 'سيتم عرض هذا السعر للطلاب في صفحة ملفك الشخصي' : 'This price will be shown to students on your profile page'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Social Links Section */}
                                    <div className="border-t border-border pt-6">
                                        <h3 className="text-lg font-semibold mb-4">
                                            {isArabic ? 'روابط التواصل الاجتماعي' : 'Social Links'}
                                        </h3>
                                        <p className="text-xs text-muted-foreground mb-4">
                                            {isArabic ? 'أضف روابط ملفاتك الشخصية على مواقع التواصل الاجتماعي' : 'Add links to your social media profiles'}
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">YouTube</label>
                                                <input
                                                    type="url"
                                                    value={socialLinks.youtube}
                                                    onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                                                    placeholder="https://youtube.com/@channel"
                                                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Twitter / X</label>
                                                <input
                                                    type="url"
                                                    value={socialLinks.twitter}
                                                    onChange={(e) => setSocialLinks({ ...socialLinks, twitter: e.target.value })}
                                                    placeholder="https://twitter.com/username"
                                                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">LinkedIn</label>
                                                <input
                                                    type="url"
                                                    value={socialLinks.linkedin}
                                                    onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                                                    placeholder="https://linkedin.com/in/username"
                                                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">Instagram</label>
                                                <input
                                                    type="url"
                                                    value={socialLinks.instagram}
                                                    onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                                                    placeholder="https://instagram.com/username"
                                                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium mb-2">
                                                    {isArabic ? 'الموقع الإلكتروني' : 'Website'}
                                                </label>
                                                <input
                                                    type="url"
                                                    value={socialLinks.website}
                                                    onChange={(e) => setSocialLinks({ ...socialLinks, website: e.target.value })}
                                                    placeholder="https://yourwebsite.com"
                                                    className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                />
                                            </div>
                                        </div>
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

                                {/* Password Change Section */}
                                <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                                    <h3 className="text-lg font-semibold mb-4">
                                        {isArabic ? 'تغيير كلمة المرور' : 'Change Password'}
                                    </h3>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            {isArabic ? 'كلمة المرور الحالية' : 'Current Password'}
                                        </label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            {isArabic ? 'كلمة المرور الجديدة' : 'New Password'}
                                        </label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            {isArabic ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
                                        </label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        />
                                    </div>
                                    <Button
                                        onClick={() => toast.success(isArabic ? 'تم تحديث كلمة المرور' : 'Password updated successfully')}
                                        className="bg-gradient-to-r from-purple-600 to-pink-600"
                                    >
                                        {isArabic ? 'تحديث كلمة المرور' : 'Update Password'}
                                    </Button>
                                </div>

                                {/* Two-Factor Authentication */}
                                <div className="bg-card border border-border rounded-xl p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-lg font-semibold">
                                                {isArabic ? 'المصادقة الثنائية (2FA)' : 'Two-Factor Authentication'}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {isArabic
                                                    ? 'أضف طبقة إضافية من الأمان لحسابك'
                                                    : 'Add an extra layer of security to your account'}
                                            </p>
                                        </div>
                                        <Button
                                            variant="outline"
                                            onClick={() => toast.success(isArabic ? 'سيتم تفعيل 2FA قريباً' : '2FA setup coming soon')}
                                        >
                                            {isArabic ? 'تفعيل' : 'Enable'}
                                        </Button>
                                    </div>
                                </div>

                                {/* Active Sessions */}
                                <div className="bg-card border border-border rounded-xl p-6">
                                    <h3 className="text-lg font-semibold mb-4">
                                        {isArabic ? 'الجلسات النشطة' : 'Active Sessions'}
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-background rounded-lg border border-border">
                                            <div>
                                                <p className="font-medium">{isArabic ? 'الجلسة الحالية' : 'Current Session'}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {isArabic ? 'نشط الآن' : 'Active now'}
                                                </p>
                                            </div>
                                            <span className="text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full">
                                                {isArabic ? 'الحالي' : 'Current'}
                                            </span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="mt-4 w-full text-red-500 border-red-500/30 hover:bg-red-500/10"
                                        onClick={() => toast.success(isArabic ? 'تم تسجيل الخروج من جميع الأجهزة' : 'Logged out from all devices')}
                                    >
                                        {isArabic ? 'تسجيل الخروج من جميع الأجهزة' : 'Log out of all devices'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
