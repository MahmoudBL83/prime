import { ReactNode } from 'react';

export default function MessagingLayout({
    children,
}: {
    children: ReactNode;
}) {
    // This layout bypasses the MainLayout to have full screen messaging
    return <>{children}</>;
}
