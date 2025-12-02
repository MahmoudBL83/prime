import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const signupSchema = z.object({
    email: z.string().email("Invalid email address"),
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validation = signupSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues?.[0]?.message || "Invalid input" },
                { status: 400 }
            )
        }

        const { email, name } = validation.data

        // Check if email already exists
        const existing = await prisma.earlyAccessSignup.findUnique({
            where: { email },
        })

        if (existing) {
            return NextResponse.json(
                { message: "You're already on the waitlist! We'll notify you when we launch." },
                { status: 200 }
            )
        }

        // Create new signup
        await prisma.earlyAccessSignup.create({
            data: {
                email,
                name: name || null,
            },
        })

        return NextResponse.json(
            { message: "Success! We'll send you an access link when the platform launches." },
            { status: 201 }
        )
    } catch (error) {
        console.error("Early access signup error:", error)
        return NextResponse.json(
            { error: "Failed to process signup. Please try again." },
            { status: 500 }
        )
    }
}
