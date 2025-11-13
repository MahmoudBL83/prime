// Quick test to see Prisma models
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Check what models are available
console.log('Available Prisma models:')
console.log(Object.keys(prisma))

// Try to find the correct casing
try {
    console.log('Testing instructorFollow...')
    // This should throw an error if it doesn't exist
} catch (error) {
    console.error('Error:', error)
}