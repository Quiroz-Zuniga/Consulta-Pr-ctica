import PDFDocument from 'pdfkit';
import type { PatientExpedientData, ClinicReportData } from '../../domain/ports/IReportingRepository.js';

// ─────────────────────────────────────────────────────────────
// Colores corporativos del sistema
// ─────────────────────────────────────────────────────────────
const TEAL = '#0f766e';
const SLATE = '#64748b';
const DARK = '#1e293b';
const LINE_GRAY = '#cbd5e1';

export class PdfKitReportService {
  // ─────────────────────────────────────────────────────────────
  // Expediente Clínico Completo del Paciente
  // ─────────────────────────────────────────────────────────────
  async generatePatientExpedientPdf(data: PatientExpedientData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50, bufferPages: true });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = doc.page.width - 100; // usable width

      // ── PORTADA ──────────────────────────────────────────────
      this.drawHeader(doc, W, 'EXPEDIENTE CLÍNICO COMPLETO');
      doc.moveDown(0.3);

      doc.fontSize(11).font('Helvetica-Bold').fillColor(DARK);
      doc.text(`Paciente:`, { continued: true }).font('Helvetica').text(`  ${data.patient.fullName}`);
      if (data.patient.birthDate) {
        doc.font('Helvetica-Bold').text(`Fecha de nacimiento:`, { continued: true })
          .font('Helvetica').text(`  ${this.formatDate(data.patient.birthDate)}`);
      }
      if (data.patient.gender) {
        doc.font('Helvetica-Bold').text(`Género:`, { continued: true })
          .font('Helvetica').text(`  ${data.patient.gender}`);
      }
      doc.font('Helvetica-Bold').text(`Teléfono:`, { continued: true })
        .font('Helvetica').text(`  ${data.patient.phone}`);
      doc.font('Helvetica-Bold').text(`Fecha de registro:`, { continued: true })
        .font('Helvetica').text(`  ${this.formatDate(data.patient.createdAt)}`);

      if (data.patient.isProtected) {
        doc.moveDown(0.5);
        doc.fontSize(9).fillColor('#b45309')
          .text('⚠  Expediente marcado como PROTEGIDO — Acceso restringido y registrado en auditoría', { align: 'center' });
      }

      this.drawDivider(doc, W);

      // ── HISTORIAL MÉDICO ─────────────────────────────────────
      this.drawSectionTitle(doc, '1. Historial Médico');
      if (data.medicalHistories.length === 0) {
        doc.fontSize(10).fillColor(SLATE).text('Sin notas clínicas registradas.');
      } else {
        data.medicalHistories.forEach((h, i) => {
          doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK)
            .text(`[${i + 1}] ${this.formatDate(h.createdAt)}  — CIE-10: ${h.cie10Code ?? 'N/E'}${h.doctorName ? `  | Dr. ${h.doctorName}` : ''}`);
          doc.font('Helvetica').fillColor(SLATE).fontSize(9)
            .text(h.clinicalNote, { indent: 12 });
          if (h.isLocked) {
            doc.fontSize(8).fillColor('#0f766e').text('  ✓ Nota inmutable (bloqueada)', { indent: 12 });
          }
          doc.moveDown(0.4);
        });
      }

      this.drawDivider(doc, W);

      // ── RECETAS ───────────────────────────────────────────────
      this.drawSectionTitle(doc, '2. Recetas Emitidas');
      if (data.prescriptions.length === 0) {
        doc.fontSize(10).fillColor(SLATE).text('Sin recetas emitidas.');
      } else {
        data.prescriptions.forEach((rx, i) => {
          doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK)
            .text(`[${i + 1}] Receta del ${this.formatDate(rx.createdAt)}`);
          rx.medications.forEach((med) => {
            doc.font('Helvetica').fillColor(DARK).fontSize(9)
              .text(`• ${med.name} — ${med.dosage} — cada ${med.frequency} — ${med.durationDays} días`, { indent: 12 });
          });
          if (rx.customIndications) {
            doc.fontSize(9).fillColor(SLATE)
              .text(`  Indicaciones: ${rx.customIndications}`, { indent: 12 });
          }
          doc.moveDown(0.4);
        });
      }

      this.drawDivider(doc, W);

      // ── FORMULARIOS INTAKE ───────────────────────────────────
      this.drawSectionTitle(doc, '3. Formularios de Preconsulta (Intake)');
      if (data.intakeForms.length === 0) {
        doc.fontSize(10).fillColor(SLATE).text('Sin formularios registrados.');
      } else {
        data.intakeForms.forEach((f, i) => {
          doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK)
            .text(`[${i + 1}] ${this.formatDate(f.createdAt)} — Estado: ${f.status}`);
          if (f.chiefComplaint) doc.font('Helvetica').fontSize(9).fillColor(DARK)
            .text(`• Motivo: ${f.chiefComplaint}`, { indent: 12 });
          if (f.symptoms) doc.font('Helvetica').fontSize(9).fillColor(SLATE)
            .text(`• Síntomas: ${f.symptoms}`, { indent: 12 });
          if (f.allergies) doc.font('Helvetica').fontSize(9).fillColor(SLATE)
            .text(`• Alergias: ${f.allergies}`, { indent: 12 });
          if (f.currentMedications) doc.font('Helvetica').fontSize(9).fillColor(SLATE)
            .text(`• Medicamentos actuales: ${f.currentMedications}`, { indent: 12 });
          doc.moveDown(0.4);
        });
      }

      this.drawDivider(doc, W);

      // ── PAGOS ─────────────────────────────────────────────────
      this.drawSectionTitle(doc, '4. Registro de Pagos');
      if (data.payments.length === 0) {
        doc.fontSize(10).fillColor(SLATE).text('Sin pagos registrados.');
      } else {
        data.payments.forEach((pay, i) => {
          doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK)
            .text(`[${i + 1}] ${this.formatDate(pay.createdAt)} — ${pay.currency} ${pay.amount.toFixed(2)} — ${pay.paymentMethod} — ${pay.status}`);
          if (pay.notes) doc.font('Helvetica').fontSize(9).fillColor(SLATE)
            .text(`   ${pay.notes}`, { indent: 12 });
          doc.moveDown(0.2);
        });
      }

      this.drawDivider(doc, W);

      // ── CITAS ─────────────────────────────────────────────────
      this.drawSectionTitle(doc, '5. Historial de Citas');
      if (data.appointments.length === 0) {
        doc.fontSize(10).fillColor(SLATE).text('Sin citas registradas.');
      } else {
        data.appointments.slice(0, 20).forEach((apt, i) => {
          doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK)
            .text(`[${i + 1}] ${this.formatDate(apt.appointmentDate)} — ${apt.status}${apt.doctorName ? ` | ${apt.doctorName}` : ''}`);
          doc.moveDown(0.2);
        });
        if (data.appointments.length > 20) {
          doc.fontSize(9).fillColor(SLATE)
            .text(`... y ${data.appointments.length - 20} citas adicionales no mostradas.`);
        }
      }

      // ── PIE DE PÁGINA ─────────────────────────────────────────
      const pageCount = (doc.bufferedPageRange().count);
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor(SLATE)
          .text(
            `Documento CONFIDENCIAL — Generado el ${this.formatDate(new Date())} | Consulta Práctica Web | Página ${i + 1}/${pageCount}`,
            50, doc.page.height - 40, { align: 'center', width: W },
          );
      }

      doc.end();
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Reporte de Actividad del Consultorio
  // ─────────────────────────────────────────────────────────────
  async generateClinicReportPdf(data: ClinicReportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'LETTER', margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const W = doc.page.width - 100;

      this.drawHeader(doc, W, 'REPORTE DE ACTIVIDAD DEL CONSULTORIO');
      doc.fontSize(10).fillColor(SLATE)
        .text(`Período: ${this.formatDate(data.dateRange.from)} — ${this.formatDate(data.dateRange.to)}`);
      doc.text(`Generado el: ${this.formatDate(data.generatedAt)}`);
      this.drawDivider(doc, W);

      // ── KPIs ──────────────────────────────────────────────────
      this.drawSectionTitle(doc, '1. Indicadores Clave del Período');
      this.drawKpiRow(doc, W, [
        { label: 'Citas Totales', value: String(data.appointments.total) },
        { label: 'Completadas', value: String(data.appointments.completed) },
        { label: 'Canceladas', value: String(data.appointments.cancelled) },
      ]);
      this.drawKpiRow(doc, W, [
        { label: 'Inasistencias', value: `${data.appointments.noShows} (${data.appointments.noShowRate}%)` },
        { label: 'Pacientes Únicos', value: String(data.totalPatients) },
        { label: 'Pacientes Nuevos', value: String(data.newPatients) },
      ]);

      this.drawDivider(doc, W);

      // ── INGRESOS ──────────────────────────────────────────────
      this.drawSectionTitle(doc, '2. Ingresos');
      doc.fontSize(10).font('Helvetica-Bold').fillColor(DARK)
        .text(`Total Registrado: ${data.revenue.currency} ${data.revenue.totalRevenue.toFixed(2)}`);
      doc.font('Helvetica').fillColor(SLATE)
        .text(`  • Cobrado: ${data.revenue.currency} ${data.revenue.totalPaid.toFixed(2)}`)
        .text(`  • Pendiente: ${data.revenue.currency} ${data.revenue.totalPending.toFixed(2)}`)
        .text(`  • Reembolsado: ${data.revenue.currency} ${data.revenue.totalRefunded.toFixed(2)}`);

      if (data.revenue.byMethod.length > 0) {
        doc.moveDown(0.5).font('Helvetica-Bold').fillColor(DARK).text('Por método de pago:');
        data.revenue.byMethod.forEach((m) => {
          doc.font('Helvetica').fillColor(SLATE)
            .text(`  • ${m.method}: ${data.revenue.currency} ${m.amount.toFixed(2)} (${m.count} transacciones)`);
        });
      }
      this.drawDivider(doc, W);

      // ── TOP DIAGNÓSTICOS ──────────────────────────────────────
      this.drawSectionTitle(doc, '3. Top 10 Diagnósticos CIE-10');
      if (data.topDiagnoses.length === 0) {
        doc.fontSize(10).fillColor(SLATE).text('Sin diagnósticos registrados en el período.');
      } else {
        data.topDiagnoses.forEach((d, i) => {
          doc.fontSize(10).font('Helvetica').fillColor(DARK)
            .text(`${i + 1}. [${d.code}] ${d.description} — ${d.count} casos`);
        });
      }
      this.drawDivider(doc, W);

      // ── FRECUENCIA DE VISITAS ─────────────────────────────────
      this.drawSectionTitle(doc, '4. Pacientes con Mayor Frecuencia de Visitas');
      if (data.patientVisitFrequency.length === 0) {
        doc.fontSize(10).fillColor(SLATE).text('Sin datos en el período.');
      } else {
        data.patientVisitFrequency.slice(0, 10).forEach((pv, i) => {
          doc.fontSize(10).font('Helvetica').fillColor(DARK)
            .text(`${i + 1}. ${pv.patientName} — ${pv.visitCount} visitas | Última: ${this.formatDate(pv.lastVisit)}`);
        });
      }

      doc.moveDown(2);
      doc.fontSize(8).fillColor(SLATE)
        .text('Reporte generado automáticamente por Consulta Práctica Web', { align: 'center' });

      doc.end();
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Helpers de diseño
  // ─────────────────────────────────────────────────────────────
  private drawHeader(doc: PDFKit.PDFDocument, W: number, title: string): void {
    doc.rect(50, 50, W, 36).fill(TEAL);
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#ffffff')
      .text(title, 50, 61, { width: W, align: 'center' });
    doc.moveDown(1.2);
    doc.fontSize(9).font('Helvetica').fillColor(SLATE)
      .text('CONSULTA PRÁCTICA WEB', { align: 'center' });
    doc.moveDown(0.8);
  }

  private drawSectionTitle(doc: PDFKit.PDFDocument, title: string): void {
    doc.moveDown(0.3);
    doc.fontSize(11).font('Helvetica-Bold').fillColor(TEAL).text(title);
    doc.moveDown(0.3);
    doc.fillColor(DARK);
  }

  private drawDivider(doc: PDFKit.PDFDocument, W: number): void {
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(50 + W, doc.y).strokeColor(LINE_GRAY).lineWidth(0.5).stroke();
    doc.moveDown(0.5);
  }

  private drawKpiRow(doc: PDFKit.PDFDocument, W: number, kpis: Array<{ label: string; value: string }>): void {
    const colW = W / kpis.length;
    const startY = doc.y;
    kpis.forEach((kpi, i) => {
      const x = 50 + i * colW;
      doc.fontSize(9).font('Helvetica').fillColor(SLATE).text(kpi.label, x, startY, { width: colW });
      doc.fontSize(14).font('Helvetica-Bold').fillColor(TEAL).text(kpi.value, x, startY + 12, { width: colW });
    });
    doc.moveDown(2.2);
  }

  private formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('es-HN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }
}
