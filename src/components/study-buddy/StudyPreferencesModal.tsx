'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, MessageCircle, Brain, Target, Users, Calendar, Bell, Globe, X } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface StudyPreferences {
  // Study Time Preferences
  preferredStudyTimes: string[]
  timezone: string
  weeklyAvailability: Record<string, string[]>
  studyDuration: number

  // Communication Preferences
  communicationStyle: 'text' | 'voice' | 'video' | 'mixed'
  responseTime: 'immediate' | 'within_hour' | 'within_day' | 'flexible'
  languagePreference: 'arabic' | 'english' | 'both'

  // Learning Style Preferences
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading' | 'mixed'
  studyEnvironment: 'quiet' | 'background_music' | 'collaborative' | 'flexible'
  sessionStructure: 'structured' | 'flexible' | 'discussion_based' | 'problem_solving'

  // Subject and Skill Preferences
  subjectExpertise: string[]
  subjectsToLearn: string[]
  skillLevelPreference: 'beginner' | 'intermediate' | 'advanced' | 'mixed'

  // Compatibility Preferences
  ageRangePreference: '18-25' | '26-35' | '36-45' | '46+' | 'any'
  genderPreference: 'any' | 'same' | 'different'
  locationPreference: 'same_city' | 'same_country' | 'any'

  // Study Goals and Methods
  studyGoalType: 'exam_prep' | 'skill_building' | 'project_work' | 'general_learning'
  studyMethodPreference: string[]
  progressTracking: boolean

  // Session Preferences
  groupSizePreference: 'one_on_one' | 'small_group' | 'large_group' | 'flexible'
  sessionFrequency: 'daily' | 'weekly' | 'bi_weekly' | 'monthly' | 'flexible'

  // Notifications and Reminders
  reminderPreferences: {
    sessionReminders?: boolean
    matchNotifications?: boolean
    dailyDigest?: boolean
  }
  quietHours: {
    enabled?: boolean
    startTime?: string
    endTime?: string
  }
}

interface StudyPreferencesModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

export function StudyPreferencesModal({ isOpen, onClose, onSave }: StudyPreferencesModalProps) {
  const [preferences, setPreferences] = useState<StudyPreferences>({
    preferredStudyTimes: [],
    timezone: 'UTC',
    weeklyAvailability: {},
    studyDuration: 60,
    communicationStyle: 'mixed',
    responseTime: 'flexible',
    languagePreference: 'both',
    learningStyle: 'mixed',
    studyEnvironment: 'flexible',
    sessionStructure: 'flexible',
    subjectExpertise: [],
    subjectsToLearn: [],
    skillLevelPreference: 'mixed',
    ageRangePreference: 'any',
    genderPreference: 'any',
    locationPreference: 'any',
    studyGoalType: 'general_learning',
    studyMethodPreference: [],
    progressTracking: true,
    groupSizePreference: 'flexible',
    sessionFrequency: 'weekly',
    reminderPreferences: {
      sessionReminders: true,
      matchNotifications: true,
      dailyDigest: false,
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
    },
  })

  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(false)
  const [newSubject, setNewSubject] = useState('')
  const [newMethod, setNewMethod] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadPreferences()
    }
  }, [isOpen])

  const loadPreferences = async () => {
    try {
      const response = await fetch('/api/study-buddy/preferences')
      if (response.ok) {
        const data = await response.json()
        setPreferences(data.preferences)
      }
    } catch (error) {
      console.error('Failed to load preferences:', error)
    }
  }

  const savePreferences = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/study-buddy/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences)
      })

      if (response.ok) {
        toast.success('Study preferences saved successfully!')
        onSave()
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save preferences')
      }
    } catch (error) {
      toast.error('Failed to save preferences')
    } finally {
      setLoading(false)
    }
  }

  const addSubjectExpertise = () => {
    if (newSubject.trim() && !preferences.subjectExpertise.includes(newSubject.trim())) {
      setPreferences(prev => ({
        ...prev,
        subjectExpertise: [...prev.subjectExpertise, newSubject.trim()]
      }))
      setNewSubject('')
    }
  }

  const addSubjectToLearn = () => {
    if (newSubject.trim() && !preferences.subjectsToLearn.includes(newSubject.trim())) {
      setPreferences(prev => ({
        ...prev,
        subjectsToLearn: [...prev.subjectsToLearn, newSubject.trim()]
      }))
      setNewSubject('')
    }
  }

  const addStudyMethod = () => {
    if (newMethod.trim() && !preferences.studyMethodPreference.includes(newMethod.trim())) {
      setPreferences(prev => ({
        ...prev,
        studyMethodPreference: [...prev.studyMethodPreference, newMethod.trim()]
      }))
      setNewMethod('')
    }
  }

  const removeItem = (array: string[], item: string, field: string) => {
    setPreferences(prev => ({
      ...prev,
      [field]: array.filter(i => i !== item)
    }))
  }

  const tabs = [
    { id: 'general', label: 'General', icon: Clock },
    { id: 'communication', label: 'Communication', icon: MessageCircle },
    { id: 'learning', label: 'Learning Style', icon: Brain },
    { id: 'subjects', label: 'Subjects', icon: Target },
    { id: 'compatibility', label: 'Matching', icon: Users },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background border border-border rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Globe className="w-6 h-6 text-purple-400" />
            Study Preferences
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-64 border-r border-border bg-gray-800/50">
            <div className="p-4 space-y-2">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === id
                      ? 'bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-foreground border border-purple-500/30'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">General Preferences</h3>
                  
                  <div>
                    <label className="block text-foreground font-medium mb-2">Preferred Session Duration</label>
                    <select
                      value={preferences.studyDuration}
                      onChange={(e) => setPreferences(prev => ({ ...prev, studyDuration: parseInt(e.target.value) }))}
                      className="w-full px-4 py-3 bg-white/10 border border-border rounded-xl text-foreground focus:outline-none focus:border-purple-400"
                    >
                      <option value={30}>30 minutes</option>
                      <option value={60}>1 hour</option>
                      <option value={90}>1.5 hours</option>
                      <option value={120}>2 hours</option>
                      <option value={180}>3 hours</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-foreground font-medium mb-2">Timezone</label>
                    <select
                      value={preferences.timezone}
                      onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/10 border border-border rounded-xl text-foreground focus:outline-none focus:border-purple-400"
                    >
                      <option value="UTC">UTC</option>
                      <option value="Africa/Cairo">Cairo (EET)</option>
                      <option value="Europe/London">London (GMT)</option>
                      <option value="America/New_York">New York (EST)</option>
                      <option value="America/Los_Angeles">Los Angeles (PST)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-foreground font-medium mb-2">Study Goal Type</label>
                    <select
                      value={preferences.studyGoalType}
                      onChange={(e) => setPreferences(prev => ({ ...prev, studyGoalType: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-white/10 border border-border rounded-xl text-foreground focus:outline-none focus:border-purple-400"
                    >
                      <option value="exam_prep">Exam Preparation</option>
                      <option value="skill_building">Skill Building</option>
                      <option value="project_work">Project Work</option>
                      <option value="general_learning">General Learning</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="progressTracking"
                      checked={preferences.progressTracking}
                      onChange={(e) => setPreferences(prev => ({ ...prev, progressTracking: e.target.checked }))}
                      className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="progressTracking" className="text-foreground">Enable progress tracking</label>
                  </div>
                </div>
              )}

              {activeTab === 'communication' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Communication Preferences</h3>
                  
                  <div>
                    <label className="block text-foreground font-medium mb-2">Communication Style</label>
                    <select
                      value={preferences.communicationStyle}
                      onChange={(e) => setPreferences(prev => ({ ...prev, communicationStyle: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-white/10 border border-border rounded-xl text-foreground focus:outline-none focus:border-purple-400"
                    >
                      <option value="text">Text Only</option>
                      <option value="voice">Voice Calls</option>
                      <option value="video">Video Calls</option>
                      <option value="mixed">Mixed (All Methods)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-foreground font-medium mb-2">Response Time Expectation</label>
                    <select
                      value={preferences.responseTime}
                      onChange={(e) => setPreferences(prev => ({ ...prev, responseTime: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-white/10 border border-border rounded-xl text-foreground focus:outline-none focus:border-purple-400"
                    >
                      <option value="immediate">Immediate Response</option>
                      <option value="within_hour">Within 1 Hour</option>
                      <option value="within_day">Within 24 Hours</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-foreground font-medium mb-2">Language Preference</label>
                    <select
                      value={preferences.languagePreference}
                      onChange={(e) => setPreferences(prev => ({ ...prev, languagePreference: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-white/10 border border-border rounded-xl text-foreground focus:outline-none focus:border-purple-400"
                    >
                      <option value="arabic">Arabic Only</option>
                      <option value="english">English Only</option>
                      <option value="both">Both Languages</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'learning' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Learning Style Preferences</h3>
                  
                  <div>
                    <label className="block text-foreground font-medium mb-2">Learning Style</label>
                    <select
                      value={preferences.learningStyle}
                      onChange={(e) => setPreferences(prev => ({ ...prev, learningStyle: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-white/10 border border-border rounded-xl text-foreground focus:outline-none focus:border-purple-400"
                    >
                      <option value="visual">Visual (Charts, Diagrams)</option>
                      <option value="auditory">Auditory (Discussion, Listening)</option>
                      <option value="kinesthetic">Kinesthetic (Hands-on)</option>
                      <option value="reading">Reading/Writing</option>
                      <option value="mixed">Mixed Approach</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-foreground font-medium mb-2">Study Environment</label>
                    <select
                      value={preferences.studyEnvironment}
                      onChange={(e) => setPreferences(prev => ({ ...prev, studyEnvironment: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-white/10 border border-border rounded-xl text-foreground focus:outline-none focus:border-purple-400"
                    >
                      <option value="quiet">Quiet Environment</option>
                      <option value="background_music">Background Music</option>
                      <option value="collaborative">Collaborative/Social</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-foreground font-medium mb-2">Session Structure</label>
                    <select
                      value={preferences.sessionStructure}
                      onChange={(e) => setPreferences(prev => ({ ...prev, sessionStructure: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-white/10 border border-border rounded-xl text-foreground focus:outline-none focus:border-purple-400"
                    >
                      <option value="structured">Highly Structured</option>
                      <option value="flexible">Flexible Structure</option>
                      <option value="discussion_based">Discussion Based</option>
                      <option value="problem_solving">Problem Solving Focus</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'subjects' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Subject Preferences</h3>
                  
                  <div>
                    <label className="block text-foreground font-medium mb-2">Areas of Expertise (You can help others)</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubjectExpertise())}
                        className="flex-1 px-4 py-2 bg-white/10 border border-border rounded-xl text-foreground placeholder-gray-400 focus:outline-none focus:border-purple-400"
                        placeholder="Add subject expertise"
                      />
                      <button
                        type="button"
                        onClick={addSubjectExpertise}
                        className="px-4 py-2 bg-green-500 text-foreground rounded-xl hover:bg-green-600"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {preferences.subjectExpertise.map((subject, index) => (
                        <span 
                          key={index} 
                          className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm cursor-pointer hover:bg-red-500/20 hover:text-red-300"
                          onClick={() => removeItem(preferences.subjectExpertise, subject, 'subjectExpertise')}
                        >
                          {subject} ×
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-foreground font-medium mb-2">Subjects to Learn (You want help with)</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubjectToLearn())}
                        className="flex-1 px-4 py-2 bg-white/10 border border-border rounded-xl text-foreground placeholder-gray-400 focus:outline-none focus:border-purple-400"
                        placeholder="Add subject to learn"
                      />
                      <button
                        type="button"
                        onClick={addSubjectToLearn}
                        className="px-4 py-2 bg-blue-500 text-foreground rounded-xl hover:bg-blue-600"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {preferences.subjectsToLearn.map((subject, index) => (
                        <span 
                          key={index} 
                          className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm cursor-pointer hover:bg-red-500/20 hover:text-red-300"
                          onClick={() => removeItem(preferences.subjectsToLearn, subject, 'subjectsToLearn')}
                        >
                          {subject} ×
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-foreground font-medium mb-2">Skill Level Preference</label>
                    <select
                      value={preferences.skillLevelPreference}
                      onChange={(e) => setPreferences(prev => ({ ...prev, skillLevelPreference: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-white/10 border border-border rounded-xl text-foreground focus:outline-none focus:border-purple-400"
                    >
                      <option value="beginner">Beginner Level</option>
                      <option value="intermediate">Intermediate Level</option>
                      <option value="advanced">Advanced Level</option>
                      <option value="mixed">Any Level</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-foreground font-medium mb-2">Study Methods</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newMethod}
                        onChange={(e) => setNewMethod(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStudyMethod())}
                        className="flex-1 px-4 py-2 bg-white/10 border border-border rounded-xl text-foreground placeholder-gray-400 focus:outline-none focus:border-purple-400"
                        placeholder="Add study method"
                      />
                      <button
                        type="button"
                        onClick={addStudyMethod}
                        className="px-4 py-2 bg-purple-500 text-foreground rounded-xl hover:bg-purple-600"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {preferences.studyMethodPreference.map((method, index) => (
                        <span 
                          key={index} 
                          className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm cursor-pointer hover:bg-red-500/20 hover:text-red-300"
                          onClick={() => removeItem(preferences.studyMethodPreference, method, 'studyMethodPreference')}
                        >
                          {method} ×
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'compatibility' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Matching Preferences</h3>
                  
                  <div>
                    <label className="block text-foreground font-medium mb-2">Age Range Preference</label>
                    <select
                      value={preferences.ageRangePreference}
                      onChange={(e) => setPreferences(prev => ({ ...prev, ageRangePreference: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-white/10 border border-border rounded-xl text-foreground focus:outline-none focus:border-purple-400"
                    >
                      <option value="18-25">18-25 years</option>
                      <option value="26-35">26-35 years</option>
                      <option value="36-45">36-45 years</option>
                      <option value="46+">46+ years</option>
                      <option value="any">Any Age</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-foreground font-medium mb-2">Gender Preference</label>
                    <select
                      value={preferences.genderPreference}
                      onChange={(e) => setPreferences(prev => ({ ...prev, genderPreference: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-white/10 border border-border rounded-xl text-foreground focus:outline-none focus:border-purple-400"
                    >
                      <option value="any">Any Gender</option>
                      <option value="same">Same Gender</option>
                      <option value="different">Different Gender</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-foreground font-medium mb-2">Location Preference</label>
                    <select
                      value={preferences.locationPreference}
                      onChange={(e) => setPreferences(prev => ({ ...prev, locationPreference: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-white/10 border border-border rounded-xl text-foreground focus:outline-none focus:border-purple-400"
                    >
                      <option value="same_city">Same City</option>
                      <option value="same_country">Same Country</option>
                      <option value="any">Anywhere</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'schedule' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Schedule Preferences</h3>
                  
                  <div>
                    <label className="block text-foreground font-medium mb-2">Group Size Preference</label>
                    <select
                      value={preferences.groupSizePreference}
                      onChange={(e) => setPreferences(prev => ({ ...prev, groupSizePreference: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-white/10 border border-border rounded-xl text-foreground focus:outline-none focus:border-purple-400"
                    >
                      <option value="one_on_one">One-on-One Only</option>
                      <option value="small_group">Small Group (2-4 people)</option>
                      <option value="large_group">Large Group (5+ people)</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-foreground font-medium mb-2">Session Frequency</label>
                    <select
                      value={preferences.sessionFrequency}
                      onChange={(e) => setPreferences(prev => ({ ...prev, sessionFrequency: e.target.value as any }))}
                      className="w-full px-4 py-3 bg-white/10 border border-border rounded-xl text-foreground focus:outline-none focus:border-purple-400"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="bi_weekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Notification Preferences</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="sessionReminders"
                        checked={preferences.reminderPreferences.sessionReminders}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          reminderPreferences: {
                            ...prev.reminderPreferences,
                            sessionReminders: e.target.checked
                          }
                        }))}
                        className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="sessionReminders" className="text-foreground">Session reminders</label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="matchNotifications"
                        checked={preferences.reminderPreferences.matchNotifications}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          reminderPreferences: {
                            ...prev.reminderPreferences,
                            matchNotifications: e.target.checked
                          }
                        }))}
                        className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="matchNotifications" className="text-foreground">New match notifications</label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="dailyDigest"
                        checked={preferences.reminderPreferences.dailyDigest}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          reminderPreferences: {
                            ...prev.reminderPreferences,
                            dailyDigest: e.target.checked
                          }
                        }))}
                        className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="dailyDigest" className="text-foreground">Daily digest emails</label>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <input
                        type="checkbox"
                        id="quietHours"
                        checked={preferences.quietHours.enabled}
                        onChange={(e) => setPreferences(prev => ({
                          ...prev,
                          quietHours: {
                            ...prev.quietHours,
                            enabled: e.target.checked
                          }
                        }))}
                        className="w-4 h-4 text-purple-500 rounded focus:ring-purple-500"
                      />
                      <label htmlFor="quietHours" className="text-foreground">Enable quiet hours</label>
                    </div>

                    {preferences.quietHours.enabled && (
                      <div className="grid grid-cols-2 gap-4 ml-7">
                        <div>
                          <label className="block text-foreground font-medium mb-2">From</label>
                          <input
                            type="time"
                            value={preferences.quietHours.startTime}
                            onChange={(e) => setPreferences(prev => ({
                              ...prev,
                              quietHours: {
                                ...prev.quietHours,
                                startTime: e.target.value
                              }
                            }))}
                            className="w-full px-4 py-2 bg-white/10 border border-border rounded-xl text-foreground focus:outline-none focus:border-purple-400"
                          />
                        </div>
                        <div>
                          <label className="block text-foreground font-medium mb-2">To</label>
                          <input
                            type="time"
                            value={preferences.quietHours.endTime}
                            onChange={(e) => setPreferences(prev => ({
                              ...prev,
                              quietHours: {
                                ...prev.quietHours,
                                endTime: e.target.value
                              }
                            }))}
                            className="w-full px-4 py-2 bg-white/10 border border-border rounded-xl text-foreground focus:outline-none focus:border-purple-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border p-6">
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 text-foreground rounded-xl font-semibold hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={savePreferences}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-foreground rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}