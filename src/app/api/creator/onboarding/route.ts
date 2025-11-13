import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || !session.user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const formData = await req.formData()

        // Extract all form fields
        const fullName = formData.get('fullName') as string
        const arabicName = formData.get('arabicName') as string || ''
        const email = formData.get('email') as string
        const phone = formData.get('phone') as string
        const country = formData.get('country') as string || ''
        const city = formData.get('city') as string || ''
        const bio = formData.get('bio') as string || ''
        const bioAr = formData.get('bioAr') as string || ''
        const expertise = formData.get('expertise') as string
        const yearsOfExperience = formData.get('yearsOfExperience') as string
        const education = formData.get('education') as string || ''
        const languages = JSON.parse(formData.get('languages') as string || '[]')
        const socialLinks = JSON.parse(formData.get('socialLinks') as string || '{}')

        // Handle file uploads
        const idDocument = formData.get('idDocument')
        const certificate = formData.get('certificate')
        const taxForm = formData.get('taxForm')

        let idDocumentPath = ''
        let certificatePath = ''
        let taxFormPath = ''

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'kyc')
        await mkdir(uploadsDir, { recursive: true })

        // Save ID document
        if (idDocument && idDocument instanceof File && idDocument.size > 0) {
            const buffer = Buffer.from(await idDocument.arrayBuffer())
            const filename = `id_${session.user.id}_${Date.now()}${path.extname(idDocument.name)}`
            const filepath = path.join(uploadsDir, filename)
            await writeFile(filepath, buffer)
            idDocumentPath = `/uploads/kyc/${filename}`
        }

        // Save certificate
        if (certificate && certificate instanceof File && certificate.size > 0) {
            const buffer = Buffer.from(await certificate.arrayBuffer())
            const filename = `cert_${session.user.id}_${Date.now()}${path.extname(certificate.name)}`
            const filepath = path.join(uploadsDir, filename)
            await writeFile(filepath, buffer)
            certificatePath = `/uploads/kyc/${filename}`
        }

        // Save tax form
        if (taxForm && taxForm instanceof File && taxForm.size > 0) {
            const buffer = Buffer.from(await taxForm.arrayBuffer())
            const filename = `tax_${session.user.id}_${Date.now()}${path.extname(taxForm.name)}`
            const filepath = path.join(uploadsDir, filename)
            await writeFile(filepath, buffer)
            taxFormPath = `/uploads/kyc/${filename}`
        }

        // Update user profile with personal information
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name: fullName,
                arabicName,
                phone,
                bio,
                role: 'CREATOR',
                onboardingCompleted: true
            }
        })

        // Update or create creator profile with professional information
        const creator = await prisma.creator.upsert({
            where: { userId: session.user.id },
            update: {
                expertise,
                languages: languages.join(', '), // Store as comma-separated string
                socialLinks,
                nationalId: phone, // Using phone as temp identifier
                nationalIdImage: idDocumentPath,
                selfieImage: certificatePath,
                addressProof: taxFormPath,
                kycStatus: 'PENDING', // Set to pending verification
                certifications: {
                    education,
                    yearsOfExperience,
                    country,
                    city,
                    bioAr
                }
            },
            create: {
                userId: session.user.id,
                expertise,
                languages: languages.join(', '),
                socialLinks,
                nationalId: phone,
                nationalIdImage: idDocumentPath,
                selfieImage: certificatePath,
                addressProof: taxFormPath,
                kycStatus: 'PENDING',
                certifications: {
                    education,
                    yearsOfExperience,
                    country,
                    city,
                    bioAr
                }
            }
        })

        return NextResponse.json({
            success: true,
            message: 'Onboarding completed successfully',
            creator
        })

    } catch (error) {
        console.error('Error processing onboarding:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to process onboarding application'
            },
            { status: 500 }
        )
    }
}

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session || !session.user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Check if user has already completed onboarding
        const creator = await prisma.creator.findUnique({
            where: { userId: session.user.id }
        })

        return NextResponse.json({
            success: true,
            hasCompletedOnboarding: creator?.onboardingCompleted || false,
            kycStatus: creator?.kycStatus || 'NOT_STARTED',
            creator
        })

    } catch (error) {
        console.error('Error fetching onboarding status:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch onboarding status'
            },
            { status: 500 }
        )
    }
}
