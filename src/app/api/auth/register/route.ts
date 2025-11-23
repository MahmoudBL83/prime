import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { UserRole } from "@prisma/client"

// Mark as Edge Runtime compatible or Node runtime
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(2),
    arabicName: z.string().optional(),
    phone: z.string().optional(),
    interests: z.array(z.string()).optional(),
    goals: z.array(z.string()).optional(),
})

export async function POST(req: NextRequest) {
    try {
        // Check if DATABASE_URL is configured
        if (!process.env.DATABASE_URL) {
            console.error("DATABASE_URL is not configured")
            return NextResponse.json(
                { error: "Database configuration error" },
                { status: 500 }
            )
        }

        const body = await req.json()
        const validation = registerSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues },
                { status: 400 }
            )
        }

        const { email, password, interests, goals, ...userData } = validation.data

        // Check if user exists
        const existing = await prisma.user.findUnique({
            where: { email },
        })

        if (existing) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 400 }
            )
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12)

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                interests: interests ? JSON.stringify(interests) : undefined,
                goals: goals ? JSON.stringify(goals) : undefined,
                ...userData,
            },
        })

        // TODO: Send verification email

        return NextResponse.json({
            message: "Registration successful",
            userId: user.id,
        })
    } catch (error) {
        console.error("Registration error:", error)
        
        // More detailed error logging for debugging
        if (error instanceof Error) {
            console.error("Error message:", error.message)
            console.error("Error stack:", error.stack)
        }
        
        return NextResponse.json(
            { error: "Internal server error", details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined },
            { status: 500 }
        )
    } finally {
        // Disconnect Prisma in serverless environment to prevent connection pooling issues
        await prisma.$disconnect()
    }
}
