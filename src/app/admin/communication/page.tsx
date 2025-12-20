'use client'

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Megaphone, Mail, FileText, ArrowRight } from 'lucide-react'

export default function CommunicationDashboard() {
    const router = useRouter()

    const cards = [
        {
            title: 'Broadcast',
            description: 'Send system-wide notifications to users, students, or instructors.',
            icon: Megaphone,
            color: 'from-blue-600 to-cyan-600',
            href: '/admin/communication/broadcast',
            stats: 'Push & In-App'
        },
        {
            title: 'Email Templates',
            description: 'Manage automated email templates, content, and translations.',
            icon: Mail,
            color: 'from-purple-600 to-pink-600',
            href: '/admin/communication/templates',
            stats: 'Transactional'
        }
    ]

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <h1 className="text-4xl font-bold text-white mb-2">
                    Communication Center
                </h1>
                <p className="text-gray-400">
                    Manage system notifications and email communications
                </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card, index) => (
                    <motion.div
                        key={card.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => router.push(card.href)}
                        className={`bg-gradient-to-br ${card.color} rounded-2xl p-1 cursor-pointer hover:scale-105 transition-transform group`}
                    >
                        <div className="bg-gray-900/90 h-full rounded-xl p-6 backdrop-blur-sm">
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center mb-4`}>
                                <card.icon className="w-6 h-6 text-white" />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-gray-300 transition-all">
                                {card.title}
                            </h3>

                            <p className="text-gray-400 text-sm mb-4 h-10">
                                {card.description}
                            </p>

                            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-gray-500">
                                <span>{card.stats}</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-white/50 group-hover:text-white" />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}
