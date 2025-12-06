'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Mail,
    Plus,
    Edit,
    Copy,
    Trash2,
    Eye,
    Send,
    Globe,
    Clock,
    TrendingUp,
    CheckCircle,
    History,
    Filter,
    Download,
    Languages,
    Zap,
    ShoppingCart,
    UserPlus,
    AlertTriangle,
    Bell,
    Star,
    Loader2
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

type TemplateType = 'transactional' | 'lifecycle' | 'promotional' | 'safety'
type TemplateStatus = 'active' | 'draft' | 'archived'
type Language = 'en' | 'ar'
type TriggerType = 'manual' | 'event' | 'scheduled'

interface EmailTemplate {
    id: string
    name: string
    type: TemplateType
    status: TemplateStatus
    subject: {
        en: string
        ar: string
    }
    body: {
        en: string
        ar: string
    }
    variables: string[]
    triggerType: TriggerType
    eventTrigger?: string
    schedule?: string
    analytics: {
        sent: number
        opened: number
        clicked: number
        converted: number
    }
    lastUpdated: string
    version: number
}

const MOCK_TEMPLATES: EmailTemplate[] = [
    {
        id: 'TPL-001',
        name: 'Welcome Email - New User',
        type: 'lifecycle',
        status: 'active',
        subject: {
            en: 'Welcome to Egyptian EdTech! 🎓',
            ar: 'مرحبًا بك في منصة التعليم المصرية! 🎓'
        },
        body: {
            en: `Hi {{userName}},

Welcome to Egyptian EdTech Platform! We're thrilled to have you join our community of learners.

Here's what you can do next:
• Explore our course catalog
• Complete your profile
• Get 20% off your first course with code: WELCOME20

Start learning today!

Best regards,
The Egyptian EdTech Team`,
            ar: `مرحبًا {{userName}}،

أهلاً بك في منصة التعليم المصرية! يسعدنا انضمامك إلى مجتمع المتعلمين لدينا.

إليك ما يمكنك فعله الآن:
• استكشف كتالوج الدورات
• أكمل ملفك الشخصي
• احصل على خصم 20% على أول دورة مع الكود: WELCOME20

ابدأ التعلم اليوم!

مع أطيب التحيات،
فريق منصة التعليم المصرية`
        },
        variables: ['userName'],
        triggerType: 'event',
        eventTrigger: 'user_signup',
        analytics: {
            sent: 2340,
            opened: 1872,
            clicked: 936,
            converted: 421
        },
        lastUpdated: '2024-10-15T10:00:00Z',
        version: 3
    },
    {
        id: 'TPL-002',
        name: 'Order Confirmation',
        type: 'transactional',
        status: 'active',
        subject: {
            en: 'Your Order Confirmation - {{courseName}}',
            ar: 'تأكيد طلبك - {{courseName}}'
        },
        body: {
            en: `Dear {{userName}},

Thank you for your purchase!

Order Details:
• Course: {{courseName}}
• Price: E£{{coursePrice}}
• Order ID: {{orderId}}
• Date: {{orderDate}}

You now have lifetime access to this course. Start learning now!

Access Your Course: {{courseUrl}}

Questions? Contact our support team.

Best regards,
Egyptian EdTech Platform`,
            ar: `عزيزي {{userName}}،

شكرًا لشرائك!

تفاصيل الطلب:
• الدورة: {{courseName}}
• السعر: {{coursePrice}} جنيه
• رقم الطلب: {{orderId}}
• التاريخ: {{orderDate}}

لديك الآن وصول مدى الحياة إلى هذه الدورة. ابدأ التعلم الآن!

الوصول إلى دورتك: {{courseUrl}}

أسئلة؟ اتصل بفريق الدعم لدينا.

مع أطيب التحيات،
منصة التعليم المصرية`
        },
        variables: ['userName', 'courseName', 'coursePrice', 'orderId', 'orderDate', 'courseUrl'],
        triggerType: 'event',
        eventTrigger: 'order_completed',
        analytics: {
            sent: 1890,
            opened: 1701,
            clicked: 1323,
            converted: 0
        },
        lastUpdated: '2024-10-12T14:30:00Z',
        version: 2
    },
    {
        id: 'TPL-003',
        name: 'Course Completion Celebration',
        type: 'lifecycle',
        status: 'active',
        subject: {
            en: 'Congratulations! You completed {{courseName}} 🎉',
            ar: 'تهانينا! أكملت دورة {{courseName}} 🎉'
        },
        body: {
            en: `Congratulations {{userName}}!

You've successfully completed "{{courseName}}"!

Your achievements:
• Completion Rate: {{completionRate}}%
• Final Grade: {{finalGrade}}%
• Time Invested: {{hoursSpent}} hours

Download your certificate: {{certificateUrl}}

Ready for more? Check out these recommended courses:
{{recommendedCourses}}

Keep learning!`,
            ar: `تهانينا {{userName}}!

لقد أكملت بنجاح دورة "{{courseName}}"!

إنجازاتك:
• معدل الإكمال: {{completionRate}}%
• الدرجة النهائية: {{finalGrade}}%
• الوقت المستثمر: {{hoursSpent}} ساعة

تحميل شهادتك: {{certificateUrl}}

مستعد للمزيد؟ تحقق من هذه الدورات الموصى بها:
{{recommendedCourses}}

استمر في التعلم!`
        },
        variables: ['userName', 'courseName', 'completionRate', 'finalGrade', 'hoursSpent', 'certificateUrl', 'recommendedCourses'],
        triggerType: 'event',
        eventTrigger: 'course_completed',
        analytics: {
            sent: 1560,
            opened: 1404,
            clicked: 624,
            converted: 187
        },
        lastUpdated: '2024-10-10T09:00:00Z',
        version: 1
    },
    {
        id: 'TPL-004',
        name: 'Flash Sale Announcement',
        type: 'promotional',
        status: 'active',
        subject: {
            en: '⚡ 50% OFF Flash Sale - 24 Hours Only!',
            ar: '⚡ تخفيضات 50% - 24 ساعة فقط!'
        },
        body: {
            en: `Hi {{userName}},

🔥 FLASH SALE ALERT! 🔥

Get 50% OFF on ALL courses for the next 24 hours!

Use code: FLASH50

Popular courses on sale:
• {{course1}} - {{price1}} (Was {{originalPrice1}})
• {{course2}} - {{price2}} (Was {{originalPrice2}})
• {{course3}} - {{price3}} (Was {{originalPrice3}})

⏰ Hurry! Sale ends {{expiryTime}}

Shop Now: {{saleUrl}}`,
            ar: `مرحبًا {{userName}}،

🔥 تنبيه تخفيضات البرق! 🔥

احصل على خصم 50% على جميع الدورات خلال 24 ساعة القادمة!

استخدم الكود: FLASH50

الدورات الشائعة المعروضة:
• {{course1}} - {{price1}} (كان {{originalPrice1}})
• {{course2}} - {{price2}} (كان {{originalPrice2}})
• {{course3}} - {{price3}} (كان {{originalPrice3}})

⏰ أسرع! ينتهي العرض {{expiryTime}}

تسوق الآن: {{saleUrl}}`
        },
        variables: ['userName', 'course1', 'price1', 'originalPrice1', 'course2', 'price2', 'originalPrice2', 'course3', 'price3', 'originalPrice3', 'expiryTime', 'saleUrl'],
        triggerType: 'manual',
        analytics: {
            sent: 45000,
            opened: 18000,
            clicked: 5400,
            converted: 810
        },
        lastUpdated: '2024-10-16T08:00:00Z',
        version: 1
    },
    {
        id: 'TPL-005',
        name: 'Account Warning - Policy Violation',
        type: 'safety',
        status: 'active',
        subject: {
            en: 'Important: Account Warning',
            ar: 'مهم: تحذير بخصوص الحساب'
        },
        body: {
            en: `Dear {{userName}},

We're writing to inform you about a policy violation detected on your account.

Violation Details:
• Type: {{violationType}}
• Date: {{violationDate}}
• Description: {{violationDescription}}

This is a formal warning. Continued violations may result in account suspension.

What you should do:
1. Review our Community Guidelines: {{guidelinesUrl}}
2. Ensure future compliance
3. Contact support if you have questions

We appreciate your cooperation.

Support Team
Egyptian EdTech Platform`,
            ar: `عزيزي {{userName}}،

نكتب لإبلاغك عن انتهاك للسياسة تم اكتشافه في حسابك.

تفاصيل الانتهاك:
• النوع: {{violationType}}
• التاريخ: {{violationDate}}
• الوصف: {{violationDescription}}

هذا تحذير رسمي. قد تؤدي الانتهاكات المستمرة إلى تعليق الحساب.

ما يجب عليك فعله:
1. راجع إرشادات المجتمع: {{guidelinesUrl}}
2. تأكد من الالتزام المستقبلي
3. اتصل بالدعم إذا كان لديك أسئلة

نقدر تعاونك.

فريق الدعم
منصة التعليم المصرية`
        },
        variables: ['userName', 'violationType', 'violationDate', 'violationDescription', 'guidelinesUrl'],
        triggerType: 'manual',
        analytics: {
            sent: 45,
            opened: 42,
            clicked: 28,
            converted: 0
        },
        lastUpdated: '2024-10-08T11:00:00Z',
        version: 2
    },
    {
        id: 'TPL-006',
        name: 'Re-engagement - Inactive User',
        type: 'lifecycle',
        status: 'active',
        subject: {
            en: 'We miss you! Come back for 30% OFF',
            ar: 'نفتقدك! عد للحصول على خصم 30%'
        },
        body: {
            en: `Hi {{userName}},

We noticed you haven't visited in a while. We miss you!

Here's what's new:
• {{newCoursesCount}} new courses added
• {{newFeaturesCount}} platform improvements
• Special 30% discount just for you: {{discountCode}}

Your learning journey awaits!

Return to Learning: {{loginUrl}}

Valid for {{validDays}} days.`,
            ar: `مرحبًا {{userName}}،

لاحظنا أنك لم تزورنا منذ فترة. نفتقدك!

إليك ما هو جديد:
• {{newCoursesCount}} دورة جديدة
• {{newFeaturesCount}} تحسينات في المنصة
• خصم خاص 30% لك فقط: {{discountCode}}

رحلة التعلم تنتظرك!

العودة للتعلم: {{loginUrl}}

صالح لمدة {{validDays}} أيام.`
        },
        variables: ['userName', 'newCoursesCount', 'newFeaturesCount', 'discountCode', 'loginUrl', 'validDays'],
        triggerType: 'scheduled',
        schedule: '30 days after last login',
        analytics: {
            sent: 3400,
            opened: 1360,
            clicked: 408,
            converted: 136
        },
        lastUpdated: '2024-10-14T13:00:00Z',
        version: 1
    }
]

const typeColors = {
    transactional: 'bg-blue-100 text-blue-800 border-blue-200',
    lifecycle: 'bg-purple-100 text-purple-800 border-purple-200',
    promotional: 'bg-orange-100 text-orange-800 border-orange-200',
    safety: 'bg-red-100 text-red-800 border-red-200'
}

const statusColors = {
    active: 'bg-green-100 text-green-800 border-green-200',
    draft: 'bg-muted text-gray-800 border-border',
    archived: 'bg-yellow-100 text-yellow-800 border-yellow-200'
}

const typeIcons = {
    transactional: ShoppingCart,
    lifecycle: UserPlus,
    promotional: Star,
    safety: AlertTriangle
}

export default function CommunicationTemplatesPage() {
    const [activeTab, setActiveTab] = useState('all')
    const [templates, setTemplates] = useState<EmailTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
    const [showPreviewModal, setShowPreviewModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showAnalyticsModal, setShowAnalyticsModal] = useState(false)
    const [previewLanguage, setPreviewLanguage] = useState<Language>('en')
    const [editLanguage, setEditLanguage] = useState<Language>('en')
    const [stats, setStats] = useState({
        totalTemplates: 0,
        activeTemplates: 0,
        totalSent: 0,
        avgOpenRate: '0.0',
        avgClickRate: '0.0'
    })

    const fetchTemplates = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch('/api/admin/communication/templates')
            if (!response.ok) throw new Error('Failed to fetch templates')
            const data = await response.json()
            setTemplates(data.templates || [])
            if (data.stats) {
                setStats({
                    totalTemplates: data.stats.totalTemplates,
                    activeTemplates: data.stats.activeTemplates,
                    totalSent: data.stats.totalSent,
                    avgOpenRate: String(data.stats.avgOpenRate || '0.0'),
                    avgClickRate: String(data.stats.avgClickRate || '0.0')
                })
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchTemplates()
    }, [fetchTemplates])

    const transactional = templates.filter(t => t.type === 'transactional')
    const lifecycle = templates.filter(t => t.type === 'lifecycle')
    const promotional = templates.filter(t => t.type === 'promotional')
    const safety = templates.filter(t => t.type === 'safety')
    const active = templates.filter(t => t.status === 'active')

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const handlePreview = (template: EmailTemplate) => {
        setSelectedTemplate(template)
        setPreviewLanguage('en')
        setShowPreviewModal(true)
    }

    const handleEdit = (template: EmailTemplate) => {
        setSelectedTemplate(template)
        setEditLanguage('en')
        setShowEditModal(true)
    }

    const handleViewAnalytics = (template: EmailTemplate) => {
        setSelectedTemplate(template)
        setShowAnalyticsModal(true)
    }

    const calculateRate = (value: number, total: number) => {
        return total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-400">{error}</p>
                    <Button onClick={fetchTemplates} className="mt-4">Retry</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-6">
            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Communication Templates</h1>
                        <p className="text-muted-foreground">Manage email templates and automated communications</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="bg-white/5 border-border text-muted-foreground hover:bg-white/10">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter
                        </Button>
                        <Button variant="outline" className="bg-white/5 border-border text-muted-foreground hover:bg-white/10">
                            <Download className="w-4 h-4 mr-2" />
                            Export Report
                        </Button>
                        <Button className="bg-purple-600 hover:bg-purple-700 text-foreground">
                            <Plus className="w-4 h-4 mr-2" />
                            New Template
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Mail className="w-8 h-8 text-purple-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.totalTemplates}</div>
                        <div className="text-sm text-muted-foreground mt-1">Total Templates</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.activeTemplates}</div>
                        <div className="text-sm text-muted-foreground mt-1">Active</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Send className="w-8 h-8 text-blue-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.totalSent.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground mt-1">Total Sent</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Eye className="w-8 h-8 text-yellow-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.avgOpenRate}%</div>
                        <div className="text-sm text-muted-foreground mt-1">Avg Open Rate</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="w-8 h-8 text-emerald-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.avgClickRate}%</div>
                        <div className="text-sm text-muted-foreground mt-1">Avg Click Rate</div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="border-b border-border px-6">
                            <TabsList className="bg-transparent">
                                <TabsTrigger value="all" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <Mail className="w-4 h-4 mr-2" />
                                    All ({templates.length})
                                </TabsTrigger>
                                <TabsTrigger value="transactional" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <ShoppingCart className="w-4 h-4 mr-2" />
                                    Transactional ({transactional.length})
                                </TabsTrigger>
                                <TabsTrigger value="lifecycle" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <UserPlus className="w-4 h-4 mr-2" />
                                    Lifecycle ({lifecycle.length})
                                </TabsTrigger>
                                <TabsTrigger value="promotional" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <Star className="w-4 h-4 mr-2" />
                                    Promotional ({promotional.length})
                                </TabsTrigger>
                                <TabsTrigger value="safety" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Safety ({safety.length})
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* All Templates Tab */}
                        <TabsContent value="all" className="p-6">
                            <div className="space-y-4">
                                {templates.map((template) => {
                                    const TypeIcon = typeIcons[template.type]
                                    const openRate = calculateRate(template.analytics.opened, template.analytics.sent)
                                    const clickRate = calculateRate(template.analytics.clicked, template.analytics.sent)
                                    const conversionRate = calculateRate(template.analytics.converted, template.analytics.sent)

                                    return (
                                        <div key={template.id} className="bg-white/5 rounded-lg p-5 border border-border hover:bg-white/10 transition-all">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="bg-purple-500/20 rounded-lg p-2">
                                                            <TypeIcon className="w-5 h-5 text-purple-400" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-foreground text-lg">{template.name}</h4>
                                                            <p className="text-sm text-muted-foreground">{template.id}</p>
                                                        </div>
                                                        <Badge className={typeColors[template.type]}>
                                                            {template.type}
                                                        </Badge>
                                                        <Badge className={statusColors[template.status]}>
                                                            {template.status}
                                                        </Badge>
                                                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                                            <Languages className="w-3 h-3 mr-1" />
                                                            EN/AR
                                                        </Badge>
                                                    </div>

                                                    <div className="grid grid-cols-5 gap-4 mb-3">
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Sent</div>
                                                            <div className="text-lg font-semibold text-foreground">{template.analytics.sent.toLocaleString()}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Open Rate</div>
                                                            <div className="text-lg font-semibold text-yellow-400">{openRate}%</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Click Rate</div>
                                                            <div className="text-lg font-semibold text-blue-400">{clickRate}%</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Conversions</div>
                                                            <div className="text-lg font-semibold text-green-400">{template.analytics.converted}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-muted-foreground mb-1">Version</div>
                                                            <div className="text-lg font-semibold text-foreground">v{template.version}</div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white/5 rounded-lg p-3 border border-border mb-2">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Zap className="w-4 h-4 text-yellow-400" />
                                                            <span className="text-sm font-semibold text-foreground">Trigger</span>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {template.triggerType === 'event' && `Event: ${template.eventTrigger}`}
                                                            {template.triggerType === 'scheduled' && `Scheduled: ${template.schedule}`}
                                                            {template.triggerType === 'manual' && 'Manual send only'}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                                        <span className="text-xs text-muted-foreground">Variables:</span>
                                                        {template.variables.slice(0, 5).map((variable) => (
                                                            <Badge key={variable} className="bg-indigo-100 text-indigo-800 text-xs">
                                                                {`{{${variable}}}`}
                                                            </Badge>
                                                        ))}
                                                        {template.variables.length > 5 && (
                                                            <span className="text-xs text-muted-foreground">+{template.variables.length - 5} more</span>
                                                        )}
                                                    </div>

                                                    <div className="text-xs text-muted-foreground">
                                                        Last updated: {formatDate(template.lastUpdated)}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2 ml-4">
                                                    <Button
                                                        variant="outline"
                                                        className="bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                                                        onClick={() => handlePreview(template)}
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        Preview
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                                                        onClick={() => handleEdit(template)}
                                                    >
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Edit
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                                                        onClick={() => handleViewAnalytics(template)}
                                                    >
                                                        <TrendingUp className="w-4 h-4 mr-2" />
                                                        Analytics
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </TabsContent>

                        {/* Type-specific tabs - similar structure */}
                        {['transactional', 'lifecycle', 'promotional', 'safety'].map((type) => (
                            <TabsContent key={type} value={type} className="p-6">
                                <div className="space-y-4">
                                    {templates.filter(t => t.type === type).map((template) => (
                                        <div key={template.id} className="bg-white/5 rounded-lg p-5 border border-border">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-semibold text-foreground text-lg mb-1">{template.name}</h4>
                                                    <p className="text-sm text-muted-foreground">{template.subject.en}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="bg-white/5 border-border text-muted-foreground"
                                                        onClick={() => handlePreview(template)}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="bg-white/5 border-border text-muted-foreground"
                                                        onClick={() => handleEdit(template)}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            </div>

            {/* Preview Modal */}
            <Dialog open={showPreviewModal} onOpenChange={setShowPreviewModal}>
                <DialogContent className="bg-background text-foreground border-border max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Template Preview</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            Preview email template in different languages
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTemplate && (
                        <div className="space-y-4 mt-4">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant={previewLanguage === 'en' ? 'default' : 'outline'}
                                    onClick={() => setPreviewLanguage('en')}
                                    className={previewLanguage === 'en' ? 'bg-blue-600' : 'bg-white/5 border-border text-muted-foreground'}
                                >
                                    <Globe className="w-4 h-4 mr-2" />
                                    English
                                </Button>
                                <Button
                                    variant={previewLanguage === 'ar' ? 'default' : 'outline'}
                                    onClick={() => setPreviewLanguage('ar')}
                                    className={previewLanguage === 'ar' ? 'bg-blue-600' : 'bg-white/5 border-border text-muted-foreground'}
                                >
                                    <Globe className="w-4 h-4 mr-2" />
                                    العربية
                                </Button>
                            </div>

                            <div className="bg-white/5 rounded-lg p-6 border border-border">
                                <div className="mb-4">
                                    <div className="text-sm text-muted-foreground mb-1">Subject:</div>
                                    <div className="text-lg font-semibold text-foreground">
                                        {selectedTemplate.subject[previewLanguage]}
                                    </div>
                                </div>

                                <div className="border-t border-border pt-4">
                                    <div className="text-sm text-muted-foreground mb-2">Body:</div>
                                    <div className="text-foreground whitespace-pre-wrap font-mono text-sm bg-background/20 p-4 rounded">
                                        {selectedTemplate.body[previewLanguage]}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                                <div className="text-sm text-blue-300 mb-2">Available Variables:</div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedTemplate.variables.map((variable) => (
                                        <Badge key={variable} className="bg-blue-100 text-blue-800">
                                            {`{{${variable}}}`}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="bg-background text-foreground border-border max-w-5xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Edit Template</DialogTitle>
                    </DialogHeader>

                    {selectedTemplate && (
                        <div className="space-y-4 mt-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Button
                                    variant={editLanguage === 'en' ? 'default' : 'outline'}
                                    onClick={() => setEditLanguage('en')}
                                    className={editLanguage === 'en' ? 'bg-blue-600' : 'bg-white/5 border-border text-muted-foreground'}
                                >
                                    English
                                </Button>
                                <Button
                                    variant={editLanguage === 'ar' ? 'default' : 'outline'}
                                    onClick={() => setEditLanguage('ar')}
                                    className={editLanguage === 'ar' ? 'bg-blue-600' : 'bg-white/5 border-border text-muted-foreground'}
                                >
                                    العربية
                                </Button>
                            </div>

                            <div>
                                <label className="text-sm text-muted-foreground mb-2 block">Subject</label>
                                <input
                                    type="text"
                                    defaultValue={selectedTemplate.subject[editLanguage]}
                                    className="w-full px-3 py-2 bg-white/5 border border-border rounded-lg text-foreground"
                                />
                            </div>

                            <div>
                                <label className="text-sm text-muted-foreground mb-2 block">Body</label>
                                <Textarea
                                    defaultValue={selectedTemplate.body[editLanguage]}
                                    className="bg-white/5 border-border text-foreground font-mono min-h-[300px]"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                                >
                                    Cancel
                                </Button>
                                <Button className="flex-1 bg-purple-600 hover:bg-purple-700 text-foreground">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Analytics Modal */}
            <Dialog open={showAnalyticsModal} onOpenChange={setShowAnalyticsModal}>
                <DialogContent className="bg-background text-foreground border-border max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Template Analytics</DialogTitle>
                    </DialogHeader>

                    {selectedTemplate && (
                        <div className="space-y-4 mt-4">
                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <h4 className="font-semibold text-foreground mb-2">{selectedTemplate.name}</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-lg p-4 border border-border">
                                    <div className="text-sm text-muted-foreground mb-1">Total Sent</div>
                                    <div className="text-3xl font-bold text-foreground">{selectedTemplate.analytics.sent.toLocaleString()}</div>
                                </div>

                                <div className="bg-white/5 rounded-lg p-4 border border-border">
                                    <div className="text-sm text-muted-foreground mb-1">Opened</div>
                                    <div className="text-3xl font-bold text-yellow-400">{selectedTemplate.analytics.opened.toLocaleString()}</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        {calculateRate(selectedTemplate.analytics.opened, selectedTemplate.analytics.sent)}% open rate
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-lg p-4 border border-border">
                                    <div className="text-sm text-muted-foreground mb-1">Clicked</div>
                                    <div className="text-3xl font-bold text-blue-400">{selectedTemplate.analytics.clicked.toLocaleString()}</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        {calculateRate(selectedTemplate.analytics.clicked, selectedTemplate.analytics.sent)}% click rate
                                    </div>
                                </div>

                                <div className="bg-white/5 rounded-lg p-4 border border-border">
                                    <div className="text-sm text-muted-foreground mb-1">Converted</div>
                                    <div className="text-3xl font-bold text-green-400">{selectedTemplate.analytics.converted.toLocaleString()}</div>
                                    <div className="text-sm text-muted-foreground mt-1">
                                        {calculateRate(selectedTemplate.analytics.converted, selectedTemplate.analytics.sent)}% conversion
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
