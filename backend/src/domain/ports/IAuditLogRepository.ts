import type { AuditLog } from '../entities/AuditLog.js';

export interface IAuditLogRepository {
  create(log: AuditLog): Promise<void>;
  findByResourceId(resourceType: string, resourceId: string): Promise<AuditLog[]>;
  findByUserId(userId: string, limit?: number): Promise<AuditLog[]>;
  findByDateRange(from: Date, to: Date, resourceType?: string): Promise<AuditLog[]>;
}
