import type { IReportingRepository } from '../../domain/ports/IReportingRepository.js';
import type { IAuditLogRepository } from '../../domain/ports/IAuditLogRepository.js';
import type { CsvJsonExportService } from '../../infrastructure/utils/CsvJsonExportService.js';
import { LogAuditEvent } from './LogAuditEvent.js';
import { DomainException } from '../../domain/exceptions/DomainException.js';

export type ExportFormat = 'csv' | 'json';

export interface ExportPatientDataCsvJsonInput {
  patientId: string;
  requestedByUserId: string;
  format: ExportFormat;
  /** Obligatorio si el paciente es is_protected */
  confirmationReason?: string;
}

export interface ExportPatientDataCsvJsonResult {
  content: string;
  contentType: string;
  fileName: string;
  patientName: string;
  auditLogId: string;
}

export class ExportPatientDataCsvJson {
  private readonly logAuditEvent: LogAuditEvent;

  constructor(
    private readonly reportingRepository: IReportingRepository,
    private readonly csvJsonService: CsvJsonExportService,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {
    this.logAuditEvent = new LogAuditEvent(auditLogRepository);
  }

  async execute(input: ExportPatientDataCsvJsonInput): Promise<ExportPatientDataCsvJsonResult> {
    const data = await this.reportingRepository.getPatientExpedientData(input.patientId);

    // ── Validación de paciente protegido ──────────────────────
    if (data.patient.isProtected) {
      if (!input.confirmationReason || input.confirmationReason.trim().length === 0) {
        throw new DomainException(
          'Este paciente está marcado como PROTEGIDO. Se requiere un motivo de confirmación explícito (confirmationReason) para exportar sus datos.',
        );
      }
    }

    // ── Exportación ───────────────────────────────────────────
    const exported = this.csvJsonService.exportPatientData(data);
    const isProtected = data.patient.isProtected;

    const result =
      input.format === 'csv'
        ? {
            content: exported.csv,
            contentType: 'text/csv',
            fileName: `expediente_${input.patientId}_${Date.now()}.csv`,
          }
        : {
            content: exported.json,
            contentType: 'application/json',
            fileName: `expediente_${input.patientId}_${Date.now()}.json`,
          };

    // ── Auditoría ─────────────────────────────────────────────
    const auditLog = await this.logAuditEvent.execute({
      userId: input.requestedByUserId,
      action: isProtected ? 'protected_patient_export_confirmed' : 'data_export_csv',
      resourceType: 'patient',
      resourceId: input.patientId,
      metadata: {
        format: input.format,
        patientName: data.patient.fullName,
        exportedAt: new Date().toISOString(),
        ...(isProtected ? { confirmationReason: input.confirmationReason } : {}),
      },
    });

    return {
      ...result,
      patientName: data.patient.fullName,
      auditLogId: auditLog.id,
    };
  }
}
