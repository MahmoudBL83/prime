'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import { useTheme } from 'next-themes';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Edit3, 
  Save, 
  X, 
  Award, 
  BookOpen, 
  Target, 
  Star,
  Settings,
  Shield,
  Bell,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle,
  BarChart3,
  Users,
  CreditCard,
  Briefcase,
  Globe,
  MessageCircle,
  Video,
  Headphones,
  Download,
  Share2,
  DollarSign,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  FileText,
  Sun,
  Moon,
  Upload,
  Grid,
  List,
  Image as ImageIcon,
  Film,
  Heart,
  Trash2,
  Edit,
  Play,
  Sparkles
} from 'lucide-react';

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

interface UserProfile {
  id: string;
  name: string;
  email: string;
  arabicName?: string;
  phone?: string;
  interests: string[];
  goals: string[];
  skillLevel: string;
  learningMode: string;
  onboardingCompleted: boolean;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  subscriptionStatus: string;
  enrollments: Array<{
    courseId: string;
    progress: number;
    lastAccessed?: string;
    enrolledAt: string;
    completedAt?: string;
  }>;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const params = useParams();
  const locale = params.locale as string;
  
  // Theme
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [editForm, setEditForm] = useState({
    name: '',
    arabicName: '',
    phone: '',
    interests: [] as string[],
    goals: [] as string[],
    skillLevel: '',
    learningMode: ''
  });

  const [studyBuddyPrefs, setStudyBuddyPrefs] = useState({
    enabled: true,
    subjects: [] as string[],
    availability: {
      monday: { enabled: false, start: '09:00', end: '17:00' },
      tuesday: { enabled: false, start: '09:00', end: '17:00' },
      wednesday: { enabled: false, start: '09:00', end: '17:00' },
      thursday: { enabled: false, start: '09:00', end: '17:00' },
      friday: { enabled: false, start: '09:00', end: '17:00' },
      saturday: { enabled: false, start: '09:00', end: '17:00' },
      sunday: { enabled: false, start: '09:00', end: '17:00' },
    },
    sessionLength: '1hr',
    collaborationPrefs: ['chat', 'audio'],
    headsetAvailable: false,
    timezone: 'UTC+2'
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'PRIVATE',
    showProgressPublicly: false,
    showRealName: true,
    studyBuddyEnabled: true
  });

  const [notificationModal, setNotificationModal] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    courseUpdates: true,
    newMessages: true,
    studyBuddyRequests: true,
    marketingEmails: false,
    weeklyDigest: true
  });

  // Creator Dashboard states
  const [creatorTab, setCreatorTab] = useState<'posts' | 'media' | 'videos' | 'stats' | 'calendar'>('posts');
  const [mediaView, setMediaView] = useState<'grid' | 'list'>('grid');
  const [creatorPosts, setCreatorPosts] = useState<any[]>([]);
  const [loadingCreatorPosts, setLoadingCreatorPosts] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const isRTL = locale === 'ar';

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? theme === 'dark' : true;

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const tabs = [
    { id: 'overview', label: isRTL ? 'نظرة عامة' : 'Overview', icon: User },
    { id: 'learning', label: isRTL ? 'التعلم' : 'Learning', icon: BookOpen },
    { id: 'study-buddy', label: isRTL ? 'شريك الدراسة' : 'Study Buddy', icon: Users },
    { id: 'subscriptions', label: isRTL ? 'الاشتراكات' : 'Subscriptions', icon: CreditCard },
    { id: 'certificates', label: isRTL ? 'الشهادات' : 'Certificates', icon: Award },
    ...(profile?.role === 'CREATOR' ? [{ id: 'creator', label: isRTL ? 'الإبداع' : 'Creator', icon: Briefcase }] : []),
    { id: 'settings', label: isRTL ? 'الإعدادات' : 'Settings', icon: Settings },
    { id: 'security', label: isRTL ? 'الأمان' : 'Security', icon: Shield },
  ];

  const skillLevels = [
    { value: 'Beginner', label: isRTL ? 'مبتدئ' : 'Beginner' },
    { value: 'Intermediate', label: isRTL ? 'متوسط' : 'Intermediate' },
    { value: 'Advanced', label: isRTL ? 'متقدم' : 'Advanced' },
  ];

  const learningModes = [
    { value: 'Self-paced', label: isRTL ? 'بالوتيرة الخاصة' : 'Self-paced' },
    { value: 'Structured', label: isRTL ? 'منظم' : 'Structured' },
    { value: 'Interactive', label: isRTL ? 'تفاعلي' : 'Interactive' },
  ];

  useEffect(() => {
    loadProfile();
    loadNotificationSettings();
  }, [session]);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        setProfile(data.user);
        setEditForm({
          name: data.user.name || '',
          arabicName: data.user.arabicName || '',
          phone: data.user.phone || '',
          interests: data.user.interests || [],
          goals: data.user.goals || [],
          skillLevel: data.user.skillLevel || 'Beginner',
          learningMode: data.user.learningMode || 'Self-paced'
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationSettings = async () => {
    try {
      const response = await fetch('/api/user/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotificationSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const saveNotificationSettings = async () => {
    try {
      const response = await fetch('/api/user/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationSettings),
      });

      if (response.ok) {
        setNotificationModal(false);
        // Show success message
        alert(isRTL ? 'تم حفظ إعدادات الإشعارات بنجاح' : 'Notification settings saved successfully');
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      alert(isRTL ? 'فشل حفظ إعدادات الإشعارات' : 'Failed to save notification settings');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        await loadProfile();
        setEditMode(false);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSubscriptionBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
            <Zap className="w-4 h-4 mr-1" />
            {isRTL ? 'نشط' : 'Active'}
          </span>
        );
      case 'NONE':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
            {isRTL ? 'مجاني' : 'Free'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-gray-900 via-purple-900/30 to-violet-900/30' : 'bg-gradient-to-br from-gray-50 via-purple-50 to-violet-50'}`}>
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className={`w-16 h-16 border-4 rounded-full mx-auto mb-4 ${
              isDark ? 'border-purple-400/30 border-t-purple-400' : 'border-purple-600/30 border-t-purple-600'
            }`}
          />
          <p className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {isRTL ? 'جاري تحميل الملف الشخصي...' : 'Loading profile...'}
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-gray-900 via-purple-900/30 to-violet-900/30' : 'bg-gradient-to-br from-gray-50 via-purple-50 to-violet-50'}`}>
        <div className="text-center">
          <User className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          <p className={`text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {isRTL ? 'لم يتم العثور على الملف الشخصي' : 'Profile not found'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-20 pb-10 ${isDark ? 'bg-gradient-to-br from-gray-900 via-purple-900/30 to-violet-900/30' : 'bg-gradient-to-br from-gray-50 via-purple-50 to-violet-50'}`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Theme Toggle Button - Fixed Position */}
        {mounted && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={toggleTheme}
            className={`fixed top-24 right-6 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
              isDark 
                ? 'bg-white/10 hover:bg-white/20 backdrop-blur-sm' 
                : 'bg-white hover:bg-gray-100 border border-gray-200 shadow-md'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-yellow-400 transition-transform duration-300 hover:rotate-180" />
            ) : (
              <Moon className="w-5 h-5 text-purple-600 transition-transform duration-300 hover:-rotate-12" />
            )}
          </motion.button>
        )}

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`backdrop-blur-xl border rounded-3xl p-8 mb-8 shadow-2xl ${
            isDark 
              ? 'bg-gradient-to-r from-black/30 via-black/20 to-black/30 border-white/10' 
              : 'bg-white/80 border-gray-200'
          }`}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center space-x-6">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl ${
                  isDark 
                    ? 'bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-500' 
                    : 'bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600'
                }`}
              >
                <span className="text-white font-bold text-3xl">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              </motion.div>
              
              <div>
                <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {profile.name}
                  {profile.arabicName && (
                    <span className={`block text-xl mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {profile.arabicName}
                    </span>
                  )}
                </h1>
                
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  {getSubscriptionBadge(profile.subscriptionStatus)}
                  
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {profile.role === 'CREATOR' ? (isRTL ? '👨‍🏫 مدرس' : '👨‍🏫 Instructor') : (isRTL ? '🎓 طالب' : '🎓 Student')}
                  </span>
                  
                  {profile.emailVerified && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {isRTL ? 'مُتحقق' : 'Verified'}
                    </span>
                  )}
                </div>
                
                <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {isRTL ? 'عضو منذ' : 'Member since'} {formatDate(profile.createdAt)}
                </p>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setEditMode(true)}
              className={`flex items-center space-x-2 px-6 py-3 text-white rounded-xl transition-all duration-200 shadow-lg ${
                isDark 
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 hover:shadow-purple-500/25' 
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
              }`}
            >
              <Edit3 className="w-5 h-5" />
              <span>{isRTL ? 'تعديل الملف الشخصي' : 'Edit Profile'}</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="overflow-x-auto overflow-y-hidden scrollbar-hide">
            <div className={`flex space-x-1 p-1 backdrop-blur-xl rounded-2xl border min-w-max ${
              isDark 
                ? 'bg-black/20 border-white/10' 
                : 'bg-white/80 border-gray-200'
            }`}>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center justify-center space-x-2 px-6 py-3 rounded-xl transition-all duration-200 whitespace-nowrap ${
                      activeTab === tab.id
                        ? isDark 
                          ? 'bg-gradient-to-r from-purple-500/30 to-blue-500/30 text-white border border-purple-400/50 shadow-lg'
                          : 'bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border border-purple-300 shadow-md'
                        : isDark
                          ? 'text-gray-400 hover:text-white hover:bg-white/5'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && (
              <div>
                {/* Personal Information */}
                <div className={`backdrop-blur-xl border rounded-2xl p-6 shadow-xl ${
                  isDark 
                    ? 'bg-gradient-to-br from-black/30 via-black/20 to-black/30 border-white/10' 
                    : 'bg-white/80 border-gray-200'
                }`}>
                  <h3 className={`text-xl font-bold mb-6 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <User className={`w-6 h-6 mr-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                    {isRTL ? 'المعلومات الشخصية' : 'Personal Information'}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {isRTL ? 'الاسم' : 'Name'}
                      </label>
                      <div className={`flex items-center space-x-3 p-3 border rounded-lg ${
                        isDark 
                          ? 'bg-white/5 border-white/10' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <User className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                        <span className={isDark ? 'text-white' : 'text-gray-900'}>{profile.name}</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {isRTL ? 'البريد الإلكتروني' : 'Email'}
                      </label>
                      <div className={`flex items-center space-x-3 p-3 border rounded-lg ${
                        isDark 
                          ? 'bg-white/5 border-white/10' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <Mail className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                        <span className={isDark ? 'text-white' : 'text-gray-900'}>{profile.email}</span>
                      </div>
                    </div>
                    
                    {profile.phone && (
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {isRTL ? 'رقم الهاتف' : 'Phone'}
                        </label>
                        <div className={`flex items-center space-x-3 p-3 border rounded-lg ${
                          isDark 
                            ? 'bg-white/5 border-white/10' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <Phone className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                          <span className={isDark ? 'text-white' : 'text-gray-900'}>{profile.phone}</span>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {isRTL ? 'المستوى' : 'Skill Level'}
                      </label>
                      <div className={`flex items-center space-x-3 p-3 border rounded-lg ${
                        isDark 
                          ? 'bg-white/5 border-white/10' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <Award className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                        <span className={isDark ? 'text-white' : 'text-gray-900'}>
                          {skillLevels.find(level => level.value === profile.skillLevel)?.label || profile.skillLevel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interests and Goals */}
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={`block text-sm font-medium mb-3 flex items-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <Star className={`w-5 h-5 mr-2 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                        {isRTL ? 'الاهتمامات' : 'Interests'}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {profile.interests.map((interest, index) => (
                          <span
                            key={index}
                            className={`px-3 py-1 border rounded-full text-sm ${
                              isDark 
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                                : 'bg-purple-100 text-purple-700 border-purple-300'
                            }`}
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium mb-3 flex items-center ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <Target className={`w-5 h-5 mr-2 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                        {isRTL ? 'الأهداف' : 'Goals'}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {profile.goals.map((goal, index) => (
                          <span
                            key={index}
                            className={`px-3 py-1 border rounded-full text-sm ${
                              isDark 
                                ? 'bg-green-500/20 text-green-300 border-green-500/30' 
                                : 'bg-green-100 text-green-700 border-green-300'
                            }`}
                          >
                            {goal}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'learning' && (
              <div className={`backdrop-blur-xl border rounded-2xl p-6 shadow-xl ${
                isDark 
                  ? 'bg-gradient-to-br from-black/30 via-black/20 to-black/30 border-white/10' 
                  : 'bg-white/80 border-gray-200'
              }`}>
                <h3 className={`text-xl font-bold mb-6 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <BookOpen className={`w-6 h-6 mr-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  {isRTL ? 'رحلة التعلم' : 'Learning Journey'}
                </h3>
                
                {profile.enrollments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profile.enrollments.map((enrollment, index) => (
                      <motion.div
                        key={enrollment.courseId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`border rounded-xl p-4 ${
                          isDark 
                            ? 'bg-white/5 border-white/10' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {isRTL ? 'دورة' : 'Course'}
                          </span>
                          <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {Math.round(enrollment.progress)}%
                          </span>
                        </div>
                        
                        <div className={`w-full rounded-full h-2 mb-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${enrollment.progress}%` }}
                            transition={{ duration: 1, delay: index * 0.1 }}
                            className={`h-2 rounded-full ${
                              isDark 
                                ? 'bg-gradient-to-r from-purple-500 to-blue-500' 
                                : 'bg-gradient-to-r from-purple-600 to-blue-600'
                            }`}
                          />
                        </div>
                        
                        <div className={`text-xs space-y-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <p>{isRTL ? 'تسجيل في:' : 'Enrolled:'} {formatDate(enrollment.enrolledAt)}</p>
                          {enrollment.lastAccessed && (
                            <p>{isRTL ? 'آخر دخول:' : 'Last accessed:'} {formatDate(enrollment.lastAccessed)}</p>
                          )}
                          {enrollment.completedAt && (
                            <p className={isDark ? 'text-green-400' : 'text-green-600'}>
                              {isRTL ? 'اكتمل في:' : 'Completed:'} {formatDate(enrollment.completedAt)}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
                    <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {isRTL ? 'لم تبدأ أي دورات بعد' : 'No courses started yet'}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                      {isRTL ? 'ابدأ رحلة التعلم الخاصة بك' : 'Start your learning journey today'}
                    </p>
                  </div>
                )}
              </div>
            )}

            

            {activeTab === 'study-buddy' && (
              <div className={`backdrop-blur-xl border rounded-2xl p-6 shadow-xl ${
                isDark 
                  ? 'bg-gradient-to-br from-black/30 via-black/20 to-black/30 border-white/10' 
                  : 'bg-white/80 border-gray-200'
              }`}>
                <h3 className={`text-xl font-bold mb-6 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Users className={`w-6 h-6 mr-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                  {isRTL ? 'تفضيلات شريك الدراسة' : 'Study Buddy Preferences'}
                </h3>

                {/* Enable/Disable Toggle */}
                <div className={`mb-8 p-4 border rounded-xl ${
                  isDark 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Users className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {isRTL ? 'تفعيل مطابقة شريك الدراسة' : 'Enable Study Buddy Matching'}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {isRTL ? 'اسمح للآخرين بالعثور عليك كشريك دراسة' : 'Allow others to find you as a study partner'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setStudyBuddyPrefs({...studyBuddyPrefs, enabled: !studyBuddyPrefs.enabled})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        studyBuddyPrefs.enabled 
                          ? isDark ? 'bg-purple-600' : 'bg-purple-600' 
                          : isDark ? 'bg-gray-600' : 'bg-gray-400'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          studyBuddyPrefs.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {studyBuddyPrefs.enabled && (
                  <div className="space-y-6">
                    {/* Study Subjects */}
                    <div>
                      <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {isRTL ? 'مواضيع الدراسة' : 'Study Subjects'}
                      </label>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {studyBuddyPrefs.subjects.map((subject, index) => (
                          <span
                            key={index}
                            className={`inline-flex items-center px-3 py-1 border rounded-full text-sm ${
                              isDark 
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                                : 'bg-purple-100 text-purple-700 border-purple-300'
                            }`}
                          >
                            {subject}
                            <button
                              onClick={() => {
                                const newSubjects = studyBuddyPrefs.subjects.filter((_, i) => i !== index);
                                setStudyBuddyPrefs({...studyBuddyPrefs, subjects: newSubjects});
                              }}
                              className="ml-2"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder={isRTL ? 'أضف موضوع دراسة...' : 'Add study subject...'}
                        className={`w-full px-4 py-2 border rounded-lg ${
                          isDark 
                            ? 'bg-white/10 border-white/20 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const value = e.currentTarget.value.trim();
                            if (value && !studyBuddyPrefs.subjects.includes(value)) {
                              setStudyBuddyPrefs({...studyBuddyPrefs, subjects: [...studyBuddyPrefs.subjects, value]});
                              e.currentTarget.value = '';
                            }
                          }
                        }}
                      />
                    </div>

                    {/* Session Length */}
                    <div>
                      <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {isRTL ? 'طول الجلسة المفضل' : 'Preferred Session Length'}
                      </label>
                      <div className="grid grid-cols-4 gap-3">
                        {['30min', '1hr', '2hr', '3hr'].map((length) => (
                          <button
                            key={length}
                            onClick={() => setStudyBuddyPrefs({...studyBuddyPrefs, sessionLength: length})}
                            className={`px-4 py-2 rounded-lg border transition-colors ${
                              studyBuddyPrefs.sessionLength === length
                                ? isDark 
                                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                                  : 'bg-purple-100 text-purple-700 border-purple-300'
                                : isDark 
                                  ? 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10' 
                                  : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                            }`}
                          >
                            {length}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Collaboration Preferences */}
                    <div>
                      <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {isRTL ? 'طرق التعاون' : 'Collaboration Methods'}
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {[
                          { id: 'chat', label: isRTL ? 'محادثة' : 'Chat', icon: MessageCircle },
                          { id: 'audio', label: isRTL ? 'صوت' : 'Audio', icon: Phone },
                          { id: 'video', label: isRTL ? 'فيديو' : 'Video', icon: Video },
                          { id: 'co-watch', label: isRTL ? 'مشاهدة مشتركة' : 'Co-Watch', icon: Eye }
                        ].map((method) => {
                          const Icon = method.icon;
                          const isSelected = studyBuddyPrefs.collaborationPrefs.includes(method.id);
                          return (
                            <button
                              key={method.id}
                              onClick={() => {
                                const newPrefs = isSelected
                                  ? studyBuddyPrefs.collaborationPrefs.filter(p => p !== method.id)
                                  : [...studyBuddyPrefs.collaborationPrefs, method.id];
                                setStudyBuddyPrefs({...studyBuddyPrefs, collaborationPrefs: newPrefs});
                              }}
                              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border transition-colors ${
                                isSelected
                                  ? isDark 
                                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' 
                                    : 'bg-blue-100 text-blue-700 border-blue-300'
                                  : isDark 
                                    ? 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10' 
                                    : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                              <span className="text-sm">{method.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Headset Availability */}
                    <div className={`flex items-center justify-between p-4 border rounded-xl ${
                      isDark 
                        ? 'bg-white/5 border-white/10' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <Headphones className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                        <div>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {isRTL ? 'سماعة متاحة' : 'Headset Available'}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {isRTL ? 'أملك سماعة رأس للمكالمات الصوتية' : 'I have a headset for audio calls'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setStudyBuddyPrefs({...studyBuddyPrefs, headsetAvailable: !studyBuddyPrefs.headsetAvailable})}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          studyBuddyPrefs.headsetAvailable 
                            ? isDark ? 'bg-green-600' : 'bg-green-600' 
                            : isDark ? 'bg-gray-600' : 'bg-gray-400'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            studyBuddyPrefs.headsetAvailable ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Timezone */}
                    <div>
                      <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {isRTL ? 'المنطقة الزمنية' : 'Timezone'}
                      </label>
                      <select
                        value={studyBuddyPrefs.timezone}
                        onChange={(e) => setStudyBuddyPrefs({...studyBuddyPrefs, timezone: e.target.value})}
                        className={`w-full px-4 py-3 border rounded-lg ${
                          isDark 
                            ? 'bg-white/10 border-white/20 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      >
                        <option value="UTC+2" className={isDark ? 'bg-gray-800' : 'bg-white'}>UTC+2 (Cairo)</option>
                        <option value="UTC+0" className={isDark ? 'bg-gray-800' : 'bg-white'}>UTC+0 (London)</option>
                        <option value="UTC-5" className={isDark ? 'bg-gray-800' : 'bg-white'}>UTC-5 (New York)</option>
                        <option value="UTC+1" className={isDark ? 'bg-gray-800' : 'bg-white'}>UTC+1 (Berlin)</option>
                        <option value="UTC+3" className={isDark ? 'bg-gray-800' : 'bg-white'}>UTC+3 (Riyadh)</option>
                      </select>
                    </div>

                    {/* Save Button */}
                    <button className={`w-full px-6 py-3 text-white rounded-xl transition-all duration-200 ${
                      isDark 
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600' 
                        : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
                    }`}>
                      {isRTL ? 'حفظ التفضيلات' : 'Save Preferences'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'subscriptions' && (
              <div className="space-y-6">
                {/* Active Subscriptions */}
                <div className={`backdrop-blur-xl border rounded-2xl p-6 shadow-xl ${
                  isDark 
                    ? 'bg-gradient-to-br from-black/30 via-black/20 to-black/30 border-white/10' 
                    : 'bg-white/80 border-gray-200'
                }`}>
                  <h3 className={`text-xl font-bold mb-6 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <CreditCard className={`w-6 h-6 mr-2 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                    {isRTL ? 'الاشتراكات النشطة' : 'Active Subscriptions'}
                  </h3>

                  <div className="space-y-4">
                    {/* Platform Subscription (Category A) */}
                    <div className={`p-4 border rounded-xl ${
                      isDark 
                        ? 'bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-500/30' 
                        : 'bg-gradient-to-r from-green-50 to-blue-50 border-green-300'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center">
                            <BookOpen className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {isRTL ? 'الوصول الكامل (الفئة A)' : 'All-Access (Category A)'}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                              {profile.subscriptionStatus === 'ACTIVE' ? (isRTL ? 'نشط' : 'Active') : (isRTL ? 'غير مفعل' : 'Inactive')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-2xl ${isDark ? 'text-white' : 'text-gray-900'}`}>$9.99</p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{isRTL ? 'شهريًا' : 'per month'}</p>
                        </div>
                      </div>
                      <div className={`flex items-center justify-between pt-3 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {isRTL ? 'تاريخ التجديد: 15 نوفمبر 2025' : 'Renewal: Nov 15, 2025'}
                        </p>
                        <button className={`px-4 py-2 border rounded-lg transition-colors text-sm ${
                          isDark 
                            ? 'bg-white/10 text-white border-white/20 hover:bg-white/20' 
                            : 'bg-gray-100 text-gray-900 border-gray-300 hover:bg-gray-200'
                        }`}>
                          {isRTL ? 'إدارة' : 'Manage'}
                        </button>
                      </div>
                    </div>

                    {/* Premium Subscription (Category B) - Placeholder */}
                    <div className={`p-4 border rounded-xl opacity-60 ${
                      isDark 
                        ? 'bg-white/5 border-white/10' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                            <Award className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {isRTL ? 'برامج مميزة (الفئة B)' : 'Signature Programs (Category B)'}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {isRTL ? 'غير مشترك' : 'Not subscribed'}
                            </p>
                          </div>
                        </div>
                        <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 text-sm">
                          {isRTL ? 'ترقية' : 'Upgrade'}
                        </button>
                      </div>
                    </div>

                    {/* Creator Subscriptions (Category C) */}
                    <div className={`p-4 border rounded-xl ${
                      isDark 
                        ? 'bg-white/5 border-white/10' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <h4 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {isRTL ? 'قنوات المدربين (الفئة C)' : 'Creator Channels (Category C)'}
                      </h4>
                      <p className={`text-sm text-center py-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {isRTL ? 'لم تشترك في أي قناة بعد' : 'No creator channel subscriptions yet'}
                      </p>
                      <button className={`w-full px-4 py-2 border rounded-lg transition-colors ${
                        isDark 
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30' 
                          : 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
                      }`}>
                        {isRTL ? 'تصفح المدربين' : 'Browse Creators'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Payment Methods */}
                <div className={`backdrop-blur-xl border rounded-2xl p-6 shadow-xl ${
                  isDark 
                    ? 'bg-gradient-to-br from-black/30 via-black/20 to-black/30 border-white/10' 
                    : 'bg-white/80 border-gray-200'
                }`}>
                  <h3 className={`text-xl font-bold mb-6 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <CreditCard className={`w-6 h-6 mr-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    {isRTL ? 'طرق الدفع' : 'Payment Methods'}
                  </h3>
                  <div className={`p-4 border rounded-xl text-center ${
                    isDark 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <CreditCard className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                    <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {isRTL ? 'لا توجد طرق دفع محفوظة' : 'No saved payment methods'}
                    </p>
                    <button className={`px-6 py-2 text-white rounded-lg transition-all duration-200 ${
                      isDark 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600' 
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                    }`}>
                      {isRTL ? 'إضافة طريقة دفع' : 'Add Payment Method'}
                    </button>
                  </div>
                </div>

                {/* Invoice History */}
                <div className={`backdrop-blur-xl border rounded-2xl p-6 shadow-xl ${
                  isDark 
                    ? 'bg-gradient-to-br from-black/30 via-black/20 to-black/30 border-white/10' 
                    : 'bg-white/80 border-gray-200'
                }`}>
                  <h3 className={`text-xl font-bold mb-6 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <FileText className={`w-6 h-6 mr-2 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                    {isRTL ? 'سجل الفواتير' : 'Invoice History'}
                  </h3>
                  <div className="space-y-3">
                    {[1, 2, 3].map((invoice) => (
                      <div key={invoice} className={`flex items-center justify-between p-4 border rounded-lg ${
                        isDark 
                          ? 'bg-white/5 border-white/10' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {isRTL ? 'فاتورة #' : 'Invoice #'}{1000 + invoice}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            Oct {invoice * 5}, 2025
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>$9.99</span>
                          <button className={`p-2 border rounded-lg transition-colors ${
                            isDark 
                              ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30' 
                              : 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
                          }`}>
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'certificates' && (
              <div className={`backdrop-blur-xl border rounded-2xl p-6 shadow-xl ${
                isDark 
                  ? 'bg-gradient-to-br from-black/30 via-black/20 to-black/30 border-white/10' 
                  : 'bg-white/80 border-gray-200'
              }`}>
                <h3 className={`text-xl font-bold mb-6 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Award className={`w-6 h-6 mr-2 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                  {isRTL ? 'الشهادات والإنجازات' : 'Certificates & Achievements'}
                </h3>

                {/* Certificates Section */}
                <div className="mb-8">
                  <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {isRTL ? 'الشهادات المكتسبة' : 'Earned Certificates'}
                  </h4>
                  {profile.enrollments.filter(e => e.completedAt).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.enrollments.filter(e => e.completedAt).map((enrollment, index) => (
                        <div key={index} className={`p-4 border rounded-xl ${
                          isDark 
                            ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-500/30' 
                            : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300'
                        }`}>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <p className={`font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {isRTL ? 'شهادة إتمام الدورة' : 'Course Completion Certificate'}
                              </p>
                              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                                {isRTL ? 'أكمل في:' : 'Completed:'} {formatDate(enrollment.completedAt!)}
                              </p>
                            </div>
                            <Award className={`w-8 h-8 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                          </div>
                          <div className="flex gap-2 mt-4">
                            <button className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border rounded-lg transition-colors text-sm ${
                              isDark 
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30' 
                                : 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
                            }`}>
                              <Download className="w-4 h-4" />
                              {isRTL ? 'تحميل' : 'Download'}
                            </button>
                            <button className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border rounded-lg transition-colors text-sm ${
                              isDark 
                                ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30' 
                                : 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
                            }`}>
                              <Share2 className="w-4 h-4" />
                              {isRTL ? 'مشاركة' : 'Share'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`text-center py-8 border rounded-xl ${
                      isDark 
                        ? 'bg-white/5 border-white/10' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <Award className={`w-16 h-16 mx-auto mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                      <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                        {isRTL ? 'لم تحصل على شهادات بعد' : 'No certificates earned yet'}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        {isRTL ? 'أكمل دورة للحصول على شهادتك الأولى' : 'Complete a course to earn your first certificate'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Achievements Section */}
                <div>
                  <h4 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {isRTL ? 'الإنجازات والشارات' : 'Achievements & Badges'}
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { name: isRTL ? 'أول دورة' : 'First Course', icon: Star, unlocked: true },
                      { name: isRTL ? 'الالتزام' : 'Commitment', icon: Zap, unlocked: true },
                      { name: isRTL ? 'متعلم سريع' : 'Fast Learner', icon: TrendingUp, unlocked: false },
                      { name: isRTL ? 'خبير' : 'Expert', icon: Award, unlocked: false }
                    ].map((achievement, index) => {
                      const Icon = achievement.icon;
                      return (
                        <div
                          key={index}
                          className={`p-4 rounded-xl border text-center ${
                            achievement.unlocked
                              ? isDark 
                                ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-500/30' 
                                : 'bg-gradient-to-br from-purple-100 to-blue-100 border-purple-300'
                              : isDark 
                                ? 'bg-white/5 border-white/10 opacity-50' 
                                : 'bg-gray-50 border-gray-200 opacity-50'
                          }`}
                        >
                          <Icon className={`w-8 h-8 mx-auto mb-2 ${
                            achievement.unlocked 
                              ? isDark ? 'text-purple-400' : 'text-purple-600' 
                              : 'text-gray-500'
                          }`} />
                          <p className={`text-sm font-medium ${
                            achievement.unlocked 
                              ? isDark ? 'text-white' : 'text-gray-900' 
                              : 'text-gray-500'
                          }`}>
                            {achievement.name}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'creator' && profile.role === 'CREATOR' && (
              <div className="space-y-6">
                {/* Creator Stats */}
                <div className={`backdrop-blur-xl border rounded-2xl p-6 shadow-xl ${
                  isDark 
                    ? 'bg-gradient-to-br from-black/30 via-black/20 to-black/30 border-white/10' 
                    : 'bg-white/80 border-gray-200'
                }`}>
                  <h3 className={`text-xl font-bold mb-6 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <Briefcase className={`w-6 h-6 mr-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                    {isRTL ? 'نظرة عامة على المدرب' : 'Creator Overview'}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className={`p-4 border rounded-xl ${
                      isDark 
                        ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30' 
                        : 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <DollarSign className={`w-8 h-8 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                        <TrendingUp className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                      </div>
                      <p className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>$0</p>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{isRTL ? 'إجمالي الأرباح' : 'Total Earnings'}</p>
                    </div>

                    <div className={`p-4 border rounded-xl ${
                      isDark 
                        ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-500/30' 
                        : 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <Users className={`w-8 h-8 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                        <TrendingUp className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                      <p className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>0</p>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{isRTL ? 'المشتركون' : 'Subscribers'}</p>
                    </div>

                    <div className={`p-4 border rounded-xl ${
                      isDark 
                        ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/30' 
                        : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-300'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <BookOpen className={`w-8 h-8 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                        <TrendingUp className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      </div>
                      <p className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>0</p>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{isRTL ? 'الدورات' : 'Courses'}</p>
                    </div>
                  </div>

                  {/* KYC Status */}
                  <div className={`p-4 border rounded-xl ${
                    isDark 
                      ? 'bg-yellow-500/20 border-yellow-500/30' 
                      : 'bg-yellow-50 border-yellow-300'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <Shield className={`w-6 h-6 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                      <div className="flex-1">
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {isRTL ? 'حالة التحقق من الهوية' : 'KYC Verification Status'}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
                          {isRTL ? 'قيد المراجعة - يستغرق حتى 10 أيام' : 'Under Review - Takes up to 10 days'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 border rounded-full text-sm font-medium ${
                        isDark 
                          ? 'bg-yellow-500/30 text-yellow-300 border-yellow-500/40' 
                          : 'bg-yellow-100 text-yellow-700 border-yellow-400'
                      }`}>
                        {isRTL ? 'قيد الانتظار' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Teaching Profile */}
                <div className={`backdrop-blur-xl border rounded-2xl p-6 shadow-xl ${
                  isDark 
                    ? 'bg-gradient-to-br from-black/30 via-black/20 to-black/30 border-white/10' 
                    : 'bg-white/80 border-gray-200'
                }`}>
                  <h3 className={`text-xl font-bold mb-6 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <Award className={`w-6 h-6 mr-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    {isRTL ? 'الملف التعليمي' : 'Teaching Profile'}
                  </h3>

                  <div className="space-y-4">
                    <div className={`flex items-center justify-between p-4 border rounded-xl ${
                      isDark 
                        ? 'bg-white/5 border-white/10' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <Globe className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                        <div>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {isRTL ? 'الملف الشخصي العام' : 'Public Profile'}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {isRTL ? 'عرض ملفك الشخصي العام' : 'View your public profile'}
                          </p>
                        </div>
                      </div>
                      <button className={`px-4 py-2 border rounded-lg transition-colors ${
                        isDark 
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30' 
                          : 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
                      }`}>
                        {isRTL ? 'عرض' : 'View'}
                      </button>
                    </div>

                    <div className={`flex items-center justify-between p-4 border rounded-xl ${
                      isDark 
                        ? 'bg-white/5 border-white/10' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <DollarSign className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                        <div>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {isRTL ? 'أسعار الاشتراك' : 'Subscription Pricing'}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {isRTL ? 'تعيين أسعار قناتك' : 'Set your channel pricing'}
                          </p>
                        </div>
                      </div>
                      <button className={`px-4 py-2 border rounded-lg transition-colors ${
                        isDark 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30' 
                          : 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200'
                      }`}>
                        {isRTL ? 'إدارة' : 'Manage'}
                      </button>
                    </div>

                    <div className={`flex items-center justify-between p-4 border rounded-xl ${
                      isDark 
                        ? 'bg-white/5 border-white/10' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        <Video className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                        <div>
                          <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {isRTL ? 'متاح للقاءات' : 'Available for Meetings'}
                          </p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {isRTL ? 'تبديل توفر الاستشارة' : 'Toggle consultation availability'}
                          </p>
                        </div>
                      </div>
                      <button className={`relative inline-flex h-6 w-11 items-center rounded-full ${
                        isDark ? 'bg-green-600' : 'bg-green-500'
                      }`}>
                        <span className="inline-block h-4 w-4 transform translate-x-6 rounded-full bg-white transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className={`backdrop-blur-xl border rounded-2xl p-6 shadow-xl ${
                isDark 
                  ? 'bg-gradient-to-br from-black/30 via-black/20 to-black/30 border-white/10' 
                  : 'bg-white/80 border-gray-200'
              }`}>
                <h3 className={`text-xl font-bold mb-6 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Settings className={`w-6 h-6 mr-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                  {isRTL ? 'إعدادات الحساب' : 'Account Settings'}
                </h3>
                
                <div className="space-y-6">
                  {/* Privacy Settings */}
                  <div>
                    <h4 className={`text-lg font-semibold mb-4 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <Lock className={`w-5 h-5 mr-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      {isRTL ? 'إعدادات الخصوصية' : 'Privacy Settings'}
                    </h4>
                    <div className="space-y-3">
                      <div className={`flex items-center justify-between p-4 border rounded-xl ${
                        isDark 
                          ? 'bg-white/5 border-white/10' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-3">
                          {privacySettings.profileVisibility === 'PUBLIC' ? (
                            <Eye className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                          ) : (
                            <EyeOff className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                          )}
                          <div>
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {isRTL ? 'رؤية الملف الشخصي' : 'Profile Visibility'}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {privacySettings.profileVisibility === 'PUBLIC' ? (isRTL ? 'عام' : 'Public') : (isRTL ? 'خاص' : 'Private')}
                            </p>
                          </div>
                        </div>
                        <select
                          value={privacySettings.profileVisibility}
                          onChange={(e) => setPrivacySettings({...privacySettings, profileVisibility: e.target.value})}
                          className={`px-4 py-2 border rounded-lg text-sm ${
                            isDark 
                              ? 'bg-white/10 border-white/20 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="PUBLIC" className={isDark ? 'bg-gray-800' : 'bg-white'}>{isRTL ? 'عام' : 'Public'}</option>
                          <option value="PRIVATE" className={isDark ? 'bg-gray-800' : 'bg-white'}>{isRTL ? 'خاص' : 'Private'}</option>
                          <option value="BUDDIES_ONLY" className={isDark ? 'bg-gray-800' : 'bg-white'}>{isRTL ? 'الأصدقاء فقط' : 'Buddies Only'}</option>
                        </select>
                      </div>

                      <div className={`flex items-center justify-between p-4 border rounded-xl ${
                        isDark 
                          ? 'bg-white/5 border-white/10' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <BarChart3 className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                          <div>
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {isRTL ? 'إظهار التقدم علنًا' : 'Show Progress Publicly'}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {isRTL ? 'السماح للآخرين برؤية تقدمك في التعلم' : 'Let others see your learning progress'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setPrivacySettings({...privacySettings, showProgressPublicly: !privacySettings.showProgressPublicly})}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            privacySettings.showProgressPublicly 
                              ? isDark ? 'bg-blue-600' : 'bg-blue-500' 
                              : isDark ? 'bg-gray-600' : 'bg-gray-400'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              privacySettings.showProgressPublicly ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className={`flex items-center justify-between p-4 border rounded-xl ${
                        isDark 
                          ? 'bg-white/5 border-white/10' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <User className={`w-5 h-5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                          <div>
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {isRTL ? 'إظهار الاسم الحقيقي' : 'Show Real Name'}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {isRTL ? 'استخدم اسمك الحقيقي بدلاً من اسم مستعار' : 'Use real name instead of alias'}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setPrivacySettings({...privacySettings, showRealName: !privacySettings.showRealName})}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            privacySettings.showRealName 
                              ? isDark ? 'bg-yellow-600' : 'bg-yellow-500' 
                              : isDark ? 'bg-gray-600' : 'bg-gray-400'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              privacySettings.showRealName ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Notification Settings */}
                  <div className={`pt-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                    <h4 className={`text-lg font-semibold mb-4 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      <Bell className={`w-5 h-5 mr-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      {isRTL ? 'الإشعارات والتفضيلات' : 'Notifications & Preferences'}
                    </h4>
                    <div className="space-y-3">
                      <div className={`flex items-center justify-between p-4 border rounded-xl ${
                        isDark 
                          ? 'bg-white/5 border-white/10' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <Bell className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                          <div>
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {isRTL ? 'الإشعارات' : 'Notifications'}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {isRTL ? 'إدارة تفضيلات الإشعارات' : 'Manage notification preferences'}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setNotificationModal(true)}
                          className={`px-4 py-2 border rounded-lg transition-colors ${
                          isDark 
                            ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30' 
                            : 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
                        }`}>
                          {isRTL ? 'إدارة' : 'Manage'}
                        </button>
                      </div>
                      
                      <div className={`flex items-center justify-between p-4 border rounded-xl ${
                        isDark 
                          ? 'bg-white/5 border-white/10' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <Clock className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                          <div>
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {isRTL ? 'المنطقة الزمنية' : 'Timezone'}
                            </p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                              {isRTL ? 'تعيين منطقتك الزمنية' : 'Set your timezone'}
                            </p>
                          </div>
                        </div>
                        <select
                          className={`px-4 py-2 border rounded-lg text-sm ${
                            isDark 
                              ? 'bg-white/10 border-white/20 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                        >
                          <option value="Africa/Cairo" className={isDark ? 'bg-gray-800' : 'bg-white'}>Cairo (GMT+2)</option>
                          <option value="Asia/Dubai" className={isDark ? 'bg-gray-800' : 'bg-white'}>Dubai (GMT+4)</option>
                          <option value="Asia/Riyadh" className={isDark ? 'bg-gray-800' : 'bg-white'}>Riyadh (GMT+3)</option>
                          <option value="Europe/London" className={isDark ? 'bg-gray-800' : 'bg-white'}>London (GMT+0)</option>
                          <option value="America/New_York" className={isDark ? 'bg-gray-800' : 'bg-white'}>New York (GMT-5)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className={`backdrop-blur-xl border rounded-2xl p-6 shadow-xl ${
                isDark 
                  ? 'bg-gradient-to-br from-black/30 via-black/20 to-black/30 border-white/10' 
                  : 'bg-white/80 border-gray-200'
              }`}>
                <h3 className={`text-xl font-bold mb-6 flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <Shield className={`w-6 h-6 mr-2 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
                  {isRTL ? 'الأمان والخصوصية' : 'Security & Privacy'}
                </h3>
                
                <div className="space-y-6">
                  <div className={`flex items-center justify-between p-4 border rounded-xl ${
                    isDark 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className={`w-5 h-5 ${
                        profile.emailVerified 
                          ? isDark ? 'text-green-400' : 'text-green-600' 
                          : isDark ? 'text-yellow-400' : 'text-yellow-600'
                      }`} />
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {isRTL ? 'تحقق من البريد الإلكتروني' : 'Email Verification'}
                        </p>
                        <p className={`text-sm ${
                          profile.emailVerified 
                            ? isDark ? 'text-green-400' : 'text-green-600' 
                            : isDark ? 'text-yellow-400' : 'text-yellow-600'
                        }`}>
                          {profile.emailVerified 
                            ? (isRTL ? 'تم التحقق من البريد الإلكتروني' : 'Email verified')
                            : (isRTL ? 'البريد الإلكتروني غير مُحقق' : 'Email not verified')
                          }
                        </p>
                      </div>
                    </div>
                    {!profile.emailVerified && (
                      <button className={`px-4 py-2 border rounded-lg transition-colors ${
                        isDark 
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/30' 
                          : 'bg-yellow-100 text-yellow-700 border-yellow-300 hover:bg-yellow-200'
                      }`}>
                        {isRTL ? 'تحقق' : 'Verify'}
                      </button>
                    )}
                  </div>
                  
                  <div className={`flex items-center justify-between p-4 border rounded-xl ${
                    isDark 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <Shield className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {isRTL ? 'كلمة المرور' : 'Password'}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {isRTL ? 'تغيير كلمة المرور' : 'Change your password'}
                        </p>
                      </div>
                    </div>
                    <button className={`px-4 py-2 border rounded-lg transition-colors ${
                      isDark 
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 hover:bg-blue-500/30' 
                        : 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200'
                    }`}>
                      {isRTL ? 'تغيير' : 'Change'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Creator Dashboard Tab */}
            {activeTab === 'creator' && profile?.role === 'CREATOR' && (
              <div className={`backdrop-blur-xl border rounded-2xl p-6 shadow-xl ${
                isDark 
                  ? 'bg-gradient-to-br from-black/30 via-black/20 to-black/30 border-white/10' 
                  : 'bg-white/80 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-xl font-bold flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <Briefcase className={`w-6 h-6 mr-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                    {isRTL ? 'لوحة تحكم المنشئ' : 'Creator Dashboard'}
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.location.href = `/${locale}/mentors`}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      isDark 
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30' 
                          : 'bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200'
                    }`}
                  >
                    <Upload className="w-4 h-4 inline mr-2" />
                    {isRTL ? 'منشور جديد' : 'New Post'}
                  </motion.button>
                </div>
                
                <div className={`p-6 border rounded-xl mb-6 ${
                  isDark 
                    ? 'bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/30' 
                    : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {isRTL ? 'إدارة المحتوى' : 'Content Management'}
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {isRTL ? 'إدارة منشوراتك ومحتواك' : 'Manage your posts and content'}
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.location.href = `/${locale}/mentors`}
                      className={`px-4 py-2 rounded-lg transition-all ${
                        isDark 
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30' 
                          : 'bg-purple-100 text-purple-700 border border-purple-300 hover:bg-purple-200'
                      }`}
                    >
                      <Upload className="w-4 h-4 inline mr-2" />
                      {isRTL ? 'منشور جديد' : 'New Post'}
                    </motion.button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className={`p-4 rounded-xl ${
                      isDark ? 'bg-black/20' : 'bg-white/50'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {isRTL ? 'المنشورات' : 'Posts'}
                        </span>
                      </div>
                      <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        0
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl ${
                      isDark ? 'bg-black/20' : 'bg-white/50'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Users className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {isRTL ? 'المشتركون' : 'Subscribers'}
                        </span>
                      </div>
                      <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        0
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl ${
                      isDark ? 'bg-black/20' : 'bg-white/50'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {isRTL ? 'المشاهدات' : 'Views'}
                        </span>
                      </div>
                      <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        0
                      </div>
                    </div>

                    <div className={`p-4 rounded-xl ${
                      isDark ? 'bg-black/20' : 'bg-white/50'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className={`w-5 h-5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {isRTL ? 'الأرباح' : 'Earnings'}
                        </span>
                      </div>
                      <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        0 EGP
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.location.href = `/${locale}/mentors`}
                    className={`p-4 rounded-xl border transition-all ${
                      isDark 
                        ? 'bg-white/5 border-white/10 hover:border-purple-500/50' 
                        : 'bg-gray-50 border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <Upload className={`w-6 h-6 mb-2 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                    <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {isRTL ? 'تحميل محتوى' : 'Upload Content'}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {isRTL ? 'صور، فيديوهات، منشورات' : 'Images, videos, posts'}
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.location.href = `/${locale}/messaging`}
                    className={`p-4 rounded-xl border transition-all ${
                      isDark 
                        ? 'bg-white/5 border-white/10 hover:border-blue-500/50' 
                        : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <MessageCircle className={`w-6 h-6 mb-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {isRTL ? 'الرسائل' : 'Messages'}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {isRTL ? 'تواصل مع المشتركين' : 'Chat with subscribers'}
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.location.href = `/${locale}/mentors`}
                    className={`p-4 rounded-xl border transition-all ${
                      isDark 
                        ? 'bg-white/5 border-white/10 hover:border-green-500/50' 
                        : 'bg-gray-50 border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <BarChart3 className={`w-6 h-6 mb-2 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                    <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {isRTL ? 'التحليلات' : 'Analytics'}
                    </div>
                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {isRTL ? 'عرض الإحصائيات' : 'View statistics'}
                    </div>
                  </motion.button>
                </div>

                {/* Info Box */}
                <div className={`p-4 rounded-xl ${
                  isDark 
                    ? 'bg-blue-500/10 border border-blue-500/30' 
                    : 'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isDark ? 'bg-blue-500/20' : 'bg-blue-100'
                      }`}>
                        <Sparkles className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      </div>
                    </div>
                    <div>
                      <h4 className={`font-semibold mb-1 ${isDark ? 'text-blue-400' : 'text-blue-900'}`}>
                        {isRTL ? 'نصيحة للمنشئين' : 'Creator Tip'}
                      </h4>
                      <p className={`text-sm ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>
                        {isRTL 
                          ? 'انتقل إلى صفحة المنشئين للوصول إلى جميع ميزات إدارة المحتوى والتحليلات المتقدمة.'
                          : 'Go to the Creators page to access all content management features and advanced analytics.'
                        }
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => window.location.href = `/${locale}/mentors`}
                        className={`mt-3 px-4 py-2 rounded-lg transition-all font-semibold ${
                          isDark 
                            ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {isRTL ? 'انتقل إلى لوحة المنشئين' : 'Go to Creator Panel'}
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Edit Profile Modal */}
        <AnimatePresence>
          {editMode && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-black/90 backdrop-blur-xl rounded-2xl p-6 w-full max-w-2xl border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                    {isRTL ? 'تعديل الملف الشخصي' : 'Edit Profile'}
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setEditMode(false)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all duration-200"
                  >
                    <X className="w-5 h-5 text-white" />
                  </motion.button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {isRTL ? 'الاسم' : 'Name'}
                      </label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {isRTL ? 'الاسم العربي' : 'Arabic Name'}
                      </label>
                      <input
                        type="text"
                        value={editForm.arabicName}
                        onChange={(e) => setEditForm({...editForm, arabicName: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {isRTL ? 'رقم الهاتف' : 'Phone Number'}
                    </label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {isRTL ? 'المستوى' : 'Skill Level'}
                      </label>
                      <select
                        value={editForm.skillLevel}
                        onChange={(e) => setEditForm({...editForm, skillLevel: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                      >
                        {skillLevels.map(level => (
                          <option key={level.value} value={level.value} className="bg-gray-800">
                            {level.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {isRTL ? 'نمط التعلم' : 'Learning Mode'}
                      </label>
                      <select
                        value={editForm.learningMode}
                        onChange={(e) => setEditForm({...editForm, learningMode: e.target.value})}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400/50"
                      >
                        {learningModes.map(mode => (
                          <option key={mode.value} value={mode.value} className="bg-gray-800">
                            {mode.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Interests Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      {isRTL ? 'الاهتمامات' : 'Interests'}
                    </label>
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2 mb-3">
                        {editForm.interests.map((interest, index) => (
                          <motion.span
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="inline-flex items-center px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-sm"
                          >
                            {interest}
                            <button
                              type="button"
                              onClick={() => {
                                const newInterests = editForm.interests.filter((_, i) => i !== index);
                                setEditForm({...editForm, interests: newInterests});
                              }}
                              className="ml-2 text-green-300 hover:text-red-400 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </motion.span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder={isRTL ? 'اضف اهتمام جديد...' : 'Add new interest...'}
                          className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-400/50"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const value = e.currentTarget.value.trim();
                              if (value && !editForm.interests.includes(value)) {
                                setEditForm({...editForm, interests: [...editForm.interests, value]});
                                e.currentTarget.value = '';
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            const value = input?.value.trim();
                            if (value && !editForm.interests.includes(value)) {
                              setEditForm({...editForm, interests: [...editForm.interests, value]});
                              input.value = '';
                            }
                          }}
                          className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors"
                        >
                          {isRTL ? 'إضافة' : 'Add'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Goals Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      {isRTL ? 'الأهداف التعليمية' : 'Learning Goals'}
                    </label>
                    <div className="space-y-3">
                      <div className="space-y-2 mb-3">
                        {editForm.goals.map((goal, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg"
                          >
                            <Target className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            <span className="flex-1 text-white text-sm">{goal}</span>
                            <button
                              type="button"
                              onClick={() => {
                                const newGoals = editForm.goals.filter((_, i) => i !== index);
                                setEditForm({...editForm, goals: newGoals});
                              }}
                              className="text-gray-400 hover:text-red-400 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder={isRTL ? 'اضف هدف تعليمي جديد...' : 'Add learning goal...'}
                          className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const value = e.currentTarget.value.trim();
                              if (value && !editForm.goals.includes(value)) {
                                setEditForm({...editForm, goals: [...editForm.goals, value]});
                                e.currentTarget.value = '';
                              }
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            const value = input?.value.trim();
                            if (value && !editForm.goals.includes(value)) {
                              setEditForm({...editForm, goals: [...editForm.goals, value]});
                              input.value = '';
                            }
                          }}
                          className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors"
                        >
                          {isRTL ? 'إضافة' : 'Add'}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-6">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      <span>{saving ? (isRTL ? 'جاري الحفظ...' : 'Saving...') : (isRTL ? 'حفظ التغييرات' : 'Save Changes')}</span>
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setEditMode(false)}
                      className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl hover:bg-white/20 transition-all duration-200"
                    >
                      {isRTL ? 'إلغاء' : 'Cancel'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Notification Settings Modal */}
        <AnimatePresence>
          {notificationModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-lg flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className={`w-full max-w-2xl border rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto ${
                  isDark 
                    ? 'bg-gradient-to-br from-gray-800/90 via-gray-900/90 to-black/90 backdrop-blur-xl border-white/20' 
                    : 'bg-white/95 backdrop-blur-xl border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-2xl font-bold flex items-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <Bell className={`w-6 h-6 mr-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    {isRTL ? 'إعدادات الإشعارات' : 'Notification Settings'}
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setNotificationModal(false)}
                    className={`p-2 rounded-full transition-all duration-200 ${
                      isDark 
                        ? 'bg-white/10 hover:bg-white/20' 
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    <X className={`w-5 h-5 ${isDark ? 'text-white' : 'text-gray-900'}`} />
                  </motion.button>
                </div>

                <div className="space-y-4">
                  {/* Email Notifications */}
                  <div className={`flex items-center justify-between p-4 border rounded-xl ${
                    isDark 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <Mail className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {isRTL ? 'إشعارات البريد الإلكتروني' : 'Email Notifications'}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {isRTL ? 'تلقي إشعارات عبر البريد الإلكتروني' : 'Receive email notifications'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotificationSettings({...notificationSettings, emailNotifications: !notificationSettings.emailNotifications})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.emailNotifications 
                          ? isDark ? 'bg-blue-600' : 'bg-blue-500' 
                          : isDark ? 'bg-gray-600' : 'bg-gray-400'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Push Notifications */}
                  <div className={`flex items-center justify-between p-4 border rounded-xl ${
                    isDark 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <Bell className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {isRTL ? 'الإشعارات الفورية' : 'Push Notifications'}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {isRTL ? 'تلقي إشعارات فورية على المتصفح' : 'Receive browser push notifications'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotificationSettings({...notificationSettings, pushNotifications: !notificationSettings.pushNotifications})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.pushNotifications 
                          ? isDark ? 'bg-purple-600' : 'bg-purple-500' 
                          : isDark ? 'bg-gray-600' : 'bg-gray-400'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.pushNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Course Updates */}
                  <div className={`flex items-center justify-between p-4 border rounded-xl ${
                    isDark 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <BookOpen className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {isRTL ? 'تحديثات الدورات' : 'Course Updates'}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {isRTL ? 'إشعارات عند إضافة محتوى جديد' : 'Notify when new content is added'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotificationSettings({...notificationSettings, courseUpdates: !notificationSettings.courseUpdates})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.courseUpdates 
                          ? isDark ? 'bg-green-600' : 'bg-green-500' 
                          : isDark ? 'bg-gray-600' : 'bg-gray-400'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.courseUpdates ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* New Messages */}
                  <div className={`flex items-center justify-between p-4 border rounded-xl ${
                    isDark 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <MessageCircle className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {isRTL ? 'الرسائل الجديدة' : 'New Messages'}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {isRTL ? 'إشعارات عند تلقي رسائل جديدة' : 'Notify about new messages'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotificationSettings({...notificationSettings, newMessages: !notificationSettings.newMessages})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.newMessages 
                          ? isDark ? 'bg-blue-600' : 'bg-blue-500' 
                          : isDark ? 'bg-gray-600' : 'bg-gray-400'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.newMessages ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Study Buddy Requests */}
                  <div className={`flex items-center justify-between p-4 border rounded-xl ${
                    isDark 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <Users className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {isRTL ? 'طلبات شريك الدراسة' : 'Study Buddy Requests'}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {isRTL ? 'إشعارات عند تلقي طلبات جديدة' : 'Notify about new buddy requests'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotificationSettings({...notificationSettings, studyBuddyRequests: !notificationSettings.studyBuddyRequests})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.studyBuddyRequests 
                          ? isDark ? 'bg-purple-600' : 'bg-purple-500' 
                          : isDark ? 'bg-gray-600' : 'bg-gray-400'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.studyBuddyRequests ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Marketing Emails */}
                  <div className={`flex items-center justify-between p-4 border rounded-xl ${
                    isDark 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <Mail className={`w-5 h-5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {isRTL ? 'رسائل تسويقية' : 'Marketing Emails'}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {isRTL ? 'تلقي عروض وأخبار خاصة' : 'Receive special offers and news'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotificationSettings({...notificationSettings, marketingEmails: !notificationSettings.marketingEmails})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.marketingEmails 
                          ? isDark ? 'bg-yellow-600' : 'bg-yellow-500' 
                          : isDark ? 'bg-gray-600' : 'bg-gray-400'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.marketingEmails ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Weekly Digest */}
                  <div className={`flex items-center justify-between p-4 border rounded-xl ${
                    isDark 
                      ? 'bg-white/5 border-white/10' 
                      : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="flex items-center space-x-3">
                      <FileText className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {isRTL ? 'ملخص أسبوعي' : 'Weekly Digest'}
                        </p>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {isRTL ? 'ملخص أسبوعي لتقدمك' : 'Weekly summary of your progress'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setNotificationSettings({...notificationSettings, weeklyDigest: !notificationSettings.weeklyDigest})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationSettings.weeklyDigest 
                          ? isDark ? 'bg-green-600' : 'bg-green-500' 
                          : isDark ? 'bg-gray-600' : 'bg-gray-400'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationSettings.weeklyDigest ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={saveNotificationSettings}
                    className={`flex-1 px-6 py-3 rounded-xl transition-all duration-200 text-white ${
                      isDark 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600' 
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                    }`}
                  >
                    {isRTL ? 'حفظ الإعدادات' : 'Save Settings'}
                  </motion.button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}