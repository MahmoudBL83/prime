'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function Home() {
    const router = useRouter();
    const params = useParams();
    const locale = params?.locale as string || 'en';

    useEffect(() => {
        // Redirect to courses page
        router.replace(`/${locale}/courses`);
    }, [router, locale]);

    // Show minimal loading state during redirect
    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-white/70">Loading...</div>
        </div>
    );
}
