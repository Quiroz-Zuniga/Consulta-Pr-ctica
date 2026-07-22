import type { IReportingRepository } from '../../domain/ports/IReportingRepository.js';
import type { IAuditLogRepository } from '../../domain/ports/IAuditLogRepository.js';
import type { PdfKitReportService } from '../../infrastructure/pdf/PdfKitReportService.js';
import type { CsvJsonExportService } from '../../infrastructure/utils/CsvJsonExportService.js';
import { LogAuditEvent } from './LogAuditEvent.js';
import { DomainException } from '../../domain/exceptions/DomainException.js';

export interface ExportPatientRecordInput {
  patientId: string;
  requestedByUserId: string;
  /**
   * OBLIGATORIO si el paciente tiene is_protected = true.
   * Si no se provee en ese caso, el use-case lanza DomainException.
   */
  confirmationReason?: string;
}

export interface ExportPatientRecordResult {
  pdfBuffer: Buffer;
  patientName: string;
  isProtected: boolean;
  auditLogId: string;
}

export class ExportPatientRecord {
  private readonly logAuditEvent: LogAuditEvent;

  constructor(
    private readonly reportingRepository: IReportingRepository,
    private readonly pdfService: PdfKitReportService,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {
    this.logAuditEvent = new LogAuditEvent(auditLogRepository);
  }

  async execute(input: ExportPatientRecordInput): Promise<ExportPatientRecordResult> {
    const data = await this.reportingRepository.getPatientExpedientData(input.patientId);

    // ── Validación de paciente protegido ──────────────────────
    if (data.patient.isProtected) {
      if (!input.confirmationReason || input.confirmationReason.trim().length === 0) {
        throw new DomainException(
          'Este paciente está marcado como PROTEGIDO. Se requiere un motivo de confirmación explícito (confirmationReason) para generar el expediente.',
        );
      }
    }

    // ── Generación del PDF ────────────────────────────────────
    const pdfBuffer = await this.pdfService.generatePatientExpedientPdf(data);

    // ── Registro de auditoría ─────────────────────────────────
    const auditAction = data.patient.isProtected
      ? ('protected_patient_export_confirmed' as const)
      : ('patient_pdf_exported' as const);

    const auditLog = await this.logAuditEvent.execute({
      userId: input.requestedByUserId,
      action: auditAction,
      resourceType: 'patient',
      resourceId: input.patientId,
      metadata: data.patient.isProtected
        ? {
            confirmationReason: input.confirmationReason,
            patientName: data.patient.fullName,
            exportedAt: new Date().toISOString(),
          }
        : {
            patientName: data.patient.fullName,
            exportedAt: new Date().toISOString(),
          },
    });

    return {
      pdfBuffer,
      patientName: data.patient.fullName,
      isProtected: data.patient.isProtected,
      auditLogId: auditLog.id,
    };
  }
}
