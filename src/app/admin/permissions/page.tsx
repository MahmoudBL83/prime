'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
    Shield,
    Users,
    CheckCircle,
    XCircle,
    Edit,
    Trash2,
    Plus,
    Search,
    Lock,
    Unlock,
    Eye,
    FileText,
    DollarSign,
    BarChart3,
    Settings,
    UserCheck,
    AlertTriangle,
    BookOpen
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

type Permission = 
    | 'users.view' | 'users.edit' | 'users.delete' | 'users.ban'
    | 'creators.view' | 'creators.edit' | 'creators.approve' | 'creators.ban'
    | 'content.view' | 'content.edit' | 'content.approve' | 'content.delete'
    | 'financial.view' | 'financial.edit' | 'financial.payouts'
    | 'analytics.view' | 'analytics.export'
    | 'settings.view' | 'settings.edit'
    | 'safety.view' | 'safety.moderate' | 'safety.ban'
    | 'rewards.view' | 'rewards.edit' | 'rewards.approve'
    | 'channels.view' | 'channels.approve' | 'channels.moderate'
    | 'signature.view' | 'signature.curate' | 'signature.publish'

interface Role {
    id: string
    name: string
    description: string
    color: string
    permissions: Permission[]
    userCount: number
    isSystem: boolean
    createdAt: string
}

interface AdminUser {
    id: string
    name: string
    email: string
    role: string
    avatar: string
    status: 'active' | 'suspended' | 'invited'
    lastActive: string
    createdAt: string
}

const allPermissions: { category: string; permissions: { key: Permission; label: string; description: string }[] }[] = [
    {
        category: 'Users',
        permissions: [
            { key: 'users.view', label: 'View Users', description: 'View user profiles and data' },
            { key: 'users.edit', label: 'Edit Users', description: 'Modify user information' },
            { key: 'users.delete', label: 'Delete Users', description: 'Permanently delete user accounts' },
            { key: 'users.ban', label: 'Ban Users', description: 'Suspend or ban user accounts' }
        ]
    },
    {
        category: 'Creators',
        permissions: [
            { key: 'creators.view', label: 'View Creators', description: 'View creator profiles and applications' },
            { key: 'creators.edit', label: 'Edit Creators', description: 'Modify creator information' },
            { key: 'creators.approve', label: 'Approve Creators', description: 'Approve creator applications' },
            { key: 'creators.ban', label: 'Ban Creators', description: 'Suspend creator accounts' }
        ]
    },
    {
        category: 'Content',
        permissions: [
            { key: 'content.view', label: 'View Content', description: 'View all courses and content' },
            { key: 'content.edit', label: 'Edit Content', description: 'Modify course content' },
            { key: 'content.approve', label: 'Approve Content', description: 'Approve/reject content submissions' },
            { key: 'content.delete', label: 'Delete Content', description: 'Remove content from platform' }
        ]
    },
    {
        category: 'Financial',
        permissions: [
            { key: 'financial.view', label: 'View Financial', description: 'View revenue and transactions' },
            { key: 'financial.edit', label: 'Edit Financial', description: 'Modify pricing and revenue settings' },
            { key: 'financial.payouts', label: 'Process Payouts', description: 'Approve and process creator payouts' }
        ]
    },
    {
        category: 'Analytics',
        permissions: [
            { key: 'analytics.view', label: 'View Analytics', description: 'Access platform analytics' },
            { key: 'analytics.export', label: 'Export Analytics', description: 'Export analytics reports' }
        ]
    },
    {
        category: 'Settings',
        permissions: [
            { key: 'settings.view', label: 'View Settings', description: 'View platform settings' },
            { key: 'settings.edit', label: 'Edit Settings', description: 'Modify platform configuration' }
        ]
    },
    {
        category: 'Safety',
        permissions: [
            { key: 'safety.view', label: 'View Reports', description: 'View safety reports' },
            { key: 'safety.moderate', label: 'Moderate Content', description: 'Review and moderate flagged content' },
            { key: 'safety.ban', label: 'Ban Users', description: 'Take enforcement actions' }
        ]
    },
    {
        category: 'Rewards',
        permissions: [
            { key: 'rewards.view', label: 'View Rewards', description: 'View rewards and scholarships' },
            { key: 'rewards.edit', label: 'Edit Rewards', description: 'Create and modify rewards' },
            { key: 'rewards.approve', label: 'Approve Winners', description: 'Approve reward winners' }
        ]
    },
    {
        category: 'Channels',
        permissions: [
            { key: 'channels.view', label: 'View Channels', description: 'View membership channels' },
            { key: 'channels.approve', label: 'Approve Channels', description: 'Approve channel applications' },
            { key: 'channels.moderate', label: 'Moderate Channels', description: 'Moderate channel content' }
        ]
    },
    {
        category: 'Signature',
        permissions: [
            { key: 'signature.view', label: 'View Courses', description: 'View signature courses' },
            { key: 'signature.curate', label: 'Curate Content', description: 'Curate and review courses' },
            { key: 'signature.publish', label: 'Publish Courses', description: 'Approve for publication' }
        ]
    }
]

const mockRoles: Role[] = [
    {
        id: '1',
        name: 'Super Admin',
        description: 'Full access to all platform features and settings',
        color: 'from-red-600 to-pink-600',
        permissions: allPermissions.flatMap(cat => cat.permissions.map(p => p.key)),
        userCount: 2,
        isSystem: true,
        createdAt: '2025-01-01'
    },
    {
        id: '2',
        name: 'Content Operations',
        description: 'Manage content review and approval workflows',
        color: 'from-blue-600 to-cyan-600',
        permissions: ['content.view', 'content.edit', 'content.approve', 'creators.view', 'users.view'],
        userCount: 8,
        isSystem: true,
        createdAt: '2025-01-01'
    },
    {
        id: '3',
        name: 'Trust & Safety',
        description: 'Moderate content and handle safety reports',
        color: 'from-purple-600 to-pink-600',
        permissions: ['safety.view', 'safety.moderate', 'safety.ban', 'users.view', 'users.ban', 'content.view'],
        userCount: 5,
        isSystem: true,
        createdAt: '2025-01-01'
    },
    {
        id: '4',
        name: 'Finance Operations',
        description: 'Manage revenue, payouts, and financial reporting',
        color: 'from-green-600 to-emerald-600',
        permissions: ['financial.view', 'financial.edit', 'financial.payouts', 'creators.view', 'analytics.view'],
        userCount: 3,
        isSystem: true,
        createdAt: '2025-01-01'
    },
    {
        id: '5',
        name: 'Editorial Team',
        description: 'Curate signature courses and manage quality standards',
        color: 'from-yellow-600 to-orange-600',
        permissions: ['signature.view', 'signature.curate', 'signature.publish', 'content.view', 'creators.view'],
        userCount: 4,
        isSystem: true,
        createdAt: '2025-01-01'
    },
    {
        id: '6',
        name: 'Creator Success',
        description: 'Support creators and approve applications',
        color: 'from-indigo-600 to-purple-600',
        permissions: ['creators.view', 'creators.edit', 'creators.approve', 'channels.view', 'channels.approve', 'content.view', 'analytics.view'],
        userCount: 6,
        isSystem: true,
        createdAt: '2025-01-01'
    }
]

const mockAdminUsers: AdminUser[] = [
    {
        id: '1',
        name: 'Mohamed Shahid',
        email: 'shahid@edtech.eg',
        role: 'Super Admin',
        avatar: 'MS',
        status: 'active',
        lastActive: '2025-10-15',
        createdAt: '2025-01-01'
    },
    {
        id: '2',
        name: 'Sara Ahmed',
        email: 'sara@edtech.eg',
        role: 'Content Operations',
        avatar: 'SA',
        status: 'active',
        lastActive: '2025-10-15',
        createdAt: '2025-03-15'
    },
    {
        id: '3',
        name: 'Ali Hassan',
        email: 'ali@edtech.eg',
        role: 'Trust & Safety',
        avatar: 'AH',
        status: 'active',
        lastActive: '2025-10-14',
        createdAt: '2025-04-20'
    },
    {
        id: '4',
        name: 'Fatima Nour',
        email: 'fatima@edtech.eg',
        role: 'Finance Operations',
        avatar: 'FN',
        status: 'active',
        lastActive: '2025-10-15',
        createdAt: '2025-05-10'
    },
    {
        id: '5',
        name: 'Omar Khalil',
        email: 'omar@edtech.eg',
        role: 'Editorial Team',
        avatar: 'OK',
        status: 'invited',
        lastActive: '2025-10-10',
        createdAt: '2025-10-10'
    }
]

export default function AdminPermissionsPage() {
    const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles')
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [editMode, setEditMode] = useState(false)

    const filteredRoles = mockRoles.filter(role => 
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.description.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredUsers = mockAdminUsers.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getRoleColor = (roleName: string) => {
        const role = mockRoles.find(r => r.name === roleName)
        return role?.color || 'from-gray-600 to-gray-700'
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-blue-950/20">
            <div className="p-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                                Permissions & Roles
                            </h1>
                            <p className="text-muted-foreground mt-2">
                                Manage admin roles and access control
                            </p>
                        </div>
                        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-foreground">
                            <Plus className="w-4 h-4 mr-2" />
                            Create New Role
                        </Button>
                    </div>
                </motion.div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {[
                        { label: 'Total Roles', value: mockRoles.length, icon: Shield, color: 'from-blue-600 to-cyan-600' },
                        { label: 'Admin Users', value: mockAdminUsers.length, icon: Users, color: 'from-purple-600 to-pink-600' },
                        { label: 'Active Today', value: mockAdminUsers.filter(u => u.status === 'active').length, icon: UserCheck, color: 'from-green-600 to-emerald-600' },
                        { label: 'Pending Invites', value: mockAdminUsers.filter(u => u.status === 'invited').length, icon: AlertTriangle, color: 'from-yellow-600 to-orange-600' }
                    ].map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6 hover:border-border transition-all group"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity`} />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-4">
                                    <stat.icon className={`w-8 h-8 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} />
                                </div>
                                <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-4 mb-6">
                    {[
                        { id: 'roles', label: 'Roles', count: mockRoles.length },
                        { id: 'users', label: 'Admin Users', count: mockAdminUsers.length }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={`px-4 py-2 rounded-xl font-medium transition-all ${
                                activeTab === tab.id
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-foreground'
                                    : 'bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'
                            }`}
                        >
                            {tab.label}
                            <Badge className="ml-2 bg-white/20 text-foreground">
                                {tab.count}
                            </Badge>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={activeTab === 'roles' ? 'Search roles...' : 'Search admin users...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                </div>

                {/* Roles Tab */}
                {activeTab === 'roles' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredRoles.map((role, index) => (
                            <motion.div
                                key={role.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6 hover:border-border transition-all cursor-pointer"
                                onClick={() => setSelectedRole(role)}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className={`w-12 h-12 bg-gradient-to-br ${role.color} rounded-xl flex items-center justify-center`}>
                                        <Shield className="w-6 h-6 text-foreground" />
                                    </div>
                                    {role.isSystem && (
                                        <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30">
                                            System
                                        </Badge>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-foreground mb-2">{role.name}</h3>
                                <p className="text-sm text-muted-foreground mb-4">{role.description}</p>

                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Users className="w-4 h-4" />
                                        <span>{role.userCount} users</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Lock className="w-4 h-4" />
                                        <span>{role.permissions.length} permissions</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button className="flex-1 bg-white/5 hover:bg-white/10 text-foreground border border-border text-sm">
                                        <Eye className="w-4 h-4 mr-2" />
                                        View
                                    </Button>
                                    {!role.isSystem && (
                                        <>
                                            <Button className="px-3 bg-white/5 hover:bg-white/10 text-foreground border border-border">
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button className="px-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="space-y-4">
                        {filteredUsers.map((user, index) => (
                            <motion.div
                                key={user.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white/5 backdrop-blur-xl border border-border rounded-2xl p-6 hover:border-border transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-16 h-16 bg-gradient-to-br ${getRoleColor(user.role)} rounded-xl flex items-center justify-center text-foreground font-bold text-xl`}>
                                            {user.avatar}
                                        </div>

                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-xl font-bold text-foreground">{user.name}</h3>
                                                <Badge className={`${
                                                    user.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                                    user.status === 'invited' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                                    'bg-red-500/20 text-red-400 border-red-500/30'
                                                } border`}>
                                                    {user.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                                                    {user.status === 'suspended' && <XCircle className="w-3 h-3 mr-1" />}
                                                    {user.status === 'invited' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                                    {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                                </Badge>
                                            </div>
                                            <p className="text-muted-foreground mb-2">{user.email}</p>
                                            <Badge className={`bg-gradient-to-r ${getRoleColor(user.role)} text-foreground border-0`}>
                                                {user.role}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground mb-1">Last Active</p>
                                        <p className="text-foreground font-medium">{new Date(user.lastActive).toLocaleDateString()}</p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Joined {new Date(user.createdAt).toLocaleDateString()}
                                        </p>
                                        <div className="flex items-center gap-2 mt-4">
                                            <Button className="bg-white/5 hover:bg-white/10 text-foreground border border-border text-sm">
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edit
                                            </Button>
                                            {user.status === 'active' && (
                                                <Button className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-sm">
                                                    <Lock className="w-4 h-4 mr-2" />
                                                    Suspend
                                                </Button>
                                            )}
                                            {user.status === 'invited' && (
                                                <Button className="bg-blue-600 hover:bg-blue-700 text-foreground text-sm">
                                                    Resend Invite
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Role Detail Modal/Panel */}
                {selectedRole && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50 flex items-center justify-center p-8"
                        onClick={() => setSelectedRole(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-background border border-border rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-foreground mb-2">{selectedRole.name}</h2>
                                    <p className="text-muted-foreground">{selectedRole.description}</p>
                                </div>
                                <Button
                                    onClick={() => setSelectedRole(null)}
                                    className="bg-white/5 hover:bg-white/10 text-foreground border border-border"
                                >
                                    Close
                                </Button>
                            </div>

                            <div className="space-y-6">
                                {allPermissions.map((category) => (
                                    <div key={category.category} className="bg-white/5 border border-border rounded-xl p-6">
                                        <h3 className="text-xl font-bold text-foreground mb-4">{category.category}</h3>
                                        <div className="space-y-3">
                                            {category.permissions.map((permission) => {
                                                const hasPermission = selectedRole.permissions.includes(permission.key)
                                                return (
                                                    <div
                                                        key={permission.key}
                                                        className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                                                            hasPermission ? 'bg-green-500/10 border border-green-500/30' : 'bg-white/5'
                                                        }`}
                                                    >
                                                        <div>
                                                            <p className="font-medium text-foreground">{permission.label}</p>
                                                            <p className="text-sm text-muted-foreground">{permission.description}</p>
                                                        </div>
                                                        {hasPermission ? (
                                                            <CheckCircle className="w-6 h-6 text-green-400" />
                                                        ) : (
                                                            <XCircle className="w-6 h-6 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
