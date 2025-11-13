/**
 * Certificate Generation Component
 * Creates downloadable certificates for completed courses
 */

'use client';

import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Share2, Award } from 'lucide-react';

interface CertificateProps {
    studentName: string;
    courseName: string;
    courseNameAr: string;
    instructorName: string;
    completionDate: Date;
    certificateId: string;
    courseDuration: string;
    grade?: string;
}

export default function Certificate({
    studentName,
    courseName,
    courseNameAr,
    instructorName,
    completionDate,
    certificateId,
    courseDuration,
    grade = 'امتياز'
}: CertificateProps) {
    const certificateRef = useRef<HTMLDivElement>(null);

    const downloadCertificate = async () => {
        if (!certificateRef.current) return;

        try {
            // Import html2canvas dynamically to avoid SSR issues
            const html2canvas = (await import('html2canvas')).default;

            const canvas = await html2canvas(certificateRef.current, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
            });

            // Create download link
            const link = document.createElement('a');
            link.download = `certificate-${certificateId}.png`;
            link.href = canvas.toDataURL('image/png');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Failed to download certificate:', error);
        }
    };

    const shareCertificate = async () => {
        const shareData = {
            title: `شهادة إتمام ${courseNameAr || courseName}`,
            text: `حصلت على شهادة إتمام كورس ${courseNameAr || courseName} من المنصة التعليمية المصرية`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.log('Share cancelled');
            }
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareData.url);
            // Show toast notification here
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Certificate Actions */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-foreground">شهادة إتمام الكورس</h1>
                <div className="flex gap-3">
                    <Button onClick={shareCertificate} variant="outline">
                        <Share2 className="w-4 h-4 mr-2" />
                        مشاركة
                    </Button>
                    <Button onClick={downloadCertificate}>
                        <Download className="w-4 h-4 mr-2" />
                        تحميل الشهادة
                    </Button>
                </div>
            </div>

            {/* Certificate */}
            <Card className="shadow-2xl">
                <CardContent className="p-0">
                    <div
                        ref={certificateRef}
                        className="relative bg-gradient-to-br from-blue-50 to-indigo-100 p-16 text-center"
                        style={{ minHeight: '600px', fontFamily: 'Arial, sans-serif' }}
                    >
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-10">
                            <div className="absolute top-10 left-10 w-20 h-20 border-4 border-gold-500 rounded-full"></div>
                            <div className="absolute top-20 right-16 w-16 h-16 border-3 border-blue-500 rotate-45"></div>
                            <div className="absolute bottom-16 left-20 w-24 h-24 border-4 border-green-500 rounded-full"></div>
                            <div className="absolute bottom-10 right-10 w-18 h-18 border-3 border-purple-500 rotate-12"></div>
                        </div>

                        {/* Header */}
                        <div className="relative z-10">
                            <div className="flex justify-center mb-6">
                                <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full p-4">
                                    <Award className="w-12 h-12 text-foreground" />
                                </div>
                            </div>

                            <h1 className="text-4xl font-bold text-gray-800 mb-2">شهادة إتمام</h1>
                            <h2 className="text-2xl font-semibold text-blue-600 mb-8">Certificate of Completion</h2>

                            {/* Certificate Body */}
                            <div className="space-y-6">
                                <p className="text-lg text-foreground">هذا يشهد بأن</p>
                                <p className="text-lg text-foreground">This is to certify that</p>

                                <div className="my-8">
                                    <h3 className="text-3xl font-bold text-foreground border-b-2 border-border pb-2 inline-block">
                                        {studentName}
                                    </h3>
                                </div>

                                <p className="text-lg text-foreground">قد أكمل بنجاح كورس</p>
                                <p className="text-lg text-foreground">has successfully completed the course</p>

                                <div className="my-6">
                                    <h4 className="text-2xl font-bold text-blue-800">{courseNameAr || courseName}</h4>
                                    {courseNameAr && courseName !== courseNameAr && (
                                        <p className="text-xl text-muted-foreground mt-2">{courseName}</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                                    <div>
                                        <p className="text-sm text-muted-foreground">تاريخ الإكمال</p>
                                        <p className="text-sm text-muted-foreground">Completion Date</p>
                                        <p className="font-semibold text-gray-800">
                                            {completionDate.toLocaleDateString('ar-EG')}
                                        </p>
                                        <p className="font-semibold text-gray-800">
                                            {completionDate.toLocaleDateString('en-US')}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground">مدة الكورس</p>
                                        <p className="text-sm text-muted-foreground">Course Duration</p>
                                        <p className="font-semibold text-gray-800">{courseDuration}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground">التقدير</p>
                                        <p className="text-sm text-muted-foreground">Grade</p>
                                        <p className="font-semibold text-green-600">{grade}</p>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex justify-between items-end mt-12 pt-8 border-t border-border">
                                    <div className="text-left">
                                        <div className="border-b border-gray-400 pb-1 mb-2 w-48"></div>
                                        <p className="text-sm text-muted-foreground">المدرب</p>
                                        <p className="text-sm text-muted-foreground">Instructor</p>
                                        <p className="font-medium text-gray-800">{instructorName}</p>
                                    </div>

                                    <div className="text-center">
                                        <div className="bg-blue-100 rounded-lg p-3">
                                            <p className="text-xs text-muted-foreground">رقم الشهادة</p>
                                            <p className="text-xs text-muted-foreground">Certificate ID</p>
                                            <p className="font-mono text-sm text-gray-800">{certificateId}</p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="border-b border-gray-400 pb-1 mb-2 w-48"></div>
                                        <p className="text-sm text-muted-foreground">المنصة التعليمية المصرية</p>
                                        <p className="text-sm text-muted-foreground">Egyptian EdTech Platform</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {new Date().getFullYear()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Certificate Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">معلومات الشهادة</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
                    <div>
                        <p><strong>رقم الشهادة:</strong> {certificateId}</p>
                        <p><strong>تاريخ الإصدار:</strong> {new Date().toLocaleDateString('ar-EG')}</p>
                    </div>
                    <div>
                        <p><strong>حالة التحقق:</strong> شهادة معتمدة</p>
                        <p><strong>صالحة حتى:</strong> غير محدودة</p>
                    </div>
                </div>
                <p className="text-xs text-blue-600 mt-3">
                    يمكن التحقق من صحة هذه الشهادة عبر الموقع الرسمي للمنصة باستخدام رقم الشهادة أعلاه
                </p>
            </div>
        </div>
    );
}
