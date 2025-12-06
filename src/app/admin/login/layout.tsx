import type { Metadata } from "next";
import Providers from "@/components/providers";

export const metadata: Metadata = {
    title: "Admin Login - Prime",
    description: "Admin login page for Prime platform",
    robots: "noindex, nofollow",
};

export default function AdminLoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Admin login bypasses parent admin layout but keeps global html/body
    return (
        <Providers>
            {children}
        </Providers>
    );
}
