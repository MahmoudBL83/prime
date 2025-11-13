'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { 
    DollarSign, 
    TrendingUp, 
    Clock, 
    CreditCard,
    Download,
    ArrowUpRight,
    Wallet,
    Calendar
} from 'lucide-react';

interface EarningsStats {
    totalEarnings: number;
    availableBalance: number;
    pendingEarnings: number;
    lifetimeEarnings: number;
    thisMonth: number;
    lastMonth: number;
}

interface Payout {
    id: string;
    amount: number;
    status: string;
    method: string;
    createdAt: string;
    processedAt?: string;
}

interface RevenueBreakdown {
    courseRevenue: number;
    channelRevenue: number;
    liveSessionRevenue: number;
}

export default function CreatorEarningsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const t = useTranslations('creator.earnings');
    const [loading, setLoading] = useState(true);
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
    
    // Mock data - replace with actual API calls
    const [stats, setStats] = useState<EarningsStats>({
        totalEarnings: 0,
        availableBalance: 0,
        pendingEarnings: 0,
        lifetimeEarnings: 0,
        thisMonth: 0,
        lastMonth: 0
    });

    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [breakdown, setBreakdown] = useState<RevenueBreakdown>({
        courseRevenue: 0,
        channelRevenue: 0,
        liveSessionRevenue: 0
    });
    const [withdrawalAmount, setWithdrawalAmount] = useState<number>(0);
    const [withdrawalMethod, setWithdrawalMethod] = useState<string>('BANK_TRANSFER');
    const [accountDetailsInput, setAccountDetailsInput] = useState<string>('');
    const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        } else if (session?.user?.role !== 'CREATOR') {
            router.push('/dashboard');
        } else {
            // Load earnings data
            loadEarningsData();
        }
    }, [status, session, router]);

    const loadEarningsData = async () => {
        try {
            const res = await fetch('/api/creator/earnings')
            if (!res.ok) throw new Error('Failed to fetch earnings')
            const data = await res.json()

            setStats({
                totalEarnings: data?.stats?.totalEarnings || 0,
                availableBalance: data?.stats?.availableBalance || 0,
                pendingEarnings: data?.stats?.pendingEarnings || 0,
                lifetimeEarnings: data?.stats?.lifetimeEarnings || 0,
                thisMonth: data?.stats?.thisMonth || 0,
                lastMonth: data?.stats?.lastMonth || 0
            })

            setBreakdown({
                courseRevenue: data?.breakdown?.courseRevenue || 0,
                channelRevenue: data?.breakdown?.channelRevenue || 0,
                liveSessionRevenue: data?.breakdown?.liveSessionRevenue || 0
            })

            setPayouts((data?.payouts || []).map((p: any) => ({
                id: p.id,
                amount: p.amount,
                status: p.status,
                method: p.method,
                createdAt: p.requestedAt || p.createdAt || p.requestedAt,
                processedAt: p.processedAt
            })))

            setLoading(false)
        } catch (error) {
            console.error('Failed to load earnings:', error)
            setLoading(false)
        }
    };

    const requestWithdrawal = async (amount: number, method: string, accountDetails: any) => {
        try {
            const res = await fetch('/api/creator/payouts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, method, accountDetails })
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error || 'Failed to request payout')

            // Refresh data
            await loadEarningsData()
            setShowWithdrawalModal(false)
            alert('Withdrawal request submitted')
        } catch (err: any) {
            console.error(err)
            alert(err?.message || 'Request failed')
        }
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 2
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status: string) => {
        const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
            PENDING: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: t('pending') },
            PROCESSING: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: t('processing') },
            COMPLETED: { bg: 'bg-green-500/10', text: 'text-green-400', label: t('completed') },
            FAILED: { bg: 'bg-red-500/10', text: 'text-red-400', label: t('failed') },
            CANCELLED: { bg: 'bg-gray-500/10', text: 'text-gray-400', label: t('cancelled') }
        };

        const config = statusConfig[status] || statusConfig.PENDING;
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                {config.label}
            </span>
        );
    };

    const getMethodLabel = (method: string) => {
        const methods: Record<string, string> = {
            BANK_TRANSFER: t('bankTransfer'),
            PAYPAL: t('paypal'),
            STRIPE: t('stripe'),
            VODAFONE_CASH: t('vodafoneCash')
        };
        return methods[method] || method;
    };

    if (loading || status === 'loading') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading earnings data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        {t('title')}
                    </h1>
                    <p className="text-gray-400">{t('subtitle')}</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Available Balance */}
                    <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 backdrop-blur-xl border border-green-500/20 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Wallet className="w-8 h-8 text-green-400" />
                            <TrendingUp className="w-5 h-5 text-green-400" />
                        </div>
                        <h3 className="text-gray-400 text-sm font-medium mb-1">{t('availableBalance')}</h3>
                        <p className="text-3xl font-bold text-white mb-2">{formatCurrency(stats.availableBalance)}</p>
                        <button
                            onClick={() => setShowWithdrawalModal(true)}
                            className="w-full mt-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            <ArrowUpRight className="w-4 h-4" />
                            {t('requestWithdrawal')}
                        </button>
                    </div>

                    {/* This Month */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/5 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Calendar className="w-8 h-8 text-purple-400" />
                        </div>
                        <h3 className="text-gray-400 text-sm font-medium mb-1">{t('thisMonth')}</h3>
                        <p className="text-3xl font-bold text-white mb-2">{formatCurrency(stats.thisMonth)}</p>
                        <p className="text-gray-400 text-sm">
                            {t('lastMonth')}: {formatCurrency(stats.lastMonth)}
                        </p>
                    </div>

                    {/* Pending Earnings */}
                    <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/5 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <Clock className="w-8 h-8 text-yellow-400" />
                        </div>
                        <h3 className="text-gray-400 text-sm font-medium mb-1">{t('pendingEarnings')}</h3>
                        <p className="text-3xl font-bold text-white mb-2">{formatCurrency(stats.pendingEarnings)}</p>
                        <p className="text-gray-400 text-sm">{t('processingTime')}</p>
                    </div>

                    {/* Lifetime Earnings */}
                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 backdrop-blur-xl border border-blue-500/20 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <DollarSign className="w-8 h-8 text-blue-400" />
                        </div>
                        <h3 className="text-gray-400 text-sm font-medium mb-1">{t('lifetimeEarnings')}</h3>
                        <p className="text-3xl font-bold text-white">{formatCurrency(stats.lifetimeEarnings)}</p>
                    </div>
                </div>

                {/* Revenue Breakdown */}
                <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6 mb-8">
                    <h2 className="text-xl font-bold text-white mb-6">{t('revenueBreakdown')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30">
                            <h3 className="text-gray-400 text-sm mb-2">{t('courseRevenue')}</h3>
                            <p className="text-2xl font-bold text-white">{formatCurrency(breakdown.courseRevenue)}</p>
                            <div className="mt-2 h-2 bg-gray-700/50 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                                    style={{ width: `${(breakdown.courseRevenue / stats.thisMonth) * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30">
                            <h3 className="text-gray-400 text-sm mb-2">{t('channelRevenue')}</h3>
                            <p className="text-2xl font-bold text-white">{formatCurrency(breakdown.channelRevenue)}</p>
                            <div className="mt-2 h-2 bg-gray-700/50 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                                    style={{ width: `${(breakdown.channelRevenue / stats.thisMonth) * 100}%` }}
                                />
                            </div>
                        </div>

                        <div className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30">
                            <h3 className="text-gray-400 text-sm mb-2">{t('liveSessionRevenue')}</h3>
                            <p className="text-2xl font-bold text-white">{formatCurrency(breakdown.liveSessionRevenue)}</p>
                            <div className="mt-2 h-2 bg-gray-700/50 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500"
                                    style={{ width: `${(breakdown.liveSessionRevenue / stats.thisMonth) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Withdrawal History */}
                <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">{t('withdrawalHistory')}</h2>
                        <button className="text-purple-400 hover:text-purple-300 flex items-center gap-2 text-sm">
                            <Download className="w-4 h-4" />
                            {t('downloadStatement')}
                        </button>
                    </div>

                    {payouts.length === 0 ? (
                        <div className="text-center py-12">
                            <CreditCard className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">{t('noWithdrawals')}</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-gray-700/50">
                                        <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">{t('date')}</th>
                                        <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">{t('amount')}</th>
                                        <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">{t('method')}</th>
                                        <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">{t('status')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payouts.map((payout) => (
                                        <tr key={payout.id} className="border-b border-gray-700/30 hover:bg-gray-800/30 transition-colors">
                                            <td className="py-4 px-4 text-gray-300">{formatDate(payout.createdAt)}</td>
                                            <td className="py-4 px-4 text-white font-medium">{formatCurrency(payout.amount)}</td>
                                            <td className="py-4 px-4 text-gray-300">{getMethodLabel(payout.method)}</td>
                                            <td className="py-4 px-4">{getStatusBadge(payout.status)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Withdrawal Modal - TODO: Implement modal component */}
            {showWithdrawalModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gradient-to-br from-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-8 max-w-md w-full">
                        <h3 className="text-2xl font-bold text-white mb-2">{t('withdrawalRequest')}</h3>
                        <p className="text-gray-400 mb-6">{t('minimumWithdrawal', { amount: formatCurrency(100) })}</p>
                        
                        {/* Withdrawal form */}
                        <form
                            onSubmit={async (e) => {
                                e.preventDefault()
                                setIsSubmittingWithdrawal(true)
                                try {
                                    await requestWithdrawal(withdrawalAmount, withdrawalMethod, { details: accountDetailsInput })
                                } finally {
                                    setIsSubmittingWithdrawal(false)
                                }
                            }}
                        >
                            <div className="space-y-4">
                                <label className="block text-sm text-gray-300">{t('amount')}</label>
                                <input
                                    type="number"
                                    min={100}
                                    step={10}
                                    value={withdrawalAmount}
                                    onChange={(e) => setWithdrawalAmount(Number(e.target.value))}
                                    className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white"
                                />

                                <label className="block text-sm text-gray-300">{t('method')}</label>
                                <select
                                    value={withdrawalMethod}
                                    onChange={(e) => setWithdrawalMethod(e.target.value)}
                                    className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white"
                                >
                                    <option value="BANK_TRANSFER">{t('bankTransfer')}</option>
                                    <option value="PAYPAL">{t('paypal')}</option>
                                    <option value="VODAFONE_CASH">{t('vodafoneCash')}</option>
                                </select>

                                <label className="block text-sm text-gray-300">{t('accountDetails')}</label>
                                <textarea
                                    value={accountDetailsInput}
                                    onChange={(e) => setAccountDetailsInput(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white"
                                />

                                <button
                                    type="submit"
                                    disabled={isSubmittingWithdrawal}
                                    className="w-full bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300"
                                >
                                    {isSubmittingWithdrawal ? t('submitting') : t('submitWithdrawal')}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowWithdrawalModal(false)}
                                    className="w-full bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300"
                                >
                                    {t('cancel')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
