'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Award, Calendar, Download, Share2, CheckCircle, ExternalLink } from 'lucide-react';
import { useTranslationsSafe } from '@/hooks/useTranslationsSafe';
import toast from 'react-hot-toast';

interface Certificate {
  id: string;
  certificateNumber: string;
  issueDate: string;
  completionDate: string;
  credentialUrl: string;
  isPublic: boolean;
  user: {
    name: string;
  };
  course: {
    title: string;
    titleAr?: string;
    instructor?: {
      name: string;
      arabicName?: string;
    };
  };
}

export default function CertificatePage() {
  const params = useParams();
  const { t, locale } = useTranslationsSafe('certificates');
  const isRtl = locale === 'ar';
  
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchCertificate();
  }, [params.certificateNumber]);

  const fetchCertificate = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/certificates/${params.certificateNumber}`);
      
      if (!response.ok) {
        throw new Error('Certificate not found');
      }
      
      const data = await response.json();
      setCertificate(data.certificate);
    } catch (error) {
      console.error('Error fetching certificate:', error);
      toast.error(isRtl ? 'الشهادة غير موجودة' : 'Certificate not found');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      // In production, this would generate and download a PDF
      toast.success(isRtl ? 'جاري تحميل الشهادة...' : 'Downloading certificate...');
      
      // For now, open in new tab
      window.open(`/api/certificates/${params.certificateNumber}/download`, '_blank');
    } catch (error) {
      toast.error(isRtl ? 'فشل تحميل الشهادة' : 'Failed to download certificate');
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/certificates/${params.certificateNumber}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: isRtl ? 'شهادة الإنجاز' : 'Certificate of Completion',
          text: isRtl 
            ? `لقد أكملت ${certificate?.course.titleAr || certificate?.course.title}!`
            : `I completed ${certificate?.course.title}!`,
          url: url,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url);
      toast.success(isRtl ? 'تم نسخ الرابط' : 'Link copied to clipboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">{isRtl ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center">
        <div className="text-center">
          <Award className="w-24 h-24 text-gray-700 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-300 mb-2">
            {isRtl ? 'الشهادة غير موجودة' : 'Certificate Not Found'}
          </h1>
          <p className="text-gray-500">
            {isRtl 
              ? 'رقم الشهادة غير صحيح أو تم حذفها'
              : 'The certificate number is invalid or has been removed'}
          </p>
        </div>
      </div>
    );
  }

  const courseTitle = isRtl && certificate.course.titleAr 
    ? certificate.course.titleAr 
    : certificate.course.title;

  const instructorName = isRtl && certificate.course.instructor?.arabicName
    ? certificate.course.instructor.arabicName
    : certificate.course.instructor?.name || 'Prime Learning';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Action Buttons */}
        <div className="flex justify-end gap-3 mb-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg flex items-center gap-2 text-gray-300 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            {isRtl ? 'مشاركة' : 'Share'}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownload}
            disabled={downloading}
            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 rounded-lg flex items-center gap-2 text-white font-semibold transition-all disabled:opacity-50"
          >
            <Download className="w-5 h-5" />
            {downloading 
              ? (isRtl ? 'جاري التحميل...' : 'Downloading...') 
              : (isRtl ? 'تحميل PDF' : 'Download PDF')}
          </motion.button>
        </div>

        {/* Certificate Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Certificate Header */}
          <div className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 py-8 px-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/patterns/circuit.svg')] opacity-10"></div>
            <div className="relative">
              <Award className="w-20 h-20 text-white mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-white mb-2">
                {isRtl ? 'شهادة إتمام' : 'Certificate of Completion'}
              </h1>
              <p className="text-amber-100">
                {isRtl ? 'من Prime Learning' : 'From Prime Learning'}
              </p>
            </div>
          </div>

          {/* Certificate Body */}
          <div className="p-12 text-center" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="mb-8">
              <p className="text-gray-600 text-lg mb-4">
                {isRtl ? 'تشهد هذه الشهادة بأن' : 'This is to certify that'}
              </p>
              <h2 className="text-4xl font-bold text-gray-900 mb-2">
                {certificate.user.name}
              </h2>
              <p className="text-gray-600 text-lg mb-8">
                {isRtl ? 'قد أتم بنجاح الدورة التدريبية' : 'has successfully completed the course'}
              </p>
              
              <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-amber-200 mb-8 max-w-2xl mx-auto">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {courseTitle}
                </h3>
                <p className="text-gray-600">
                  {isRtl ? 'مقدمة من' : 'Presented by'} {instructorName}
                </p>
              </div>
            </div>

            {/* Certificate Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 max-w-3xl mx-auto">
              <div className="bg-white rounded-lg p-4 shadow">
                <Calendar className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  {isRtl ? 'تاريخ الإصدار' : 'Issue Date'}
                </p>
                <p className="font-semibold text-gray-900">
                  {new Date(certificate.issueDate).toLocaleDateString(
                    isRtl ? 'ar-EG' : 'en-US',
                    { year: 'numeric', month: 'long', day: 'numeric' }
                  )}
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow">
                <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  {isRtl ? 'تاريخ الإنجاز' : 'Completion Date'}
                </p>
                <p className="font-semibold text-gray-900">
                  {new Date(certificate.completionDate).toLocaleDateString(
                    isRtl ? 'ar-EG' : 'en-US',
                    { year: 'numeric', month: 'long', day: 'numeric' }
                  )}
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 shadow">
                <Award className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">
                  {isRtl ? 'رقم الشهادة' : 'Certificate No.'}
                </p>
                <p className="font-mono font-semibold text-gray-900 text-sm">
                  {certificate.certificateNumber}
                </p>
              </div>
            </div>

            {/* Verification Section */}
            <div className="border-t-2 border-amber-200 pt-6">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <ExternalLink className="w-4 h-4" />
                <span>
                  {isRtl 
                    ? 'يمكن التحقق من صحة هذه الشهادة على'
                    : 'Verify this certificate at'}{' '}
                  <span className="font-mono text-amber-700">
                    prime-learning.com/certificates/{certificate.certificateNumber}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Certificate Footer */}
          <div className="bg-gradient-to-r from-amber-100 to-orange-100 py-6 px-8 text-center border-t-2 border-amber-200">
            <p className="text-sm text-gray-700">
              {isRtl 
                ? 'هذه الشهادة صادرة إلكترونياً ومعتمدة من Prime Learning'
                : 'This certificate is digitally issued and verified by Prime Learning'}
            </p>
          </div>
        </motion.div>

        {/* Additional Info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            {isRtl 
              ? 'شارك إنجازك على وسائل التواصل الاجتماعي'
              : 'Share your achievement on social media'} 🎉
          </p>
        </div>
      </div>
    </div>
  );
}
