'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, User, Sparkles, Lock } from 'lucide-react';

// Apple TV Design System Colors
const colors = {
    background: '#000000',
    surface: 'rgba(255, 255, 255, 0.08)',
    border: 'rgba(255, 255, 255, 0.15)',
    blue: '#0A84FF',
    purple: '#BF5AF2',
    pink: '#FF375F',
    green: '#30D158',
}

export default function EarlyAccessModal() {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await fetch('/api/early-access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message);
                setEmail('');
                setName('');
            } else {
                setError(data.error || 'Something went wrong');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Pure black backdrop with blur */}
            <div 
                className="absolute inset-0 backdrop-blur-xl"
                style={{ 
                    backgroundColor: colors.background,
                    opacity: 0.95,
                    pointerEvents: 'none' 
                }}
            />

            {/* Modal - Apple TV style */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ 
                    duration: 0.6, 
                    ease: [0.4, 0, 0.2, 1],
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                }}
                className="relative z-10 w-full max-w-md mx-4"
            >
                {/* Glass card with minimal design */}
                <div 
                    className="relative rounded-3xl border-2 p-8 shadow-2xl"
                    style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                    }}
                >
                    {/* Lock icon indicator */}
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                        <motion.div 
                            className="p-3 rounded-2xl shadow-lg"
                            style={{
                                background: `linear-gradient(135deg, ${colors.blue}, ${colors.purple})`,
                            }}
                            animate={{
                                boxShadow: [
                                    `0 0 20px ${colors.blue}40`,
                                    `0 0 30px ${colors.purple}40`,
                                    `0 0 20px ${colors.blue}40`,
                                ]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            <Lock className="w-5 h-5 text-white" />
                        </motion.div>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-6 mt-4">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ 
                                delay: 0.2, 
                                type: "spring", 
                                stiffness: 200,
                                damping: 15
                            }}
                            className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-2xl"
                            style={{
                                background: `linear-gradient(135deg, ${colors.blue}, ${colors.purple})`,
                            }}
                        >
                            <Sparkles className="w-8 h-8 text-white" />
                        </motion.div>
                        
                        <h2 className="text-3xl font-bold text-white mb-2">
                            Coming Soon
                        </h2>
                        <p className="text-white/60 text-sm">
                            We're preparing something amazing! Join our waitlist to get early access.
                        </p>
                    </div>

                    {/* Success/Error Messages */}
                    <AnimatePresence mode="wait">
                        {message && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-4 p-4 rounded-xl border-2"
                                style={{
                                    backgroundColor: `${colors.green}15`,
                                    borderColor: `${colors.green}30`,
                                }}
                            >
                                <p className="text-sm text-center" style={{ color: colors.green }}>
                                    {message}
                                </p>
                            </motion.div>
                        )}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="mb-4 p-4 rounded-xl border-2"
                                style={{
                                    backgroundColor: `${colors.pink}15`,
                                    borderColor: `${colors.pink}30`,
                                }}
                            >
                                <p className="text-sm text-center" style={{ color: colors.pink }}>
                                    {error}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name Input */}
                        <div>
                            <label className="block text-white/80 text-sm font-medium mb-2">
                                Name (Optional)
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full rounded-xl px-12 py-3 text-white placeholder:text-white/40 focus:outline-none transition-all border-2"
                                    style={{
                                        backgroundColor: colors.surface,
                                        borderColor: colors.border,
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = colors.blue;
                                        e.target.style.boxShadow = `0 0 0 3px ${colors.blue}20`;
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = colors.border;
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                        </div>

                        {/* Email Input */}
                        <div>
                            <label className="block text-white/80 text-sm font-medium mb-2">
                                Email Address *
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com"
                                    required
                                    className="w-full rounded-xl px-12 py-3 text-white placeholder:text-white/40 focus:outline-none transition-all border-2"
                                    style={{
                                        backgroundColor: colors.surface,
                                        borderColor: colors.border,
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = colors.blue;
                                        e.target.style.boxShadow = `0 0 0 3px ${colors.blue}20`;
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = colors.border;
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <motion.button
                            type="submit"
                            disabled={loading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full text-white font-semibold py-3 px-6 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{
                                background: `linear-gradient(135deg, ${colors.blue}, ${colors.purple})`,
                                boxShadow: `0 0 20px ${colors.blue}30`,
                            }}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle 
                                            className="opacity-25" 
                                            cx="12" 
                                            cy="12" 
                                            r="10" 
                                            stroke="currentColor" 
                                            strokeWidth="4" 
                                            fill="none" 
                                        />
                                        <path 
                                            className="opacity-75" 
                                            fill="currentColor" 
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
                                        />
                                    </svg>
                                    Processing...
                                </span>
                            ) : (
                                'Join Waitlist'
                            )}
                        </motion.button>
                    </form>

                    {/* Info text */}
                    <div 
                        className="mt-6 pt-6 border-t-2"
                        style={{ borderColor: colors.border }}
                    >
                        <p className="text-white/50 text-xs text-center leading-relaxed">
                            📧 You will receive the access link directly via email.
                            <br />
                            No spam, just pure learning excellence.
                        </p>
                    </div>
                </div>

                {/* Decorative glow */}
                <div 
                    className="absolute inset-0 -z-10 blur-3xl rounded-3xl opacity-30"
                    style={{
                        background: `linear-gradient(135deg, ${colors.blue}40, ${colors.purple}40)`,
                    }}
                />
            </motion.div>
        </div>
    );
}
