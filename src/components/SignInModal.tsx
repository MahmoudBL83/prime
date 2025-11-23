'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn } from 'next-auth/react';

interface SignInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSignInSuccess: () => void;
}

export function SignInModal({ isOpen, onClose, onSignInSuccess }: SignInModalProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await signIn('credentials', {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                setError('Invalid email or password');
            } else {
                onSignInSuccess();
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
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
                        className="relative w-full max-w-md bg-neutral-900 rounded-3xl shadow-2xl"
                        style={{ border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        {/* Header */}
                        <div className="border-b border-white/10 px-8 py-6 flex items-center justify-between">
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                            <h2 className="text-2xl font-bold text-white">Sign In</h2>
                            <div className="w-8"></div>
                        </div>

                        {/* Content */}
                        <div className="px-8 py-6">
                            <p className="text-white/80 text-center mb-6">
                                Sign in to continue with your subscription
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="text-white/60 text-sm font-medium">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="your@email.com"
                                        required
                                        className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3.5 border border-white/20 focus:border-white/40 focus:outline-none"
                                    />
                                </div>

                                {/* Password */}
                                <div className="space-y-2">
                                    <label className="text-white/60 text-sm font-medium">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full bg-white/10 text-white placeholder-white/40 rounded-xl px-4 py-3.5 border border-white/20 focus:border-white/40 focus:outline-none"
                                    />
                                </div>

                                {/* Error Message */}
                                {error && (
                                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
                                        {error}
                                    </div>
                                )}

                                {/* Sign In Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-white hover:bg-white/90 text-black font-semibold py-4 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? 'Signing in...' : 'Sign In'}
                                </button>

                                {/* Forgot Password */}
                                <button
                                    type="button"
                                    className="w-full text-blue-500 hover:text-blue-400 text-sm transition-colors"
                                >
                                    Forgot password?
                                </button>

                                {/* Divider */}
                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-white/10"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-4 bg-neutral-900 text-white/60">or</span>
                                    </div>
                                </div>

                                {/* Create Account */}
                                <button
                                    type="button"
                                    className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-4 rounded-full transition-all border border-white/20"
                                >
                                    Create New Account
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
