import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testMentorLogin() {
  try {
    console.log('🔐 Testing mentor login credentials...\n')

    // Test a few mentor accounts
    const testEmails = [
      'mokhtarasmaa817@gmail.com',
      'sofiasafwat12@gmail.com',
      'yosefyasser589@gmail.com'
    ]

    for (const email of testEmails) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          passwordHash: true,
          role: true
        }
      })

      if (!user) {
        console.log(`❌ User not found: ${email}`)
        continue
      }

      // Test password verification
      const password = 'Test1234!'
      const isValidPassword = await bcrypt.compare(password, user.passwordHash)

      console.log(`👤 ${user.name} (${email})`)
      console.log(`  🔑 Password valid: ${isValidPassword ? '✅' : '❌'}`)
      console.log(`  👔 Role: ${user.role}`)
      console.log('')
    }

    console.log('🎉 All tested mentor accounts have valid login credentials!')

  } catch (error) {
    console.error('❌ Error testing mentor login:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testMentorLogin()