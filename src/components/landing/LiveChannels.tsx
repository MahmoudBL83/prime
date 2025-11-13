import { motion } from 'framer-motion';
import { Play, Users, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface LiveChannel {
    id: string;
    title: string;
    instructor: string;
    thumbnail: string;
    viewerCount: number;
    category: string;
    isLive: boolean;
    startTime?: string;
}

interface LiveChannelsProps {
    channels: LiveChannel[];
}

export function LiveChannels({ channels }: LiveChannelsProps) {
    return (
        <div className="py-12 bg-gradient-to-r from-red-900/20 to-purple-900/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <h2 className="text-2xl font-bold text-foreground">القنوات المباشرة</h2>
                    </div>
                    <Link
                        href="/live"
                        className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                    >
                        مشاهدة جميع القنوات
                    </Link>
                </div>

                {/* Live Channels Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {channels.map((channel) => (
                        <LiveChannelCard key={channel.id} channel={channel} />
                    ))}
                </div>
            </div>
        </div>
    );
}

function LiveChannelCard({ channel }: { channel: LiveChannel }) {
    return (
        <motion.div
            className="group cursor-pointer"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
        >
            <Link href={`/live/${channel.id}`}>
                <div className="relative">
                    {/* Channel Thumbnail */}
                    <div className="aspect-video bg-card rounded-lg overflow-hidden relative">
                        {/* Placeholder thumbnail with live indicator */}
                        <div className="w-full h-full bg-gradient-to-br from-red-900 to-orange-900 flex items-center justify-center">
                            <span className="text-foreground text-sm opacity-60">{channel.title}</span>
                        </div>

                        {/* Live Badge */}
                        <div className="absolute top-3 left-3">
                            <span className="px-3 py-1 bg-red-600 text-foreground text-xs font-bold rounded-full flex items-center">
                                <span className="w-2 h-2 bg-background rounded-full mr-2 animate-pulse"></span>
                                مباشر الآن
                            </span>
                        </div>

                        {/* Viewer Count */}
                        <div className="absolute top-3 right-3">
                            <div className="flex items-center gap-1 px-2 py-1 bg-background/80 text-foreground text-xs rounded">
                                <Eye className="w-3 h-3" />
                                <span>{channel.viewerCount.toLocaleString('ar-EG')}</span>
                            </div>
                        </div>

                        {/* Play Overlay on Hover */}
                        <div className="absolute inset-0 bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button
                                size="lg"
                                className="bg-red-600 hover:bg-red-700 text-foreground rounded-full px-6 py-3"
                            >
                                <Play className="w-5 h-5 fill-current mr-2" />
                                انضم للبث
                            </Button>
                        </div>
                    </div>

                    {/* Channel Info */}
                    <div className="mt-4">
                        <h3 className="text-foreground font-semibold text-base line-clamp-2 mb-2">
                            {channel.title}
                        </h3>

                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                                <Users className="w-3 h-3 text-foreground" />
                            </div>
                            <span className="text-muted-foreground text-sm">{channel.instructor}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="px-2 py-1 bg-card rounded">
                                {channel.category}
                            </span>
                            {channel.startTime && (
                                <span>بدأ {channel.startTime}</span>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

// Sample data for demo
export const sampleLiveChannels: LiveChannel[] = [
    {
        id: "live-1",
        title: "ورشة البرمجة المباشرة - تطوير تطبيقات الجوال",
        instructor: "أحمد محمد",
        thumbnail: "",
        viewerCount: 1250,
        category: "برمجة",
        isLive: true,
        startTime: "منذ 30 دقيقة"
    },
    {
        id: "live-2",
        title: "جلسة أسئلة وأجوبة - التسويق الرقمي",
        instructor: "فاطمة أحمد",
        thumbnail: "",
        viewerCount: 890,
        category: "تسويق",
        isLive: true,
        startTime: "منذ ساعة"
    },
    {
        id: "live-3",
        title: "تصميم الواجهات التفاعلية",
        instructor: "محمد علي",
        thumbnail: "",
        viewerCount: 620,
        category: "تصميم",
        isLive: true,
        startTime: "منذ 15 دقيقة"
    },
    {
        id: "live-4",
        title: "استراتيجيات الاستثمار الذكي",
        instructor: "سارة حسن",
        thumbnail: "",
        viewerCount: 2100,
        category: "مال وأعمال",
        isLive: true,
        startTime: "منذ 45 دقيقة"
    }
];