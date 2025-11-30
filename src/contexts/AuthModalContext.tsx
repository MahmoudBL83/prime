"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { AuthModal } from "@/components/auth/AuthModal";

type AuthModalMode = "signin" | "signup";

type OpenAuthModalOptions = {
    onSuccess?: () => void;
};

interface AuthModalContextValue {
    isOpen: boolean;
    mode: AuthModalMode;
    openAuthModal: (mode?: AuthModalMode, options?: OpenAuthModalOptions) => void;
    closeAuthModal: () => void;
    setAuthMode: (mode: AuthModalMode) => void;
}

const AuthModalContext = createContext<AuthModalContextValue | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<AuthModalMode>("signin");
    const successCallbackRef = useRef<(() => void) | null>(null);

    const closeAuthModal = useCallback(() => {
        setIsOpen(false);
        successCallbackRef.current = null;
    }, []);

    const openAuthModal = useCallback(
        (nextMode: AuthModalMode = "signin", options?: OpenAuthModalOptions) => {
            setMode(nextMode);
            successCallbackRef.current = options?.onSuccess ?? null;
            setIsOpen(true);
        },
        []
    );

    const handleAuthSuccess = useCallback(() => {
        setIsOpen(false);
        const callback = successCallbackRef.current;
        successCallbackRef.current = null;
        callback?.();
    }, []);

    const value = useMemo(
        () => ({
            isOpen,
            mode,
            openAuthModal,
            closeAuthModal,
            setAuthMode: setMode,
        }),
        [isOpen, mode, openAuthModal, closeAuthModal]
    );

    return (
        <AuthModalContext.Provider value={value}>
            {children}
            <AuthModal
                isOpen={isOpen}
                mode={mode}
                onClose={closeAuthModal}
                onModeChange={setMode}
                onSuccess={handleAuthSuccess}
            />
        </AuthModalContext.Provider>
    );
}

export function useAuthModal() {
    const context = useContext(AuthModalContext);
    if (!context) {
        throw new Error("useAuthModal must be used within an AuthModalProvider");
    }
    return context;
}
