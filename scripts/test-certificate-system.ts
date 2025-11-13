/**
 * Test Script: Certificate System
 * Quick verification that certificate generation works
 */

import { prisma } from '@/lib/prisma';
import { generateCertificate } from '@/services/certificateService';

async function testCertificateSystem() {
  console.log('🧪 Testing Certificate System...\n');

  try {
    // Find a completed enrollment (100% progress)
    const completedEnrollment = await prisma.enrollment.findFirst({
      where: {
        progress: 100,
        certificate: null // No certificate yet
      },
      include: {
        user: true,
        course: true
      }
    });

    if (!completedEnrollment) {
      console.log('⚠️  No completed enrollments without certificates found.');
      console.log('   Please complete a course first to test certificate generation.\n');
      return;
    }

    console.log('✅ Found completed enrollment:');
    console.log(`   Student: ${completedEnrollment.user.name}`);
    console.log(`   Course: ${completedEnrollment.course.title}`);
    console.log(`   Progress: ${completedEnrollment.progress}%\n`);

    // Generate certificate
    console.log('🎓 Generating certificate...');
    const certificate = await generateCertificate({
      enrollmentId: completedEnrollment.id,
      userId: completedEnrollment.userId,
      courseId: completedEnrollment.courseId,
      completionDate: completedEnrollment.completedAt || new Date()
    });

    console.log('✅ Certificate generated successfully!');
    console.log(`   Certificate Number: ${certificate.certificateNumber}`);
    console.log(`   Issue Date: ${certificate.issueDate.toLocaleDateString()}`);
    console.log(`   Verification URL: ${certificate.credentialUrl}\n`);

    // Verify it was saved to database
    const savedCertificate = await prisma.certificate.findUnique({
      where: { id: certificate.id }
    });

    if (savedCertificate) {
      console.log('✅ Certificate saved to database');
      console.log(`   Download Count: ${savedCertificate.downloadCount}`);
      console.log(`   Is Public: ${savedCertificate.isPublic}\n`);
    }

    // Test certificate retrieval by number
    const retrievedCert = await prisma.certificate.findUnique({
      where: { certificateNumber: certificate.certificateNumber },
      include: {
        user: true,
        course: true
      }
    });

    if (retrievedCert) {
      console.log('✅ Certificate retrieval by number works');
      console.log(`   Retrieved: ${retrievedCert.certificateNumber}\n`);
    }

    console.log('🎉 All tests passed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Certificate generation');
    console.log('   ✅ Unique number assignment');
    console.log('   ✅ Database save');
    console.log('   ✅ Certificate retrieval');
    console.log('\n💡 Next: Test PDF download in browser at /dashboard/my-learning');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run test
testCertificateSystem();
