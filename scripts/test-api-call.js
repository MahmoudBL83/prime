// Test script to simulate the exact API call from the frontend
const testProfileUpdate = async () => {
    console.log('🧪 Testing Profile Update API Call')
    console.log('================================')

    const testData = {
        bio: 'Test bio from API test script',
        interests: ['JavaScript', 'React', 'Next.js'],
        goals: ['Learn TypeScript', 'Build projects', 'Get certified'],
        skillLevel: 'INTERMEDIATE',
        learningMode: 'online',
        studyBuddyPreferences: {}
    }

    try {
        const response = await fetch('http://localhost:3001/api/study-buddy/profile', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                // You'll need to add authentication headers here
            },
            body: JSON.stringify(testData)
        })

        console.log('Response status:', response.status)
        const data = await response.json()
        console.log('Response data:', data)

    } catch (error) {
        console.error('API test error:', error)
    }
}

// For browser console testing
if (typeof window !== 'undefined') {
    window.testProfileUpdate = testProfileUpdate
}

export { testProfileUpdate }