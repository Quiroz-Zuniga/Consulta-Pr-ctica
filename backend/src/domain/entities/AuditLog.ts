export type AuditAction =
  | 'report_generated'
  | 'patient_pdf_exported'
  | 'protected_patient_export_confirmed'
  | 'data_export_csv'
  | 'data_export_json';

export type AuditResourceType = 'patient' | 'report' | 'payment';

export interface AuditLog {
  id: string;
  /** UUID del usuario que ejecutó la acción (FK -> users) */
  userId: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  /** UUID del recurso afectado — nullable para reportes globales */
  resourceId?: string;
  /** Detalles extra: motivo de confirmación para pacientes protegidos, rango de fechas, etc. */
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
