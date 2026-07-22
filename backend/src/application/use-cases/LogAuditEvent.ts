import { randomUUID } from 'node:crypto';
import type { IAuditLogRepository } from '../../domain/ports/IAuditLogRepository.js';
import type { AuditLog, AuditAction, AuditResourceType } from '../../domain/entities/AuditLog.js';

export interface LogAuditEventInput {
  userId: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Caso de uso genérico reutilizable para registrar cualquier evento
 * de auditoría desde otros módulos.
 */
export class LogAuditEvent {
  constructor(private readonly auditLogRepository: IAuditLogRepository) {}

  async execute(input: LogAuditEventInput): Promise<AuditLog> {
    const log: AuditLog = {
      id: randomUUID(),
      userId: input.userId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata,
      createdAt: new Date(),
    };

    await this.auditLogRepository.create(log);
    return log;
  }
}
