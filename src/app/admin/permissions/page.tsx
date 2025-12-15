'use client'

import { useState, useEffect, useCallback } from 'react'
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
    Eye,
    UserCheck,
    AlertTriangle,
    Loader2,
    Save,
    X,
    UserPlus,
    RefreshCw
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface Permission {
    key: string
    label: string
    description: string
}

interface PermissionCategory {
    label: string
    permissions: Record<string, { label: string; description: string }>
}

interface Role {
    id: string
    name: string
    type: string
    description: string | null
    color: string
    permissions: string[]
    userCount: number
    isSystem: boolean
    createdAt: string
    admins: {
        id: string
        name: string
        email: string
        avatar: string | null
        assignedAt: string
    }[]
}

interface AdminUser {
    id: string
    name: string
    email: string
    role: string
    roleId: string | null
    roleType: string | null
    avatar: string
    status: 'active' | 'suspended' | 'invited'
    lastActive: string
    createdAt: string
}

interface Stats {
    totalRoles: number
    totalAdmins: number
    activeToday: number
    pendingInvites: number
}

export default function AdminPermissionsPage() {
    const [activeTab, setActiveTab] = useState<'roles' | 'users'>('roles')
    const [roles, setRoles] = useState<Role[]>([])
    const [users, setUsers] = useState<AdminUser[]>([])
    const [stats, setStats] = useState<Stats>({ totalRoles: 0, totalAdmins: 0, activeToday: 0, pendingInvites: 0 })
    const [permissionDefinitions, setPermissionDefinitions] = useState<Record<string, PermissionCategory>>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    
    // Modal states
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [showRoleModal, setShowRoleModal] = useState(false)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [saving, setSaving] = useState(false)
    
    // Form states
    const [newRoleName, setNewRoleName] = useState('')
    const [newRoleDescription, setNewRoleDescription] = useState('')
    const [newRoleType, setNewRoleType] = useState('CUSTOM')
    const [newRolePermissions, setNewRolePermissions] = useState<string[]>([])
    const [editedPermissions, setEditedPermissions] = useState<string[]>([])
    const [assignEmail, setAssignEmail] = useState('')

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/admin/roles')
            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch data')
            }

            if (result.success) {
                setRoles(result.data.roles || [])
                setUsers(result.data.users || [])
                setStats(result.data.stats || { totalRoles: 0, totalAdmins: 0, activeToday: 0, pendingInvites: 0 })
                setPermissionDefinitions(result.data.permissionDefinitions || {})
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

    // Seed default roles if none exist
    const seedRoles = async () => {
        try {
            setSaving(true)
            const response = await fetch('/api/admin/roles/seed', { method: 'POST' })
            const result = await response.json()
            
            if (result.success) {
                await fetchData()
            } else {
                throw new Error(result.error)
            }
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to seed roles')
        } finally {
            setSaving(false)
        }
    }

    const handleCreateRole = async () => {
        if (!newRoleName.trim()) {
            alert('Please enter a role name')
            return
        }

        try {
            setSaving(true)
            const response = await fetch('/api/admin/roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newRoleName.trim(),
                    type: newRoleType,
                    description: newRoleDescription.trim() || undefined,
                    permissions: newRolePermissions
                })
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to create role')
            }

            setShowCreateModal(false)
            setNewRoleName('')
            setNewRoleDescription('')
            setNewRoleType('CUSTOM')
            setNewRolePermissions([])
            await fetchData()
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to create role')
        } finally {
            setSaving(false)
        }
    }

    const handleUpdatePermissions = async () => {
        if (!selectedRole) return

        try {
            setSaving(true)
            const response = await fetch(`/api/admin/roles/${selectedRole.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    permissions: editedPermissions
                })
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update role')
            }

            setEditMode(false)
            await fetchData()
            // Update selected role with new permissions
            setSelectedRole(prev => prev ? { ...prev, permissions: editedPermissions } : null)
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update role')
        } finally {
            setSaving(false)
        }
    }

    const handleDeleteRole = async (roleId: string) => {
        if (!confirm('Are you sure you want to delete this role?')) return

        try {
            const response = await fetch(`/api/admin/roles/${roleId}`, {
                method: 'DELETE'
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to delete role')
            }

            await fetchData()
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete role')
        }
    }

    const handleAssignUser = async () => {
        if (!selectedRole || !assignEmail.trim()) {
            alert('Please enter a user email')
            return
        }

        try {
            setSaving(true)
            
            // First find the user by email
            const searchResponse = await fetch(`/api/admin/users?search=${encodeURIComponent(assignEmail.trim())}`)
            const searchResult = await searchResponse.json()
            
            const user = searchResult.data?.users?.find((u: { email: string }) => 
                u.email.toLowerCase() === assignEmail.trim().toLowerCase()
            )

            if (!user) {
                throw new Error('User not found with this email')
            }

            // Assign the user to the role
            const response = await fetch(`/api/admin/roles/${selectedRole.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: user.id,
                    action: 'assign'
                })
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to assign user')
            }

            setShowAssignModal(false)
            setAssignEmail('')
            await fetchData()
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to assign user')
        } finally {
            setSaving(false)
        }
    }

    const handleUnassignUser = async (userId: string, roleId: string) => {
        if (!confirm('Remove this user from the role?')) return

        try {
            const response = await fetch(`/api/admin/roles/${roleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    action: 'unassign'
                })
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to unassign user')
            }

            await fetchData()
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to unassign user')
        }
    }

    const togglePermission = (permission: string, list: string[], setter: (p: string[]) => void) => {
        if (list.includes(permission)) {
            setter(list.filter(p => p !== permission))
        } else {
            setter([...list, permission])
        }
    }

    const filteredRoles = roles.filter(role => 
        role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (role.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    )

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const getRoleColor = (roleName: string) => {
        const role = roles.find(r => r.name === roleName)
        return role?.color || 'from-gray-600 to-gray-700'
    }

    // Get all permissions as flat array for create modal
    const allPermissions: Permission[] = Object.entries(permissionDefinitions).flatMap(([, cat]) =>
        Object.entries(cat.permissions).map(([key, perm]) => ({
            key,
            label: perm.label,
            description: perm.description
        }))
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-blue-950/20 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-blue-950/20 p-8">
                <div className="bg-red-600/20 border border-red-500/30 rounded-lg p-6 max-w-lg mx-auto">
                    <p className="text-red-300 mb-4">Error: {error}</p>
                    <Button onClick={fetchData} className="bg-red-600 hover:bg-red-700">
                        Try Again
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-blue-950/20">
            <div className="p-4 sm:p-6 lg:p-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 lg:mb-8"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
                        <div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                                Permissions & Roles
                            </h1>
                            <p className="text-muted-foreground mt-2 text-sm sm:text-base">
                                Manage admin roles and access control
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button 
                                onClick={fetchData}
                                variant="outline"
                                className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                                size="sm"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                            {roles.length === 0 && (
                                <Button 
                                    onClick={seedRoles}
                                    disabled={saving}
                                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-foreground"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                                    Setup Default Roles
                                </Button>
                            )}
                            <Button 
                                onClick={() => setShowCreateModal(true)}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-foreground"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                <span className="hidden sm:inline">Create New Role</span>
                                <span className="sm:hidden">New</span>
                            </Button>
                        </div>
                    </div>
                </motion.div>

                {/* Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 lg:mb-8">
                    {[
                        { label: 'Total Roles', value: stats.totalRoles, icon: Shield, color: 'from-blue-600 to-cyan-600' },
                        { label: 'Admin Users', value: stats.totalAdmins, icon: Users, color: 'from-purple-600 to-pink-600' },
                        { label: 'Active Today', value: stats.activeToday, icon: UserCheck, color: 'from-green-600 to-emerald-600' },
                        { label: 'Pending Invites', value: stats.pendingInvites, icon: AlertTriangle, color: 'from-yellow-600 to-orange-600' }
                    ].map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative bg-white/5 backdrop-blur-xl border border-border rounded-xl lg:rounded-2xl p-4 lg:p-6 hover:border-border transition-all group"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 rounded-xl lg:rounded-2xl transition-opacity`} />
                            <div className="relative">
                                <div className="flex items-center justify-between mb-2 lg:mb-4">
                                    <stat.icon className={`w-6 h-6 lg:w-8 lg:h-8 bg-gradient-to-br ${stat.color} bg-clip-text text-transparent`} />
                                </div>
                                <p className="text-xl lg:text-3xl font-bold text-foreground mb-1">{stat.value}</p>
                                <p className="text-xs lg:text-sm text-muted-foreground">{stat.label}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Tabs */}
                <div className="flex items-center gap-2 sm:gap-4 mb-4 lg:mb-6">
                    {[
                        { id: 'roles', label: 'Roles', count: roles.length },
                        { id: 'users', label: 'Admin Users', count: users.length }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as typeof activeTab)}
                            className={`px-3 sm:px-4 py-2 rounded-xl font-medium transition-all text-sm sm:text-base ${
                                activeTab === tab.id
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-foreground'
                                    : 'bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10'
                            }`}
                        >
                            {tab.label}
                            <Badge className="ml-2 bg-white/20 text-foreground text-xs">
                                {tab.count}
                            </Badge>
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative mb-4 lg:mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={activeTab === 'roles' ? 'Search roles...' : 'Search admin users...'}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/5 border border-border rounded-xl pl-10 pr-4 py-3 text-foreground placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm sm:text-base"
                    />
                </div>

                {/* Roles Tab */}
                {activeTab === 'roles' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                        {filteredRoles.length === 0 ? (
                            <div className="col-span-full bg-white/5 rounded-xl p-8 text-center">
                                <Shield className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                                <p className="text-gray-400 mb-4">No roles found</p>
                                <Button onClick={seedRoles} disabled={saving}>
                                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    Setup Default Roles
                                </Button>
                            </div>
                        ) : (
                            filteredRoles.map((role, index) => (
                                <motion.div
                                    key={role.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white/5 backdrop-blur-xl border border-border rounded-xl lg:rounded-2xl p-4 lg:p-6 hover:border-blue-500/30 transition-all cursor-pointer"
                                    onClick={() => {
                                        setSelectedRole(role)
                                        setEditedPermissions(role.permissions)
                                        setShowRoleModal(true)
                                    }}
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br ${role.color} rounded-xl flex items-center justify-center`}>
                                            <Shield className="w-5 h-5 lg:w-6 lg:h-6 text-foreground" />
                                        </div>
                                        {role.isSystem && (
                                            <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-600/30 text-xs">
                                                System
                                            </Badge>
                                        )}
                                    </div>

                                    <h3 className="text-lg lg:text-xl font-bold text-foreground mb-2">{role.name}</h3>
                                    <p className="text-xs lg:text-sm text-muted-foreground mb-4 line-clamp-2">{role.description}</p>

                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 text-xs lg:text-sm text-muted-foreground">
                                            <Users className="w-4 h-4" />
                                            <span>{role.userCount} users</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs lg:text-sm text-muted-foreground">
                                            <Lock className="w-4 h-4" />
                                            <span>{role.permissions.length} permissions</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Button 
                                            className="flex-1 bg-white/5 hover:bg-white/10 text-foreground border border-border text-xs lg:text-sm"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setSelectedRole(role)
                                                setEditedPermissions(role.permissions)
                                                setShowRoleModal(true)
                                            }}
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            View
                                        </Button>
                                        {!role.isSystem && (
                                            <Button 
                                                className="px-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteRole(role.id)
                                                }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        )}
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                )}

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div className="space-y-3 lg:space-y-4">
                        {filteredUsers.length === 0 ? (
                            <div className="bg-white/5 rounded-xl p-8 text-center">
                                <Users className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                                <p className="text-gray-400">No admin users found</p>
                            </div>
                        ) : (
                            filteredUsers.map((user, index) => (
                                <motion.div
                                    key={user.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="bg-white/5 backdrop-blur-xl border border-border rounded-xl lg:rounded-2xl p-4 lg:p-6 hover:border-blue-500/30 transition-all"
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 lg:gap-4">
                                            <div className={`w-12 h-12 lg:w-16 lg:h-16 bg-gradient-to-br ${getRoleColor(user.role)} rounded-xl flex items-center justify-center text-foreground font-bold text-sm lg:text-xl`}>
                                                {typeof user.avatar === 'string' && user.avatar.length <= 2 
                                                    ? user.avatar 
                                                    : user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                            </div>

                                            <div>
                                                <div className="flex flex-wrap items-center gap-2 lg:gap-3 mb-1">
                                                    <h3 className="text-base lg:text-xl font-bold text-foreground">{user.name}</h3>
                                                    <Badge className={`${
                                                        user.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                                        user.status === 'invited' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                                        'bg-red-500/20 text-red-400 border-red-500/30'
                                                    } border text-xs`}>
                                                        {user.status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
                                                        {user.status === 'suspended' && <XCircle className="w-3 h-3 mr-1" />}
                                                        {user.status === 'invited' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                                                    </Badge>
                                                </div>
                                                <p className="text-muted-foreground text-sm mb-2">{user.email}</p>
                                                <Badge className={`bg-gradient-to-r ${getRoleColor(user.role)} text-foreground border-0 text-xs`}>
                                                    {user.role}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-start lg:items-end gap-2">
                                            <div className="text-xs lg:text-sm text-muted-foreground">
                                                <span>Last Active: </span>
                                                <span className="text-foreground">{new Date(user.lastActive).toLocaleDateString()}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Joined {new Date(user.createdAt).toLocaleDateString()}
                                            </div>
                                            {user.roleId && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 text-xs"
                                                    onClick={() => handleUnassignUser(user.id, user.roleId!)}
                                                >
                                                    Remove Role
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                )}

                {/* Role Detail Modal */}
                <Dialog open={showRoleModal} onOpenChange={setShowRoleModal}>
                    <DialogContent className="bg-gray-900 border-white/10 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <DialogTitle className="text-2xl">{selectedRole?.name}</DialogTitle>
                                    <DialogDescription className="text-gray-400">
                                        {selectedRole?.description}
                                    </DialogDescription>
                                </div>
                                <div className="flex gap-2">
                                    {!editMode ? (
                                        <>
                                            <Button
                                                onClick={() => {
                                                    setShowAssignModal(true)
                                                }}
                                                className="bg-blue-600 hover:bg-blue-700"
                                                size="sm"
                                            >
                                                <UserPlus className="w-4 h-4 mr-2" />
                                                Assign User
                                            </Button>
                                            <Button
                                                onClick={() => setEditMode(true)}
                                                variant="outline"
                                                className="bg-white/5 border-white/10"
                                                size="sm"
                                            >
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edit Permissions
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Button
                                                onClick={handleUpdatePermissions}
                                                disabled={saving}
                                                className="bg-green-600 hover:bg-green-700"
                                                size="sm"
                                            >
                                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                                Save
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setEditMode(false)
                                                    setEditedPermissions(selectedRole?.permissions || [])
                                                }}
                                                variant="outline"
                                                className="bg-white/5 border-white/10"
                                                size="sm"
                                            >
                                                <X className="w-4 h-4 mr-2" />
                                                Cancel
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Assigned Users */}
                        {selectedRole && selectedRole.admins.length > 0 && (
                            <div className="mb-6 p-4 bg-white/5 rounded-xl">
                                <h4 className="text-sm font-medium text-gray-400 mb-3">Assigned Users ({selectedRole.admins.length})</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedRole.admins.map(admin => (
                                        <div key={admin.id} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-xs font-bold">
                                                {admin.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'A'}
                                            </div>
                                            <span className="text-sm">{admin.name}</span>
                                            <button
                                                onClick={() => handleUnassignUser(admin.id, selectedRole.id)}
                                                className="text-red-400 hover:text-red-300 ml-1"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="space-y-4 lg:space-y-6">
                            {Object.entries(permissionDefinitions).map(([catKey, category]) => (
                                <div key={catKey} className="bg-white/5 border border-border rounded-xl p-4 lg:p-6">
                                    <h3 className="text-lg lg:text-xl font-bold text-foreground mb-4">{category.label}</h3>
                                    <div className="space-y-2 lg:space-y-3">
                                        {Object.entries(category.permissions).map(([permKey, permission]) => {
                                            const hasPermission = editMode 
                                                ? editedPermissions.includes(permKey)
                                                : selectedRole?.permissions.includes(permKey)
                                            return (
                                                <div
                                                    key={permKey}
                                                    className={`flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer ${
                                                        hasPermission ? 'bg-green-500/10 border border-green-500/30' : 'bg-white/5 border border-transparent'
                                                    } ${editMode ? 'hover:border-blue-500/50' : ''}`}
                                                    onClick={() => {
                                                        if (editMode) {
                                                            togglePermission(permKey, editedPermissions, setEditedPermissions)
                                                        }
                                                    }}
                                                >
                                                    <div>
                                                        <p className="font-medium text-foreground text-sm lg:text-base">{permission.label}</p>
                                                        <p className="text-xs lg:text-sm text-muted-foreground">{permission.description}</p>
                                                    </div>
                                                    {hasPermission ? (
                                                        <CheckCircle className="w-5 h-5 lg:w-6 lg:h-6 text-green-400 flex-shrink-0" />
                                                    ) : (
                                                        <XCircle className="w-5 h-5 lg:w-6 lg:h-6 text-muted-foreground flex-shrink-0" />
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Create Role Modal */}
                <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                    <DialogContent className="bg-gray-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create New Role</DialogTitle>
                            <DialogDescription className="text-gray-400">
                                Define a new admin role with specific permissions
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Role Name *</label>
                                <Input
                                    value={newRoleName}
                                    onChange={(e) => setNewRoleName(e.target.value)}
                                    placeholder="e.g., Marketing Team"
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                <Textarea
                                    value={newRoleDescription}
                                    onChange={(e) => setNewRoleDescription(e.target.value)}
                                    placeholder="What is this role responsible for?"
                                    className="bg-white/5 border-white/10 text-white"
                                    rows={2}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Role Type</label>
                                <select
                                    value={newRoleType}
                                    onChange={(e) => setNewRoleType(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
                                >
                                    <option value="CUSTOM">Custom</option>
                                    <option value="CONTENT_ADMIN">Content Admin</option>
                                    <option value="SAFETY_ADMIN">Safety Admin</option>
                                    <option value="FINANCE_ADMIN">Finance Admin</option>
                                    <option value="SUPPORT_ADMIN">Support Admin</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Permissions ({newRolePermissions.length} selected)
                                </label>
                                <div className="max-h-60 overflow-y-auto bg-white/5 rounded-lg p-3 space-y-2">
                                    {allPermissions.map(perm => (
                                        <label
                                            key={perm.key}
                                            className={`flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white/10 ${
                                                newRolePermissions.includes(perm.key) ? 'bg-green-500/20' : ''
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={newRolePermissions.includes(perm.key)}
                                                onChange={() => togglePermission(perm.key, newRolePermissions, setNewRolePermissions)}
                                                className="rounded"
                                            />
                                            <div>
                                                <p className="text-sm font-medium">{perm.label}</p>
                                                <p className="text-xs text-gray-400">{perm.description}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowCreateModal(false)}
                                    className="bg-white/5 border-white/10 text-white"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateRole}
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                                    Create Role
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Assign User Modal */}
                <Dialog open={showAssignModal} onOpenChange={setShowAssignModal}>
                    <DialogContent className="bg-gray-900 border-white/10 text-white max-w-md">
                        <DialogHeader>
                            <DialogTitle>Assign User to {selectedRole?.name}</DialogTitle>
                            <DialogDescription className="text-gray-400">
                                Enter the email address of the user to assign this role
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">User Email *</label>
                                <Input
                                    type="email"
                                    value={assignEmail}
                                    onChange={(e) => setAssignEmail(e.target.value)}
                                    placeholder="user@example.com"
                                    className="bg-white/5 border-white/10 text-white"
                                />
                            </div>

                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                                <p className="text-sm text-blue-300">
                                    <strong>Note:</strong> The user will be upgraded to Admin if they aren&apos;t already. 
                                    Any existing role assignment will be replaced.
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowAssignModal(false)}
                                    className="bg-white/5 border-white/10 text-white"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAssignUser}
                                    disabled={saving}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                                    Assign User
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}
