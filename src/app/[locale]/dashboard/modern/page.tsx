'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Home } from 'lucide-react';

export default function ModernDashboardPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Modern Dashboard
          </h1>
          <p className="text-gray-600">
            Modern dashboard functionality is being developed. Please check back soon.
          </p>
        </div>
      </div>
    </div>
  );
}