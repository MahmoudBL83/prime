'use client'

import React, { useState, useEffect } from 'react'
import {
    DollarSign,
    Download,
    FileText,
    TrendingUp,
    TrendingDown,
    Calendar,
    AlertCircle,
    CheckCircle,
    Clock,
    Receipt,
    Calculator,
    BarChart3,
    Filter,
    Building,
    CreditCard,
    Loader2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ARAccount {
    id: string
    customer: string
    customerId: string
    invoiceNumber: string
    amount: number
    dueDate: string
    daysOverdue: number
    status: 'current' | 'overdue_30' | 'overdue_60' | 'overdue_90+'
    category: 'subscription' | 'course' | 'channel'
}

interface LedgerEntry {
    id: string
    date: string
    category: string
    description: string
    debit: number
    credit: number
    balance: number
    reference: string
    account: string
}

interface TaxReport {
    id: string
    period: string
    type: 'vat' | 'income' | 'withholding'
    grossRevenue: number
    taxableIncome: number
    taxAmount: number
    taxRate: number
    status: 'draft' | 'filed' | 'paid'
    dueDate: string
    filedDate?: string
}

const arStatusColors = {
    current: 'bg-green-100 text-green-800 border-green-200',
    overdue_30: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    overdue_60: 'bg-orange-100 text-orange-800 border-orange-200',
    'overdue_90+': 'bg-red-100 text-red-800 border-red-200'
}

const taxStatusColors = {
    draft: 'bg-muted text-gray-800 border-border',
    filed: 'bg-blue-100 text-blue-800 border-blue-200',
    paid: 'bg-green-100 text-green-800 border-green-200'
}

const categoryColors = {
    subscription: 'bg-blue-100 text-blue-800 border-blue-200',
    course: 'bg-purple-100 text-purple-800 border-purple-200',
    channel: 'bg-green-100 text-green-800 border-green-200'
}

export default function FinancialEnhancements() {
    const [activeTab, setActiveTab] = useState('ar')
    const [arAccounts, setArAccounts] = useState<ARAccount[]>([])
    const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([])
    const [taxReports, setTaxReports] = useState<TaxReport[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedPeriod, setSelectedPeriod] = useState('current_month')

    useEffect(() => {
        fetchFinancialData()
    }, [selectedPeriod])

    const fetchFinancialData = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/admin/financial/enhancements?period=${selectedPeriod}`)
            if (!response.ok) throw new Error('Failed to fetch financial data')
            const data = await response.json()
            setArAccounts(data.arAccounts || [])
            setLedgerEntries(data.ledgerEntries || [])
            setTaxReports(data.taxReports || [])
        } catch (error) {
            toast.error('Failed to load financial data')
        } finally {
            setLoading(false)
        }
    }

    const arStats = {
        total: arAccounts.reduce((sum, acc) => sum + acc.amount, 0),
        current: arAccounts.filter(a => a.status === 'current').reduce((sum, acc) => sum + acc.amount, 0),
        overdue: arAccounts.filter(a => a.status !== 'current').reduce((sum, acc) => sum + acc.amount, 0),
        overdue90Plus: arAccounts.filter(a => a.status === 'overdue_90+').length
    }

    const ledgerStats = {
        totalDebit: ledgerEntries.reduce((sum, entry) => sum + entry.debit, 0),
        totalCredit: ledgerEntries.reduce((sum, entry) => sum + entry.credit, 0),
        currentBalance: ledgerEntries[0]?.balance || 0
    }

    const taxStats = {
        totalTaxLiability: taxReports.filter(r => r.status === 'draft' || r.status === 'filed').reduce((sum, r) => sum + r.taxAmount, 0),
        paidThisQuarter: taxReports.filter(r => r.status === 'paid' && r.period.includes('2024')).reduce((sum, r) => sum + r.taxAmount, 0),
        upcomingDeadlines: taxReports.filter(r => r.status !== 'paid' && new Date(r.dueDate) > new Date()).length
    }

    const formatCurrency = (amount: number) => {
        return `E£${amount.toLocaleString()}`
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    const handleExportLedger = (format: 'csv' | 'excel' | 'pdf') => {
        // TODO: Implement actual export functionality
        // In real implementation, this would trigger download
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">Loading financial data...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <CreditCard className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="text-2xl font-semibold text-foreground">{formatCurrency(arStats.total)}</div>
                    <div className="text-sm text-muted-foreground">Total AR</div>
                </div>

                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <div className="text-2xl font-semibold text-foreground">{formatCurrency(arStats.overdue)}</div>
                    <div className="text-sm text-muted-foreground">Overdue Amount</div>
                </div>

                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <BarChart3 className="w-8 h-8 text-green-600" />
                    </div>
                    <div className="text-2xl font-semibold text-foreground">{formatCurrency(ledgerStats.currentBalance)}</div>
                    <div className="text-sm text-muted-foreground">Current Balance</div>
                </div>

                <div className="bg-background rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between mb-2">
                        <Receipt className="w-8 h-8 text-purple-600" />
                    </div>
                    <div className="text-2xl font-semibold text-foreground">{formatCurrency(taxStats.totalTaxLiability)}</div>
                    <div className="text-sm text-muted-foreground">Tax Liability</div>
                </div>
            </div>

            {/* Main Content */}
            <div className="bg-background rounded-lg border border-border">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <div className="border-b border-border px-6">
                        <TabsList className="bg-transparent">
                            <TabsTrigger value="ar" className="data-[state=active]:bg-purple-50">
                                <CreditCard className="w-4 h-4 mr-2" />
                                Accounts Receivable
                            </TabsTrigger>
                            <TabsTrigger value="ledger" className="data-[state=active]:bg-purple-50">
                                <FileText className="w-4 h-4 mr-2" />
                                General Ledger
                            </TabsTrigger>
                            <TabsTrigger value="tax" className="data-[state=active]:bg-purple-50">
                                <Calculator className="w-4 h-4 mr-2" />
                                Tax Reporting
                            </TabsTrigger>
                        </TabsList>
                    </div>

                    {/* AR Tab */}
                    <TabsContent value="ar" className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">Accounts Receivable</h3>
                                    <p className="text-sm text-muted-foreground mt-1">Track outstanding invoices and payment collection</p>
                                </div>
                                <Button variant="outline">
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Report
                                </Button>
                            </div>

                            {/* AR Summary Cards */}
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                    <div className="text-sm text-green-600 mb-1">Current</div>
                                    <div className="text-xl font-bold text-green-900">{formatCurrency(arStats.current)}</div>
                                </div>
                                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                                    <div className="text-sm text-yellow-600 mb-1">1-30 Days</div>
                                    <div className="text-xl font-bold text-yellow-900">
                                        {formatCurrency(arAccounts.filter(a => a.status === 'overdue_30').reduce((sum, acc) => sum + acc.amount, 0))}
                                    </div>
                                </div>
                                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                    <div className="text-sm text-orange-600 mb-1">31-60 Days</div>
                                    <div className="text-xl font-bold text-orange-900">
                                        {formatCurrency(arAccounts.filter(a => a.status === 'overdue_60').reduce((sum, acc) => sum + acc.amount, 0))}
                                    </div>
                                </div>
                                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                    <div className="text-sm text-red-600 mb-1">90+ Days</div>
                                    <div className="text-xl font-bold text-red-900">
                                        {formatCurrency(arAccounts.filter(a => a.status === 'overdue_90+').reduce((sum, acc) => sum + acc.amount, 0))}
                                    </div>
                                </div>
                            </div>

                            {/* AR Table */}
                            <div className="border border-border rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-background border-b border-border">
                                        <tr>
                                            <th className="text-left py-3 px-4 font-medium text-foreground">Customer</th>
                                            <th className="text-left py-3 px-4 font-medium text-foreground">Invoice</th>
                                            <th className="text-left py-3 px-4 font-medium text-foreground">Category</th>
                                            <th className="text-left py-3 px-4 font-medium text-foreground">Amount</th>
                                            <th className="text-left py-3 px-4 font-medium text-foreground">Due Date</th>
                                            <th className="text-left py-3 px-4 font-medium text-foreground">Days Overdue</th>
                                            <th className="text-center py-3 px-4 font-medium text-foreground">Status</th>
                                            <th className="text-center py-3 px-4 font-medium text-foreground">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {arAccounts.map((account) => (
                                            <tr key={account.id} className="hover:bg-background">
                                                <td className="py-3 px-4">
                                                    <div className="font-medium text-foreground">{account.customer}</div>
                                                    <div className="text-xs text-muted-foreground">{account.customerId}</div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-sm font-medium text-foreground">{account.invoiceNumber}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge className={categoryColors[account.category]}>
                                                        {account.category}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="font-semibold text-foreground">{formatCurrency(account.amount)}</span>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-muted-foreground">
                                                    {formatDate(account.dueDate)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`font-medium ${account.daysOverdue > 0 ? 'text-red-600' : 'text-foreground'}`}>
                                                        {account.daysOverdue > 0 ? `${account.daysOverdue} days` : 'Current'}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <Badge className={arStatusColors[account.status]}>
                                                        {account.status.replace('_', ' ')}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button size="sm" variant="outline" className="text-xs">
                                                            View
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="text-xs">
                                                            Send Reminder
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Ledger Tab */}
                    <TabsContent value="ledger" className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">General Ledger</h3>
                                    <p className="text-sm text-muted-foreground mt-1">Complete transaction history and account balances</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={selectedPeriod}
                                        onChange={(e) => setSelectedPeriod(e.target.value)}
                                        className="border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                                    >
                                        <option value="current_month">Current Month</option>
                                        <option value="last_month">Last Month</option>
                                        <option value="current_quarter">Current Quarter</option>
                                        <option value="current_year">Current Year</option>
                                    </select>
                                    <Button variant="outline" onClick={() => handleExportLedger('csv')}>
                                        <Download className="w-4 h-4 mr-2" />
                                        CSV
                                    </Button>
                                    <Button variant="outline" onClick={() => handleExportLedger('excel')}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Excel
                                    </Button>
                                    <Button variant="outline" onClick={() => handleExportLedger('pdf')}>
                                        <Download className="w-4 h-4 mr-2" />
                                        PDF
                                    </Button>
                                </div>
                            </div>

                            {/* Ledger Summary */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm text-blue-600">Total Credits</span>
                                    </div>
                                    <div className="text-2xl font-bold text-blue-900">{formatCurrency(ledgerStats.totalCredit)}</div>
                                </div>
                                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingDown className="w-5 h-5 text-red-600" />
                                        <span className="text-sm text-red-600">Total Debits</span>
                                    </div>
                                    <div className="text-2xl font-bold text-red-900">{formatCurrency(ledgerStats.totalDebit)}</div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <BarChart3 className="w-5 h-5 text-green-600" />
                                        <span className="text-sm text-green-600">Net Balance</span>
                                    </div>
                                    <div className="text-2xl font-bold text-green-900">{formatCurrency(ledgerStats.totalCredit - ledgerStats.totalDebit)}</div>
                                </div>
                            </div>

                            {/* Ledger Table */}
                            <div className="border border-border rounded-lg overflow-hidden">
                                <table className="w-full">
                                    <thead className="bg-background border-b border-border">
                                        <tr>
                                            <th className="text-left py-3 px-4 font-medium text-foreground">Date</th>
                                            <th className="text-left py-3 px-4 font-medium text-foreground">Reference</th>
                                            <th className="text-left py-3 px-4 font-medium text-foreground">Account</th>
                                            <th className="text-left py-3 px-4 font-medium text-foreground">Description</th>
                                            <th className="text-right py-3 px-4 font-medium text-foreground">Debit</th>
                                            <th className="text-right py-3 px-4 font-medium text-foreground">Credit</th>
                                            <th className="text-right py-3 px-4 font-medium text-foreground">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {ledgerEntries.map((entry) => (
                                            <tr key={entry.id} className="hover:bg-background">
                                                <td className="py-3 px-4 text-sm text-foreground">
                                                    {formatDate(entry.date)}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className="text-sm font-medium text-foreground">{entry.reference}</span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="text-sm text-foreground">{entry.account}</div>
                                                    <Badge className="mt-1 bg-muted text-gray-800 border-border text-xs">
                                                        {entry.category}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-muted-foreground">
                                                    {entry.description}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    {entry.debit > 0 && (
                                                        <span className="font-medium text-red-600">{formatCurrency(entry.debit)}</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    {entry.credit > 0 && (
                                                        <span className="font-medium text-green-600">{formatCurrency(entry.credit)}</span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-right">
                                                    <span className="font-semibold text-foreground">{formatCurrency(entry.balance)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Tax Tab */}
                    <TabsContent value="tax" className="p-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">Tax Reporting</h3>
                                    <p className="text-sm text-muted-foreground mt-1">VAT, income tax, and withholding tax reports</p>
                                </div>
                                <Button className="bg-purple-600 hover:bg-purple-700 text-foreground">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Generate Report
                                </Button>
                            </div>

                            {/* Tax Summary */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                                    <div className="text-sm text-purple-600 mb-1">Outstanding Tax</div>
                                    <div className="text-2xl font-bold text-purple-900">{formatCurrency(taxStats.totalTaxLiability)}</div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                                    <div className="text-sm text-green-600 mb-1">Paid This Quarter</div>
                                    <div className="text-2xl font-bold text-green-900">{formatCurrency(taxStats.paidThisQuarter)}</div>
                                </div>
                                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                                    <div className="text-sm text-orange-600 mb-1">Upcoming Deadlines</div>
                                    <div className="text-2xl font-bold text-orange-900">{taxStats.upcomingDeadlines}</div>
                                </div>
                            </div>

                            {/* Tax Reports */}
                            <div className="space-y-3">
                                {taxReports.map((report) => (
                                    <div key={report.id} className="border border-border rounded-lg p-5">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <div className="bg-purple-100 rounded-lg p-2">
                                                        <Receipt className="w-5 h-5 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-foreground">{report.period} - {report.type.toUpperCase()}</h4>
                                                        <p className="text-sm text-muted-foreground">Tax Rate: {report.taxRate}%</p>
                                                    </div>
                                                    <Badge className={taxStatusColors[report.status]}>
                                                        {report.status}
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-4 gap-4 mt-3">
                                                    <div>
                                                        <div className="text-xs text-muted-foreground">Gross Revenue</div>
                                                        <div className="text-lg font-semibold text-foreground">{formatCurrency(report.grossRevenue)}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground">Taxable Income</div>
                                                        <div className="text-lg font-semibold text-foreground">{formatCurrency(report.taxableIncome)}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground">Tax Amount</div>
                                                        <div className="text-lg font-semibold text-purple-600">{formatCurrency(report.taxAmount)}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-muted-foreground">Due Date</div>
                                                        <div className="text-sm font-medium text-foreground">{formatDate(report.dueDate)}</div>
                                                        {report.filedDate && (
                                                            <div className="text-xs text-green-600 mt-1">
                                                                Filed: {formatDate(report.filedDate)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-4">
                                                {report.status === 'draft' && (
                                                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-foreground">
                                                        <CheckCircle className="w-4 h-4 mr-1" />
                                                        File Report
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="outline">
                                                    <Download className="w-4 h-4 mr-1" />
                                                    Download
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <Building className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-blue-900 mb-1">Egyptian Tax Compliance</h4>
                                        <p className="text-sm text-blue-800">
                                            All reports are prepared according to Egyptian Tax Authority (ETA) requirements.
                                            VAT at 15%, Creator withholding tax at 5%, and quarterly filing schedules are automatically applied.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
