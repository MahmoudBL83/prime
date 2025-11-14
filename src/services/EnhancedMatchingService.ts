import { prisma } from '@/lib/prisma'

interface User {
  id: string
  name: string
  arabicName?: string | null
  profileImage?: string | null
  interests: string
  goals: string
  skillLevel: string | null
  learningMode?: string | null
  studyPreferences?: StudyPreferences | null
}

interface StudyPreferences {
  communicationStyle: string | null
  responseTime: string | null
  languagePreference: string | null
  learningStyle: string | null
  studyEnvironment: string | null
  sessionStructure: string | null
  subjectExpertise: any
  subjectsToLearn: any
  skillLevelPreference: string | null
  ageRangePreference: string | null
  genderPreference: string | null
  locationPreference: string | null
  studyGoalType: string | null
  studyMethodPreference: any
  groupSizePreference: string | null
  sessionFrequency: string | null
  studyDuration: number | null
  weeklyAvailability: any
}

interface CompatibilityScore {
  userId: string
  totalScore: number
  breakdown: {
    interestsScore: number
    goalsScore: number
    skillLevelScore: number
    communicationScore: number
    learningStyleScore: number
    scheduleScore: number
    subjectScore: number
    preferencesScore: number
  }
  sharedInterests: string[]
  sharedGoals: string[]
  reasonsForMatch: string[]
}

export class EnhancedMatchingService {
  
  static async findMatches(userId: string, limit: number = 20): Promise<CompatibilityScore[]> {
    try {
      console.log('🔍 Enhanced Matching Service - Finding matches for user ID:', userId)
      
      // Get current user with preferences
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          studyPreferences: true,
        },
      })

      if (!currentUser) {
        console.error('❌ Enhanced Matching Service - User not found for ID:', userId)
        
        // Let's also check if this user exists with a different ID format
        const userByEmail = await prisma.user.findFirst({
          where: { 
            OR: [
              { email: { contains: userId } },
              { id: { contains: userId } }
            ]
          },
          select: { id: true, email: true, name: true }
        })
        
        if (userByEmail) {
          console.error('❌ Found similar user:', userByEmail)
        }
        
        throw new Error('User not found')
      }

      console.log('✅ Enhanced Matching Service - Found user:', {
        id: currentUser.id,
        email: currentUser.email,
        name: currentUser.name,
        role: currentUser.role,
        onboardingCompleted: currentUser.onboardingCompleted,
        hasPreferences: !!currentUser.studyPreferences
      })

      // Get all potential matches (other learners, excluding current user)
      const potentialMatches = await prisma.user.findMany({
        where: {
          id: { not: userId },
          role: 'LEARNER',
          onboardingCompleted: true,
        },
        include: {
          studyPreferences: true,
        },
      })

      // Get existing matches to exclude them
      const existingMatches = await prisma.studyBuddyMatch.findMany({
        where: {
          OR: [
            { user1Id: userId },
            { user2Id: userId },
          ],
        },
        select: {
          user1Id: true,
          user2Id: true,
        },
      })

      const excludedUserIds = new Set(
        existingMatches.map(match =>
          match.user1Id === userId ? match.user2Id : match.user1Id
        )
      )

      // Filter out users with existing matches
      const availableMatches = potentialMatches.filter(
        user => !excludedUserIds.has(user.id)
      )

      // Calculate compatibility scores
      const compatibilityScores = availableMatches.map(user =>
        this.calculateCompatibility(currentUser as any, user as any)
      )

      // Sort by total score and return top matches
      return compatibilityScores
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, limit)

    } catch (error) {
      console.error('Error finding matches:', error)
      throw error
    }
  }

  private static calculateCompatibility(user1: User, user2: User): CompatibilityScore {
    const breakdown = {
      interestsScore: this.calculateInterestsCompatibility(user1, user2),
      goalsScore: this.calculateGoalsCompatibility(user1, user2),
      skillLevelScore: this.calculateSkillLevelCompatibility(user1, user2),
      communicationScore: this.calculateCommunicationCompatibility(user1, user2),
      learningStyleScore: this.calculateLearningStyleCompatibility(user1, user2),
      scheduleScore: this.calculateScheduleCompatibility(user1, user2),
      subjectScore: this.calculateSubjectCompatibility(user1, user2),
      preferencesScore: this.calculatePreferencesCompatibility(user1, user2),
    }

    // Weighted total score
    const weights = {
      interestsScore: 0.20,      // 20% - shared interests
      goalsScore: 0.15,          // 15% - shared goals
      skillLevelScore: 0.10,     // 10% - compatible skill levels
      communicationScore: 0.15,  // 15% - communication compatibility
      learningStyleScore: 0.10,  // 10% - learning style match
      scheduleScore: 0.10,       // 10% - schedule overlap
      subjectScore: 0.15,        // 15% - subject expertise/needs match
      preferencesScore: 0.05,    // 5% - other preferences
    }

    const totalScore = Object.entries(breakdown).reduce(
      (sum, [key, score]) => sum + score * (weights[key as keyof typeof weights] || 0),
      0
    )

    const sharedInterests = this.getSharedItems(
      this.parseStringArray(user1.interests),
      this.parseStringArray(user2.interests)
    )

    const sharedGoals = this.getSharedItems(
      this.parseStringArray(user1.goals),
      this.parseStringArray(user2.goals)
    )

    const reasonsForMatch = this.generateMatchReasons(user1, user2, breakdown, sharedInterests, sharedGoals)

    return {
      userId: user2.id,
      totalScore: Math.round(totalScore * 100), // Convert to 0-100 scale
      breakdown: {
        ...breakdown,
        interestsScore: Math.round(breakdown.interestsScore * 100),
        goalsScore: Math.round(breakdown.goalsScore * 100),
        skillLevelScore: Math.round(breakdown.skillLevelScore * 100),
        communicationScore: Math.round(breakdown.communicationScore * 100),
        learningStyleScore: Math.round(breakdown.learningStyleScore * 100),
        scheduleScore: Math.round(breakdown.scheduleScore * 100),
        subjectScore: Math.round(breakdown.subjectScore * 100),
        preferencesScore: Math.round(breakdown.preferencesScore * 100),
      },
      sharedInterests,
      sharedGoals,
      reasonsForMatch,
    }
  }

  private static calculateInterestsCompatibility(user1: User, user2: User): number {
    const interests1 = this.parseStringArray(user1.interests)
    const interests2 = this.parseStringArray(user2.interests)
    
    if (interests1.length === 0 || interests2.length === 0) return 0.3 // Default score if no interests
    
    const sharedInterests = this.getSharedItems(interests1, interests2)
    const totalInterests = new Set([...interests1, ...interests2]).size
    
    return sharedInterests.length / Math.max(interests1.length, interests2.length)
  }

  private static calculateGoalsCompatibility(user1: User, user2: User): number {
    const goals1 = this.parseStringArray(user1.goals)
    const goals2 = this.parseStringArray(user2.goals)
    
    if (goals1.length === 0 || goals2.length === 0) return 0.3 // Default score if no goals
    
    const sharedGoals = this.getSharedItems(goals1, goals2)
    return sharedGoals.length / Math.max(goals1.length, goals2.length)
  }

  private static calculateSkillLevelCompatibility(user1: User, user2: User): number {
    const level1 = user1.skillLevel?.toLowerCase()
    const level2 = user2.skillLevel?.toLowerCase()
    
    if (!level1 || !level2) return 0.5 // Default score if no skill level
    
    const levels = ['beginner', 'intermediate', 'advanced']
    const index1 = levels.indexOf(level1)
    const index2 = levels.indexOf(level2)
    
    if (index1 === -1 || index2 === -1) return 0.5
    
    // Perfect match for same level, good match for adjacent levels
    const difference = Math.abs(index1 - index2)
    if (difference === 0) return 1.0
    if (difference === 1) return 0.7
    return 0.3
  }

  private static calculateCommunicationCompatibility(user1: User, user2: User): number {
    const prefs1 = user1.studyPreferences
    const prefs2 = user2.studyPreferences
    
    if (!prefs1 || !prefs2) return 0.5 // Default if no preferences
    
    let score = 0
    let factors = 0
    
    // Communication style compatibility
    if (prefs1.communicationStyle && prefs2.communicationStyle) {
      if (prefs1.communicationStyle === prefs2.communicationStyle || 
          prefs1.communicationStyle === 'mixed' || prefs2.communicationStyle === 'mixed') {
        score += 1
      } else {
        score += 0.3
      }
      factors++
    }
    
    // Language preference compatibility
    if (prefs1.languagePreference && prefs2.languagePreference) {
      if (prefs1.languagePreference === prefs2.languagePreference || 
          prefs1.languagePreference === 'both' || prefs2.languagePreference === 'both') {
        score += 1
      } else {
        score += 0.2
      }
      factors++
    }
    
    // Response time compatibility
    if (prefs1.responseTime && prefs2.responseTime) {
      const responseCompatibility = this.calculateResponseTimeCompatibility(prefs1.responseTime, prefs2.responseTime)
      score += responseCompatibility
      factors++
    }
    
    return factors > 0 ? score / factors : 0.5
  }

  private static calculateLearningStyleCompatibility(user1: User, user2: User): number {
    const prefs1 = user1.studyPreferences
    const prefs2 = user2.studyPreferences
    
    if (!prefs1 || !prefs2) return 0.5
    
    let score = 0
    let factors = 0
    
    // Learning style compatibility
    if (prefs1.learningStyle && prefs2.learningStyle) {
      if (prefs1.learningStyle === prefs2.learningStyle || 
          prefs1.learningStyle === 'mixed' || prefs2.learningStyle === 'mixed') {
        score += 1
      } else {
        score += 0.4
      }
      factors++
    }
    
    // Study environment compatibility
    if (prefs1.studyEnvironment && prefs2.studyEnvironment) {
      if (prefs1.studyEnvironment === prefs2.studyEnvironment || 
          prefs1.studyEnvironment === 'flexible' || prefs2.studyEnvironment === 'flexible') {
        score += 1
      } else {
        score += 0.3
      }
      factors++
    }
    
    // Session structure compatibility
    if (prefs1.sessionStructure && prefs2.sessionStructure) {
      if (prefs1.sessionStructure === prefs2.sessionStructure || 
          prefs1.sessionStructure === 'flexible' || prefs2.sessionStructure === 'flexible') {
        score += 1
      } else {
        score += 0.4
      }
      factors++
    }
    
    return factors > 0 ? score / factors : 0.5
  }

  private static calculateScheduleCompatibility(user1: User, user2: User): number {
    const prefs1 = user1.studyPreferences
    const prefs2 = user2.studyPreferences
    
    if (!prefs1 || !prefs2 || !prefs1.weeklyAvailability || !prefs2.weeklyAvailability) {
      return 0.5 // Default if no schedule data
    }
    
    // Simple schedule overlap calculation
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    let totalOverlap = 0
    let daysChecked = 0
    
    for (const day of days) {
      const slots1 = prefs1.weeklyAvailability[day] || []
      const slots2 = prefs2.weeklyAvailability[day] || []
      
      if (Array.isArray(slots1) && Array.isArray(slots2) && slots1.length > 0 && slots2.length > 0) {
        // Check if there's any time overlap
        const hasOverlap = slots1.some(slot1 => 
          slots2.some(slot2 => this.hasTimeOverlap(slot1, slot2))
        )
        if (hasOverlap) totalOverlap++
        daysChecked++
      }
    }
    
    return daysChecked > 0 ? totalOverlap / daysChecked : 0.5
  }

  private static calculateSubjectCompatibility(user1: User, user2: User): number {
    const prefs1 = user1.studyPreferences
    const prefs2 = user2.studyPreferences
    
    if (!prefs1 || !prefs2) return 0.3
    
    const expertise1 = Array.isArray(prefs1.subjectExpertise) ? prefs1.subjectExpertise : []
    const toLearn1 = Array.isArray(prefs1.subjectsToLearn) ? prefs1.subjectsToLearn : []
    const expertise2 = Array.isArray(prefs2.subjectExpertise) ? prefs2.subjectExpertise : []
    const toLearn2 = Array.isArray(prefs2.subjectsToLearn) ? prefs2.subjectsToLearn : []
    
    // Perfect match: one person's expertise matches other's learning needs
    const canHelp1 = this.getSharedItems(expertise1, toLearn2).length
    const canHelp2 = this.getSharedItems(expertise2, toLearn1).length
    const mutualHelp = canHelp1 + canHelp2
    
    // Shared learning interests
    const sharedLearning = this.getSharedItems(toLearn1, toLearn2).length
    
    // Calculate score based on mutual benefit
    const maxPossible = Math.max(toLearn1.length + toLearn2.length, 1)
    return (mutualHelp * 1.5 + sharedLearning) / maxPossible
  }

  private static calculatePreferencesCompatibility(user1: User, user2: User): number {
    const prefs1 = user1.studyPreferences
    const prefs2 = user2.studyPreferences
    
    if (!prefs1 || !prefs2) return 0.5
    
    let score = 0
    let factors = 0
    
    // Group size preference
    if (prefs1.groupSizePreference && prefs2.groupSizePreference) {
      if (prefs1.groupSizePreference === prefs2.groupSizePreference || 
          prefs1.groupSizePreference === 'flexible' || prefs2.groupSizePreference === 'flexible') {
        score += 1
      } else {
        score += 0.3
      }
      factors++
    }
    
    // Session frequency
    if (prefs1.sessionFrequency && prefs2.sessionFrequency) {
      if (prefs1.sessionFrequency === prefs2.sessionFrequency || 
          prefs1.sessionFrequency === 'flexible' || prefs2.sessionFrequency === 'flexible') {
        score += 1
      } else {
        score += 0.4
      }
      factors++
    }
    
    return factors > 0 ? score / factors : 0.5
  }

  // Helper methods
  private static parseStringArray(str: string | null | undefined): string[] {
    if (!str) return []
    return str.split(',').map(item => item.trim()).filter(item => item.length > 0)
  }

  private static getSharedItems(arr1: string[], arr2: string[]): string[] {
    return arr1.filter(item => 
      arr2.some(item2 => 
        item.toLowerCase().includes(item2.toLowerCase()) || 
        item2.toLowerCase().includes(item.toLowerCase())
      )
    )
  }

  private static calculateResponseTimeCompatibility(time1: string, time2: string): number {
    const priority = { 'immediate': 4, 'within_hour': 3, 'within_day': 2, 'flexible': 1 }
    const diff = Math.abs((priority[time1 as keyof typeof priority] || 1) - (priority[time2 as keyof typeof priority] || 1))
    return 1 - (diff / 3) // Normalize to 0-1 range
  }

  private static hasTimeOverlap(slot1: string, slot2: string): boolean {
    // Simple overlap check for time slots in format "HH:MM-HH:MM"
    try {
      const [start1, end1] = slot1.split('-')
      const [start2, end2] = slot2.split('-')
      
      const start1Min = this.timeToMinutes(start1)
      const end1Min = this.timeToMinutes(end1)
      const start2Min = this.timeToMinutes(start2)
      const end2Min = this.timeToMinutes(end2)
      
      return start1Min < end2Min && end1Min > start2Min
    } catch {
      return false
    }
  }

  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }

  private static generateMatchReasons(user1: User, user2: User, breakdown: any, sharedInterests: string[], sharedGoals: string[]): string[] {
    const reasons: string[] = []
    
    if (sharedInterests.length > 0) {
      reasons.push(`Shared interests: ${sharedInterests.slice(0, 3).join(', ')}`)
    }
    
    if (sharedGoals.length > 0) {
      reasons.push(`Common goals: ${sharedGoals.slice(0, 2).join(', ')}`)
    }
    
    if (breakdown.skillLevelScore > 0.7) {
      reasons.push('Compatible skill levels')
    }
    
    if (breakdown.communicationScore > 0.8) {
      reasons.push('Excellent communication compatibility')
    }
    
    if (breakdown.scheduleScore > 0.6) {
      reasons.push('Good schedule alignment')
    }
    
    if (breakdown.subjectScore > 0.5) {
      reasons.push('Complementary subject expertise')
    }
    
    return reasons.slice(0, 4) // Limit to top 4 reasons
  }
}
