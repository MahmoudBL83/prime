'use client'

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Home } from 'lucide-react';

export default function NetflixDashboardPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Dashboard</span>
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-white mb-4">
            Netflix-style Dashboard
          </h1>
          <p className="text-gray-300">
            Netflix-style dashboard functionality is being developed. Please check back soon.
          </p>
        </div>
      </div>
    </div>
  );
}
