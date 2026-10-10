export type SwipeAction = 'like' | 'superlike' | 'pass'

export interface BuddyCandidate {
    id: string
    name: string
    arabicName?: string | null
    bio?: string | null
    interests: string[]
    goals: string[]
    skillLevel: string | null
    learningMode?: string | null
    profileImage?: string | null
    compatibilityScore: number
    compatibilityBreakdown?: Partial<Record<
        | 'interestsScore'
        | 'goalsScore'
        | 'skillLevelScore'
        | 'communicationScore'
        | 'learningStyleScore'
        | 'scheduleScore'
        | 'subjectScore'
        | 'preferencesScore',
        number
    >>
    sharedInterests: string[]
    sharedGoals: string[]
    reasonsForMatch?: string[]
    /** This learner already swiped right on the viewer */
    likedYou?: boolean
}

export interface BuddyMatch {
    id: string
    status: string
    likedByMe?: boolean
    chatRoomId?: string | null
    createdAt: string
    updatedAt: string
    sharedSubjects?: string[]
    sharedGoals?: string[]
    otherUser: {
        id: string
        name: string
        arabicName?: string | null
        profileImage?: string | null
        interests: string[]
        goals: string[]
        skillLevel: string | null
        learningMode?: string | null
    }
}

/** Tinder brand gradient used for accents in the Study Buddy section */
export const TINDER_GRADIENT = 'linear-gradient(262deg, #ff7854 0%, #fd267d 100%)'

export const SWIPE_COLORS = {
    nope: '#fd5068',
    like: '#1be4a1',
    superlike: '#1786ff',
    rewind: '#f5b748',
    profile: '#a84af4',
} as const

export function firstNameOf(name: string): string {
    return name.trim().split(/\s+/)[0] || name
}

export function formatSkillLevel(level: string | null | undefined): string {
    if (!level) return ''
    const lower = level.toLowerCase().replace(/_/g, ' ')
    return lower.charAt(0).toUpperCase() + lower.slice(1)
}

export function formatLearningMode(mode: string | null | undefined): string {
    if (!mode) return ''
    const map: Record<string, string> = {
        online: 'Studies online',
        offline: 'Studies in person',
        hybrid: 'Online & in person',
        self_paced: 'Self-paced learner',
        group: 'Loves group study',
    }
    return map[mode.toLowerCase()] ?? mode.replace(/_/g, ' ')
}
