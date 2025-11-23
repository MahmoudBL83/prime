'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { CheckCircle, AlertCircle, ArrowRight, User, Calendar, Shield, Info } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface OnboardingProgress {
  currentStep: number
  completedSteps: string[]
  data: Record<string, any>
  isComplete: boolean
}

interface OnboardingWizardProps {
  userId?: string
  onComplete?: () => void
  embedded?: boolean
}

const ONBOARDING_STEPS = [
  {
    id: 'age-verification',
    title: 'Age Verification',
    description: 'Confirm your age to personalize your experience',
    icon: Calendar,
  },
  {
    id: 'guardian-consent',
    title: 'Guardian Consent',
    description: 'For users under 18, guardian approval is required',
    icon: Shield,
    conditional: true, // Only shown if user is under 18
  },
  {
    id: 'profile-completion',
    title: 'Complete Profile',
    description: 'Add details to personalize your learning journey',
    icon: User,
  },
  {
    id: 'preferences',
    title: 'Learning Preferences',
    description: 'Tell us about your interests and goals',
    icon: Info,
  },
]

export default function OnboardingWizard({ userId, onComplete, embedded = false }: OnboardingWizardProps) {
  const router = useRouter()
  const [progress, setProgress] = useState<OnboardingProgress | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isUnder18, setIsUnder18] = useState(false)
  const [guardianData, setGuardianData] = useState({
    email: '',
    name: '',
    relationship: 'parent',
  })

  useEffect(() => {
    fetchProgress()
  }, [])

  const fetchProgress = async () => {
    try {
      const response = await fetch('/api/onboarding/status')
      if (!response.ok) throw new Error('Failed to fetch onboarding progress')
      const data = await response.json()
      setProgress(data)
      setCurrentStep(data.currentStep || 0)
      setFormData(data.data || {})
      
      // Check if already complete
      if (data.isComplete && onComplete) {
        onComplete()
      }
    } catch (error) {
      console.error('Error fetching onboarding progress:', error)
      toast.error('Failed to load onboarding progress')
    } finally {
      setLoading(false)
    }
  }

  const handleAgeVerification = async (birthdate: string) => {
    const age = calculateAge(birthdate)
    const under18 = age < 18

    setIsUnder18(under18)
    setFormData({ ...formData, birthdate, age })

    try {
      const response = await fetch('/api/onboarding/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'age-verification',
          data: { birthdate, age, requiresGuardian: under18 },
        }),
      })

      if (!response.ok) throw new Error('Failed to save age verification')

      toast.success('Age verified')
      
      // If under 18, go to guardian consent step, otherwise skip it
      if (under18) {
        setCurrentStep(1) // guardian-consent
      } else {
        setCurrentStep(2) // profile-completion
      }
    } catch (error) {
      console.error('Error saving age verification:', error)
      toast.error('Failed to save age verification')
    }
  }

  const handleGuardianConsent = async () => {
    if (!guardianData.email || !guardianData.name) {
      toast.error('Please fill in all guardian details')
      return
    }

    try {
      const response = await fetch('/api/onboarding/guardian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(guardianData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send guardian consent')
      }

      toast.success('Guardian consent request sent! Please check their email.')
      setCurrentStep(2) // profile-completion
    } catch (error) {
      console.error('Error sending guardian consent:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send guardian consent')
    }
  }

  const handleProfileCompletion = async (profileData: any) => {
    try {
      const response = await fetch('/api/onboarding/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'profile-completion',
          data: profileData,
        }),
      })

      if (!response.ok) throw new Error('Failed to save profile')

      toast.success('Profile saved')
      setCurrentStep(3) // preferences
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to save profile')
    }
  }

  const handlePreferencesCompletion = async (preferences: any) => {
    try {
      const response = await fetch('/api/onboarding/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step: 'preferences',
          data: preferences,
        }),
      })

      if (!response.ok) throw new Error('Failed to save preferences')

      toast.success('Onboarding complete!')
      
      if (onComplete) {
        onComplete()
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error completing onboarding:', error)
      toast.error('Failed to complete onboarding')
    }
  }

  const calculateAge = (birthdate: string): number => {
    const today = new Date()
    const birth = new Date(birthdate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const steps = ONBOARDING_STEPS.filter(step => {
    if (step.id === 'guardian-consent') {
      return isUnder18 || formData.requiresGuardian
    }
    return true
  })

  const currentStepData = steps[currentStep]

  return (
    <div className={`${embedded ? '' : 'min-h-screen'} bg-background`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-foreground">Getting Started</h2>
            <span className="text-sm text-muted-foreground">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-600"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepData?.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-card rounded-lg shadow p-8"
          >
            <div className="flex items-center gap-4 mb-6">
              {currentStepData?.icon && <currentStepData.icon className="w-8 h-8 text-blue-600" />}
              <div>
                <h3 className="text-xl font-semibold text-foreground">{currentStepData?.title}</h3>
                <p className="text-muted-foreground">{currentStepData?.description}</p>
              </div>
            </div>

            {/* Age Verification Step */}
            {currentStepData?.id === 'age-verification' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleAgeVerification(e.target.value)}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    ℹ️ We need your age to comply with safety regulations and personalize your experience.
                    Users under 18 require guardian consent.
                  </p>
                </div>
              </div>
            )}

            {/* Guardian Consent Step */}
            {currentStepData?.id === 'guardian-consent' && (
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    🛡️ Since you are under 18, we need your parent or guardian to approve your account.
                    They will receive an email with a consent link.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Guardian's Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={guardianData.email}
                    onChange={(e) => setGuardianData({ ...guardianData, email: e.target.value })}
                    placeholder="guardian@example.com"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Guardian's Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={guardianData.name}
                    onChange={(e) => setGuardianData({ ...guardianData, name: e.target.value })}
                    placeholder="Full name"
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Relationship
                  </label>
                  <select
                    value={guardianData.relationship}
                    onChange={(e) => setGuardianData({ ...guardianData, relationship: e.target.value })}
                    className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="parent">Parent</option>
                    <option value="legal_guardian">Legal Guardian</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <button
                  onClick={handleGuardianConsent}
                  className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send Consent Request
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Profile Completion Step */}
            {currentStepData?.id === 'profile-completion' && (
              <ProfileCompletionForm onSubmit={handleProfileCompletion} />
            )}

            {/* Preferences Step */}
            {currentStepData?.id === 'preferences' && (
              <PreferencesForm onSubmit={handlePreferencesCompletion} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// Profile Completion Form Component
function ProfileCompletionForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [profile, setProfile] = useState({
    bio: '',
    location: '',
    occupation: '',
  })

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
        <textarea
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          placeholder="Tell us a bit about yourself..."
          rows={4}
          className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Location</label>
          <input
            type="text"
            value={profile.location}
            onChange={(e) => setProfile({ ...profile, location: e.target.value })}
            placeholder="City, Country"
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Occupation</label>
          <input
            type="text"
            value={profile.occupation}
            onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
            placeholder="Your current occupation"
            className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        onClick={() => onSubmit(profile)}
        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Continue
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  )
}

// Preferences Form Component
function PreferencesForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [preferences, setPreferences] = useState({
    interests: [] as string[],
    learningGoals: [] as string[],
    experienceLevel: 'beginner',
  })

  const interestOptions = ['Technology', 'Business', 'Design', 'Marketing', 'Science', 'Arts', 'Health', 'Finance']
  const goalOptions = ['Career Change', 'Skill Development', 'Personal Growth', 'Academic', 'Hobby', 'Professional Certification']

  const toggleInterest = (interest: string) => {
    setPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }))
  }

  const toggleGoal = (goal: string) => {
    setPreferences(prev => ({
      ...prev,
      learningGoals: prev.learningGoals.includes(goal)
        ? prev.learningGoals.filter(g => g !== goal)
        : [...prev.learningGoals, goal]
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          What are you interested in? (Select all that apply)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {interestOptions.map(interest => (
            <button
              key={interest}
              type="button"
              onClick={() => toggleInterest(interest)}
              className={`px-4 py-2 border rounded-lg transition-all ${
                preferences.interests.includes(interest)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-border hover:border-blue-300'
              }`}
            >
              {interest}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          What are your learning goals? (Select all that apply)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {goalOptions.map(goal => (
            <button
              key={goal}
              type="button"
              onClick={() => toggleGoal(goal)}
              className={`px-4 py-2 border rounded-lg transition-all ${
                preferences.learningGoals.includes(goal)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-border hover:border-blue-300'
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          What's your experience level?
        </label>
        <div className="grid grid-cols-3 gap-2">
          {['beginner', 'intermediate', 'advanced'].map(level => (
            <button
              key={level}
              type="button"
              onClick={() => setPreferences({ ...preferences, experienceLevel: level })}
              className={`px-4 py-2 border rounded-lg transition-all capitalize ${
                preferences.experienceLevel === level
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-border hover:border-blue-300'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onSubmit(preferences)}
        disabled={preferences.interests.length === 0 || preferences.learningGoals.length === 0}
        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Complete Onboarding
        <CheckCircle className="w-5 h-5" />
      </button>
    </div>
  )
}
