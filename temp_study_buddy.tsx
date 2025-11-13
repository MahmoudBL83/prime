// Activity Tab Component
function ActivityTab({ userId }: { userId: string }) {
    return (
        <div className="max-w-6xl mx-auto">
            <ActivityFeed userId={userId} />
        </div>
    )
}