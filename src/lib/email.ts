import nodemailer from 'nodemailer';

// Configure the email transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail address
    pass: process.env.GMAIL_APP_PASSWORD, // Your Gmail App Password
  },
});

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: EmailOptions) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn('⚠️ GMAIL credentials not found. Email notifications will not work.');
    return null;
  }

  try {
    const info = await transporter.sendMail({
      from: from || process.env.EMAIL_FROM || `"Prime Learning" <${process.env.GMAIL_USER}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
    });

    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error: any) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

// Email Templates
export const EmailTemplates = {
  // Subscription Welcome Email
  subscriptionWelcome: (data: {
    userName: string;
    subscriptionType: string;
    coursesCount: number;
    locale: string;
  }) => {
    const isGerman = data.locale === 'de';

    return {
      subject: isGerman
        ? `🎉 Willkommen bei Prime Learning!`
        : `🎉 Welcome to Prime Learning!`,
      html: `
        <!DOCTYPE html>
        <html lang="${isGerman ? 'de' : 'en'}">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 30px 20px; background: #ffffff; }
            .highlight { background: #FEE2E2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #DC2626; }
            .cta-button { display: inline-block; background: #DC2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .footer { background: #F3F4F6; padding: 20px; text-align: center; font-size: 12px; color: #6B7280; }
            .feature { margin: 15px 0; padding-left: 25px; position: relative; }
            .feature:before { content: "✓"; position: absolute; left: 0; color: #DC2626; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${isGerman ? '🎓 Willkommen bei Prime Learning' : '🎓 Welcome to Prime Learning'}</h1>
          </div>
          
          <div class="content">
            <h2>${isGerman ? `Hallo ${data.userName}!` : `Hi ${data.userName}!`}</h2>
            
            <p>${isGerman
          ? `Vielen Dank für das Abonnieren von ${data.subscriptionType}. Wir freuen uns, Sie auf Ihrem Lernweg zu begleiten!`
          : `Thank you for subscribing to ${data.subscriptionType}. We're excited to help you on your learning journey!`}
            </p>
            
            <div class="highlight">
              <h3>${isGerman ? '🎉 Ihr Abonnement ist jetzt aktiv!' : '🎉 Your subscription is now active!'}</h3>
              <p style="margin: 10px 0; font-size: 18px;">
                <strong>${isGerman ? 'Sie haben ab sofort Zugriff auf' : 'You now have instant access to'} ${data.coursesCount} ${isGerman ? 'Kurse!' : 'courses!'}</strong>
              </p>
            </div>
            
            <h3>${isGerman ? 'Was kommt als Nächstes?' : 'What\'s Next?'}</h3>
            
            <div class="feature">${isGerman ? 'Durchsuchen Sie unsere umfangreiche Kursbibliothek' : 'Browse our massive course library'}</div>
            <div class="feature">${isGerman ? 'Starten Sie heute Ihre erste Lektion' : 'Start your first lesson today'}</div>
            <div class="feature">${isGerman ? 'Finden Sie einen Lernpartner' : 'Find a Study Buddy to learn with'}</div>
            <div class="feature">${isGerman ? 'Verfolgen Sie Ihren Fortschritt und verdienen Sie Abzeichen' : 'Track your progress and earn badges'}</div>
            <div class="feature">${isGerman ? 'Treten Sie Kanälen Ihrer Lieblingsautoren bei' : 'Join your favorite creator channels'}</div>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/${data.locale}/dashboard/my-learning" class="cta-button">
                ${isGerman ? '🚀 Jetzt mit dem Lernen beginnen' : '🚀 Start Learning Now'}
              </a>
            </div>
            
            <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
              ${isGerman
          ? 'Brauchen Sie Hilfe? Unser Support-Team ist rund um die Uhr für Sie da.'
          : 'Need help? Our support team is available 24/7.'}
            </p>
          </div>
          
          <div class="footer">
            <p>${isGerman ? 'Diese E-Mail wurde gesendet von' : 'This email was sent from'} Prime Learning</p>
            <p>${isGerman ? 'Wenn Sie sich nicht angemeldet haben, ignorieren Sie bitte diese E-Mail.' : 'If you didn\'t sign up, please ignore this email.'}</p>
          </div>
        </body>
        </html>
      `
    };
  },

  // Payment Receipt
  paymentReceipt: (data: {
    userName: string;
    amount: number;
    currency: string;
    subscriptionType: string;
    billingCycle: string;
    invoiceUrl?: string;
    nextBillingDate: string;
    locale: string;
  }) => {
    const isGerman = data.locale === 'de';

    return {
      subject: isGerman
        ? `Zahlungsbeleg - ${data.subscriptionType}`
        : `Payment Receipt - ${data.subscriptionType}`,
      html: `
        <!DOCTYPE html>
        <html lang="${isGerman ? 'de' : 'en'}">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background: #1F2937; padding: 30px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { padding: 30px 20px; background: #ffffff; }
            .receipt-box { background: #F9FAFB; border: 2px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .receipt-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #E5E7EB; }
            .receipt-row:last-child { border-bottom: none; font-weight: bold; font-size: 18px; }
            .cta-button { display: inline-block; background: #059669; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; margin: 15px 0; }
            .footer { background: #F3F4F6; padding: 20px; text-align: center; font-size: 12px; color: #6B7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${isGerman ? '✅ Zahlung erfolgreich' : '✅ Payment Successful'}</h1>
          </div>
          
          <div class="content">
            <p>${isGerman ? `Sehr geehrte(r) ${data.userName},` : `Dear ${data.userName},`}</p>
            
            <p>${isGerman
          ? 'Vielen Dank für Ihre Zahlung. Ihr Abonnement wurde erfolgreich bearbeitet.'
          : 'Thank you for your payment. Your subscription has been successfully processed.'}</p>
            
            <div class="receipt-box">
              <h3 style="margin-top: 0;">${isGerman ? 'Zahlungsdetails' : 'Payment Details'}</h3>
              
              <div class="receipt-row">
                <span>${isGerman ? 'Abonnement:' : 'Subscription:'}</span>
                <span><strong>${data.subscriptionType}</strong></span>
              </div>
              
              <div class="receipt-row">
                <span>${isGerman ? 'Abrechnungszyklus:' : 'Billing Cycle:'}</span>
                <span>${data.billingCycle === 'yearly' ? (isGerman ? 'Jährlich' : 'Annual') : (isGerman ? 'Monatlich' : 'Monthly')}</span>
              </div>
              
              <div class="receipt-row">
                <span>${isGerman ? 'Gezahlter Betrag:' : 'Amount Paid:'}</span>
                <span><strong>${data.amount} ${data.currency}</strong></span>
              </div>
              
              <div class="receipt-row">
                <span>${isGerman ? 'Nächste Abrechnung:' : 'Next Billing:'}</span>
                <span>${data.nextBillingDate}</span>
              </div>
            </div>
            
            ${data.invoiceUrl ? `
              <div style="text-align: center;">
                <a href="${data.invoiceUrl}" class="cta-button">
                  ${isGerman ? '📄 تحميل الفاتورة' : '📄 Download Invoice'}
                </a>
              </div>
            ` : ''}
            
            <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
              ${isGerman
          ? 'ستظهر هذه المعاملة في كشف حسابك البنكي باسم "Prime Learning".'
          : 'This transaction will appear on your bank statement as "Prime Learning".'}
            </p>
          </div>
          
          <div class="footer">
            <p>${isGerman ? 'أسئلة؟ اتصل بنا على' : 'Questions? Contact us at'} support@prime-learning.com</p>
          </div>
        </body>
        </html>
      `
    };
  },

  // Study Buddy Match Notification
  studyBuddyMatch: (data: {
    userName: string;
    buddyName: string;
    sharedInterests: string[];
    locale: string;
  }) => {
    const isGerman = data.locale === 'de';

    return {
      subject: isGerman
        ? `🎉 Du hast einen neuen Lernpartner!`
        : `🎉 You have a new Study Buddy!`,
      html: `
        <!DOCTYPE html>
        <html lang="${isGerman ? 'de' : 'en'}">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 30px 20px; background: #ffffff; }
            .buddy-card { background: linear-gradient(135deg, #F3E8FF 0%, #E9D5FF 100%); padding: 25px; border-radius: 12px; margin: 20px 0; text-align: center; }
            .interests { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin: 15px 0; }
            .interest-tag { background: #8B5CF6; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; }
            .cta-button { display: inline-block; background: #8B5CF6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .footer { background: #F3F4F6; padding: 20px; text-align: center; font-size: 12px; color: #6B7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${isGerman ? '🤝 Du hast einen neuen Match!' : '🤝 You Have a New Match!'}</h1>
          </div>
          
          <div class="content">
            <p>${isGerman ? `Hallo ${data.userName}!` : `Hi ${data.userName}!`}</p>
            
            <p>${isGerman
          ? `Gute Neuigkeiten! Du wurdest mit ${data.buddyName} gematcht. Ihr teilt ähnliche Lerninteressen!`
          : `Great news! You've been matched with ${data.buddyName}. You both share similar learning interests!`}
            </p>
            
            <div class="buddy-card">
              <h2 style="margin: 0; color: #6D28D9;">👤 ${data.buddyName}</h2>
              <p style="margin: 15px 0 5px; font-size: 14px; color: #6B7280;">${isGerman ? 'Gemeinsame Interessen:' : 'Shared Interests:'}</p>
              <div class="interests">
                ${data.sharedInterests.map(interest => `<span class="interest-tag">${interest}</span>`).join('')}
              </div>
            </div>
            
            <h3>${isGerman ? 'ابدأ التعلم معاً:' : 'Start Learning Together:'}</h3>
            <ul>
              <li>${isGerman ? 'ابدأ محادثة وتعرف على بعضكما' : 'Start a chat and get to know each other'}</li>
              <li>${isGerman ? 'جدولة جلسات دراسة منتظمة' : 'Schedule regular study sessions'}</li>
              <li>${isGerman ? 'شارك الموارد والملاحظات' : 'Share resources and notes'}</li>
              <li>${isGerman ? 'حفز بعضكما البعض' : 'Motivate each other'}</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/${data.locale}/study-buddy" class="cta-button">
                ${isGerman ? '💬 ابدأ المحادثة' : '💬 Start Chatting'}
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>${isGerman ? 'التعلم أفضل مع الأصدقاء!' : 'Learning is better with friends!'} 🎓</p>
          </div>
        </body>
        </html>
      `
    };
  },

  // Course Completion Congratulations
  courseCompletion: (data: {
    userName: string;
    courseName: string;
    certificateUrl?: string;
    completionDate: string;
    locale: string;
  }) => {
    const isGerman = data.locale === 'de';

    return {
      subject: isGerman
        ? `🎓 Herzlichen Glückwunsch! Du hast ${data.courseName} abgeschlossen`
        : `🎓 Congratulations! You completed ${data.courseName}`,
      html: `
        <!DOCTYPE html>
        <html lang="${isGerman ? 'de' : 'en'}">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 32px; }
            .content { padding: 30px 20px; background: #ffffff; }
            .achievement-box { background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%); padding: 30px; border-radius: 12px; margin: 20px 0; text-align: center; border: 3px solid #F59E0B; }
            .cta-button { display: inline-block; background: #F59E0B; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 15px 0; font-weight: bold; }
            .footer { background: #F3F4F6; padding: 20px; text-align: center; font-size: 12px; color: #6B7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 ${isGerman ? 'تهانينا!' : 'Congratulations!'} 🎉</h1>
          </div>
          
          <div class="content">
            <p style="font-size: 18px;">${isGerman ? `عزيزي ${data.userName}،` : `Dear ${data.userName},`}</p>
            
            <div class="achievement-box">
              <h2 style="margin: 0; color: #92400E; font-size: 24px;">${isGerman ? '🏆 إنجاز رائع!' : '🏆 Amazing Achievement!'}</h2>
              <p style="margin: 20px 0; font-size: 16px; color: #78350F;">
                ${isGerman ? 'لقد أكملت بنجاح:' : 'You\'ve successfully completed:'}
              </p>
              <h3 style="margin: 10px 0; color: #92400E;">"${data.courseName}"</h3>
              <p style="margin: 15px 0; font-size: 14px; color: #A16207;">
                ${isGerman ? `تاريخ الإكمال: ${data.completionDate}` : `Completion Date: ${data.completionDate}`}
              </p>
            </div>
            
            ${data.certificateUrl ? `
              <div style="text-align: center;">
                <p>${isGerman ? 'شهادتك جاهزة!' : 'Your certificate is ready!'}</p>
                <a href="${data.certificateUrl}" class="cta-button">
                  ${isGerman ? '📜 تحميل الشهادة' : '📜 Download Certificate'}
                </a>
              </div>
            ` : ''}
            
            <h3>${isGerman ? 'ماذا بعد؟' : 'What\'s Next?'}</h3>
            <ul>
              <li>${isGerman ? 'شارك إنجازك على وسائل التواصل الاجتماعي' : 'Share your achievement on social media'}</li>
              <li>${isGerman ? 'استكشف دورات أكثر تقدماً' : 'Explore more advanced courses'}</li>
              <li>${isGerman ? 'ساعد الآخرين من خلال الإجابة على أسئلتهم' : 'Help others by answering their questions'}</li>
              <li>${isGerman ? 'طبق ما تعلمته في مشاريع حقيقية' : 'Apply what you learned in real projects'}</li>
            </ul>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/${data.locale}/courses" class="cta-button">
                ${isGerman ? '🚀 استكشف المزيد من الدورات' : '🚀 Explore More Courses'}
              </a>
            </div>
            
            <p style="margin-top: 30px; text-align: center; color: #6B7280;">
              ${isGerman ? 'نحن فخورون بإنجازاتك!' : 'We\'re proud of your achievements!'} 🌟
            </p>
          </div>
          
          <div class="footer">
            <p>${isGerman ? 'استمر في التعلم والنمو!' : 'Keep learning and growing!'} 🎓</p>
          </div>
        </body>
        </html>
      `
    };
  },

  // Email Verification
  emailVerification: (data: {
    userName: string;
    verificationLink: string;
    locale: string;
  }) => {
    const isGerman = data.locale === 'de';
    return {
      subject: isGerman ? 'E-Mail bestätigen' : 'Verify your email address',
      html: `
        <!DOCTYPE html>
        <html lang="${isGerman ? 'de' : 'en'}">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background: #0a84ff; padding: 30px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { padding: 30px 20px; background: #ffffff; }
            .cta-button { display: inline-block; background: #0a84ff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { background: #F3F4F6; padding: 20px; text-align: center; font-size: 12px; color: #6B7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${isGerman ? 'تأكيد البريد الإلكتروني' : 'Verify Email Address'}</h1>
          </div>
          <div class="content">
            <p>${isGerman ? `مرحباً ${data.userName}،` : `Hi ${data.userName},`}</p>
            <p>${isGerman ? 'يرجى النقر على الرابط أدناه لتفعيل حسابك:' : 'Please click the button below to verify your email address:'}</p>
            <div style="text-align: center;">
              <a href="${data.verificationLink}" class="cta-button">${isGerman ? 'تفعيل الحساب' : 'Verify Email'}</a>
            </div>
            <p>${isGerman ? 'إذا لم تطلب هذا، يمكنك تجاهل هذا البريد.' : 'If you did not request this, please ignore this email.'}</p>
          </div>
          <div class="footer">
            <p>Prime Learning</p>
          </div>
        </body>
        </html>
      `
    };
  },

  // Password Reset
  passwordReset: (data: {
    userName: string;
    resetLink: string;
    locale: string;
  }) => {
    const isGerman = data.locale === 'de';
    return {
      subject: isGerman ? 'Passwort zurücksetzen' : 'Reset your password',
      html: `
        <!DOCTYPE html>
        <html lang="${isGerman ? 'de' : 'en'}">
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
            .header { background: #DC2626; padding: 30px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { padding: 30px 20px; background: #ffffff; }
            .cta-button { display: inline-block; background: #DC2626; color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { background: #F3F4F6; padding: 20px; text-align: center; font-size: 12px; color: #6B7280; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${isGerman ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}</h1>
          </div>
          <div class="content">
            <p>${isGerman ? `مرحباً ${data.userName}،` : `Hi ${data.userName},`}</p>
            <p>${isGerman ? 'لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. انقر أدناه للمتابعة:' : 'We received a request to reset your password. Click below to proceed:'}</p>
            <div style="text-align: center;">
              <a href="${data.resetLink}" class="cta-button">${isGerman ? 'إعادة تعيين كلمة المرور' : 'Reset Password'}</a>
            </div>
            <p>${isGerman ? 'سينتهي هذا الرابط خلال ساعة واحدة.' : 'This link will expire in 1 hour.'}</p>
            <p>${isGerman ? 'إذا لم تطلب هذا، يرجى تأمين حسابك.' : 'If you did not request this, please secure your account.'}</p>
          </div>
          <div class="footer">
            <p>Prime Learning</p>
          </div>
        </body>
        </html>
      `
    };
  }
};

// Helper function to send subscription welcome email
export async function sendSubscriptionWelcomeEmail(data: {
  userEmail: string;
  userName: string;
  subscriptionType: string;
  coursesCount: number;
  locale: string;
}) {
  const template = EmailTemplates.subscriptionWelcome(data);
  return sendEmail({
    to: data.userEmail,
    ...template,
  });
}

// Helper function to send payment receipt
export async function sendPaymentReceiptEmail(data: {
  userEmail: string;
  userName: string;
  amount: number;
  currency: string;
  subscriptionType: string;
  billingCycle: string;
  invoiceUrl?: string;
  nextBillingDate: string;
  locale: string;
}) {
  const template = EmailTemplates.paymentReceipt(data);
  return sendEmail({
    to: data.userEmail,
    ...template,
  });
}

// Helper function to send study buddy match notification
export async function sendStudyBuddyMatchEmail(data: {
  userEmail: string;
  userName: string;
  buddyName: string;
  sharedInterests: string[];
  locale: string;
}) {
  const template = EmailTemplates.studyBuddyMatch(data);
  return sendEmail({
    to: data.userEmail,
    ...template,
  });
}

// Helper function to send course completion email
export async function sendCourseCompletionEmail(data: {
  userEmail: string;
  userName: string;
  courseName: string;
  certificateUrl?: string;
  completionDate: string;
  locale: string;
}) {
  const template = EmailTemplates.courseCompletion(data);
  return sendEmail({
    to: data.userEmail,
    ...template,
  });
}

// Helper function to send email verification
export async function sendEmailVerificationEmail(data: {
  userEmail: string;
  userName: string;
  verificationLink: string;
  locale: string;
}) {
  const template = EmailTemplates.emailVerification(data);
  return sendEmail({
    to: data.userEmail,
    ...template,
  });
}

// Helper function to send password reset
export async function sendPasswordResetEmail(data: {
  userEmail: string;
  userName: string;
  resetLink: string;
  locale: string;
}) {
  const template = EmailTemplates.passwordReset(data);
  return sendEmail({
    to: data.userEmail,
    ...template,
  });
}
