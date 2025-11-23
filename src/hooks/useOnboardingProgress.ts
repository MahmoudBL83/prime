import { useState, useEffect, useCallback } from 'react'

interface StepProgress {
  key: string
  title: string
  completed: boolean
  lastUpdated?: string
  data?: Record<string, any>
}

interface GuardianLink {
  id: string
  guardianName: string
  guardianEmail: string
  guardianPhone?: string | null
  relationship?: string | null
  status: 'PENDING' | 'VERIFIED' | 'REJECTED'
  verificationCode: string
  verifiedAt?: string | null
  expiresAt?: string | null
}

interface UserVerification {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED'
  verifiedAt?: string | null
}

interface OnboardingStatusResponse {
  progress: {
    id: string
    userId: string
    steps: StepProgress[]
    completed: boolean
    completedAt?: string | null
    lastStep?: string | null
    locale?: string | null
  }
  guardianRequired: boolean
  guardianLink: GuardianLink | null
  guardianVerification: UserVerification | null
  onboardingCompleted: boolean
}

interface UpdateStepPayload {
  stepKey: string
  data?: Record<string, any>
  completed?: boolean
  locale?: string
}

interface GuardianPayload {
  name: string
  email: string
  phone?: string
  relationship?: string
  locale?: string
}

export const useOnboardingProgress = () => {
  const [status, setStatus] = useState<OnboardingStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/onboarding/status', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error('Failed to load onboarding status')
      }
      const data: OnboardingStatusResponse = await response.json()
      setStatus(data)
      setError(null)
    } catch (err) {
      console.error('Onboarding status fetch error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const updateStep = useCallback(async ({ stepKey, data, completed, locale }: UpdateStepPayload) => {
    try {
      const response = await fetch('/api/onboarding/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepKey, data, completed, locale })
      })

      if (!response.ok) {
        throw new Error('Failed to update onboarding step')
      }

      const payload = await response.json()
      setStatus((prev) => prev ? { ...prev, progress: payload.progress, onboardingCompleted: payload.completed || prev.onboardingCompleted } : prev)
      return payload
    } catch (err) {
      console.error('Onboarding step update error:', err)
      throw err
    }
  }, [])

  const initiateGuardian = useCallback(async (payload: GuardianPayload) => {
    const response = await fetch('/api/onboarding/guardian', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}))
      throw new Error(errorPayload.error || 'Failed to start guardian verification')
    }

    await fetchStatus()
    return response.json()
  }, [fetchStatus])

  const verifyGuardian = useCallback(async (code: string) => {
    const response = await fetch('/api/onboarding/guardian', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    })

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}))
      throw new Error(errorPayload.error || 'Failed to verify guardian')
    }

    const data = await response.json()
    await fetchStatus()
    return data
  }, [fetchStatus])

  return {
    status,
    loading,
    error,
    refresh: fetchStatus,
    updateStep,
    initiateGuardian,
    verifyGuardian
  }
}
