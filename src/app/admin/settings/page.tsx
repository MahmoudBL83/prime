'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Settings,
    DollarSign,
    Mail,
    Bell,
    Shield,
    FileText,
    Zap,
    Globe,
    CreditCard,
    Lock,
    Users,
    Save,
    RefreshCw,
    AlertCircle,
    CheckCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type SettingsTab = 'general' | 'pricing' | 'features' | 'payments' | 'emails' | 'notifications' | 'legal' | 'security'

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const tabs = [
        { id: 'general' as const, name: 'General', icon: Settings },
        { id: 'pricing' as const, name: 'Pricing Tiers', icon: DollarSign },
        { id: 'features' as const, name: 'Feature Flags', icon: Zap },
        { id: 'payments' as const, name: 'Payment Settings', icon: CreditCard },
        { id: 'emails' as const, name: 'Email Templates', icon: Mail },
        { id: 'notifications' as const, name: 'Notifications', icon: Bell },
        { id: 'legal' as const, name: 'Legal & Policy', icon: FileText },
        { id: 'security' as const, name: 'Security', icon: Shield }
    ]

    const handleSave = async () => {
        setSaving(true)
        // Simulate save
        await new Promise(resolve => setTimeout(resolve, 1500))
        setSaving(false)
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
    }

    return (
        <div className="min-h-screen p-8 space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-4xl font-bold text-foreground mb-2">
                        Platform Settings
                    </h1>
                    <p className="text-muted-foreground">
                        Configure platform-wide settings and preferences
                    </p>
                </div>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-foreground"
                >
                    {saving ? (
                        <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : saved ? (
                        <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Saved!
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </>
                    )}
                </Button>
            </motion.div>

            {/* Tabs */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-2"
            >
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl transition-all ${
                                activeTab === tab.id
                                    ? 'bg-gradient-to-r from-red-600 to-pink-600 text-foreground shadow-lg'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                            }`}
                        >
                            <tab.icon className="w-5 h-5" />
                            <span className="text-xs font-semibold text-center">{tab.name}</span>
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Content Area */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-8"
            >
                {/* General Settings */}
                {activeTab === 'general' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-4">General Settings</h2>
                            <p className="text-muted-foreground mb-8">Configure basic platform settings</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Platform Name
                                </label>
                                <input
                                    type="text"
                                    defaultValue="Prime Learning Platform"
                                    className="w-full bg-white/10 border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Support Email
                                </label>
                                <input
                                    type="email"
                                    defaultValue="support@prime-learning.com"
                                    className="w-full bg-white/10 border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Default Language
                                </label>
                                <select className="w-full bg-white/10 border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50">
                                    <option value="en">English</option>
                                    <option value="ar">Arabic</option>
                                    <option value="de">German</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    Time Zone
                                </label>
                                <select className="w-full bg-white/10 border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50">
                                    <option value="UTC">UTC</option>
                                    <option value="Africa/Cairo">Cairo (EET)</option>
                                    <option value="America/New_York">New York (EST)</option>
                                    <option value="Europe/London">London (GMT)</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">Maintenance Mode</p>
                                    <p className="text-xs text-muted-foreground mt-1">Disable public access for maintenance</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" />
                                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {/* Pricing Settings */}
                {activeTab === 'pricing' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-4">Pricing Tiers</h2>
                            <p className="text-muted-foreground mb-8">Manage subscription plans and pricing</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Category A */}
                            <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-foreground">Category A</h3>
                                    <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30">
                                        All-Access
                                    </Badge>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-2">
                                            Monthly Price
                                        </label>
                                        <input
                                            type="number"
                                            defaultValue="29.99"
                                            className="w-full bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-2">
                                            Annual Price
                                        </label>
                                        <input
                                            type="number"
                                            defaultValue="299.99"
                                            className="w-full bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-2">
                                            Revenue Share %
                                        </label>
                                        <input
                                            type="number"
                                            defaultValue="60"
                                            className="w-full bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Category B */}
                            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-foreground">Category B</h3>
                                    <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30">
                                        Signature
                                    </Badge>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-2">
                                            Monthly Price
                                        </label>
                                        <input
                                            type="number"
                                            defaultValue="49.99"
                                            className="w-full bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-2">
                                            Annual Price
                                        </label>
                                        <input
                                            type="number"
                                            defaultValue="499.99"
                                            className="w-full bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-2">
                                            Revenue Share %
                                        </label>
                                        <input
                                            type="number"
                                            defaultValue="70"
                                            className="w-full bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Category C */}
                            <div className="bg-gradient-to-br from-orange-600/20 to-red-600/20 border border-orange-500/30 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-bold text-foreground">Category C</h3>
                                    <Badge className="bg-orange-600/20 text-orange-400 border-orange-600/30">
                                        Membership
                                    </Badge>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-2">
                                            Min Price
                                        </label>
                                        <input
                                            type="number"
                                            defaultValue="9.99"
                                            className="w-full bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-2">
                                            Max Price
                                        </label>
                                        <input
                                            type="number"
                                            defaultValue="199.99"
                                            className="w-full bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-muted-foreground mb-2">
                                            Platform Fee %
                                        </label>
                                        <input
                                            type="number"
                                            defaultValue="20"
                                            className="w-full bg-white/10 border border-border rounded-lg px-4 py-2 text-foreground"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-yellow-600/20 border border-yellow-500/30 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-yellow-300 mb-1">
                                    Pricing changes will affect new subscriptions only
                                </p>
                                <p className="text-xs text-yellow-400/80">
                                    Existing subscribers will maintain their current pricing until renewal
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Feature Flags */}
                {activeTab === 'features' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-4">Feature Flags</h2>
                            <p className="text-muted-foreground mb-8">Enable or disable platform features</p>
                        </div>

                        <div className="space-y-3">
                            {[
                                { name: 'Study Buddy Matching', description: 'Swipe-based learner matching system', enabled: true },
                                { name: 'Rewards & Scholarships', description: 'Contest and prize system', enabled: false },
                                { name: 'Live Sessions', description: 'Real-time streaming for creators', enabled: true },
                                { name: 'Offline Downloads', description: 'Allow course downloads', enabled: true },
                                { name: 'Community Groups', description: 'Creator-led discussion groups', enabled: true },
                                { name: 'Certificates', description: 'Course completion certificates', enabled: true },
                                { name: 'AI Recommendations', description: 'ML-powered content suggestions', enabled: false },
                                { name: 'Payment Plans', description: 'Installment payment options', enabled: false }
                            ].map((feature, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-white/5 border border-border rounded-xl hover:bg-white/10 transition-all">
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">{feature.name}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{feature.description}</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" defaultChecked={feature.enabled} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Payment Settings */}
                {activeTab === 'payments' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-4">Payment Settings</h2>
                            <p className="text-muted-foreground mb-8">Configure payment gateways and options</p>
                        </div>

                        <div className="space-y-6">
                            {/* Stripe Configuration Card with Link */}
                            <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 rounded-xl p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground">Stripe Configuration</h3>
                                        <p className="text-xs text-muted-foreground mt-1">Configure API keys and subscription prices</p>
                                    </div>
                                    <a
                                        href="/admin/settings/stripe"
                                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
                                    >
                                        <CreditCard className="w-4 h-4" />
                                        Configure Stripe
                                    </a>
                                </div>
                                <div className="bg-white/5 rounded-lg p-4 border border-purple-500/20">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground mb-1">API Keys Status</p>
                                            <p className="text-foreground font-semibold">
                                                {process.env.STRIPE_SECRET_KEY ? '✓ Configured' : '⚠ Not Set'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground mb-1">Webhook Status</p>
                                            <p className="text-foreground font-semibold">
                                                {process.env.STRIPE_WEBHOOK_SECRET ? '✓ Configured' : '⚠ Not Set'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground mb-1">Price IDs</p>
                                            <p className="text-foreground font-semibold">
                                                {process.env.STRIPE_PRICE_CATEGORY_A_MONTHLY ? '✓ Set' : '⚠ Missing'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground mb-1">Mode</p>
                                            <p className="text-foreground font-semibold">
                                                {process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'Live' : 'Test'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h3 className="text-sm font-bold text-foreground">Payment Options</h3>
                                {[
                                    { name: 'Credit/Debit Cards', enabled: true },
                                    { name: 'Apple Pay', enabled: true },
                                    { name: 'Google Pay', enabled: true },
                                    { name: 'PayPal', enabled: false },
                                    { name: 'Bank Transfer', enabled: false }
                                ].map((option, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 border border-border rounded-lg">
                                        <p className="text-sm text-foreground">{option.name}</p>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" defaultChecked={option.enabled} className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Email Templates */}
                {activeTab === 'emails' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-4">Email Templates</h2>
                            <p className="text-muted-foreground mb-8">Customize automated email communications</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { name: 'Welcome Email', status: 'active', lastEdited: '2 days ago' },
                                { name: 'Course Enrollment', status: 'active', lastEdited: '1 week ago' },
                                { name: 'Payment Receipt', status: 'active', lastEdited: '3 days ago' },
                                { name: 'Creator Approval', status: 'active', lastEdited: '5 days ago' },
                                { name: 'Subscription Renewal', status: 'active', lastEdited: '1 week ago' },
                                { name: 'Password Reset', status: 'active', lastEdited: '2 weeks ago' },
                                { name: 'Course Completion', status: 'draft', lastEdited: '1 month ago' },
                                { name: 'Scholarship Winner', status: 'draft', lastEdited: '2 months ago' }
                            ].map((template, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-white/5 border border-border rounded-xl hover:bg-white/10 transition-all cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                                            <Mail className="w-5 h-5 text-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground group-hover:text-blue-400 transition-colors">
                                                {template.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Edited {template.lastEdited}</p>
                                        </div>
                                    </div>
                                    <Badge className={`${
                                        template.status === 'active' 
                                            ? 'bg-green-600/20 text-green-400 border-green-600/30' 
                                            : 'bg-gray-600/20 text-muted-foreground border-gray-600/30'
                                    } text-xs capitalize`}>
                                        {template.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notifications */}
                {activeTab === 'notifications' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-4">Notification Settings</h2>
                            <p className="text-muted-foreground mb-8">Configure push and in-app notifications</p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-foreground mb-4">User Notifications</h3>
                                <div className="space-y-3">
                                    {[
                                        { name: 'New Course Available', description: 'Notify when new courses match interests' },
                                        { name: 'Study Buddy Match', description: 'Alert for new buddy matches' },
                                        { name: 'Live Session Reminder', description: 'Remind 15 minutes before live sessions' },
                                        { name: 'Assignment Due', description: 'Alert for upcoming assignment deadlines' },
                                        { name: 'Certificate Ready', description: 'Notify when certificate is generated' }
                                    ].map((notif, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-white/5 border border-border rounded-lg">
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">{notif.name}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{notif.description}</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-foreground mb-4">Creator Notifications</h3>
                                <div className="space-y-3">
                                    {[
                                        { name: 'New Subscriber', description: 'Alert when someone subscribes to channel' },
                                        { name: 'Content Approved', description: 'Notify when content passes review' },
                                        { name: 'Payout Processed', description: 'Alert when earnings are paid out' },
                                        { name: 'New Comment', description: 'Notify for new course comments' }
                                    ].map((notif, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-white/5 border border-border rounded-lg">
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">{notif.name}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{notif.description}</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Legal & Policy */}
                {activeTab === 'legal' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-4">Legal & Policy Documents</h2>
                            <p className="text-muted-foreground mb-8">Manage terms, policies, and legal documents</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { name: 'Terms of Service', lastUpdated: '2024-01-15', status: 'published' },
                                { name: 'Privacy Policy', lastUpdated: '2024-01-15', status: 'published' },
                                { name: 'Creator Agreement', lastUpdated: '2024-02-01', status: 'published' },
                                { name: 'Refund Policy', lastUpdated: '2024-01-20', status: 'published' },
                                { name: 'Content Guidelines', lastUpdated: '2024-02-10', status: 'published' },
                                { name: 'Community Standards', lastUpdated: '2024-01-30', status: 'published' },
                                { name: 'Cookie Policy', lastUpdated: '2024-01-15', status: 'draft' },
                                { name: 'DMCA Policy', lastUpdated: '2024-01-15', status: 'published' }
                            ].map((doc, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-white/5 border border-border rounded-xl hover:bg-white/10 transition-all cursor-pointer group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-foreground" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-foreground group-hover:text-orange-400 transition-colors">
                                                {doc.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Updated {doc.lastUpdated}</p>
                                        </div>
                                    </div>
                                    <Badge className={`${
                                        doc.status === 'published' 
                                            ? 'bg-green-600/20 text-green-400 border-green-600/30' 
                                            : 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30'
                                    } text-xs capitalize`}>
                                        {doc.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Security */}
                {activeTab === 'security' && (
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-4">Security Settings</h2>
                            <p className="text-muted-foreground mb-8">Configure platform security and access controls</p>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-gradient-to-br from-red-600/20 to-pink-600/20 border border-red-500/30 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-foreground mb-4">Authentication</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">Require Email Verification</p>
                                            <p className="text-xs text-muted-foreground mt-1">Force users to verify email before access</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" defaultChecked className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">Two-Factor Authentication</p>
                                            <p className="text-xs text-muted-foreground mt-1">Optional 2FA for all users</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" defaultChecked className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                        <div>
                                            <p className="text-sm font-semibold text-foreground">Password Minimum Length</p>
                                            <p className="text-xs text-muted-foreground mt-1">Minimum characters for passwords</p>
                                        </div>
                                        <input
                                            type="number"
                                            defaultValue="8"
                                            className="w-20 bg-white/10 border border-border rounded-lg px-3 py-1 text-foreground text-center"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-xl p-6">
                                <h3 className="text-lg font-bold text-foreground mb-4">Content Security</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                        <p className="text-sm text-foreground">DRM Protection</p>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" defaultChecked className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                        <p className="text-sm text-foreground">Video Watermarking</p>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" defaultChecked className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                        <p className="text-sm text-foreground">Download Restrictions</p>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" defaultChecked className="sr-only peer" />
                                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    )
}
