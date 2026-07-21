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
      doc.font('Helvetica').text(`${this.calculateAge(patient.birthDate)} años`);
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
      doc.moveDown(0.5);

      doc.fontSize(13).font('Helvetica-Bold').text('Medicamentos Recetados');
      doc.moveDown(0.3);

      prescription.medications.forEach((med, index) => {
        const yStart = doc.y;
        doc.rect(50, yStart, pageWidth, 60).stroke();

        const contentX = 60;
        const contentY = yStart + 5;
        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(`${index + 1}. ${med.name}`, contentX, contentY, {
          width: pageWidth - 20,
        });

        doc.font('Helvetica');
        doc.text(`Dosis: ${med.dosage}`, contentX + 10, contentY + 15, {
          width: pageWidth - 30,
        });
        doc.text(`Frecuencia: ${med.frequency}`, contentX + 10, contentY + 28, {
          width: pageWidth - 30,
        });
        doc.text(`Duración: ${med.durationDays} días`, contentX + 10, contentY + 41, {
          width: pageWidth - 30,
        });

        doc.y = yStart + 65;
      });

      if (prescription.customIndications) {
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).stroke();
        doc.moveDown(0.3);
        doc.fontSize(11).font('Helvetica-Bold').text('Indicaciones Adicionales:');
        doc.font('Helvetica').text(prescription.customIndications);
      }

      if (prescription.nextAppointment) {
        doc.moveDown(0.5);
        doc.font('Helvetica-Bold').text('Próxima Cita: ', { continued: true });
        doc.font('Helvetica').text(
          prescription.nextAppointment.toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        );
      }

      doc.moveDown(1);
      doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y).stroke();
      doc.moveDown(0.5);
      doc.fontSize(9).font('Helvetica').text(
        'Documento generado electrónicamente por Consulta Práctica Web.',
        { align: 'center' },
      );

      doc.end();
    });
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
}
