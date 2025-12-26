import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const signupSchema = z.object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters")
})

export async function POST(req: NextRequest) {
    try {
        const json = await req.json().catch(() => null)

        const parsed = signupSchema.safeParse(json)
        if (!parsed.success) {
            return NextResponse.json(
                { error: parsed.error.issues.map((i) => i.message).join(", ") },
                { status: 400 }
            )
        }

        const { name, email, password } = parsed.data

        const existing = await prisma.user.findUnique({ where: { email } })
        if (existing) {
            return NextResponse.json(
                { error: "User already exists" },
                { status: 409 }
            )
        }

        const passwordHash = await bcrypt.hash(password, 12)

        const [firstName, ...rest] = name.trim().split(" ")
        const lastName = rest.join(" ").trim()

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name: name.trim(),
                firstName: firstName || undefined,
                lastName: lastName || undefined
            }
        })

        return NextResponse.json({ message: "Account created", userId: user.id })
    } catch (error) {
        console.error("Signup error:", error)
        return NextResponse.json(
            { error: "Failed to create account" },
            { status: 500 }
        )
    }
}
