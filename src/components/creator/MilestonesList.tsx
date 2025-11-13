'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Calendar,
  Award,
  FileText,
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  Edit,
  ExternalLink,
  Target,
} from 'lucide-react';
import toast from 'react-hot-toast';
import CreateMilestoneModal from './CreateMilestoneModal';

interface Milestone {
  id: string;
  title: string;
  description: string;
  type: string;
  dueDate: string;
  points: number;
  attachmentUrl: string | null;
  submissionRequired: boolean;
  isCompleted: boolean;
  completedCount: number;
  completionPercentage: number;
  isOverdue: boolean;
  isUpcoming: boolean;
  activeMembersCount: number;
}

interface MilestoneStats {
  total: number;
  completed: number;
  overdue: number;
  upcoming: number;
}

interface MilestonesListProps {
  cohortId: string;
  cohortDates: {
    startDate: Date;
    endDate: Date;
  };
}

const milestoneTypeConfig: Record<string, { icon: any; color: string; label: string }> = {
  ASSIGNMENT: { icon: FileText, color: 'from-blue-500 to-indigo-500', label: 'Assignment' },
  QUIZ: { icon: AlertCircle, color: 'from-purple-500 to-pink-500', label: 'Quiz' },
  CAPSTONE: { icon: Award, color: 'from-yellow-500 to-orange-500', label: 'Capstone' },
  PEER_REVIEW: { icon: FileText, color: 'from-green-500 to-emerald-500', label: 'Peer Review' },
  READING: { icon: FileText, color: 'from-cyan-500 to-blue-500', label: 'Reading' },
  PROJECT_PHASE: { icon: Award, color: 'from-indigo-500 to-purple-500', label: 'Project Phase' },
  DEADLINE: { icon: Calendar, color: 'from-red-500 to-orange-500', label: 'Deadline' },
};

const MilestonesList: React.FC<MilestonesListProps> = ({ cohortId, cohortDates }) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [stats, setStats] = useState<MilestoneStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'overdue' | 'completed'>('all');

  useEffect(() => {
    fetchMilestones();
  }, [cohortId]);

  const fetchMilestones = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/creator/cohorts/${cohortId}/milestones`);
      const data = await response.json();

      if (response.ok) {
        setMilestones(data.milestones);
        setStats({
          total: data.total,
          completed: data.completed,
          overdue: data.overdue,
          upcoming: data.upcoming,
        });
      } else {
        toast.error(data.error || 'Failed to fetch milestones');
      }
    } catch (error) {
      console.error('Error fetching milestones:', error);
      toast.error('Failed to load milestones');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (milestoneId: string) => {
    if (!confirm('Are you sure you want to delete this milestone?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/creator/cohorts/${cohortId}/milestones/${milestoneId}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success('Milestone deleted successfully');
        fetchMilestones();
      } else {
        toast.error(data.error || 'Failed to delete milestone');
      }
    } catch (error) {
      console.error('Error deleting milestone:', error);
      toast.error('Failed to delete milestone');
    }
  };

  const handleToggleComplete = async (milestone: Milestone) => {
    try {
      const response = await fetch(
        `/api/creator/cohorts/${cohortId}/milestones/${milestone.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isCompleted: !milestone.isCompleted }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(
          milestone.isCompleted ? 'Milestone marked as incomplete' : 'Milestone marked as complete'
        );
        fetchMilestones();
      } else {
        toast.error(data.error || 'Failed to update milestone');
      }
    } catch (error) {
      console.error('Error updating milestone:', error);
      toast.error('Failed to update milestone');
    }
  };

  const filteredMilestones = milestones.filter((milestone) => {
    if (filter === 'all') return true;
    if (filter === 'upcoming') return milestone.isUpcoming;
    if (filter === 'overdue') return milestone.isOverdue;
    if (filter === 'completed') return milestone.isCompleted;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-white" />
              <div>
                <p className="text-sm text-purple-100">Total</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-white" />
              <div>
                <p className="text-sm text-blue-100">Upcoming</p>
                <p className="text-2xl font-bold text-white">{stats.upcoming}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-red-500 to-orange-500 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-white" />
              <div>
                <p className="text-sm text-red-100">Overdue</p>
                <p className="text-2xl font-bold text-white">{stats.overdue}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-4"
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-white" />
              <div>
                <p className="text-sm text-green-100">Completed</p>
                <p className="text-2xl font-bold text-white">{stats.completed}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Actions Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Filters */}
        <div className="flex items-center gap-2">
          {[
            { value: 'all', label: 'All' },
            { value: 'upcoming', label: 'Upcoming' },
            { value: 'overdue', label: 'Overdue' },
            { value: 'completed', label: 'Completed' },
          ].map((filterOption) => (
            <button
              key={filterOption.value}
              onClick={() => setFilter(filterOption.value as any)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === filterOption.value
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>

        {/* Create Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-semibold transition-all"
        >
          <Plus className="w-5 h-5" />
          Create Milestone
        </button>
      </div>

      {/* Milestones List */}
      {filteredMilestones.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
          <Target className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            {filter === 'all' ? 'No milestones yet' : `No ${filter} milestones`}
          </h3>
          <p className="text-gray-400 mb-6">
            {filter === 'all'
              ? 'Create your first milestone to track deadlines and assignments'
              : `There are no ${filter} milestones at the moment`}
          </p>
          {filter === 'all' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all"
            >
              Create First Milestone
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMilestones.map((milestone, index) => {
            const config = milestoneTypeConfig[milestone.type] || milestoneTypeConfig.ASSIGNMENT;
            const Icon = config.icon;
            const dueDate = new Date(milestone.dueDate);
            const now = new Date();
            const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white/5 backdrop-blur-lg rounded-xl border transition-all hover:bg-white/10 ${
                  milestone.isCompleted
                    ? 'border-green-500/30'
                    : milestone.isOverdue
                    ? 'border-red-500/30'
                    : 'border-white/10'
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Icon and Info */}
                    <div className="flex items-start gap-4 flex-1">
                      {/* Type Icon */}
                      <div className={`p-3 bg-gradient-to-r ${config.color} rounded-xl shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-white">{milestone.title}</h3>
                          <span className="px-2 py-1 bg-white/10 rounded-full text-xs font-medium text-gray-300">
                            {config.label}
                          </span>
                          {milestone.submissionRequired && (
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">
                              Submission Required
                            </span>
                          )}
                        </div>

                        {milestone.description && (
                          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                            {milestone.description}
                          </p>
                        )}

                        {/* Meta Info */}
                        <div className="flex items-center gap-4 flex-wrap text-sm">
                          {/* Due Date */}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">
                              {dueDate.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </span>
                            {!milestone.isCompleted && (
                              <span
                                className={`${
                                  milestone.isOverdue
                                    ? 'text-red-400'
                                    : daysUntilDue <= 3
                                    ? 'text-orange-400'
                                    : 'text-gray-400'
                                }`}
                              >
                                {milestone.isOverdue
                                  ? `${Math.abs(daysUntilDue)}d overdue`
                                  : daysUntilDue === 0
                                  ? 'Due today'
                                  : daysUntilDue === 1
                                  ? 'Due tomorrow'
                                  : `${daysUntilDue}d remaining`}
                              </span>
                            )}
                          </div>

                          {/* Points */}
                          {milestone.points > 0 && (
                            <div className="flex items-center gap-2">
                              <Award className="w-4 h-4 text-yellow-400" />
                              <span className="text-gray-300">{milestone.points} pts</span>
                            </div>
                          )}

                          {/* Completion */}
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">
                              {milestone.completedCount}/{milestone.activeMembersCount} completed (
                              {milestone.completionPercentage}%)
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${
                                milestone.isCompleted
                                  ? 'from-green-500 to-emerald-500'
                                  : 'from-purple-500 to-pink-500'
                              } transition-all duration-500`}
                              style={{ width: `${milestone.completionPercentage}%` }}
                            />
                          </div>
                        </div>

                        {/* Attachment */}
                        {milestone.attachmentUrl && (
                          <a
                            href={milestone.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View Attachment
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Complete Toggle */}
                      <button
                        onClick={() => handleToggleComplete(milestone)}
                        className={`p-2 rounded-lg transition-all ${
                          milestone.isCompleted
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                        }`}
                        title={milestone.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(milestone.id)}
                        className="p-2 bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-all"
                        title="Delete milestone"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateMilestoneModal
          cohortId={cohortId}
          cohortDates={cohortDates}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchMilestones}
        />
      )}
    </div>
  );
};

export default MilestonesList;
