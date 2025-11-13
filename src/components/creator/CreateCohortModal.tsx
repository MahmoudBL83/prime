'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  BookOpen,
  Calendar,
  Users,
  DollarSign,
  Settings,
  AlertCircle,
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  titleAr: string | null;
  thumbnail: string | null;
  category: string;
}

interface CreateCohortModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  courseId: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  startDate: string;
  endDate: string;
  maxMembers: string;
  price: string;
  currency: string;
  timezone: string;
  applicationRequired: boolean;
  prerequisites: string;
}

const steps = [
  { id: 1, name: 'Course Selection', icon: BookOpen },
  { id: 2, name: 'Basic Info', icon: Settings },
  { id: 3, name: 'Schedule', icon: Calendar },
  { id: 4, name: 'Capacity & Pricing', icon: Users },
];

export default function CreateCohortModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateCohortModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<FormData>({
    courseId: '',
    name: '',
    nameAr: '',
    description: '',
    descriptionAr: '',
    startDate: '',
    endDate: '',
    maxMembers: '',
    price: '',
    currency: 'EGP',
    timezone: 'Africa/Cairo',
    applicationRequired: false,
    prerequisites: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchCourses();
    }
  }, [isOpen]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/creator/courses');
      const data = await response.json();

      if (response.ok) {
        setCourses(data.courses || []);
      } else {
        toast.error('Failed to load courses');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.courseId) {
          newErrors.courseId = 'Please select a course';
        }
        break;

      case 2:
        if (!formData.name || formData.name.length < 5) {
          newErrors.name = 'Cohort name must be at least 5 characters';
        }
        if (!formData.description || formData.description.length < 20) {
          newErrors.description = 'Description must be at least 20 characters';
        }
        break;

      case 3:
        if (!formData.startDate) {
          newErrors.startDate = 'Start date is required';
        }
        if (!formData.endDate) {
          newErrors.endDate = 'End date is required';
        }
        if (formData.startDate && formData.endDate) {
          const start = new Date(formData.startDate);
          const end = new Date(formData.endDate);
          const now = new Date();

          if (start < now) {
            newErrors.startDate = 'Start date must be in the future';
          }
          if (end <= start) {
            newErrors.endDate = 'End date must be after start date';
          }
        }
        break;

      case 4:
        if (formData.maxMembers && parseInt(formData.maxMembers) < 1) {
          newErrors.maxMembers = 'Maximum members must be at least 1';
        }
        if (formData.price && parseFloat(formData.price) < 0) {
          newErrors.price = 'Price cannot be negative';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      setSubmitting(true);

      const payload = {
        ...formData,
        maxMembers: formData.maxMembers ? parseInt(formData.maxMembers) : null,
        price: formData.price ? parseFloat(formData.price) : null,
      };

      const response = await fetch('/api/creator/cohorts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Cohort created successfully!');
        onSuccess();
        handleClose();
      } else {
        toast.error(data.error || 'Failed to create cohort');
        if (data.error) {
          setErrors({ submit: data.error });
        }
      }
    } catch (error) {
      console.error('Error creating cohort:', error);
      toast.error('Failed to create cohort');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData({
      courseId: '',
      name: '',
      nameAr: '',
      description: '',
      descriptionAr: '',
      startDate: '',
      endDate: '',
      maxMembers: '',
      price: '',
      currency: 'EGP',
      timezone: 'Africa/Cairo',
      applicationRequired: false,
      prerequisites: '',
    });
    setErrors({});
    onClose();
  };

  const selectedCourse = courses.find((c) => c.id === formData.courseId);

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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-3xl font-bold text-white">Create New Cohort</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        currentStep > step.id
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : currentStep === step.id
                          ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                          : 'bg-white/10'
                      }`}
                    >
                      {currentStep > step.id ? (
                        <Check className="w-5 h-5 text-white" />
                      ) : (
                        <step.icon className="w-5 h-5 text-white" />
                      )}
                    </div>
                    <div className="hidden md:block">
                      <p
                        className={`text-sm font-medium ${
                          currentStep >= step.id ? 'text-white' : 'text-gray-400'
                        }`}
                      >
                        {step.name}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-2 rounded-full transition-all ${
                        currentStep > step.id
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : 'bg-white/10'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Course Selection */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">
                      Select a Course
                    </h3>
                    <p className="text-gray-400">
                      Choose which course this cohort will be for
                    </p>
                  </div>

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-gray-400">Loading courses...</p>
                    </div>
                  ) : courses.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-300 mb-2">No courses found</p>
                      <p className="text-sm text-gray-400">
                        Create a course first before creating a cohort
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {courses.map((course) => (
                        <button
                          key={course.id}
                          onClick={() =>
                            setFormData({ ...formData, courseId: course.id })
                          }
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            formData.courseId === course.id
                              ? 'border-purple-500 bg-purple-500/20'
                              : 'border-white/20 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {course.thumbnail ? (
                              <img
                                src={course.thumbnail}
                                alt={course.title}
                                className="w-16 h-16 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                                <BookOpen className="w-8 h-8 text-white" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-white mb-1 line-clamp-2">
                                {course.title}
                              </h4>
                              <p className="text-sm text-gray-400">
                                {course.category}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {errors.courseId && (
                    <div className="flex items-center gap-2 text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      {errors.courseId}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Step 2: Basic Info */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">
                      Basic Information
                    </h3>
                    <p className="text-gray-400">
                      Give your cohort a name and description
                    </p>
                  </div>

                  {/* Selected Course Display */}
                  {selectedCourse && (
                    <div className="p-4 bg-purple-500/20 border border-purple-500/50 rounded-xl">
                      <p className="text-sm text-gray-400 mb-1">Selected Course</p>
                      <p className="text-white font-semibold">{selectedCourse.title}</p>
                    </div>
                  )}

                  {/* Cohort Name */}
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Cohort Name (English) *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="e.g., Spring 2025 Cohort"
                      className={`w-full px-4 py-3 bg-white/10 border ${
                        errors.name ? 'border-red-500' : 'border-white/20'
                      } rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                    {errors.name && (
                      <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                    )}
                  </div>

                  {/* Cohort Name Arabic */}
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Cohort Name (Arabic)
                    </label>
                    <input
                      type="text"
                      value={formData.nameAr}
                      onChange={(e) =>
                        setFormData({ ...formData, nameAr: e.target.value })
                      }
                      placeholder="مثال: مجموعة ربيع 2025"
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      dir="rtl"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Description (English) *
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Describe what makes this cohort special..."
                      rows={4}
                      className={`w-full px-4 py-3 bg-white/10 border ${
                        errors.description ? 'border-red-500' : 'border-white/20'
                      } rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none`}
                    />
                    {errors.description && (
                      <p className="text-red-400 text-sm mt-1">{errors.description}</p>
                    )}
                  </div>

                  {/* Description Arabic */}
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Description (Arabic)
                    </label>
                    <textarea
                      value={formData.descriptionAr}
                      onChange={(e) =>
                        setFormData({ ...formData, descriptionAr: e.target.value })
                      }
                      placeholder="صف ما يميز هذه المجموعة..."
                      rows={4}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      dir="rtl"
                    />
                  </div>
                </motion.div>
              )}

              {/* Step 3: Schedule */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">
                      Schedule & Timeline
                    </h3>
                    <p className="text-gray-400">
                      Set the start and end dates for this cohort
                    </p>
                  </div>

                  {/* Start Date */}
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Start Date *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className={`w-full px-4 py-3 bg-white/10 border ${
                        errors.startDate ? 'border-red-500' : 'border-white/20'
                      } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                    {errors.startDate && (
                      <p className="text-red-400 text-sm mt-1">{errors.startDate}</p>
                    )}
                  </div>

                  {/* End Date */}
                  <div>
                    <label className="block text-white font-medium mb-2">
                      End Date *
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className={`w-full px-4 py-3 bg-white/10 border ${
                        errors.endDate ? 'border-red-500' : 'border-white/20'
                      } rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                    {errors.endDate && (
                      <p className="text-red-400 text-sm mt-1">{errors.endDate}</p>
                    )}
                  </div>

                  {/* Duration Display */}
                  {formData.startDate && formData.endDate && (
                    <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-xl">
                      <p className="text-sm text-gray-400 mb-1">Duration</p>
                      <p className="text-white font-semibold">
                        {Math.ceil(
                          (new Date(formData.endDate).getTime() -
                            new Date(formData.startDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{' '}
                        days
                      </p>
                    </div>
                  )}

                  {/* Timezone */}
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Timezone
                    </label>
                    <select
                      value={formData.timezone}
                      onChange={(e) =>
                        setFormData({ ...formData, timezone: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="Africa/Cairo">Cairo (GMT+2)</option>
                      <option value="Asia/Dubai">Dubai (GMT+4)</option>
                      <option value="Asia/Riyadh">Riyadh (GMT+3)</option>
                      <option value="Europe/London">London (GMT+0)</option>
                      <option value="America/New_York">New York (GMT-5)</option>
                    </select>
                  </div>
                </motion.div>
              )}

              {/* Step 4: Capacity & Pricing */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-white mb-2">
                      Capacity & Pricing
                    </h3>
                    <p className="text-gray-400">
                      Set enrollment limits and pricing options
                    </p>
                  </div>

                  {/* Max Members */}
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Maximum Members
                    </label>
                    <input
                      type="number"
                      value={formData.maxMembers}
                      onChange={(e) =>
                        setFormData({ ...formData, maxMembers: e.target.value })
                      }
                      placeholder="Leave empty for unlimited"
                      min="1"
                      className={`w-full px-4 py-3 bg-white/10 border ${
                        errors.maxMembers ? 'border-red-500' : 'border-white/20'
                      } rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                    />
                    {errors.maxMembers && (
                      <p className="text-red-400 text-sm mt-1">{errors.maxMembers}</p>
                    )}
                    <p className="text-sm text-gray-400 mt-1">
                      Limited seats create urgency and exclusivity
                    </p>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Cohort Price (Optional)
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className={`flex-1 px-4 py-3 bg-white/10 border ${
                          errors.price ? 'border-red-500' : 'border-white/20'
                        } rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500`}
                      />
                      <select
                        value={formData.currency}
                        onChange={(e) =>
                          setFormData({ ...formData, currency: e.target.value })
                        }
                        className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="EGP">EGP</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="SAR">SAR</option>
                        <option value="AED">AED</option>
                      </select>
                    </div>
                    {errors.price && (
                      <p className="text-red-400 text-sm mt-1">{errors.price}</p>
                    )}
                    <p className="text-sm text-gray-400 mt-1">
                      Leave empty for free cohorts
                    </p>
                  </div>

                  {/* Application Required */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="applicationRequired"
                      checked={formData.applicationRequired}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          applicationRequired: e.target.checked,
                        })
                      }
                      className="w-5 h-5 mt-1 rounded border-white/20 bg-white/10 text-purple-600 focus:ring-2 focus:ring-purple-500"
                    />
                    <label htmlFor="applicationRequired" className="flex-1">
                      <p className="text-white font-medium mb-1">
                        Require Application
                      </p>
                      <p className="text-sm text-gray-400">
                        Students must apply and be approved before joining this cohort
                      </p>
                    </label>
                  </div>

                  {/* Prerequisites */}
                  <div>
                    <label className="block text-white font-medium mb-2">
                      Prerequisites (Optional)
                    </label>
                    <textarea
                      value={formData.prerequisites}
                      onChange={(e) =>
                        setFormData({ ...formData, prerequisites: e.target.value })
                      }
                      placeholder="e.g., Basic HTML, CSS, JavaScript knowledge"
                      rows={3}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    />
                    <p className="text-sm text-gray-400 mt-1">
                      List any skills or courses students should have before joining
                    </p>
                  </div>

                  {/* Summary */}
                  <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-xl space-y-2">
                    <h4 className="text-white font-semibold mb-3">Summary</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400">Course</p>
                        <p className="text-white font-medium">
                          {selectedCourse?.title}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Duration</p>
                        <p className="text-white font-medium">
                          {formData.startDate && formData.endDate
                            ? `${Math.ceil(
                                (new Date(formData.endDate).getTime() -
                                  new Date(formData.startDate).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )} days`
                            : 'Not set'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Capacity</p>
                        <p className="text-white font-medium">
                          {formData.maxMembers || 'Unlimited'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Price</p>
                        <p className="text-white font-medium">
                          {formData.price
                            ? `${formData.price} ${formData.currency}`
                            : 'Free'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {errors.submit && (
                    <div className="flex items-center gap-2 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <p>{errors.submit}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-white/20 flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                currentStep === 1
                  ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
              Previous
            </button>

            {currentStep < steps.length ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
              >
                Next
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Create Cohort
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
