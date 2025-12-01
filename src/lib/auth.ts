import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { UserRole } from "@prisma/client"

// Lazy imports to speed up compilation
const loginSchema = {
    safeParse: (data: any) => {
        if (!data?.email || !data?.password) {
            return { success: false }
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(data.email) || data.password.length < 6) {
            return { success: false }
        }
        return { success: true, data }
    }
}

export const authOptions: NextAuthOptions = {
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
        updateAge: 24 * 60 * 60, // 24 hours
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/?auth=signin",
        error: "/auth/error",
    },
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                try {
                    const validation = loginSchema.safeParse(credentials)

                    if (!validation.success) {
                        return null
                    }

                    // Lazy import Prisma only when needed
                    const { prisma } = await import("@/lib/prisma")
                    const bcrypt = await import("bcryptjs")

                    const user = await prisma.user.findUnique({
                        where: { email: validation.data.email },
                        select: {
                            id: true,
                            email: true,
                            name: true,
                            firstName: true,
                            lastName: true,
                            birthDate: true,
                            country: true,
                            role: true,
                            passwordHash: true,
                        }
                    })

                    if (!user || !user.passwordHash) {
                        return null
                    }

                    const passwordValid = await bcrypt.compare(
                        validation.data.password,
                        user.passwordHash
                    )

                    if (!passwordValid) {
                        return null
                    }

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        firstName: user.firstName ?? null,
                        lastName: user.lastName ?? null,
                        birthDate: user.birthDate ?? null,
                        country: user.country ?? null,
                        role: user.role as UserRole,
                    }
                } catch (error) {
                    console.error("Auth error:", error)
                    return null
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user, trigger }) {
            // Set initial token data on sign-in
            if (user) {
                token.id = user.id as string
                token.role = user.role as UserRole
                token.firstName = (user as any).firstName ?? null
                token.lastName = (user as any).lastName ?? null
                token.birthDate = (user as any).birthDate ? new Date((user as any).birthDate).toISOString() : null
                token.country = (user as any).country ?? null
            }
            
            // Always check creator status (on sign-in and subsequent requests)
            if (token.id) {
                try {
                    const { prisma } = await import("@/lib/prisma")
                    
                    // Check if user has creator profile
                    const creator = await prisma.creator.findUnique({
                        where: { userId: token.id as string },
                        select: { id: true }
                    })
                    token.isCreator = !!creator
                    
                    // Check creator application status
                    const application = await prisma.creatorApplication.findUnique({
                        where: { userId: token.id as string },
                        select: { status: true }
                    })
                    token.applicationStatus = application?.status || null
                } catch (error) {
                    console.error("Error checking creator status:", error)
                }
            }
            
            return token
        },
        async session({ session, token }) {
            // Minimize session object size
            if (session?.user && token) {
                session.user.id = token.id as string
                session.user.role = token.role as UserRole
                session.user.firstName = token.firstName as string | null
                session.user.lastName = token.lastName as string | null
                session.user.birthDate = token.birthDate as string | null
                session.user.country = token.country as string | null
                session.user.isCreator = token.isCreator as boolean
                session.user.applicationStatus = token.applicationStatus as string | null
            }
            return session
        },
    },
    // Add performance optimizations
    useSecureCookies: process.env.NODE_ENV === "production",
    debug: process.env.NODE_ENV === "development",
}
