'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    courseTitle: string;
    price: string;
}

export function PaymentModal({ isOpen, onClose, courseTitle, price }: PaymentModalProps) {
    const [paymentType, setPaymentType] = useState('Credit / Debit Card');
    const [formData, setFormData] = useState({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        firstName: '',
        lastName: '',
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'United States'
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = () => {
        // Handle payment submission
        console.log('Payment submitted:', formData);
        onClose();
    };

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
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-neutral-900 rounded-3xl shadow-2xl"
                        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-neutral-900 border-b border-white/10 px-8 py-6 flex items-center justify-between z-10">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={onClose}
                                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-5 h-5 text-white" />
                                </button>
                                <h2 className="text-2xl font-bold text-white">Payment Method</h2>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-8 py-6 space-y-6">
                            {/* Course Info */}
                            <div className="bg-white/5 rounded-2xl p-4">
                                <p className="text-white/60 text-sm mb-1">Subscribing to</p>
                                <p className="text-white font-semibold text-lg">{courseTitle}</p>
                                <p className="text-white/80 text-sm mt-2">{price}</p>
                            </div>

                            {/* Payment Type Selector */}
                            <div className="space-y-3">
                                <label className="text-white/60 text-sm font-medium">Payment Type</label>
                                <div className="relative">
                                    <select
                                        value={paymentType}
                                        onChange={(e) => setPaymentType(e.target.value)}
                                        className="w-full bg-white/10 text-white rounded-xl px-4 py-3.5 border border-white/20 focus:border-white/40 focus:outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="Credit / Debit Card" className="bg-neutral-800">Credit / Debit Card</option>
                                        <option value="Apple Pay" className="bg-neutral-800">Apple Pay</option>
                                        <option value="PayPal" className="bg-neutral-800">PayPal</option>
                                    </select>
                                    <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>

                            {/* Details Section */}
                            <div className="space-y-4">
                                <h3 className="text-white font-semibold text-lg">Details</h3>
                                
                                {/* Card Number */}
                                <div className="space-y-2">
                                    <label className="text-white/60 text-sm font-medium">Card Number</label>
                                    <input
                                        type="text"
                                        placeholder="Required"
                                        value={formData.cardNumber}
                                        onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                                        className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3.5 border border-white/20 focus:border-white/40 focus:outline-none"
                                    />
                                </div>

                                {/* Expiry Date & CVV */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-white/60 text-sm font-medium">Expiry Date</label>
                                        <input
                                            type="text"
                                            placeholder="MM/YYYY"
                                            value={formData.expiryDate}
                                            onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                                            className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3.5 border border-white/20 focus:border-white/40 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-white/60 text-sm font-medium">CVV</label>
                                        <input
                                            type="text"
                                            placeholder="Security code"
                                            value={formData.cvv}
                                            onChange={(e) => handleInputChange('cvv', e.target.value)}
                                            className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3.5 border border-white/20 focus:border-white/40 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Billing Address */}
                            <div className="space-y-4">
                                <h3 className="text-white font-semibold text-lg">Billing Address</h3>
                                
                                {/* First Name & Last Name */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-white/60 text-sm font-medium">First Name</label>
                                        <input
                                            type="text"
                                            placeholder="Hoda"
                                            value={formData.firstName}
                                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                                            className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3.5 border border-white/20 focus:border-white/40 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-white/60 text-sm font-medium">Last Name</label>
                                        <input
                                            type="text"
                                            placeholder="Salah"
                                            value={formData.lastName}
                                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                                            className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3.5 border border-white/20 focus:border-white/40 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Street */}
                                <div className="space-y-2">
                                    <label className="text-white/60 text-sm font-medium">Street</label>
                                    <input
                                        type="text"
                                        placeholder="Riyadh across zaki"
                                        value={formData.street}
                                        onChange={(e) => handleInputChange('street', e.target.value)}
                                        className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3.5 border border-white/20 focus:border-white/40 focus:outline-none"
                                    />
                                </div>

                                {/* City & State */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-white/60 text-sm font-medium">City</label>
                                        <input
                                            type="text"
                                            placeholder="City"
                                            value={formData.city}
                                            onChange={(e) => handleInputChange('city', e.target.value)}
                                            className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3.5 border border-white/20 focus:border-white/40 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-white/60 text-sm font-medium">State</label>
                                        <input
                                            type="text"
                                            placeholder="State"
                                            value={formData.state}
                                            onChange={(e) => handleInputChange('state', e.target.value)}
                                            className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3.5 border border-white/20 focus:border-white/40 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                {/* Zip Code & Country */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-white/60 text-sm font-medium">Zip Code</label>
                                        <input
                                            type="text"
                                            placeholder="Zip Code"
                                            value={formData.zipCode}
                                            onChange={(e) => handleInputChange('zipCode', e.target.value)}
                                            className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3.5 border border-white/20 focus:border-white/40 focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-white/60 text-sm font-medium">Country</label>
                                        <div className="relative">
                                            <select
                                                value={formData.country}
                                                onChange={(e) => handleInputChange('country', e.target.value)}
                                                className="w-full bg-white/10 text-white rounded-xl px-4 py-3.5 border border-white/20 focus:border-white/40 focus:outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="United States" className="bg-neutral-800">United States</option>
                                                <option value="Egypt" className="bg-neutral-800">Egypt</option>
                                                <option value="Germany" className="bg-neutral-800">Germany</option>
                                                <option value="United Kingdom" className="bg-neutral-800">United Kingdom</option>
                                            </select>
                                            <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Terms */}
                            <div className="text-xs text-white/60 leading-relaxed">
                                By clicking Continue, you agree to the{' '}
                                <button className="text-blue-500 hover:text-blue-400">Apple Media Services Terms and Conditions</button>
                                {' '}and acknowledge that you have read the{' '}
                                <button className="text-blue-500 hover:text-blue-400">Privacy Policy</button>.
                            </div>

                            {/* Continue Button */}
                            <button
                                onClick={handleSubmit}
                                className="w-full bg-white hover:bg-white/90 text-black font-semibold py-4 rounded-full transition-all"
                            >
                                Continue
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
