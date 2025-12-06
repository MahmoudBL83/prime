'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export function AdminAccessButton() {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="fixed bottom-6 right-6 z-50"
        >
            <Link
                href="/admin/login"
                className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600/90 to-pink-600/90 hover:from-red-600 hover:to-pink-600 backdrop-blur-xl text-white rounded-full shadow-lg shadow-red-500/20 hover:shadow-red-500/40 transition-all group"
            >
                <Shield className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-semibold">Admin Access</span>
            </Link>
        </motion.div>
    );
}
