/**
 * Certificate Service
 * Handles certificate generation, validation, and management
 */

import { prisma } from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export interface CertificateData {
  enrollmentId: string;
  userId: string;
  courseId: string;
  completionDate: Date;
  grade?: string;
}

/**
 * Generate a unique certificate number
 * Format: CERT-YYYY-XXXXXX
 */
function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(100000 + Math.random() * 900000); // 6 digits
  return `CERT-${year}-${random}`;
}

/**
 * Check if certificate number already exists
 */
async function certificateNumberExists(number: string): Promise<boolean> {
  const existing = await prisma.certificate.findUnique({
    where: { certificateNumber: number }
  });
  return !!existing;
}

/**
 * Get unique certificate number (retry if collision)
 */
async function getUniqueCertificateNumber(): Promise<string> {
  let number = generateCertificateNumber();
  let attempts = 0;
  
  while (await certificateNumberExists(number) && attempts < 10) {
    number = generateCertificateNumber();
    attempts++;
  }
  
  if (attempts >= 10) {
    // Fallback to UUID-based number if collisions persist
    number = `CERT-${new Date().getFullYear()}-${uuidv4().slice(0, 6).toUpperCase()}`;
  }
  
  return number;
}

/**
 * Generate a certificate for a completed course
 */
export async function generateCertificate(data: CertificateData) {
  // Check if certificate already exists for this enrollment
  const existingCertificate = await prisma.certificate.findUnique({
    where: { enrollmentId: data.enrollmentId }
  });

  if (existingCertificate) {
    return existingCertificate;
  }

  // Get enrollment details
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: data.enrollmentId },
    include: {
      course: {
        include: {
          creator: {
            include: {
              user: true
            }
          }
        }
      },
      user: true
    }
  });

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  // Verify the course is completed (100% progress)
  if (enrollment.progress < 100) {
    throw new Error('Course must be 100% completed to generate certificate');
  }

  // Generate unique certificate number
  const certificateNumber = await getUniqueCertificateNumber();

  // Create certificate
  const certificate = await prisma.certificate.create({
    data: {
      enrollmentId: data.enrollmentId,
      userId: data.userId,
      courseId: data.courseId,
      certificateNumber,
      completionDate: data.completionDate,
      grade: data.grade,
      credentialUrl: `/verify/${certificateNumber}`, // Public verification URL
      isPublic: true
    },
    include: {
      user: true,
      course: {
        include: {
          creator: {
            include: {
              user: true
            }
          }
        }
      }
    }
  });

  return certificate;
}

/**
 * Auto-generate certificate when course is completed
 */
export async function checkAndGenerateCertificate(enrollmentId: string) {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId }
  });

  if (!enrollment) {
    throw new Error('Enrollment not found');
  }

  // Only generate if progress is 100% and no certificate exists
  if (enrollment.progress === 100) {
    const existingCertificate = await prisma.certificate.findUnique({
      where: { enrollmentId }
    });

    if (!existingCertificate) {
      return await generateCertificate({
        enrollmentId,
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        completionDate: enrollment.completedAt || new Date()
      });
    }

    return existingCertificate;
  }

  return null;
}

/**
 * Get certificate by ID
 */
export async function getCertificate(certificateId: string) {
  return await prisma.certificate.findUnique({
    where: { id: certificateId },
    include: {
      user: true,
      course: {
        include: {
          creator: {
            include: {
              user: true
            }
          }
        }
      }
    }
  });
}

/**
 * Get certificate by certificate number
 */
export async function getCertificateByNumber(certificateNumber: string) {
  return await prisma.certificate.findUnique({
    where: { certificateNumber },
    include: {
      user: true,
      course: {
        include: {
          creator: {
            include: {
              user: true
            }
          }
        }
      }
    }
  });
}

/**
 * Get all certificates for a user
 */
export async function getUserCertificates(userId: string) {
  return await prisma.certificate.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          creator: {
            include: {
              user: true
            }
          }
        }
      }
    },
    orderBy: {
      issueDate: 'desc'
    }
  });
}

/**
 * Increment download count
 */
export async function incrementDownloadCount(certificateId: string) {
  return await prisma.certificate.update({
    where: { id: certificateId },
    data: {
      downloadCount: {
        increment: 1
      },
      lastDownloadedAt: new Date()
    }
  });
}

/**
 * Record social share
 */
export async function recordShare(certificateId: string, platform: string) {
  const certificate = await prisma.certificate.findUnique({
    where: { id: certificateId }
  });

  if (!certificate) {
    throw new Error('Certificate not found');
  }

  // Parse existing shares
  const shares = certificate.sharedOn 
    ? JSON.parse(certificate.sharedOn) 
    : [];

  // Add platform if not already shared there
  if (!shares.includes(platform)) {
    shares.push(platform);
  }

  return await prisma.certificate.update({
    where: { id: certificateId },
    data: {
      sharedOn: JSON.stringify(shares)
    }
  });
}

/**
 * Toggle certificate visibility
 */
export async function toggleCertificateVisibility(certificateId: string, userId: string) {
  // Verify ownership
  const certificate = await prisma.certificate.findUnique({
    where: { id: certificateId }
  });

  if (!certificate || certificate.userId !== userId) {
    throw new Error('Unauthorized');
  }

  return await prisma.certificate.update({
    where: { id: certificateId },
    data: {
      isPublic: !certificate.isPublic
    }
  });
}
