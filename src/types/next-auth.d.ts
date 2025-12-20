import { UserRole } from "@prisma/client"
import "next-auth"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            email: string
            name: string
            firstName?: string | null
            lastName?: string | null
            birthDate?: string | null
            country?: string | null
            role: UserRole
            subscriptionStatus?: 'NONE' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
            image?: string
            isCreator?: boolean
            applicationStatus?: string | null
            kycStatus?: string | null
        }
    }

    interface User {
        id: string
        email: string
        name: string
        firstName?: string | null
        lastName?: string | null
        birthDate?: Date | null
        country?: string | null
        role: UserRole
        subscriptionStatus?: 'NONE' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
        image?: string
        isCreator?: boolean
        applicationStatus?: string | null
        kycStatus?: string | null
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string
        role: UserRole
        firstName?: string | null
        lastName?: string | null
        birthDate?: string | null
        country?: string | null
        subscriptionStatus?: 'NONE' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
        isCreator?: boolean
        applicationStatus?: string | null
        kycStatus?: string | null
    }
}
