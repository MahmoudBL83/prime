import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

interface OnboardingStatus {
  isComplete: boolean
  currentStep: number
  requiresGuardian?: boolean
  guardianApproved?: boolean
}

export function useOnboardingStatus() {
  const { data: session } = useSession()
  const [status, setStatus] = useState<OnboardingStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) {
      setLoading(false)
      return
    }

    fetchStatus()
  }, [session])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/onboarding/status')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
      }
    } catch (error) {
      console.error('Error fetching onboarding status:', error)
    } finally {
      setLoading(false)
    }
  }

  return { status, loading, refetch: fetchStatus }
}
