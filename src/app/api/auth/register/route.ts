import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { UserRole } from "@prisma/client"

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
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
