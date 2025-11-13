'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Calendar, Award, FileText, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface CreateMilestoneModalProps {
  cohortId: string;
  cohortDates: {
    startDate: Date;
    endDate: Date;
  };
  onClose: () => void;
  onSuccess: () => void;
}

const milestoneTypes = [
  { value: 'ASSIGNMENT', label: 'Assignment', icon: FileText, color: 'from-blue-500 to-indigo-500' },
  { value: 'QUIZ', label: 'Quiz', icon: AlertCircle, color: 'from-purple-500 to-pink-500' },
  { value: 'CAPSTONE', label: 'Capstone Project', icon: Award, color: 'from-yellow-500 to-orange-500' },
  { value: 'PEER_REVIEW', label: 'Peer Review', icon: FileText, color: 'from-green-500 to-emerald-500' },
  { value: 'READING', label: 'Reading', icon: FileText, color: 'from-cyan-500 to-blue-500' },
  { value: 'PROJECT_PHASE', label: 'Project Phase', icon: Award, color: 'from-indigo-500 to-purple-500' },
  { value: 'DEADLINE', label: 'Deadline', icon: Calendar, color: 'from-red-500 to-orange-500' },
];

const CreateMilestoneModal: React.FC<CreateMilestoneModalProps> = ({
  cohortId,
  cohortDates,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'ASSIGNMENT',
    dueDate: '',
    points: 0,
    attachmentUrl: '',
    submissionRequired: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.type || !formData.dueDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate due date is within cohort timeline
    const dueDate = new Date(formData.dueDate);
    const startDate = new Date(cohortDates.startDate);
    const endDate = new Date(cohortDates.endDate);

    if (dueDate < startDate || dueDate > endDate) {
      toast.error(`Due date must be between ${startDate.toLocaleDateString()} and ${endDate.toLocaleDateString()}`);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/creator/cohorts/${cohortId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Milestone created successfully');
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Failed to create milestone');
      }
    } catch (error) {
      console.error('Error creating milestone:', error);
      toast.error('Failed to create milestone');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = milestoneTypes.find(t => t.value === formData.type);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-white/10 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between border-b border-white/10 z-10">
          <div>
            <h2 className="text-2xl font-bold text-white">Create Milestone</h2>
            <p className="text-purple-100 text-sm mt-1">Add a new deadline or assignment</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Milestone Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Milestone Type *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {milestoneTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: type.value })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      formData.type === type.value
                        ? `bg-gradient-to-r ${type.color} border-transparent text-white`
                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto mb-2" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Submit Final Project"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide details about this milestone..."
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {/* Due Date and Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Due Date */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Due Date *
              </label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  min={new Date(cohortDates.startDate).toISOString().slice(0, 16)}
                  max={new Date(cohortDates.endDate).toISOString().slice(0, 16)}
                  className="w-full px-4 py-3 pl-10 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Between {new Date(cohortDates.startDate).toLocaleDateString()} and{' '}
                {new Date(cohortDates.endDate).toLocaleDateString()}
              </p>
            </div>

            {/* Points */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Points
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-3 pl-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Attachment URL */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Attachment URL (Optional)
            </label>
            <div className="relative">
              <input
                type="url"
                value={formData.attachmentUrl}
                onChange={(e) => setFormData({ ...formData, attachmentUrl: e.target.value })}
                placeholder="https://example.com/assignment.pdf"
                className="w-full px-4 py-3 pl-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <Upload className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Link to assignment file, rubric, or resources
            </p>
          </div>

          {/* Submission Required */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <div>
              <p className="text-white font-medium">Requires Submission</p>
              <p className="text-sm text-gray-400">Students must submit work for this milestone</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, submissionRequired: !formData.submissionRequired })}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                formData.submissionRequired ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-transform ${
                  formData.submissionRequired ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-colors border border-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Milestone'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateMilestoneModal;
