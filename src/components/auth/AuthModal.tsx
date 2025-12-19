"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { X, Check } from "lucide-react";
import toast from "react-hot-toast";

type AuthModalMode = "signin" | "signup";
type AuthStep = "email" | "auth" | "forgot-password";

interface AuthModalProps {
    isOpen: boolean;
    mode: AuthModalMode;
    onClose: () => void;
    onModeChange: (mode: AuthModalMode) => void;
    onSuccess: () => void;
}

const backgroundImage =
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80";

export function AuthModal({ isOpen, mode, onClose, onModeChange, onSuccess }: AuthModalProps) {
    const [step, setStep] = useState<AuthStep>("email");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [country, setCountry] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [receiveUpdates, setReceiveUpdates] = useState(true);
    const [resetComplete, setResetComplete] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setError(null);
            setIsLoading(false);
            setStep("email");
            setResetComplete(false);
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setFirstName("");
            setLastName("");
            setBirthDate("");
            setCountry("");
        }
    }, [isOpen]);

    const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Check if user exists
            const response = await fetch("/api/auth/check-email", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.exists) {
                onModeChange("signin");
            } else {
                onModeChange("signup");
            }
            setStep("auth");
        } catch (error) {
            console.error("Email check error", error);
            // Default to signup if check fails
            onModeChange("signup");
            setStep("auth");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password. Please try again.");
                return;
            }

            toast.success("Welcome back!", { id: "auth-success" });
            onSuccess();
        } catch (authError) {
            console.error("Sign in error", authError);
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        if (!firstName || !lastName || !birthDate || !country) {
            setError("Please complete all required fields");
            setIsLoading(false);
            return;
        }

        if (!agreeToTerms) {
            setError("You must agree to the Terms & Conditions");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    firstName,
                    lastName,
                    birthDate,
                    country,
                    email,
                    password,
                }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                setError(data?.error || "Unable to create account. Please try again.");
                return;
            }

            await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            toast.success("Account created!", { id: "auth-success" });
            onSuccess();
        } catch (signUpError) {
            console.error("Sign up error", signUpError);
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordReset = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await fetch("/api/auth/request-password-reset", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            // Always show success state for security
            setResetComplete(true);
        } catch (error) {
            console.error("Password reset error", error);
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const featureList = [
        "Unlimited access to every course",
        "Live sessions & interactive tools",
        "Cancel anytime",
    ];

    const countryOptions = [
        "Egypt",
        "Germany",
        "United Arab Emirates",
        "Saudi Arabia",
        "United States",
        "United Kingdom",
    ];

    if (!mounted) return null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Background Overlay */}
                    <motion.div
                        className="absolute inset-0 bg-black/95"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 40, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="relative z-10 w-full max-w-md sm:max-w-lg lg:max-w-2xl mx-4 my-8 bg-[#1a1a1a] rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden max-h-[90vh] flex flex-col"
                        role="dialog"
                        aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative overflow-y-auto overscroll-contain">
                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#2d2d2d] hover:bg-[#3d3d3d] flex items-center justify-center transition-all z-10"
                                aria-label="Close"
                            >
                                <X className="h-4 w-4 text-white/80" />
                            </button>

                            {/* Header */}
                            <div className="flex flex-col items-center pt-16 pb-8 px-8 lg:px-16">
                                {step === "email" ? (
                                    <>
                                        <h2 className="text-2xl lg:text-3xl font-semibold text-white text-center mb-2">
                                            Continue with Email
                                        </h2>
                                        <p className="text-[#86868b] text-center text-sm lg:text-base max-w-md">
                                            You can sign in if you already have an account, or we'll help you create one.
                                        </p>
                                    </>
                                ) : step === "forgot-password" ? (
                                    <>
                                        <h2 className="text-2xl lg:text-3xl font-semibold text-white text-center mb-2">
                                            {resetComplete ? "Check your email" : "Reset Password"}
                                        </h2>
                                        <p className="text-[#86868b] text-center text-sm lg:text-base max-w-md">
                                            {resetComplete
                                                ? "We've sent a password reset link to your email."
                                                : "Enter your email to receive a password reset link."}
                                        </p>
                                    </>
                                ) : mode === "signin" ? (
                                    <>
                                        <h2 className="text-2xl lg:text-3xl font-semibold text-white text-center mb-2">
                                            Welcome back
                                        </h2>
                                        <p className="text-[#86868b] text-center text-sm lg:text-base max-w-md">
                                            Enter your password to continue
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-2xl lg:text-3xl font-semibold text-white text-center mb-2">
                                            Create Your Account
                                        </h2>
                                        <p className="text-[#86868b] text-center text-sm lg:text-base max-w-md">
                                            You'll use this account for all Prime services.
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Form */}
                            <div className="px-8 lg:px-16 pb-8 lg:pb-12 max-w-xl mx-auto">
                                {error && (
                                    <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200 mb-4">
                                        {error}
                                    </div>
                                )}

                                {step === "email" ? (
                                    <form className="space-y-4" onSubmit={handleEmailSubmit}>
                                        <div>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(event) => setEmail(event.target.value)}
                                                className="w-full rounded-xl border border-[#3d3d3d] bg-[#2d2d2d] px-4 py-3.5 text-white text-sm placeholder-[#86868b] focus:border-[#0071e3] focus:outline-none transition-all"
                                                placeholder="Email"
                                                autoFocus
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white py-3.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? "Checking..." : "Continue"}
                                        </button>
                                    </form>
                                ) : step === "forgot-password" ? (
                                    resetComplete ? (
                                        <div className="flex flex-col items-center space-y-6">
                                            <div className="w-16 h-16 bg-[#2d2d2d] rounded-full flex items-center justify-center">
                                                <Check className="w-8 h-8 text-[#0071e3]" />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setStep("auth");
                                                    onModeChange("signin");
                                                    setResetComplete(false);
                                                }}
                                                className="w-full rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white py-3.5 text-sm font-semibold transition-all"
                                            >
                                                Back to Sign In
                                            </button>
                                        </div>
                                    ) : (
                                        <form className="space-y-4" onSubmit={handlePasswordReset}>
                                            <div>
                                                <input
                                                    type="email"
                                                    required
                                                    value={email}
                                                    onChange={(event) => setEmail(event.target.value)}
                                                    className="w-full rounded-xl border border-[#3d3d3d] bg-[#2d2d2d] px-4 py-3.5 text-white text-sm placeholder-[#86868b] focus:border-[#0071e3] focus:outline-none transition-all"
                                                    placeholder="Email"
                                                    autoFocus
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="w-full rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white py-3.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isLoading ? "Sending..." : "Send Reset Link"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setStep("auth");
                                                    onModeChange("signin");
                                                }}
                                                className="w-full text-[#0071e3] text-sm hover:underline"
                                            >
                                                Back to Sign In
                                            </button>
                                        </form>
                                    )
                                ) : mode === "signin" ? (
                                    <form className="space-y-4" onSubmit={handleSignIn}>
                                        <div>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                disabled
                                                className="w-full rounded-xl border border-[#3d3d3d] bg-[#2d2d2d] px-4 py-3.5 text-white/50 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="password"
                                                required
                                                value={password}
                                                onChange={(event) => setPassword(event.target.value)}
                                                className="w-full rounded-xl border border-[#3d3d3d] bg-[#2d2d2d] px-4 py-3.5 text-white text-sm placeholder-[#86868b] focus:border-[#0071e3] focus:outline-none transition-all"
                                                placeholder="Password"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setStep("forgot-password");
                                                    setResetComplete(false);
                                                }}
                                                className="text-[#0071e3] text-sm hover:underline font-medium"
                                            >
                                                Forgot password?
                                            </button>
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white py-3.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isLoading ? "Signing in..." : "Continue"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStep("email")}
                                            className="w-full text-[#0071e3] text-sm hover:underline"
                                        >
                                            Use a different email
                                        </button>
                                    </form>
                                ) : (
                                    <form className="space-y-4" onSubmit={handleSignUp}>
                                        <div>
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                disabled
                                                className="w-full rounded-xl border border-[#3d3d3d] bg-[#2d2d2d] px-4 py-3.5 text-white/50 text-sm"
                                            />
                                            <p className="text-[#86868b] text-xs mt-2">
                                                This email address will become your Prime Account.
                                            </p>
                                        </div>
                                        <div>
                                            <input
                                                type="password"
                                                required
                                                value={password}
                                                onChange={(event) => setPassword(event.target.value)}
                                                className="w-full rounded-xl border border-[#3d3d3d] bg-[#2d2d2d] px-4 py-3.5 text-white text-sm placeholder-[#86868b] focus:border-[#0071e3] focus:outline-none transition-all"
                                                placeholder="Password"
                                                minLength={8}
                                            />
                                            <p className="text-[#86868b] text-xs mt-2">
                                                Your password must have 8 or more characters, upper and lowercase letters, and at least one number.
                                            </p>
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                required
                                                value={firstName}
                                                onChange={(event) => setFirstName(event.target.value)}
                                                className="w-full rounded-xl border border-[#3d3d3d] bg-[#2d2d2d] px-4 py-3.5 text-white text-sm placeholder-[#86868b] focus:border-[#0071e3] focus:outline-none transition-all"
                                                placeholder="First Name"
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                required
                                                value={lastName}
                                                onChange={(event) => setLastName(event.target.value)}
                                                className="w-full rounded-xl border border-[#3d3d3d] bg-[#2d2d2d] px-4 py-3.5 text-white text-sm placeholder-[#86868b] focus:border-[#0071e3] focus:outline-none transition-all"
                                                placeholder="Last Name"
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                required
                                                value={birthDate}
                                                onChange={(event) => {
                                                    let value = event.target.value.replace(/\D/g, '');
                                                    if (value.length >= 2) {
                                                        value = value.slice(0, 2) + '/' + value.slice(2);
                                                    }
                                                    if (value.length >= 5) {
                                                        value = value.slice(0, 5) + '/' + value.slice(5, 9);
                                                    }
                                                    setBirthDate(value);
                                                }}
                                                className="w-full rounded-xl border border-[#3d3d3d] bg-[#2d2d2d] px-4 py-3.5 text-white text-sm placeholder-[#86868b] focus:border-[#0071e3] focus:outline-none transition-all"
                                                placeholder="Birthday"
                                                maxLength={10}
                                            />
                                        </div>
                                        <div>
                                            <select
                                                required
                                                value={country}
                                                onChange={(event) => setCountry(event.target.value)}
                                                className="w-full rounded-xl border border-[#3d3d3d] bg-[#2d2d2d] px-4 py-3.5 text-white text-sm focus:border-[#0071e3] focus:outline-none transition-all"
                                            >
                                                <option value="" className="bg-[#1a1a1a] text-white">Country/Region</option>
                                                {countryOptions.map((option) => (
                                                    <option key={option} value={option} className="bg-[#1a1a1a] text-white">
                                                        {option}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Prime Updates Checkbox */}
                                        <div className="flex items-start gap-3 pt-2">
                                            <input
                                                type="checkbox"
                                                id="receiveUpdates"
                                                checked={receiveUpdates}
                                                onChange={(e) => setReceiveUpdates(e.target.checked)}
                                                className="mt-0.5 w-4 h-4 rounded border-[#3d3d3d] bg-[#2d2d2d] text-[#0071e3] focus:ring-[#0071e3] focus:ring-offset-0"
                                            />
                                            <label htmlFor="receiveUpdates" className="text-sm text-white">
                                                <span className="font-semibold">Prime Updates</span>
                                                <p className="text-[#86868b] text-xs mt-1">
                                                    Receive Prime emails and communications including new releases, exclusive content, special offers, and marketing and recommendations for apps, music, movies, TV, books, podcasts, Prime Pay, and more.
                                                </p>
                                            </label>
                                        </div>

                                        {/* Terms & Conditions Checkbox */}
                                        <div className="flex items-start gap-3">
                                            <input
                                                type="checkbox"
                                                id="agreeToTerms"
                                                checked={agreeToTerms}
                                                onChange={(e) => setAgreeToTerms(e.target.checked)}
                                                className="mt-0.5 w-4 h-4 rounded border-[#3d3d3d] bg-[#2d2d2d] text-[#0071e3] focus:ring-[#0071e3] focus:ring-offset-0"
                                            />
                                            <label htmlFor="agreeToTerms" className="text-sm text-white">
                                                Agree to Terms & Conditions
                                            </label>
                                        </div>

                                        {/* Terms Text */}
                                        <div className="pt-2 pb-4 border-t border-[#3d3d3d]">
                                            <p className="text-[#86868b] text-xs">
                                                By selecting Continue, you agree to the{" "}
                                                <a href="#" className="text-[#0071e3] hover:underline">
                                                    Prime Media Services Terms & Conditions
                                                </a>{" "}
                                                and acknowledge that you will be signed in on this browser.
                                            </p>
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setStep("email")}
                                                className="flex-1 rounded-xl border border-[#0071e3] bg-transparent text-[#0071e3] py-3.5 text-sm font-semibold transition-all hover:bg-[#0071e3]/10"
                                            >
                                                Back
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="flex-1 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white py-3.5 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isLoading ? "Creating..." : "Continue"}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Privacy Notice */}
                                <div className="mt-6 flex items-start gap-3">
                                    <div className="mt-0.5">
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                            <path d="M10 2C8.07 2 6.5 3.57 6.5 5.5V8H5.5C4.67 8 4 8.67 4 9.5V16.5C4 17.33 4.67 18 5.5 18H14.5C15.33 18 16 17.33 16 16.5V9.5C16 8.67 15.33 8 14.5 8H13.5V5.5C13.5 3.57 11.93 2 10 2ZM10 3.5C11.1 3.5 12 4.4 12 5.5V8H8V5.5C8 4.4 8.9 3.5 10 3.5Z" fill="#0071e3" />
                                        </svg>
                                    </div>
                                    <p className="text-[11px] text-[#86868b] leading-relaxed">
                                        Your Apple Account information is used to allow you to sign in securely and access your data. Apple records certain data for security, support, and reporting purposes. If you agree, Apple may also use your Apple Account information to send you marketing emails and communications, including based on your use of Apple services.{" "}
                                        <a href="#" className="text-[#0071e3] hover:underline">
                                            See how your data is managed...
                                        </a>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
}
