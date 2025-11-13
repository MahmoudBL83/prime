'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  X,
  MessageSquare,
  Pin,
  Mail,
  AlertCircle,
  Send,
  Eye,
} from 'lucide-react';

interface CreateAnnouncementModalProps {
  cohortId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  title: string;
  titleAr: string;
  content: string;
  contentAr: string;
  isPinned: boolean;
  sendEmail: boolean;
}

export default function CreateAnnouncementModal({
  cohortId,
  isOpen,
  onClose,
  onSuccess,
}: CreateAnnouncementModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    title: '',
    titleAr: '',
    content: '',
    contentAr: '',
    isPinned: false,
    sendEmail: false,
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title || formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!formData.content || formData.content.length < 10) {
      newErrors.content = 'Content must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const response = await fetch(
        `/api/creator/cohorts/${cohortId}/announcements`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Announcement posted successfully!');
        if (data.notificationsSent > 0) {
          toast.success(
            `Email notifications sent to ${data.notificationsSent} members`,
            { duration: 4000 }
          );
        }
        onSuccess();
        handleClose();
      } else {
        toast.error(data.error || 'Failed to post announcement');
        if (data.error) {
          setErrors({ submit: data.error });
        }
      }
    } catch (error) {
      console.error('Error posting announcement:', error);
      toast.error('Failed to post announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      titleAr: '',
      content: '',
      contentAr: '',
      isPinned: false,
      sendEmail: false,
    });
    setErrors({});
    setShowPreview(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border border-white/20 flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {showPreview ? 'Preview Announcement' : 'Post Announcement'}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {showPreview
                      ? 'Review your announcement before posting'
                      : 'Share important updates with cohort members'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {!showPreview ? (
              <div className="space-y-6">
                {/* Title (English) */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    Title (English) *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., Important: Schedule Change for Week 3"
                    className={`w-full px-4 py-3 bg-white/10 border ${
                      errors.title ? 'border-red-500' : 'border-white/20'
                    } rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                  {errors.title && (
                    <p className="text-red-400 text-sm mt-1">{errors.title}</p>
                  )}
                </div>

                {/* Title (Arabic) */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    Title (Arabic)
                  </label>
                  <input
                    type="text"
                    value={formData.titleAr}
                    onChange={(e) =>
                      setFormData({ ...formData, titleAr: e.target.value })
                    }
                    placeholder="مثال: مهم: تغيير جدول الأسبوع الثالث"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    dir="rtl"
                  />
                </div>

                {/* Content (English) */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    Content (English) *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    placeholder="Write your announcement here... You can include details, links, and instructions."
                    rows={6}
                    className={`w-full px-4 py-3 bg-white/10 border ${
                      errors.content ? 'border-red-500' : 'border-white/20'
                    } rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none`}
                  />
                  {errors.content && (
                    <p className="text-red-400 text-sm mt-1">{errors.content}</p>
                  )}
                  <p className="text-sm text-gray-400 mt-1">
                    {formData.content.length} characters
                  </p>
                </div>

                {/* Content (Arabic) */}
                <div>
                  <label className="block text-white font-medium mb-2">
                    Content (Arabic)
                  </label>
                  <textarea
                    value={formData.contentAr}
                    onChange={(e) =>
                      setFormData({ ...formData, contentAr: e.target.value })
                    }
                    placeholder="اكتب إعلانك هنا... يمكنك تضمين التفاصيل والروابط والتعليمات."
                    rows={6}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    dir="rtl"
                  />
                </div>

                {/* Options */}
                <div className="space-y-4">
                  {/* Pin Announcement */}
                  <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                    <input
                      type="checkbox"
                      id="isPinned"
                      checked={formData.isPinned}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isPinned: e.target.checked,
                        })
                      }
                      className="w-5 h-5 mt-1 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-2 focus:ring-purple-500"
                    />
                    <label htmlFor="isPinned" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Pin className="w-4 h-4 text-purple-400" />
                        <p className="text-white font-medium">Pin Announcement</p>
                      </div>
                      <p className="text-sm text-gray-400">
                        Pinned announcements appear at the top of the list
                      </p>
                    </label>
                  </div>

                  {/* Send Email */}
                  <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                    <input
                      type="checkbox"
                      id="sendEmail"
                      checked={formData.sendEmail}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sendEmail: e.target.checked,
                        })
                      }
                      className="w-5 h-5 mt-1 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-2 focus:ring-purple-500"
                    />
                    <label htmlFor="sendEmail" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-4 h-4 text-blue-400" />
                        <p className="text-white font-medium">
                          Send Email Notification
                        </p>
                      </div>
                      <p className="text-sm text-gray-400">
                        All active cohort members will receive an email notification
                      </p>
                    </label>
                  </div>
                </div>

                {errors.submit && (
                  <div className="flex items-center gap-2 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p>{errors.submit}</p>
                  </div>
                )}
              </div>
            ) : (
              /* Preview Mode */
              <div className="space-y-6">
                {/* Preview Card */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/20">
                  {formData.isPinned && (
                    <div className="flex items-center gap-2 text-purple-400 text-sm mb-3">
                      <Pin className="w-4 h-4" />
                      <span className="font-semibold">PINNED</span>
                    </div>
                  )}
                  
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {formData.title}
                  </h3>
                  
                  {formData.titleAr && (
                    <h3 className="text-xl font-bold text-gray-300 mb-4" dir="rtl">
                      {formData.titleAr}
                    </h3>
                  )}
                  
                  <div className="prose prose-invert max-w-none">
                    <p className="text-gray-300 whitespace-pre-wrap mb-4">
                      {formData.content}
                    </p>
                    
                    {formData.contentAr && (
                      <p
                        className="text-gray-300 whitespace-pre-wrap border-t border-white/10 pt-4"
                        dir="rtl"
                      >
                        {formData.contentAr}
                      </p>
                    )}
                  </div>
                </div>

                {/* Preview Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-blue-400" />
                      <p className="text-sm text-gray-400">Email Notification</p>
                    </div>
                    <p className="text-white font-semibold">
                      {formData.sendEmail ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>

                  <div className="p-4 bg-purple-500/20 border border-purple-500/50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Pin className="w-4 h-4 text-purple-400" />
                      <p className="text-sm text-gray-400">Pin Status</p>
                    </div>
                    <p className="text-white font-semibold">
                      {formData.isPinned ? 'Pinned' : 'Not Pinned'}
                    </p>
                  </div>
                </div>

                {formData.sendEmail && (
                  <div className="flex items-start gap-3 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-semibold mb-1">
                        Email Notification Enabled
                      </p>
                      <p className="text-sm text-gray-300">
                        All active cohort members will receive an email with this
                        announcement. Make sure your message is clear and professional.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/20 flex items-center justify-between">
            {!showPreview ? (
              <>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (validateForm()) {
                      setShowPreview(true);
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
                >
                  <Eye className="w-5 h-5" />
                  Preview
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Post Announcement
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
