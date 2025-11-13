'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  X,
  Video,
  Calendar,
  Clock,
  Users,
  Link as LinkIcon,
  AlertCircle,
  Mail,
  Eye,
} from 'lucide-react';

interface CreateSessionModalProps {
  cohortId: string;
  cohortDates: {
    startDate: Date;
    endDate: Date;
  };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  type: 'LIVE_QA' | 'OFFICE_HOURS' | 'GROUP_WORK' | 'GUEST_SPEAKER' | 'REVIEW_SESSION' | 'ORIENTATION' | '';
  scheduledAt: string;
  duration: number;
  meetingUrl: string;
  maxAttendees: number | null;
  isRecorded: boolean;
  notifyMembers: boolean;
}

const SESSION_TYPES = [
  { value: 'LIVE_QA', label: 'Live Q&A', labelAr: 'أسئلة وأجوبة مباشرة', icon: '💬' },
  { value: 'OFFICE_HOURS', label: 'Office Hours', labelAr: 'ساعات مكتبية', icon: '🕐' },
  { value: 'GROUP_WORK', label: 'Group Work', labelAr: 'عمل جماعي', icon: '👥' },
  { value: 'GUEST_SPEAKER', label: 'Guest Speaker', labelAr: 'متحدث ضيف', icon: '🎤' },
  { value: 'REVIEW_SESSION', label: 'Review Session', labelAr: 'جلسة مراجعة', icon: '📚' },
  { value: 'ORIENTATION', label: 'Orientation', labelAr: 'تعريف', icon: '🎯' },
];

export default function CreateSessionModal({
  cohortId,
  cohortDates,
  isOpen,
  onClose,
  onSuccess,
}: CreateSessionModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    title: '',
    titleAr: '',
    description: '',
    descriptionAr: '',
    type: '',
    scheduledAt: '',
    duration: 60,
    meetingUrl: '',
    maxAttendees: null,
    isRecorded: false,
    notifyMembers: true,
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title || formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!formData.type) {
      newErrors.type = 'Session type is required';
    }

    if (!formData.scheduledAt) {
      newErrors.scheduledAt = 'Scheduled date and time is required';
    } else {
      const scheduledDate = new Date(formData.scheduledAt);
      if (scheduledDate <= new Date()) {
        newErrors.scheduledAt = 'Scheduled time must be in the future';
      }
      if (scheduledDate < new Date(cohortDates.startDate) || scheduledDate > new Date(cohortDates.endDate)) {
        newErrors.scheduledAt = 'Session must be within cohort dates';
      }
    }

    if (!formData.duration || formData.duration < 15) {
      newErrors.duration = 'Duration must be at least 15 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);

      const response = await fetch(
        `/api/creator/cohorts/${cohortId}/sessions`,
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
        toast.success(data.message || 'Session created successfully!');
        if (data.notificationsSent > 0) {
          toast.success(
            `Notifications sent to ${data.notificationsSent} members`,
            { duration: 4000 }
          );
        }
        onSuccess();
        handleClose();
      } else {
        toast.error(data.error || 'Failed to create session');
        if (data.error) {
          setErrors({ submit: data.error });
        }
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      titleAr: '',
      description: '',
      descriptionAr: '',
      type: '',
      scheduledAt: '',
      duration: 60,
      meetingUrl: '',
      maxAttendees: null,
      isRecorded: false,
      notifyMembers: true,
    });
    setErrors({});
    setShowPreview(false);
    onClose();
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-white/20 flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
                  <Video className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {showPreview ? 'Preview Session' : 'Schedule Live Session'}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {showPreview
                      ? 'Review session details before scheduling'
                      : 'Create a live session for your cohort members'}
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
                {/* Session Type */}
                <div>
                  <label className="block text-white font-medium mb-3">
                    Session Type *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {SESSION_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, type: type.value as any })
                        }
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          formData.type === type.value
                            ? 'border-blue-500 bg-blue-500/20'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="text-2xl mb-2">{type.icon}</div>
                        <div className="text-white font-semibold text-sm">
                          {type.label}
                        </div>
                        <div className="text-gray-400 text-xs" dir="rtl">
                          {type.labelAr}
                        </div>
                      </button>
                    ))}
                  </div>
                  {errors.type && (
                    <p className="text-red-400 text-sm mt-2">{errors.type}</p>
                  )}
                </div>

                {/* Title */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      placeholder="e.g., Week 3 Q&A Session"
                      className={`w-full px-4 py-3 bg-white/10 border ${
                        errors.title ? 'border-red-500' : 'border-white/20'
                      } rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {errors.title && (
                      <p className="text-red-400 text-sm mt-1">{errors.title}</p>
                    )}
                  </div>

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
                      placeholder="مثال: جلسة أسئلة وأجوبة - الأسبوع 3"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      dir="rtl"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Description (English)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="What will be covered in this session?"
                      rows={4}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      Description (Arabic)
                    </label>
                    <textarea
                      value={formData.descriptionAr}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          descriptionAr: e.target.value,
                        })
                      }
                      placeholder="ما الذي سيتم تغطيته في هذه الجلسة؟"
                      rows={4}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      dir="rtl"
                    />
                  </div>
                </div>

                {/* Schedule & Duration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Scheduled Date & Time *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduledAt}
                      onChange={(e) =>
                        setFormData({ ...formData, scheduledAt: e.target.value })
                      }
                      min={new Date(cohortDates.startDate).toISOString().slice(0, 16)}
                      max={new Date(cohortDates.endDate).toISOString().slice(0, 16)}
                      className={`w-full px-4 py-3 bg-white/10 border ${
                        errors.scheduledAt ? 'border-red-500' : 'border-white/20'
                      } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {errors.scheduledAt && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.scheduledAt}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      Duration (minutes) *
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          duration: parseInt(e.target.value) || 0,
                        })
                      }
                      min={15}
                      step={15}
                      className={`w-full px-4 py-3 bg-white/10 border ${
                        errors.duration ? 'border-red-500' : 'border-white/20'
                      } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {errors.duration && (
                      <p className="text-red-400 text-sm mt-1">
                        {errors.duration}
                      </p>
                    )}
                  </div>
                </div>

                {/* Meeting URL & Max Attendees */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Meeting URL (Zoom, Google Meet, etc.)
                    </label>
                    <input
                      type="url"
                      value={formData.meetingUrl}
                      onChange={(e) =>
                        setFormData({ ...formData, meetingUrl: e.target.value })
                      }
                      placeholder="https://zoom.us/j/..."
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-white font-medium mb-2">
                      Max Attendees (optional)
                    </label>
                    <input
                      type="number"
                      value={formData.maxAttendees || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxAttendees: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      min={1}
                      placeholder="Leave empty for unlimited"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                    <input
                      type="checkbox"
                      id="isRecorded"
                      checked={formData.isRecorded}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isRecorded: e.target.checked,
                        })
                      }
                      className="w-5 h-5 mt-1 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="isRecorded" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Video className="w-4 h-4 text-blue-400" />
                        <p className="text-white font-medium">Record Session</p>
                      </div>
                      <p className="text-sm text-gray-400">
                        Recording will be available to members after the session
                      </p>
                    </label>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                    <input
                      type="checkbox"
                      id="notifyMembers"
                      checked={formData.notifyMembers}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          notifyMembers: e.target.checked,
                        })
                      }
                      className="w-5 h-5 mt-1 rounded border-white/20 bg-white/10 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor="notifyMembers" className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className="w-4 h-4 text-green-400" />
                        <p className="text-white font-medium">Notify Members</p>
                      </div>
                      <p className="text-sm text-gray-400">
                        Send email notification to all active cohort members
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
                {/* Session Card */}
                <div className="bg-white/5 rounded-xl p-6 border border-white/20">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="text-4xl">
                      {SESSION_TYPES.find((t) => t.value === formData.type)?.icon}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm text-blue-400 font-semibold mb-1">
                        {SESSION_TYPES.find((t) => t.value === formData.type)?.label}
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        {formData.title}
                      </h3>
                      {formData.titleAr && (
                        <h3 className="text-xl font-bold text-gray-300" dir="rtl">
                          {formData.titleAr}
                        </h3>
                      )}
                    </div>
                  </div>

                  {(formData.description || formData.descriptionAr) && (
                    <div className="space-y-3 mb-4">
                      {formData.description && (
                        <p className="text-gray-300">{formData.description}</p>
                      )}
                      {formData.descriptionAr && (
                        <p className="text-gray-300 border-t border-white/10 pt-3" dir="rtl">
                          {formData.descriptionAr}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        <p className="text-xs text-gray-400">Scheduled</p>
                      </div>
                      <p className="text-white font-semibold text-sm">
                        {formatDateTime(formData.scheduledAt)}
                      </p>
                    </div>

                    <div className="p-3 bg-purple-500/20 border border-purple-500/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <p className="text-xs text-gray-400">Duration</p>
                      </div>
                      <p className="text-white font-semibold text-sm">
                        {formData.duration} minutes
                      </p>
                    </div>
                  </div>

                  {formData.meetingUrl && (
                    <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <LinkIcon className="w-4 h-4 text-green-400" />
                        <p className="text-xs text-gray-400">Meeting Link</p>
                      </div>
                      <p className="text-white font-mono text-sm truncate">
                        {formData.meetingUrl}
                      </p>
                    </div>
                  )}

                  {formData.maxAttendees && (
                    <div className="mt-4 p-3 bg-orange-500/20 border border-orange-500/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-orange-400" />
                        <p className="text-xs text-gray-400">Max Attendees</p>
                      </div>
                      <p className="text-white font-semibold text-sm">
                        {formData.maxAttendees} members
                      </p>
                    </div>
                  )}
                </div>

                {/* Options Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Video className="w-4 h-4 text-blue-400" />
                      <p className="text-sm text-gray-400">Recording</p>
                    </div>
                    <p className="text-white font-semibold">
                      {formData.isRecorded ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>

                  <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-green-400" />
                      <p className="text-sm text-gray-400">Notifications</p>
                    </div>
                    <p className="text-white font-semibold">
                      {formData.notifyMembers ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>

                {formData.notifyMembers && (
                  <div className="flex items-start gap-3 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-white font-semibold mb-1">
                        Email Notifications Enabled
                      </p>
                      <p className="text-sm text-gray-300">
                        All active cohort members will receive an email with session
                        details and meeting link.
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
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Calendar className="w-5 h-5" />
                      Schedule Session
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
