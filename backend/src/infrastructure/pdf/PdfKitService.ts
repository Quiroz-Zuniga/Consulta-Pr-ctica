import PDFDocument from 'pdfkit';
import type { IPdfGeneratorService } from '../../domain/ports/IPdfGeneratorService.js';
import type { Prescription } from '../../domain/entities/Prescription.js';
import type { Patient } from '../../domain/entities/Patient.js';

export class PdfKitService implements IPdfGeneratorService {
  async generatePrescriptionPdf(
    prescription: Prescription,
    patient: Patient,
    doctorName: string,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - 100;

      doc.fontSize(18).font('Helvetica-Bold').text('CONSULTA PRÁCTICA', { align: 'center' });
      doc.fontSize(10).font('Helvetica').text('Receta Médica', { align: 'center' });
      doc.moveDown(0.5);

      doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).stroke();
      doc.moveDown(0.5);

      doc.fontSize(11).font('Helvetica-Bold');
      doc.text(`Paciente: `, { continued: true });
      doc.font('Helvetica').text(`${patient.fullName}`);
      doc.font('Helvetica-Bold').text(`Edad: `, { continued: true });
      doc.font('Helvetica').text(`${this.calculateAge(patient.birthDate)}${patient.birthDate ? ' años' : ''}`);
      doc.moveDown(0.3);

      doc.font('Helvetica-Bold').text(`Médico: `, { continued: true });
      doc.font('Helvetica').text(doctorName);
      doc.moveDown(0.3);

      const dateStr = prescription.createdAt.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
      doc.font('Helvetica-Bold').text(`Fecha: `, { continued: true });
      doc.font('Helvetica').text(dateStr);
      doc.moveDown(0.5);

      doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).stroke();
      doc.moveDown(0.8);

      // --- 3. PRESCRIPCIÓN & MEDICAMENTOS ---
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#0f766e');
      doc.text('PRESCRIPCIÓN MÉDICA', { align: 'left' });
      doc.moveDown(0.5);

      doc.fillColor('#000000').fontSize(10);

      prescription.medications.forEach((med, index) => {
        doc.font('Helvetica-Bold').text(`${index + 1}. ${med.name}`, { continued: true });
        doc.font('Helvetica').text(` — Dosis: ${med.dosage} | Frecuencia: ${med.frequency} | Duración: ${med.durationDays} días`);
        doc.moveDown(0.3);
      });

      if (prescription.customIndications) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Indicaciones Especiales:');
        doc.font('Helvetica').text(prescription.customIndications);
      }

      if (prescription.nextAppointment) {
        doc.moveDown(0.5);
        const nextApptStr = new Date(prescription.nextAppointment).toLocaleDateString('es-MX', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });
        doc.font('Helvetica-Bold').text(`Próxima Cita Recomendada: `, { continued: true });
        doc.font('Helvetica').text(nextApptStr);
      }

      // --- 4. FIRMA Y PIE DE PÁGINA ---
      doc.moveDown(2);
      doc.moveTo(200, doc.y).lineTo(395, doc.y).stroke();
      doc.font('Helvetica').fontSize(9).text('Firma y Sello del Médico Tratante', { align: 'center' });

      doc.moveDown(1.5);
      doc.fontSize(8).fillColor('#64748b').text(
        'Documento generado electrónicamente por Consulta Práctica Web. Validez legal sanitaria.',
        { align: 'center' },
      );

      doc.end();
    });
  }

  private calculateAge(birthDate?: Date): string {
    if (!birthDate) return 'N/E';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return `${age}`;
  }
}
