'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import toast from 'react-hot-toast'

interface WithdrawalModalProps {
    isOpen: boolean
    onClose: () => void
    availableBalance: number
    isArabic?: boolean
}

export default function WithdrawalModal({ isOpen, onClose, availableBalance, isArabic = false }: WithdrawalModalProps) {
    const [amount, setAmount] = useState('')
    const [method, setMethod] = useState<'BANK_TRANSFER' | 'WALLET' | 'PAYPAL'>('BANK_TRANSFER')
    const [accountDetails, setAccountDetails] = useState({
        accountName: '',
        accountNumber: '',
        bankName: ''
    })
    const [isProcessing, setIsProcessing] = useState(false)

    const handleWithdrawal = async () => {
        const withdrawalAmount = parseFloat(amount)

        if (!withdrawalAmount || withdrawalAmount <= 0) {
            toast.error(isArabic ? 'أدخل مبلغ صالح' : 'Enter a valid amount')
            return
        }

        if (withdrawalAmount > availableBalance) {
            toast.error(isArabic ? 'رصيد غير كافٍ' : 'Insufficient balance')
            return
        }

        if (!accountDetails.accountName || !accountDetails.accountNumber) {
            toast.error(isArabic ? 'أدخل تفاصيل الحساب' : 'Enter account details')
            return
        }

        setIsProcessing(true)
        try {
            const response = await fetch('/api/withdrawals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: withdrawalAmount,
                    method,
                    accountDetails
                })
            })

            const data = await response.json()

            if (response.ok) {
                toast.success(
                    isArabic 
                        ? 'تم تقديم طلب السحب بنجاح! سيتم معالجته خلال 3-5 أيام عمل.'
                        : 'Withdrawal request submitted! Processing within 3-5 business days.'
                )
                onClose()
                // Reload page to update balance
                setTimeout(() => window.location.reload(), 1000)
            } else {
                toast.error(data.error || (isArabic ? 'فشل السحب' : 'Withdrawal failed'))
            }
        } catch (error) {
            console.error('Withdrawal error:', error)
            toast.error(isArabic ? 'حدث خطأ' : 'An error occurred')
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-background border border-border rounded-3xl shadow-2xl"
                    >
                        {/* Header */}
                        <div className="border-b border-border p-6">
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                    <DollarSign className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-foreground">
                                        {isArabic ? 'سحب الأموال' : 'Withdraw Funds'}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {isArabic ? 'المتاح:' : 'Available:'} {availableBalance.toLocaleString()} EGP
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            {/* Amount Input */}
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    {isArabic ? 'المبلغ (EGP)' : 'Amount (EGP)'}
                                </label>
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="text-lg font-bold"
                                />
                                <div className="flex gap-2 mt-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setAmount((availableBalance * 0.25).toString())}
                                    >
                                        25%
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setAmount((availableBalance * 0.5).toString())}
                                    >
                                        50%
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setAmount((availableBalance * 0.75).toString())}
                                    >
                                        75%
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setAmount(availableBalance.toString())}
                                    >
                                        {isArabic ? 'الكل' : 'Max'}
                                    </Button>
                                </div>
                            </div>

                            {/* Method Selection */}
                            <div>
                                <label className="block text-sm font-semibold text-foreground mb-2">
                                    {isArabic ? 'طريقة السحب' : 'Withdrawal Method'}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <Button
                                        variant={method === 'BANK_TRANSFER' ? 'default' : 'outline'}
                                        onClick={() => setMethod('BANK_TRANSFER')}
                                        className="w-full"
                                    >
                                        {isArabic ? 'بنك' : 'Bank'}
                                    </Button>
                                    <Button
                                        variant={method === 'WALLET' ? 'default' : 'outline'}
                                        onClick={() => setMethod('WALLET')}
                                        className="w-full"
                                    >
                                        {isArabic ? 'محفظة' : 'Wallet'}
                                    </Button>
                                    <Button
                                        variant={method === 'PAYPAL' ? 'default' : 'outline'}
                                        onClick={() => setMethod('PAYPAL')}
                                        className="w-full"
                                    >
                                        PayPal
                                    </Button>
                                </div>
                            </div>

                            {/* Account Details */}
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-semibold text-foreground mb-2">
                                        {method === 'PAYPAL' 
                                            ? (isArabic ? 'بريد PayPal' : 'PayPal Email')
                                            : (isArabic ? 'اسم الحساب' : 'Account Name')}
                                    </label>
                                    <Input
                                        value={accountDetails.accountName}
                                        onChange={(e) => setAccountDetails({ ...accountDetails, accountName: e.target.value })}
                                        placeholder={method === 'PAYPAL' ? 'email@example.com' : 'John Doe'}
                                    />
                                </div>

                                {method !== 'PAYPAL' && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-semibold text-foreground mb-2">
                                                {method === 'WALLET' 
                                                    ? (isArabic ? 'رقم المحفظة' : 'Wallet Number')
                                                    : (isArabic ? 'رقم الحساب/IBAN' : 'Account Number/IBAN')}
                                            </label>
                                            <Input
                                                value={accountDetails.accountNumber}
                                                onChange={(e) => setAccountDetails({ ...accountDetails, accountNumber: e.target.value })}
                                                placeholder={method === 'WALLET' ? '01012345678' : 'EG38XXXX...'}
                                            />
                                        </div>

                                        {method === 'BANK_TRANSFER' && (
                                            <div>
                                                <label className="block text-sm font-semibold text-foreground mb-2">
                                                    {isArabic ? 'اسم البنك' : 'Bank Name'}
                                                </label>
                                                <Input
                                                    value={accountDetails.bankName}
                                                    onChange={(e) => setAccountDetails({ ...accountDetails, bankName: e.target.value })}
                                                    placeholder="National Bank of Egypt"
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Info Box */}
                            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex gap-3">
                                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-blue-400">
                                    {isArabic 
                                        ? 'سيتم معالجة السحب خلال 3-5 أيام عمل. قد تطبق رسوم معالجة.'
                                        : 'Withdrawals are processed within 3-5 business days. Processing fees may apply.'}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                                onClick={handleWithdrawal}
                                disabled={isProcessing}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-3 rounded-full"
                            >
                                {isProcessing ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        {isArabic ? 'تأكيد السحب' : 'Confirm Withdrawal'}
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
