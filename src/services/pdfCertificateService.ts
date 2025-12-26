/**
 * PDF Certificate Generation Service
 * Creates beautiful, branded certificates as downloadable PDFs
 */

import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface CertificateInfo {
  certificateNumber: string;
  studentName: string;
  courseName: string;
  instructorName: string;
  completionDate: Date;
  issueDate: Date;
  grade?: string;
  verificationUrl: string;
}

/**
 * Generate QR code as data URL
 */
async function generateQRCode(url: string): Promise<string> {
  try {
    return await QRCode.toDataURL(url, {
      width: 200,
      margin: 1,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      }
    });
  } catch (error) {
    console.error('QR code generation error:', error);
    return '';
  }
}

/**
 * Generate certificate PDF
 */
export async function generateCertificatePDF(
  certificate: CertificateInfo,
  locale: 'en' | 'de' = 'en'
): Promise<Blob> {
  const isGerman = locale === 'de';

  // Create PDF in landscape A4 format
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background gradient (simulated with rectangles)
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Decorative border
  doc.setDrawColor(139, 92, 246); // purple-500
  doc.setLineWidth(1);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20, 'S');

  doc.setDrawColor(59, 130, 246); // blue-500
  doc.setLineWidth(0.5);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24, 'S');

  // Decorative corner accents
  doc.setFillColor(139, 92, 246); // purple-500
  doc.circle(15, 15, 3, 'F');
  doc.circle(pageWidth - 15, 15, 3, 'F');
  doc.circle(15, pageHeight - 15, 3, 'F');
  doc.circle(pageWidth - 15, pageHeight - 15, 3, 'F');

  // Prime Egypt Logo/Branding (Text-based for now)
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  const brandText = isGerman ? 'PRIME ÄGYPTEN' : 'PRIME EGYPT';
  doc.text(brandText, pageWidth / 2, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.setFont('helvetica', 'normal');
  const tagline = isGerman
    ? 'Ägyptens führende EdTech-Plattform'
    : 'Egypt\'s Leading EdTech Platform';
  doc.text(tagline, pageWidth / 2, 37, { align: 'center' });

  // Certificate Title
  doc.setFontSize(36);
  doc.setTextColor(167, 243, 208); // emerald-200
  doc.setFont('helvetica', 'bold');
  const title = isGerman ? 'ABSCHLUSSZERTIFIKAT' : 'CERTIFICATE OF COMPLETION';
  doc.text(title, pageWidth / 2, 55, { align: 'center' });

  // Decorative line
  doc.setDrawColor(139, 92, 246); // purple-500
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 60, 60, pageWidth / 2 + 60, 60);

  // "This certifies that" text
  doc.setFontSize(12);
  doc.setTextColor(226, 232, 240); // slate-200
  doc.setFont('helvetica', 'normal');
  const certifiesText = isGerman
    ? 'Hiermit wird bescheinigt, dass'
    : 'This certifies that';
  doc.text(certifiesText, pageWidth / 2, 72, { align: 'center' });

  // Student Name
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(certificate.studentName, pageWidth / 2, 85, { align: 'center' });

  // Decorative underline
  doc.setDrawColor(59, 130, 246); // blue-500
  doc.setLineWidth(0.3);
  const nameWidth = doc.getTextWidth(certificate.studentName);
  doc.line(
    pageWidth / 2 - nameWidth / 2,
    87,
    pageWidth / 2 + nameWidth / 2,
    87
  );

  // "has successfully completed" text
  doc.setFontSize(12);
  doc.setTextColor(226, 232, 240); // slate-200
  doc.setFont('helvetica', 'normal');
  const completedText = isGerman
    ? 'den Kurs erfolgreich abgeschlossen hat'
    : 'has successfully completed the course';
  doc.text(completedText, pageWidth / 2, 98, { align: 'center' });

  // Course Name
  doc.setFontSize(20);
  doc.setTextColor(167, 243, 208); // emerald-200
  doc.setFont('helvetica', 'bold');

  // Handle long course names by wrapping
  const maxWidth = 220;
  const courseLines = doc.splitTextToSize(certificate.courseName, maxWidth);
  const courseY = 108;
  courseLines.forEach((line: string, index: number) => {
    doc.text(line, pageWidth / 2, courseY + (index * 8), { align: 'center' });
  });

  // Instructor info
  const instructorY = courseY + (courseLines.length * 8) + 10;
  doc.setFontSize(11);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.setFont('helvetica', 'normal');
  const instructorLabel = isGerman ? 'Kursleiter:' : 'Instructor:';
  doc.text(instructorLabel, pageWidth / 2, instructorY, { align: 'center' });

  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(certificate.instructorName, pageWidth / 2, instructorY + 6, { align: 'center' });

  // Dates and Grade section
  const detailsY = instructorY + 18;
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225); // slate-300
  doc.setFont('helvetica', 'normal');

  // Completion Date
  const completionLabel = isGerman ? 'Abschlussdatum:' : 'Completion Date:';
  const completionDateStr = certificate.completionDate.toLocaleDateString(
    isGerman ? 'de-DE' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );
  doc.text(`${completionLabel} ${completionDateStr}`, pageWidth / 2 - 50, detailsY, { align: 'left' });

  // Issue Date
  const issueLabel = isGerman ? 'Ausstellungsdatum:' : 'Issue Date:';
  const issueDateStr = certificate.issueDate.toLocaleDateString(
    isGerman ? 'de-DE' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );
  doc.text(`${issueLabel} ${issueDateStr}`, pageWidth / 2 - 50, detailsY + 6, { align: 'left' });

  // Grade (if available)
  if (certificate.grade) {
    const gradeLabel = isGerman ? 'Note:' : 'Grade:';
    doc.text(`${gradeLabel} ${certificate.grade}`, pageWidth / 2 - 50, detailsY + 12, { align: 'left' });
  }

  // Certificate Number
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  const certNumLabel = isGerman ? 'Zertifikats-Nr.:' : 'Certificate No:';
  doc.text(`${certNumLabel} ${certificate.certificateNumber}`, pageWidth / 2, pageHeight - 25, { align: 'center' });

  // QR Code for verification
  const qrCode = await generateQRCode(certificate.verificationUrl);
  if (qrCode) {
    const qrSize = 25;
    const qrX = pageWidth - 30;
    const qrY = pageHeight - 40;

    doc.addImage(qrCode, 'PNG', qrX, qrY, qrSize, qrSize);

    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // slate-400
    const scanText = isGerman ? 'Zum Verifizieren scannen' : 'Scan to verify';
    doc.text(scanText, qrX + qrSize / 2, qrY + qrSize + 4, { align: 'center' });
  }

  // Signature line (decorative)
  const sigY = pageHeight - 35;
  doc.setDrawColor(100, 116, 139); // slate-500
  doc.setLineWidth(0.3);
  doc.line(25, sigY, 80, sigY);

  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // slate-400
  const sigLabel = isGerman ? 'Digitale Signatur' : 'Digital Signature';
  doc.text(sigLabel, 52.5, sigY + 5, { align: 'center' });

  // Footer
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139); // slate-500
  const footer = isGerman
    ? 'Dieses Zertifikat wurde elektronisch ausgestellt und benötigt keinen physischen Stempel oder Unterschrift.'
    : 'This certificate is issued electronically and requires no physical stamp or signature';
  doc.text(footer, pageWidth / 2, pageHeight - 8, { align: 'center' });

  // Convert to Blob
  const pdfBlob = doc.output('blob');
  return pdfBlob;
}

/**
 * Download certificate PDF in browser
 */
export async function downloadCertificatePDF(
  certificate: CertificateInfo,
  locale: 'en' | 'de' = 'en'
): Promise<void> {
  const pdfBlob = await generateCertificatePDF(certificate, locale);

  // Create download link
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Certificate-${certificate.certificateNumber}.pdf`;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
