"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
	Users,
	DollarSign,
	Shield,
	AlertTriangle,
	Search,
	RefreshCcw,
	Eye,
	Ban,
	CheckCircle,
	Layers,
	Clock,
	Filter
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import CreatorDetailsModal from '@/components/admin/CreatorDetailsModal'

type ChannelStatus = 'active' | 'pending' | 'issues' | 'suspended' | string

interface Channel {
	id: string
	name: string
	status: ChannelStatus
	creator: {
		id: string
		name: string
		email: string
		avatar?: string | null
		verified: boolean
	}
	subscribers: number
	revenue: number
	pricing: {
		monthly: number | null
		annual: number | null
	}
	tiers: Array<{
		id: string
		name: string
		price: number
		currency: string
		subscriberCount: number | null
	}>
	compliance: {
		policyViolations: number
		contentFlags: number
		dmcaNotices: number
	}
	contentCount: {
		videos: number
		documents: number
		discussions: number
	}
	createdAt: string
	lastActivity: string
}

interface Stats {
	totalChannels: number
	pendingApproval: number
	activeChannels: number
	suspended: number
	totalRevenue: number
	avgSubscribers: number
	flaggedContent: number
}

interface Meta {
	total: number
	page: number
	pageSize: number
}

const DEFAULT_STATS: Stats = {
	totalChannels: 0,
	pendingApproval: 0,
	activeChannels: 0,
	suspended: 0,
	totalRevenue: 0,
	avgSubscribers: 0,
	flaggedContent: 0
}

const PAGE_SIZE = 12

export default function MentorChannelsPage() {
	const [channels, setChannels] = useState<Channel[]>([])
	const [stats, setStats] = useState<Stats>(DEFAULT_STATS)
	const [meta, setMeta] = useState<Meta>({ total: 0, page: 1, pageSize: PAGE_SIZE })
	const [search, setSearch] = useState('')
	const [debouncedSearch, setDebouncedSearch] = useState('')
	const [status, setStatus] = useState<ChannelStatus | 'all'>('all')
	const quickStatuses: Array<{ id: ChannelStatus | 'all'; label: string }> = [
		{ id: 'all', label: 'All' },
		{ id: 'active', label: 'Active' },
		{ id: 'pending', label: 'Pending' },
		{ id: 'issues', label: 'Issues' },
		{ id: 'suspended', label: 'Suspended' }
	]
	const [page, setPage] = useState(1)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null)
	const [showCreatorModal, setShowCreatorModal] = useState(false)

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search.trim()), 400)
		return () => clearTimeout(timer)
	}, [search])

	useEffect(() => {
		setPage(1)
	}, [debouncedSearch, status])

	const totalPages = useMemo(() => Math.max(1, Math.ceil(meta.total / meta.pageSize)), [meta])

	const pageLabel = useMemo(() => {
		if (meta.total === 0) return 'No channels to display'
		const start = (meta.page - 1) * meta.pageSize + 1
		const end = Math.min(meta.total, meta.page * meta.pageSize)
		return `Showing ${start}-${end} of ${meta.total}`
	}, [meta])

	const statusBadge = (value: ChannelStatus) => {
		const normalized = value.toLowerCase()
		if (normalized === 'active') return 'bg-green-600/20 text-green-300 border-green-500/30'
		if (normalized === 'pending') return 'bg-yellow-600/20 text-yellow-200 border-yellow-500/30'
		if (normalized === 'issues') return 'bg-orange-600/20 text-orange-200 border-orange-500/30'
		if (normalized === 'suspended') return 'bg-red-600/20 text-red-200 border-red-500/30'
		return 'bg-muted text-foreground border-border'
	}

	const formatCurrency = (value: number | null) => {
		if (value == null) return '—'
		return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
	}

	const formatDate = (value: string) => {
		try {
			return new Date(value).toLocaleDateString()
		} catch (error) {
			return '—'
		}
	}

	const fetchChannels = useCallback(async () => {
		try {
			setLoading(true)
			setError(null)
			const params = new URLSearchParams()
			params.set('page', page.toString())
			params.set('pageSize', PAGE_SIZE.toString())
			if (debouncedSearch) params.set('search', debouncedSearch)
			if (status !== 'all') params.set('status', status)

			const response = await fetch(`/api/admin/channels?${params.toString()}`, {
				cache: 'no-store',
				credentials: 'include'
			})
			if (!response.ok) {
				const body = await response.json().catch(() => ({}))
				throw new Error(body.error || 'Failed to load channels')
			}
			const result = await response.json()
			setChannels(result.channels || [])
			setStats(result.stats || DEFAULT_STATS)
			setMeta({
				total: result.meta?.total ?? result.channels?.length ?? 0,
				page: result.meta?.page ?? page,
				pageSize: result.meta?.pageSize ?? PAGE_SIZE
			})
			const metaPage = result.meta?.page ?? page
			if (metaPage !== page) {
				setPage(metaPage)
			}
		} catch (err: any) {
			console.error('Failed to load channels', err)
			setError(err?.message || 'Unable to load channels')
			setChannels([])
			setStats(DEFAULT_STATS)
			setMeta({ total: 0, page: 1, pageSize: PAGE_SIZE })
		} finally {
			setLoading(false)
		}
	}, [page, debouncedSearch, status])

	useEffect(() => {
		fetchChannels()
	}, [fetchChannels])

	const openCreator = (creatorId: string) => {
		setSelectedCreatorId(creatorId)
		setShowCreatorModal(true)
	}

	return (
		<div className="min-h-screen p-8 space-y-8">
			<motion.div
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				className="flex items-center justify-between"
			>
				<div>
					<h1 className="text-3xl font-bold text-foreground">Mentor Channels</h1>
					<p className="text-sm text-muted-foreground">mentor subscriptions, revenue, and compliance</p>
				</div>
				<div className="flex items-center gap-2">
					<Button onClick={fetchChannels} className="bg-white/10 hover:bg-white/20 text-foreground">
						{loading ? <RefreshCcw className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCcw className="w-4 h-4 mr-2" />}
						Refresh
					</Button>
				</div>
			</motion.div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				<div className="bg-white/5 border border-border rounded-2xl p-4 flex items-center gap-3">
					<div className="p-2 rounded-lg bg-blue-600/20">
						<Users className="w-5 h-5 text-blue-300" />
					</div>
					<div>
						<p className="text-xs text-muted-foreground">Total Channels</p>
						<p className="text-xl font-semibold text-foreground">{stats.totalChannels.toLocaleString()}</p>
					</div>
				</div>
				<div className="bg-white/5 border border-border rounded-2xl p-4 flex items-center gap-3">
					<div className="p-2 rounded-lg bg-green-600/20">
						<Shield className="w-5 h-5 text-green-300" />
					</div>
					<div>
						<p className="text-xs text-muted-foreground">Active</p>
						<p className="text-xl font-semibold text-foreground">{stats.activeChannels.toLocaleString()}</p>
					</div>
				</div>
				<div className="bg-white/5 border border-border rounded-2xl p-4 flex items-center gap-3">
					<div className="p-2 rounded-lg bg-yellow-600/20">
						<DollarSign className="w-5 h-5 text-yellow-200" />
					</div>
					<div>
						<p className="text-xs text-muted-foreground">Total Revenue</p>
						<p className="text-xl font-semibold text-foreground">{formatCurrency(stats.totalRevenue)}</p>
					</div>
				</div>
				<div className="bg-white/5 border border-border rounded-2xl p-4 flex items-center gap-3">
					<div className="p-2 rounded-lg bg-red-600/20">
						<AlertTriangle className="w-5 h-5 text-red-200" />
					</div>
					<div>
						<p className="text-xs text-muted-foreground">Flagged Content</p>
						<p className="text-xl font-semibold text-foreground">{stats.flaggedContent.toLocaleString()}</p>
					</div>
				</div>
			</div>

			<div className="bg-white/5 border border-border rounded-2xl p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
				<div className="flex-1">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
						<input
							value={search}
							onChange={(event) => setSearch(event.target.value)}
							placeholder="Search mentors, channels, or emails"
							className="w-full bg-white/10 border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-pink-500/50"
						/>
					</div>
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<div className="flex items-center gap-2 text-xs text-muted-foreground">
						<Filter className="w-4 h-4" /> Status
					</div>
					{quickStatuses.map((item) => (
						<button
							key={item.id}
							onClick={() => setStatus(item.id)}
							className={`px-3 py-1 rounded-lg text-xs border transition-all ${
								status === item.id
									? 'bg-gradient-to-r from-pink-600 to-purple-600 text-foreground border-transparent'
									: 'bg-white/10 border border-border text-foreground hover:bg-white/20'
							}`}
						>
							{item.label}
						</button>
					))}
				</div>
			</div>

			<div className="bg-white/5 border border-border rounded-2xl p-4 space-y-4">
				{loading ? (
					<div className="flex items-center justify-center py-16">
						<RefreshCcw className="w-8 h-8 animate-spin text-pink-500" />
					</div>
				) : error ? (
					<div className="text-sm text-red-300 flex items-center justify-between gap-4 flex-wrap">
						<span>{error}</span>
						<Button
							type="button"
							onClick={fetchChannels}
							className="bg-white/10 text-foreground border border-border"
						>
							Retry
						</Button>
					</div>
				) : channels.length === 0 ? (
					<div className="text-sm text-muted-foreground text-center py-10">No channels found for this filter.</div>
				) : (
					<div className="space-y-3">
						{channels.map((channel, index) => (
							<motion.div
								key={channel.id}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: 0.05 * index }}
								className="border border-border rounded-xl p-4 bg-white/5"
							>
								<div className="flex flex-col lg:flex-row gap-4">
									<div className="flex-1 space-y-2">
										<div className="flex items-center gap-2">
											<div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-600 to-purple-600 flex items-center justify-center text-sm font-semibold text-foreground">
												{channel.creator.name?.slice(0, 2)?.toUpperCase() || 'MN'}
											</div>
											<div>
												<p className="text-sm font-semibold text-foreground">{channel.name}</p>
												<p className="text-xs text-muted-foreground">{channel.creator.name} · {channel.creator.email}</p>
											</div>
											<Badge className={`${statusBadge(channel.status)} capitalize ml-auto`}>{channel.status}</Badge>
										</div>
										<div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
											<span className="flex items-center gap-1"><Users className="w-3 h-3" /> {channel.subscribers} subs</span>
											<span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {formatCurrency(channel.revenue)}</span>
											{channel.pricing.monthly != null && (
												<span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {formatCurrency(channel.pricing.monthly)} / mo</span>
											)}
											<span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Active {formatDate(channel.lastActivity)}</span>
										</div>

										{channel.tiers.length > 0 && (
											<div className="flex flex-wrap gap-2">
												{channel.tiers.slice(0, 4).map(tier => (
													<Badge key={tier.id} className="bg-white/10 border border-border text-foreground text-[11px] flex items-center gap-1">
														<span>{tier.name}</span>
														<span className="opacity-80">{formatCurrency(tier.price)}</span>
														{tier.subscriberCount != null && <span className="opacity-70">· {tier.subscriberCount} subs</span>}
													</Badge>
												))}
												{channel.tiers.length > 4 && (
													<Badge className="bg-white/5 border border-border text-foreground text-[11px]">+{channel.tiers.length - 4} more</Badge>
												)}
											</div>
										)}
									</div>

									<div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
										<div className="bg-white/5 border border-border rounded-lg p-3">
											<p className="text-[11px] text-muted-foreground">Violations</p>
											<p className="text-lg font-semibold text-foreground">{channel.compliance.policyViolations}</p>
										</div>
										<div className="bg-white/5 border border-border rounded-lg p-3">
											<p className="text-[11px] text-muted-foreground">Flags</p>
											<p className="text-lg font-semibold text-foreground">{channel.compliance.contentFlags}</p>
										</div>
										<div className="bg-white/5 border border-border rounded-lg p-3">
											<p className="text-[11px] text-muted-foreground">Tiers</p>
											<p className="text-lg font-semibold text-foreground">{channel.tiers.length}</p>
										</div>
										<div className="bg-white/5 border border-border rounded-lg p-3">
											<p className="text-[11px] text-muted-foreground">Avg subs</p>
											<p className="text-lg font-semibold text-foreground">{stats.avgSubscribers.toFixed(1)}</p>
										</div>
									</div>

									<div className="flex items-center gap-2 justify-end">
										<Button
											type="button"
											onClick={() => openCreator(channel.creator.id)}
											className="bg-white/10 hover:bg-white/20 text-foreground"
										>
											<Eye className="w-4 h-4 mr-1" /> View mentor
										</Button>
										{channel.status === 'suspended' ? (
											<Button
												type="button"
												className="bg-green-600/20 text-green-300 border border-green-500/40"
												onClick={() => alert('Restore action not implemented yet')}
											>
												<CheckCircle className="w-4 h-4 mr-1" /> Restore
											</Button>
										) : (
											<Button
												type="button"
												className="bg-red-600/20 text-red-200 border border-red-500/40"
												onClick={() => alert('Suspend action not implemented yet')}
											>
												<Ban className="w-4 h-4 mr-1" /> Suspend
											</Button>
										)}
									</div>
								</div>
							</motion.div>
						))}

						<div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
							<div className="text-sm text-muted-foreground">
								{pageLabel}
							</div>
							<div className="flex items-center gap-2">
								<Button
									type="button"
									disabled={page <= 1 || loading}
									onClick={() => setPage((prev) => Math.max(1, prev - 1))}
									className="bg-white/10 text-foreground border border-border"
								>
									Previous
								</Button>
								<span className="text-xs text-muted-foreground">Page {meta.page} / {totalPages}</span>
								<Button
									type="button"
									disabled={page >= totalPages || loading}
									onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
									className="bg-white/10 text-foreground border border-border"
								>
									Next
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>

			<CreatorDetailsModal
				creatorId={selectedCreatorId || ''}
				isOpen={showCreatorModal && !!selectedCreatorId}
				onClose={() => {
					setShowCreatorModal(false)
					setSelectedCreatorId(null)
				}}
				onCreatorUpdated={fetchChannels}
			/>
		</div>
	)
}
