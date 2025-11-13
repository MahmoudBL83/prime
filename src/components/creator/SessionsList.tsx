'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Video,
  Calendar,
  Clock,
  Users,
  Link as LinkIcon,
  Trash2,
  Edit,
  MoreVertical,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import CreateSessionModal from './CreateSessionModal';

interface Session {
  id: string;
  title: string;
  titleAr: string | null;
  description: string | null;
  descriptionAr: string | null;
  type: string;
  scheduledAt: string;
  duration: number;
  meetingUrl: string | null;
  maxAttendees: number | null;
  isRecorded: boolean;
  status: 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  recordingUrl: string | null;
  actualDuration: number | null;
  attendedCount: number;
  totalRegistered: number;
  attendanceRate: number;
}

interface SessionsListProps {
  cohortId: string;
  cohortDates: {
    startDate: Date;
    endDate: Date;
  };
}

const SESSION_TYPE_CONFIG: Record<string, { label: string; labelAr: string; icon: string; color: string }> = {
  LIVE_QA: { label: 'Live Q&A', labelAr: 'أسئلة وأجوبة', icon: '💬', color: 'blue' },
  OFFICE_HOURS: { label: 'Office Hours', labelAr: 'ساعات مكتبية', icon: '🕐', color: 'purple' },
  GROUP_WORK: { label: 'Group Work', labelAr: 'عمل جماعي', icon: '👥', color: 'green' },
  GUEST_SPEAKER: { label: 'Guest Speaker', labelAr: 'متحدث ضيف', icon: '🎤', color: 'pink' },
  REVIEW_SESSION: { label: 'Review Session', labelAr: 'جلسة مراجعة', icon: '📚', color: 'orange' },
  ORIENTATION: { label: 'Orientation', labelAr: 'تعريف', icon: '🎯', color: 'indigo' },
};

const STATUS_CONFIG = {
  SCHEDULED: { label: 'Scheduled', color: 'blue', icon: Calendar },
  LIVE: { label: 'Live Now', color: 'red', icon: Play },
  COMPLETED: { label: 'Completed', color: 'green', icon: CheckCircle },
  CANCELLED: { label: 'Cancelled', color: 'gray', icon: XCircle },
};

export default function SessionsList({ cohortId, cohortDates }: SessionsListProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (filterStatus !== 'all') params.append('status', filterStatus);

      const response = await fetch(
        `/api/creator/cohorts/${cohortId}/sessions?${params.toString()}`
      );
      const data = await response.json();

      if (response.ok) {
        setSessions(data.sessions || []);
      } else {
        toast.error(data.error || 'Failed to load sessions');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [cohortId, filterType, filterStatus]);

  const handleDelete = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      setDeletingId(sessionId);
      const response = await fetch(
        `/api/creator/cohorts/${cohortId}/sessions/${sessionId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Session deleted');
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      } else {
        toast.error(data.error || 'Failed to delete session');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    } finally {
      setDeletingId(null);
      setActiveMenu(null);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    return STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.color || 'gray';
  };

  const getTypeConfig = (type: string) => {
    return SESSION_TYPE_CONFIG[type] || { label: type, labelAr: type, icon: '📝', color: 'gray' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Live Sessions</h2>
          <p className="text-gray-400 mt-1">
            {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Types</option>
            {Object.entries(SESSION_TYPE_CONFIG).map(([value, config]) => (
              <option key={value} value={value}>
                {config.icon} {config.label}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="LIVE">Live</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            New Session
          </button>
        </div>
      </div>

      {/* Empty State */}
      {sessions.length === 0 && (
        <div className="bg-white/5 rounded-xl p-12 text-center border border-white/10">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Video className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Sessions Yet</h3>
          <p className="text-gray-400 mb-6">
            Schedule your first live session to engage with cohort members
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Schedule Session
          </button>
        </div>
      )}

      {/* Sessions List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {sessions.map((session, index) => {
          const typeConfig = getTypeConfig(session.type);
          const StatusIcon = STATUS_CONFIG[session.status]?.icon || Calendar;
          const statusColor = getStatusColor(session.status);

          return (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white/5 rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-all relative group`}
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <div
                  className={`flex items-center gap-1 px-3 py-1 bg-${statusColor}-600 rounded-full text-xs font-semibold text-white`}
                >
                  <StatusIcon className="w-3 h-3" />
                  {STATUS_CONFIG[session.status]?.label}
                </div>

                {/* Menu Button */}
                <button
                  onClick={() =>
                    setActiveMenu(activeMenu === session.id ? null : session.id)
                  }
                  className="p-2 hover:bg-white/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <MoreVertical className="w-4 h-4 text-gray-400" />
                </button>

                {/* Dropdown Menu */}
                {activeMenu === session.id && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-white/20 rounded-xl shadow-xl z-10">
                    <button
                      onClick={() => handleDelete(session.id)}
                      disabled={deletingId === session.id}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/20 transition-all text-left rounded-xl"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 text-sm">
                        {deletingId === session.id ? 'Deleting...' : 'Delete'}
                      </span>
                    </button>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="pr-24">
                {/* Type Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{typeConfig.icon}</span>
                  <span className={`text-xs font-semibold text-${typeConfig.color}-400`}>
                    {typeConfig.label}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2">
                  {session.title}
                </h3>

                {session.titleAr && (
                  <h3 className="text-lg font-bold text-gray-300 mb-3" dir="rtl">
                    {session.titleAr}
                  </h3>
                )}

                {session.description && (
                  <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                    {session.description}
                  </p>
                )}

                {/* Meta Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDateTime(session.scheduledAt)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{session.duration} minutes</span>
                  </div>

                  {session.attendedCount > 0 && (
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Users className="w-4 h-4" />
                      <span>
                        {session.attendedCount} attended ({session.attendanceRate}%)
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {session.meetingUrl && session.status !== 'COMPLETED' && (
                    <a
                      href={session.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
                    >
                      <LinkIcon className="w-4 h-4" />
                      Join Meeting
                    </a>
                  )}

                  {session.isRecorded && (
                    <div className="flex items-center gap-1 px-3 py-2 bg-red-500/20 border border-red-500/50 rounded-lg text-xs">
                      <Video className="w-3 h-3 text-red-400" />
                      <span className="text-red-400 font-semibold">Recording</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Create Modal */}
      <CreateSessionModal
        cohortId={cohortId}
        cohortDates={cohortDates}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchSessions}
      />
    </div>
  );
}
