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
        signIn: "/auth/login",
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
            // Only update token on sign-in or refresh
            if (user || trigger === "update") {
                if (user) {
                    token.id = user.id as string
                    token.role = user.role as UserRole
                }
            }
            return token
        },
        async session({ session, token }) {
            // Minimize session object size
            if (session?.user && token) {
                session.user.id = token.id as string
                session.user.role = token.role as UserRole
            }
            return session
        },
    },
    // Add performance optimizations
    useSecureCookies: process.env.NODE_ENV === "production",
    debug: process.env.NODE_ENV === "development",
}
