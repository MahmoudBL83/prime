'use client'

import React, { useState, useEffect, useCallback } from 'react'
import {
    Shield,
    Users,
    Lock,
    Unlock,
    Plus,
    Edit,
    Trash2,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    User,
    AlertTriangle,
    Download,
    History,
    Search,
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

type Permission = 'can_view' | 'can_edit' | 'can_approve' | 'can_delete'
type RoleType = 'super_admin' | 'finance_admin' | 'content_admin' | 'safety_admin' | 'support_admin' | 'custom'

interface ModulePermissions {
    module: string
    permissions: Permission[]
}

interface Role {
    id: string
    name: string
    type: RoleType
    description: string
    adminCount: number
    modules: ModulePermissions[]
    createdAt: string
    updatedAt: string
}

interface AdminUser {
    id: string
    name: string
    email: string
    role: string
    roleType: RoleType
    lastLogin: string
    status: 'active' | 'suspended'
    createdAt: string
}

interface AuditLog {
    id: string
    adminName: string
    adminEmail: string
    action: string
    module: string
    details: string
    timestamp: string
    ipAddress: string
    status: 'success' | 'failed'
}

const AVAILABLE_MODULES = [
    'Users Management',
    'Creator Applications',
    'Content Review',
    'Course Management',
    'Financial/Payouts',
    'Refunds',
    'Bans & Safety',
    'Appeals',
    'DMCA Claims',
    'Support Tickets',
    'Scholarships',
    'Analytics',
    'Communication',
    'Settings'
]

const roleColors = {
    super_admin: 'bg-purple-100 text-purple-800 border-purple-200',
    finance_admin: 'bg-green-100 text-green-800 border-green-200',
    content_admin: 'bg-blue-100 text-blue-800 border-blue-200',
    safety_admin: 'bg-red-100 text-red-800 border-red-200',
    support_admin: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    custom: 'bg-muted text-gray-800 border-border'
}

const permissionColors = {
    can_view: 'bg-blue-100 text-blue-800',
    can_edit: 'bg-yellow-100 text-yellow-800',
    can_approve: 'bg-green-100 text-green-800',
    can_delete: 'bg-red-100 text-red-800'
}

export default function PermissionsPage() {
    const [activeTab, setActiveTab] = useState('roles')
    const [roles, setRoles] = useState<Role[]>([])
    const [admins, setAdmins] = useState<AdminUser[]>([])
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [showRoleModal, setShowRoleModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showAuditModal, setShowAuditModal] = useState(false)
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
    const [stats, setStats] = useState({
        totalRoles: 0,
        totalAdmins: 0,
        activeAdmins: 0,
        totalAuditLogs: 0,
        failedAttempts: 0
    })

    const fetchData = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch('/api/admin/settings/permissions')
            if (!response.ok) throw new Error('Failed to fetch permissions data')
            const data = await response.json()
            setRoles(data.roles || [])
            setAdmins(data.admins || [])
            setAuditLogs(data.auditLogs || [])
            if (data.stats) {
                setStats(data.stats)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const handleViewRole = (role: Role) => {
        setSelectedRole(role)
        setShowRoleModal(true)
    }

    const handleEditRole = (role: Role) => {
        setSelectedRole(role)
        setShowEditModal(true)
    }

    const handleViewLog = (log: AuditLog) => {
        setSelectedLog(log)
        setShowAuditModal(true)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <p className="text-red-400">{error}</p>
                    <Button onClick={fetchData} className="mt-4">Retry</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-gray-900 p-6">
            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Permissions & Access Control</h1>
                        <p className="text-muted-foreground">Manage roles, permissions, and audit admin actions</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" className="bg-white/5 border-border text-muted-foreground hover:bg-white/10">
                            <Download className="w-4 h-4 mr-2" />
                            Export Audit Log
                        </Button>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-foreground">
                            <Plus className="w-4 h-4 mr-2" />
                            New Role
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Shield className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.totalRoles}</div>
                        <div className="text-sm text-muted-foreground mt-1">Total Roles</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <Users className="w-8 h-8 text-blue-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.totalAdmins}</div>
                        <div className="text-sm text-muted-foreground mt-1">Total Admins</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <CheckCircle className="w-8 h-8 text-green-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.activeAdmins}</div>
                        <div className="text-sm text-muted-foreground mt-1">Active</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <History className="w-8 h-8 text-purple-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.totalAuditLogs}</div>
                        <div className="text-sm text-muted-foreground mt-1">Audit Logs</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border p-6">
                        <div className="flex items-center justify-between mb-2">
                            <AlertTriangle className="w-8 h-8 text-red-400" />
                        </div>
                        <div className="text-3xl font-bold text-foreground">{stats.failedAttempts}</div>
                        <div className="text-sm text-muted-foreground mt-1">Failed Attempts</div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="bg-white/10 backdrop-blur-lg rounded-lg border border-border">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="border-b border-border px-6">
                            <TabsList className="bg-transparent">
                                <TabsTrigger value="roles" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <Shield className="w-4 h-4 mr-2" />
                                    Roles ({roles.length})
                                </TabsTrigger>
                                <TabsTrigger value="admins" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <Users className="w-4 h-4 mr-2" />
                                    Admins ({admins.length})
                                </TabsTrigger>
                                <TabsTrigger value="audit" className="data-[state=active]:bg-white/10 text-muted-foreground data-[state=active]:text-foreground">
                                    <History className="w-4 h-4 mr-2" />
                                    Audit Log ({auditLogs.length})
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Roles Tab */}
                        <TabsContent value="roles" className="p-6">
                            <div className="space-y-4">
                                {roles.map((role) => {
                                    const allPermissions = role.modules.reduce((acc, m) => acc + m.permissions.length, 0)
                                    
                                    return (
                                        <div key={role.id} className="bg-white/5 rounded-lg p-6 border border-border hover:bg-white/10 transition-all">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="bg-indigo-500/20 rounded-lg p-2">
                                                            <Shield className="w-6 h-6 text-indigo-400" />
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-semibold text-foreground">{role.name}</h3>
                                                            <p className="text-sm text-muted-foreground">{role.id}</p>
                                                        </div>
                                                        <Badge className={roleColors[role.type]}>
                                                            {role.type.replace(/_/g, ' ')}
                                                        </Badge>
                                                    </div>

                                                    <p className="text-muted-foreground mb-4">{role.description}</p>

                                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                                        <div className="bg-white/5 rounded-lg p-3 border border-border">
                                                            <div className="text-xs text-muted-foreground mb-1">Admins</div>
                                                            <div className="text-2xl font-bold text-foreground">{role.adminCount}</div>
                                                        </div>
                                                        <div className="bg-white/5 rounded-lg p-3 border border-border">
                                                            <div className="text-xs text-muted-foreground mb-1">Modules Access</div>
                                                            <div className="text-2xl font-bold text-blue-400">{role.modules.length}</div>
                                                        </div>
                                                        <div className="bg-white/5 rounded-lg p-3 border border-border">
                                                            <div className="text-xs text-muted-foreground mb-1">Total Permissions</div>
                                                            <div className="text-2xl font-bold text-green-400">{allPermissions}</div>
                                                        </div>
                                                    </div>

                                                    <div className="bg-white/5 rounded-lg p-4 border border-border">
                                                        <h4 className="text-sm font-semibold text-foreground mb-3">Module Access</h4>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {role.modules.slice(0, 6).map((module) => (
                                                                <div key={module.module} className="flex items-center justify-between text-sm">
                                                                    <span className="text-muted-foreground">{module.module}</span>
                                                                    <div className="flex gap-1">
                                                                        {module.permissions.map((perm) => (
                                                                            <Badge key={perm} className={`${permissionColors[perm]} text-xs px-2`}>
                                                                                {perm.replace('can_', '')}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {role.modules.length > 6 && (
                                                                <div className="text-sm text-muted-foreground">
                                                                    +{role.modules.length - 6} more modules
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="text-xs text-muted-foreground mt-3">
                                                        Last updated: {formatDate(role.updatedAt)}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2 ml-4">
                                                    <Button
                                                        variant="outline"
                                                        className="bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                                                        onClick={() => handleViewRole(role)}
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                                                        onClick={() => handleEditRole(role)}
                                                    >
                                                        <Edit className="w-4 h-4 mr-2" />
                                                        Edit
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </TabsContent>

                        {/* Admins Tab */}
                        <TabsContent value="admins" className="p-6">
                            <div className="space-y-4">
                                {admins.map((admin) => (
                                    <div key={admin.id} className="bg-white/5 rounded-lg p-5 border border-border">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-foreground font-bold text-lg">
                                                    {admin.name.split(' ').map(n => n[0]).join('')}
                                                </div>
                                                <div>
                                                    <h4 className="text-lg font-semibold text-foreground">{admin.name}</h4>
                                                    <p className="text-sm text-muted-foreground">{admin.email}</p>
                                                </div>
                                                <Badge className={roleColors[admin.roleType]}>
                                                    {admin.role}
                                                </Badge>
                                                <Badge className={admin.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                                    {admin.status}
                                                </Badge>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-sm text-muted-foreground">Last Login</div>
                                                <div className="text-foreground font-medium">{formatDate(admin.lastLogin)}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Audit Log Tab */}
                        <TabsContent value="audit" className="p-6">
                            <div className="space-y-4">
                                {auditLogs.map((log) => (
                                    <div
                                        key={log.id}
                                        className={`rounded-lg p-5 border ${
                                            log.status === 'failed' 
                                                ? 'bg-red-500/10 border-red-500/30' 
                                                : 'bg-white/5 border-border'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    {log.status === 'success' ? (
                                                        <CheckCircle className="w-5 h-5 text-green-400" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 text-red-400" />
                                                    )}
                                                    <h4 className="font-semibold text-foreground text-lg">{log.action}</h4>
                                                    <Badge className={log.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                                        {log.status}
                                                    </Badge>
                                                </div>

                                                <p className="text-muted-foreground mb-2">{log.details}</p>

                                                <div className="grid grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground">Admin:</span>
                                                        <span className="text-foreground ml-2">{log.adminName}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Module:</span>
                                                        <span className="text-blue-400 ml-2">{log.module}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">IP:</span>
                                                        <span className="text-foreground ml-2">{log.ipAddress}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Time:</span>
                                                        <span className="text-foreground ml-2">{formatDate(log.timestamp)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <Button
                                                variant="outline"
                                                className="bg-white/5 border-border text-muted-foreground hover:bg-white/10 ml-4"
                                                onClick={() => handleViewLog(log)}
                                            >
                                                <Eye className="w-4 h-4 mr-2" />
                                                Details
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* View Role Modal */}
            <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
                <DialogContent className="bg-background text-foreground border-border max-w-5xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Role Details</DialogTitle>
                    </DialogHeader>

                    {selectedRole && (
                        <div className="space-y-4 mt-4">
                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <h3 className="text-xl font-semibold text-foreground mb-2">{selectedRole.name}</h3>
                                <p className="text-muted-foreground">{selectedRole.description}</p>
                            </div>

                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <h4 className="text-sm font-semibold text-foreground mb-3">Permission Matrix</h4>
                                <div className="space-y-2">
                                    {selectedRole.modules.map((module) => (
                                        <div key={module.module} className="flex items-center justify-between py-2 border-b border-border">
                                            <span className="text-muted-foreground font-medium">{module.module}</span>
                                            <div className="flex gap-2">
                                                {['can_view', 'can_edit', 'can_approve', 'can_delete'].map((perm) => (
                                                    <div key={perm} className="flex items-center gap-1">
                                                        {module.permissions.includes(perm as Permission) ? (
                                                            <CheckCircle className="w-4 h-4 text-green-400" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4 text-muted-foreground" />
                                                        )}
                                                        <span className="text-xs text-muted-foreground">{perm.replace('can_', '')}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Role Modal */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent className="bg-background text-foreground border-border max-w-5xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Edit Role Permissions</DialogTitle>
                    </DialogHeader>

                    {selectedRole && (
                        <div className="space-y-4 mt-4">
                            <div className="space-y-3">
                                {AVAILABLE_MODULES.map((moduleName) => {
                                    const moduleData = selectedRole.modules.find(m => m.module === moduleName)
                                    const hasAccess = !!moduleData
                                    
                                    return (
                                        <div key={moduleName} className="bg-white/5 rounded-lg p-4 border border-border">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={hasAccess}
                                                        className="w-4 h-4"
                                                        readOnly
                                                    />
                                                    <span className="text-foreground font-medium">{moduleName}</span>
                                                </div>
                                                {hasAccess && (
                                                    <div className="flex gap-2">
                                                        {['can_view', 'can_edit', 'can_approve', 'can_delete'].map((perm) => (
                                                            <label key={perm} className="flex items-center gap-1">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={moduleData.permissions.includes(perm as Permission)}
                                                                    className="w-3 h-3"
                                                                    readOnly
                                                                />
                                                                <span className="text-xs text-muted-foreground">{perm.replace('can_', '')}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 bg-white/5 border-border text-muted-foreground hover:bg-white/10"
                                >
                                    Cancel
                                </Button>
                                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-foreground">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Audit Log Details Modal */}
            <Dialog open={showAuditModal} onOpenChange={setShowAuditModal}>
                <DialogContent className="bg-background text-foreground border-border">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Audit Log Details</DialogTitle>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-4 mt-4">
                            <div className="bg-white/5 rounded-lg p-4 border border-border">
                                <div className="flex items-center gap-2 mb-2">
                                    <Badge className={selectedLog.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                        {selectedLog.status}
                                    </Badge>
                                </div>
                                <h4 className="text-lg font-semibold text-foreground mb-2">{selectedLog.action}</h4>
                                <p className="text-muted-foreground">{selectedLog.details}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-lg p-3 border border-border">
                                    <div className="text-sm text-muted-foreground">Admin</div>
                                    <div className="text-foreground font-semibold">{selectedLog.adminName}</div>
                                    <div className="text-sm text-muted-foreground">{selectedLog.adminEmail}</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 border border-border">
                                    <div className="text-sm text-muted-foreground">Module</div>
                                    <div className="text-foreground font-semibold">{selectedLog.module}</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 border border-border">
                                    <div className="text-sm text-muted-foreground">IP Address</div>
                                    <div className="text-foreground font-semibold">{selectedLog.ipAddress}</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 border border-border">
                                    <div className="text-sm text-muted-foreground">Timestamp</div>
                                    <div className="text-foreground font-semibold">{formatDate(selectedLog.timestamp)}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
