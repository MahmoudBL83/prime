/**
 * Student Progress Page
 * Complete learning progress dashboard for students
 */

import React from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import StudentProgressDashboard from '@/components/dashboard/StudentProgressDashboard';

export default async function StudentProgressPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect('/auth/signin');
    }

    if (session.user.role !== 'LEARNER') {
        redirect('/dashboard');
    }

    return (
        <div className="min-h-screen bg-background">
            <StudentProgressDashboard />
        </div>
    );
}

export const metadata = {
    title: 'تقدم التعلم - منصة التعليم المصرية',
    description: 'تتبع تقدمك في التعلم وانجازاتك الأكاديمية',
};
