"use client";

/**
 * Legacy SignInModal placeholder. The project now relies on the global AuthModal
 * (Netflix-style). This component is kept as a safeguard for any older imports
 * and intentionally renders nothing.
 */
export function SignInModal() {
    if (process.env.NODE_ENV !== "production") {
        console.warn("SignInModal is deprecated. Use useAuthModal instead.");
    }
    return null;
}
