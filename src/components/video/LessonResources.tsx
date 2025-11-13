'use client';

import { motion } from 'framer-motion';
import { 
    FileText, Download, ExternalLink, File, Image as ImageIcon, 
    Video, FileCode, Archive
} from 'lucide-react';

interface LessonResource {
    id: string;
    title: string;
    type: string;
    url: string;
    size?: string;
}

interface LessonResourcesProps {
    resources: LessonResource[];
    isArabic?: boolean;
}

export default function LessonResources({
    resources,
    isArabic = false,
}: LessonResourcesProps) {
    const getResourceIcon = (type: string) => {
        const lowerType = type.toLowerCase();
        
        if (lowerType.includes('pdf')) return <FileText className="w-5 h-5 text-red-400" />;
        if (lowerType.includes('image') || lowerType.includes('png') || lowerType.includes('jpg')) 
            return <ImageIcon className="w-5 h-5 text-blue-400" />;
        if (lowerType.includes('video')) return <Video className="w-5 h-5 text-purple-400" />;
        if (lowerType.includes('code') || lowerType.includes('zip')) 
            return <FileCode className="w-5 h-5 text-green-400" />;
        if (lowerType.includes('archive') || lowerType.includes('zip') || lowerType.includes('rar')) 
            return <Archive className="w-5 h-5 text-yellow-400" />;
        
        return <File className="w-5 h-5 text-muted-foreground" />;
    };

    const handleDownload = async (resource: LessonResource) => {
        try {
            // Open in new tab for download
            window.open(resource.url, '_blank');
        } catch (error) {
            console.error('Error downloading resource:', error);
        }
    };

    if (resources.length === 0) {
        return (
            <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl border border-border p-6 text-center">
                <File className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">
                    {isArabic ? 'لا توجد موارد متاحة' : 'No resources available'}
                </p>
            </div>
        );
    }

    return (
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl border border-border p-4">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <Download className="w-5 h-5 text-green-400" />
                <h3 className="text-lg font-semibold text-foreground">
                    {isArabic ? 'موارد الدرس' : 'Lesson Resources'}
                </h3>
                <span className="text-sm text-muted-foreground">({resources.length})</span>
            </div>

            {/* Resources List */}
            <div className="space-y-2">
                {resources.map((resource, index) => (
                    <motion.div
                        key={resource.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-gray-800/50 rounded-lg p-3 border border-border hover:border-green-500/50 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            {/* Icon */}
                            <div className="flex-shrink-0">
                                {getResourceIcon(resource.type)}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-foreground text-sm font-medium truncate">
                                    {resource.title}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                    <span className="uppercase">{resource.type}</span>
                                    {resource.size && (
                                        <>
                                            <span>•</span>
                                            <span>{resource.size}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleDownload(resource)}
                                    className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                                    title={isArabic ? 'تحميل' : 'Download'}
                                >
                                    <Download className="w-4 h-4 text-foreground" />
                                </button>
                                <button
                                    onClick={() => window.open(resource.url, '_blank')}
                                    className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                    title={isArabic ? 'فتح' : 'Open'}
                                >
                                    <ExternalLink className="w-4 h-4 text-foreground" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Download All */}
            {resources.length > 1 && (
                <button
                    onClick={() => {
                        resources.forEach(resource => {
                            setTimeout(() => handleDownload(resource), 100);
                        });
                    }}
                    className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-foreground py-2.5 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                >
                    <Download className="w-4 h-4" />
                    {isArabic ? 'تحميل جميع الموارد' : 'Download All Resources'}
                </button>
            )}
        </div>
    );
}
