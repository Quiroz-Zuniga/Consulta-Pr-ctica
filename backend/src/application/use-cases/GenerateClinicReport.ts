import type { IReportingRepository, ClinicReportData } from '../../domain/ports/IReportingRepository.js';
import type { IAuditLogRepository } from '../../domain/ports/IAuditLogRepository.js';
import type { PdfKitReportService } from '../../infrastructure/pdf/PdfKitReportService.js';
import { LogAuditEvent } from './LogAuditEvent.js';
import { DomainException } from '../../domain/exceptions/DomainException.js';

export interface GenerateClinicReportInput {
  from: string; // ISO 8601 date string
  to: string;   // ISO 8601 date string
  requestedByUserId: string;
}

export interface GenerateClinicReportResult {
  pdfBuffer: Buffer;
  reportData: ClinicReportData;
  auditLogId: string;
}

const MAX_RANGE_DAYS = 366;

export class GenerateClinicReport {
  private readonly logAuditEvent: LogAuditEvent;

  constructor(
    private readonly reportingRepository: IReportingRepository,
    private readonly pdfService: PdfKitReportService,
    private readonly auditLogRepository: IAuditLogRepository,
  ) {
    this.logAuditEvent = new LogAuditEvent(auditLogRepository);
  }

  async execute(input: GenerateClinicReportInput): Promise<GenerateClinicReportResult> {
    const from = new Date(input.from);
    const to = new Date(input.to);

    // ── Validaciones de rango ─────────────────────────────────
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      throw new DomainException('Las fechas from/to deben ser strings ISO 8601 válidos.');
    }

    if (from > to) {
      throw new DomainException('La fecha "from" debe ser anterior o igual a la fecha "to".');
    }

    const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > MAX_RANGE_DAYS) {
      throw new DomainException(
        `El rango máximo permitido es de ${MAX_RANGE_DAYS} días para proteger el rendimiento.`,
      );
    }

    // ── Obtener datos y generar PDF ───────────────────────────
    const reportData = await this.reportingRepository.getClinicReport({ from, to });
    const pdfBuffer = await this.pdfService.generateClinicReportPdf(reportData);

    // ── Auditoría ─────────────────────────────────────────────
    const auditLog = await this.logAuditEvent.execute({
      userId: input.requestedByUserId,
      action: 'report_generated',
      resourceType: 'report',
      metadata: {
        from: input.from,
        to: input.to,
        totalAppointments: reportData.appointments.total,
        totalRevenue: reportData.revenue.totalRevenue,
        currency: reportData.revenue.currency,
      },
    });

    return { pdfBuffer, reportData, auditLogId: auditLog.id };
  }
}
