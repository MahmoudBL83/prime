/** Display copy for legacy catalog records that were seeded with TV show names. */
const legacyCopy: Record<string, { title: string; description: string }> = {
    'The Lost Bus': {
        title: 'German for Everyday Life',
        description: 'Build practical German for conversations, daily routines, and navigating life with confidence.',
    },
    Severance: {
        title: 'Advanced German in Practice',
        description: 'Strengthen your grammar, fluency, and professional communication in German.',
    },
    Pluribus: {
        title: 'Freelance Foundations',
        description: 'Learn how to define your services, find clients, and build a sustainable freelance practice.',
    },
    Foundation: {
        title: 'Build Your Freelance Career',
        description: 'Create a portfolio, price your work, and turn your skills into paid projects.',
    },
    'High Potential': {
        title: 'Startup Essentials',
        description: 'Turn a business idea into a practical plan and prepare for your first launch.',
    },
    Invasion: {
        title: 'Launch and Grow a Startup',
        description: 'Explore customer discovery, funding basics, and early growth strategies.',
    },
    'Morning Show': {
        title: 'Trading Fundamentals',
        description: 'Understand market basics, risk, and the habits behind a disciplined trading plan.',
    },
    'Ted Lasso': {
        title: 'AI and Coding Foundations',
        description: 'Start with programming concepts and learn how modern AI tools work.',
    },
    'Slow Horses': {
        title: 'Your Guide to Life in Germany',
        description: 'Explore everyday systems, culture, and practical steps for settling in Germany.',
    },
}

export function presentCourse<T extends { title: string; description: string; thumbnail?: string | null }>(course: T): T {
    const copy = legacyCopy[course.title]
    if (!copy) return course
    return { ...course, ...copy, titleAr: copy.title, titleDe: copy.title, descriptionAr: copy.description, descriptionDe: copy.description, thumbnail: null }
}
