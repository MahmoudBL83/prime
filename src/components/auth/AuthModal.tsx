"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { X, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

type AuthModalMode = "signin" | "signup";

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
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [birthDate, setBirthDate] = useState("");
    const [country, setCountry] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setError(null);
            setIsLoading(false);
            setEmail("");
            setPassword("");
            setConfirmPassword("");
            setFirstName("");
            setLastName("");
            setBirthDate("");
            setCountry("");
        }
    }, [isOpen]);

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

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        if (!firstName || !lastName || !birthDate || !country) {
            setError("Please complete all required fields");
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

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[200]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Background */}
                    <div className="absolute inset-0 overflow-hidden">
                        <Image
                            src={backgroundImage}
                            alt="Prime background"
                            fill
                            priority
                            sizes="100vw"
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/80 to-black/95" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/70" />
                    </div>

                    {/* Backdrop click handler */}
                    <div
                        className="absolute inset-0"
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-10">
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 40, scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 120, damping: 20 }}
                            className="w-full max-w-md bg-black/80 border border-white/10 rounded-3xl shadow-[0_25px_70px_rgba(0,0,0,0.75)] backdrop-blur-xl overflow-hidden"
                            role="dialog"
                            aria-modal="true"
                        >
                            <div className="flex items-center justify-between px-8 pt-8">
                                <div className="flex items-center gap-3">
                                    <div className="relative h-10 w-10 rounded-xl overflow-hidden">
                                        <Image
                                            src="/images/logo.jpg"
                                            alt="Prime"
                                            fill
                                            sizes="40px"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-white/80 text-xs uppercase tracking-[0.3em]">Prime</p>
                                        <p className="text-white font-semibold text-base">Unlimited Learning</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                    aria-label="Close auth modal"
                                >
                                    <X className="h-5 w-5 text-white" />
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="px-8 mt-8">
                                <div className="flex rounded-full bg-white/5 p-1 border border-white/10">
                                    {[
                                        { key: "signin", label: "Sign In" },
                                        { key: "signup", label: "Create Account" },
                                    ].map((tab) => (
                                        <button
                                            key={tab.key}
                                            className={`flex-1 py-2.5 text-sm font-semibold rounded-full transition-all duration-200 ${
                                                mode === tab.key
                                                    ? "bg-[#e50914] text-white shadow-lg shadow-[#e50914]/40"
                                                    : "text-white/60 hover:text-white"
                                            }`}
                                            onClick={() => onModeChange(tab.key as AuthModalMode)}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Form */}
                            <div className="px-8 py-8 space-y-6">
                                <div>
                                    <h2 className="text-3xl font-bold text-white tracking-tight">
                                        {mode === "signin" ? "Sign in to continue" : "Create your account"}
                                    </h2>
                                    <p className="text-white/60 mt-2">
                                        {mode === "signin"
                                            ? "Access every course, live cohort, and interactive tool in one place."
                                            : "Join thousands of learners leveling up their careers with Prime."}
                                    </p>
                                </div>

                                {error && (
                                    <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                        {error}
                                    </div>
                                )}

                                {mode === "signin" ? (
                                    <form className="space-y-4" onSubmit={handleSignIn}>
                                        <label className="block text-sm font-medium text-white/80">
                                            Email
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(event) => setEmail(event.target.value)}
                                                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                                                placeholder="you@example.com"
                                            />
                                        </label>
                                        <label className="block text-sm font-medium text-white/80">
                                            Password
                                            <input
                                                type="password"
                                                required
                                                value={password}
                                                onChange={(event) => setPassword(event.target.value)}
                                                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                                                placeholder="••••••••"
                                            />
                                        </label>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full rounded-2xl bg-[#e50914] py-3.5 text-base font-semibold text-white shadow-[0_20px_40px_rgba(229,9,20,0.35)] transition-all hover:bg-[#f6121d] disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {isLoading ? "Signing in..." : "Sign In"}
                                        </button>
                                    </form>
                                ) : (
                                    <form className="space-y-4" onSubmit={handleSignUp}>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <label className="block text-sm font-medium text-white/80">
                                                First Name
                                                <input
                                                    type="text"
                                                    required
                                                    value={firstName}
                                                    onChange={(event) => setFirstName(event.target.value)}
                                                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                                                    placeholder="First name"
                                                />
                                            </label>
                                            <label className="block text-sm font-medium text-white/80">
                                                Last Name
                                                <input
                                                    type="text"
                                                    required
                                                    value={lastName}
                                                    onChange={(event) => setLastName(event.target.value)}
                                                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                                                    placeholder="Last name"
                                                />
                                            </label>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <label className="block text-sm font-medium text-white/80">
                                                Birth Date
                                                <input
                                                    type="date"
                                                    required
                                                    value={birthDate}
                                                    onChange={(event) => setBirthDate(event.target.value)}
                                                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                                                />
                                            </label>
                                            <label className="block text-sm font-medium text-white/80">
                                                Country
                                                <select
                                                    required
                                                    value={country}
                                                    onChange={(event) => setCountry(event.target.value)}
                                                    className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-white/40 focus:outline-none"
                                                >
                                                    <option value="" className="bg-black text-white">
                                                        Select country
                                                    </option>
                                                    {countryOptions.map((option) => (
                                                        <option key={option} value={option} className="bg-black text-white">
                                                            {option}
                                                        </option>
                                                    ))}
                                                </select>
                                            </label>
                                        </div>
                                        <label className="block text-sm font-medium text-white/80">
                                            Email
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(event) => setEmail(event.target.value)}
                                                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                                                placeholder="you@example.com"
                                            />
                                        </label>
                                        <label className="block text-sm font-medium text-white/80">
                                            Password
                                            <input
                                                type="password"
                                                required
                                                value={password}
                                                onChange={(event) => setPassword(event.target.value)}
                                                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                                                placeholder="Create a password"
                                                minLength={8}
                                            />
                                        </label>
                                        <label className="block text-sm font-medium text-white/80">
                                            Confirm Password
                                            <input
                                                type="password"
                                                required
                                                value={confirmPassword}
                                                onChange={(event) => setConfirmPassword(event.target.value)}
                                                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/40 focus:border-white/40 focus:outline-none"
                                                placeholder="Repeat password"
                                                minLength={8}
                                            />
                                        </label>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full rounded-2xl bg-[#e50914] py-3.5 text-base font-semibold text-white shadow-[0_20px_40px_rgba(229,9,20,0.35)] transition-all hover:bg-[#f6121d] disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {isLoading ? "Creating account..." : "Start Membership"}
                                        </button>
                                    </form>
                                )}

                                <div className="space-y-3">
                                    {featureList.map((feature) => (
                                        <div key={feature} className="flex items-center gap-3">
                                            <CheckCircle className="h-5 w-5 text-green-400" />
                                            <p className="text-sm text-white/80">{feature}</p>
                                        </div>
                                    ))}
                                </div>

                                <p className="text-xs text-white/50 leading-relaxed">
                                    By continuing you agree to the Prime Terms of Service and acknowledge our Privacy Policy.
                                    You can cancel anytime.
                                </p>

                                <div className="pt-4 border-t border-white/10">
                                    {mode === "signin" ? (
                                        <p className="text-center text-sm text-white/70">
                                            New to Prime?{" "}
                                            <button
                                                className="font-semibold text-white hover:text-[#f6121d]"
                                                onClick={() => onModeChange("signup")}
                                            >
                                                Start your membership
                                            </button>
                                        </p>
                                    ) : (
                                        <p className="text-center text-sm text-white/70">
                                            Already have an account?{" "}
                                            <button
                                                className="font-semibold text-white hover:text-[#f6121d]"
                                                onClick={() => onModeChange("signin")}
                                            >
                                                Sign in
                                            </button>
                                        </p>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
