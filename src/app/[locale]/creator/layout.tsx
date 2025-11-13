export default function CreatorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="creator-studio-layout">
            {/* No navbar - Creator Studio has its own header */}
            {children}
        </div>
    )
}
