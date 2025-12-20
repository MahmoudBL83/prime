'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
    Megaphone,
    Send,
    Loader2,
    AlertCircle,
    CheckCircle,
    Users,
    AlertTriangle,
    Info,
    Link as LinkIcon
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

const broadcastSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    message: z.string().min(1, 'Message is required'),
    type: z.enum(['SYSTEM', 'INFO', 'WARNING']),
    target: z.enum(['ALL', 'STUDENTS', 'INSTRUCTORS', 'CREATORS']),
    actionUrl: z.string().optional(),
})

type BroadcastForm = z.infer<typeof broadcastSchema>

export default function BroadcastPage() {
    const router = useRouter()
    const [sending, setSending] = useState(false)
    const [result, setResult] = useState<{ count: number } | null>(null)

    const { register, handleSubmit, formState: { errors }, reset } = useForm<BroadcastForm>({
        resolver: zodResolver(broadcastSchema),
        defaultValues: {
            type: 'SYSTEM',
            target: 'ALL',
        }
    })

    const onSubmit = async (data: BroadcastForm) => {
        setSending(true)
        setResult(null)

        try {
            const response = await fetch('/api/admin/communication/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            const json = await response.json()

            if (!response.ok) {
                throw new Error(json.error || json.message || 'Failed to send broadcast')
            }

            setResult({ count: json.recipientCount })
            toast.success(`Broadcast sent to ${json.recipientCount} users!`)
            reset()
        } catch (error) {
            console.error('Broadcast error:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to send broadcast')
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <div className="flex items-center gap-3 mb-2">
                    <Button
                        variant="ghost"
                        className="text-gray-400 hover:text-white -ml-4"
                        onClick={() => router.back()}
                    >
                        ← Back
                    </Button>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                    <Megaphone className="w-8 h-8 text-blue-500" />
                    New Broadcast
                </h1>
                <p className="text-gray-400">
                    Send a global notification to all users or specific groups.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    {/* Target Audience */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Target Audience</label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <select
                                    {...register('target')}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                                >
                                    <option value="ALL">All Users</option>
                                    <option value="STUDENTS">Students Only</option>
                                    <option value="INSTRUCTORS">Instructors Only</option>
                                    <option value="CREATORS">Creators Only</option>
                                </select>
                            </div>
                        </div>

                        {/* Notification Type */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-300">Type</label>
                            <div className="relative">
                                <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <select
                                    {...register('type')}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                                >
                                    <option value="SYSTEM">System Update (Default)</option>
                                    <option value="INFO">Information</option>
                                    <option value="WARNING">Warning / Alert</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Title</label>
                        <input
                            {...register('title')}
                            placeholder="e.g., Scheduled Maintenance or New Feature"
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                        {errors.title && (
                            <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
                        )}
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Message Content</label>
                        <textarea
                            {...register('message')}
                            rows={5}
                            placeholder="Write your message here..."
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                        {errors.message && (
                            <p className="text-red-400 text-sm mt-1">{errors.message.message}</p>
                        )}
                    </div>

                    {/* Action URL */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Link (Optional)</label>
                        <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                {...register('actionUrl')}
                                placeholder="/courses/new-feature"
                                className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            />
                        </div>
                        <p className="text-xs text-gray-500">
                            Users will be redirected to this URL when they click the notification.
                        </p>
                    </div>

                    {/* Submit */}
                    <div className="pt-4 flex items-center justify-between">
                        {result ? (
                            <div className="flex items-center gap-2 text-green-400 bg-green-400/10 px-4 py-2 rounded-lg">
                                <CheckCircle className="w-5 h-5" />
                                <span>Sent to {result.count} users successfully!</span>
                            </div>
                        ) : (
                            <div></div>
                        )}

                        <Button
                            type="submit"
                            disabled={sending}
                            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[150px]"
                        >
                            {sending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Broadcast
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </motion.div>

            {/* Preview Hint */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 items-start">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-blue-200">Tip</h4>
                    <p className="text-sm text-blue-300/80">
                        Broadcasts are sent immediately and cannot be undone. They will appear in the users' notification center.
                    </p>
                </div>
            </div>
        </div>
    )
}
