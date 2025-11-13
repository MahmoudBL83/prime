'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Pin,
  Trash2,
  Edit,
  MoreVertical,
  Mail,
  AlertCircle,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import CreateAnnouncementModal from './CreateAnnouncementModal';

interface Announcement {
  id: string;
  title: string;
  titleAr: string | null;
  content: string;
  contentAr: string | null;
  isPinned: boolean;
  createdAt: string;
  createdBy: string;
  creator?: {
    name: string | null;
  };
}

interface AnnouncementsListProps {
  cohortId: string;
}

export default function AnnouncementsList({ cohortId }: AnnouncementsListProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/creator/cohorts/${cohortId}/announcements`);
      const data = await response.json();

      if (response.ok) {
        setAnnouncements(data.announcements || []);
      } else {
        toast.error(data.error || 'Failed to load announcements');
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [cohortId]);

  const handleDelete = async (announcementId: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      setDeletingId(announcementId);
      const response = await fetch(
        `/api/creator/cohorts/${cohortId}/announcements/${announcementId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || 'Announcement deleted');
        setAnnouncements((prev) => prev.filter((a) => a.id !== announcementId));
      } else {
        toast.error(data.error || 'Failed to delete announcement');
      }
    } catch (error) {
      console.error('Error deleting announcement:', error);
      toast.error('Failed to delete announcement');
    } finally {
      setDeletingId(null);
      setActiveMenu(null);
    }
  };

  const handleTogglePin = async (announcementId: string, currentPinned: boolean) => {
    try {
      const response = await fetch(
        `/api/creator/cohorts/${cohortId}/announcements/${announcementId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isPinned: !currentPinned,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(
          !currentPinned
            ? 'Announcement pinned'
            : 'Announcement unpinned'
        );
        setAnnouncements((prev) =>
          prev.map((a) =>
            a.id === announcementId
              ? { ...a, isPinned: !currentPinned }
              : a
          )
        );
      } else {
        toast.error(data.error || 'Failed to update announcement');
      }
    } catch (error) {
      console.error('Error updating announcement:', error);
      toast.error('Failed to update announcement');
    } finally {
      setActiveMenu(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Announcements</h2>
          <p className="text-gray-400 mt-1">
            {announcements.length} {announcements.length === 1 ? 'announcement' : 'announcements'}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          New Announcement
        </button>
      </div>

      {/* Empty State */}
      {announcements.length === 0 && (
        <div className="bg-white/5 rounded-xl p-12 text-center border border-white/10">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Announcements Yet</h3>
          <p className="text-gray-400 mb-6">
            Post your first announcement to communicate with cohort members
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Post Announcement
          </button>
        </div>
      )}

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((announcement, index) => (
          <motion.div
            key={announcement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`bg-white/5 rounded-xl p-6 border ${
              announcement.isPinned
                ? 'border-purple-500/50 bg-purple-500/10'
                : 'border-white/10'
            } hover:bg-white/10 transition-all relative`}
          >
            {/* Pin Badge */}
            {announcement.isPinned && (
              <div className="absolute top-4 right-4">
                <div className="flex items-center gap-1 px-3 py-1 bg-purple-600 rounded-full text-xs font-semibold text-white">
                  <Pin className="w-3 h-3" />
                  PINNED
                </div>
              </div>
            )}

            {/* Menu Button */}
            <div className="absolute top-4 right-4">
              <button
                onClick={() =>
                  setActiveMenu(activeMenu === announcement.id ? null : announcement.id)
                }
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>

              {/* Dropdown Menu */}
              {activeMenu === announcement.id && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-white/20 rounded-xl shadow-xl z-10">
                  <button
                    onClick={() =>
                      handleTogglePin(announcement.id, announcement.isPinned)
                    }
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-all text-left"
                  >
                    <Pin className="w-4 h-4 text-purple-400" />
                    <span className="text-white text-sm">
                      {announcement.isPinned ? 'Unpin' : 'Pin'} Announcement
                    </span>
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    disabled={deletingId === announcement.id}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/20 transition-all text-left border-t border-white/10"
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 text-sm">
                      {deletingId === announcement.id ? 'Deleting...' : 'Delete'}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Content */}
            <div className={announcement.isPinned ? 'pr-24' : 'pr-12'}>
              <h3 className="text-xl font-bold text-white mb-2">
                {announcement.title}
              </h3>

              {announcement.titleAr && (
                <h3 className="text-lg font-bold text-gray-300 mb-3" dir="rtl">
                  {announcement.titleAr}
                </h3>
              )}

              <p className="text-gray-300 whitespace-pre-wrap mb-4">
                {announcement.content}
              </p>

              {announcement.contentAr && (
                <p
                  className="text-gray-300 whitespace-pre-wrap border-t border-white/10 pt-4 mb-4"
                  dir="rtl"
                >
                  {announcement.contentAr}
                </p>
              )}

              {/* Meta */}
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(announcement.createdAt)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Modal */}
      <CreateAnnouncementModal
        cohortId={cohortId}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchAnnouncements}
      />
    </div>
  );
}
