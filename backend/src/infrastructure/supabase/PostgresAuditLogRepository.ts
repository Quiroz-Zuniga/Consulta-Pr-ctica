import { randomUUID } from 'node:crypto';
import { supabaseAdmin } from './SupabaseClient.js';
import type { IAuditLogRepository } from '../../domain/ports/IAuditLogRepository.js';
import type { AuditLog } from '../../domain/entities/AuditLog.js';

export class PostgresAuditLogRepository implements IAuditLogRepository {
  async create(log: AuditLog): Promise<void> {
    const { error } = await supabaseAdmin.from('audit_log').insert({
      id: log.id ?? randomUUID(),
      user_id: log.userId,
      action: log.action,
      resource_type: log.resourceType,
      resource_id: log.resourceId ?? null,
      metadata: log.metadata ?? null,
      created_at: log.createdAt ?? new Date(),
    });

    if (error) {
      throw new Error(`AuditLogRepository.create failed: ${error.message}`);
    }
  }

  async findByResourceId(resourceType: string, resourceId: string): Promise<AuditLog[]> {
    const { data, error } = await supabaseAdmin
      .from('audit_log')
      .select('*')
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`AuditLogRepository.findByResourceId failed: ${error.message}`);
    return (data ?? []).map(this.mapRow);
  }

  async findByUserId(userId: string, limit = 50): Promise<AuditLog[]> {
    const { data, error } = await supabaseAdmin
      .from('audit_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`AuditLogRepository.findByUserId failed: ${error.message}`);
    return (data ?? []).map(this.mapRow);
  }

  async findByDateRange(from: Date, to: Date, resourceType?: string): Promise<AuditLog[]> {
    let query = supabaseAdmin
      .from('audit_log')
      .select('*')
      .gte('created_at', from.toISOString())
      .lte('created_at', to.toISOString())
      .order('created_at', { ascending: false });

    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    const { data, error } = await query;
    if (error) throw new Error(`AuditLogRepository.findByDateRange failed: ${error.message}`);
    return (data ?? []).map(this.mapRow);
  }

  private mapRow(row: Record<string, unknown>): AuditLog {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      action: row.action as AuditLog['action'],
      resourceType: row.resource_type as AuditLog['resourceType'],
      resourceId: row.resource_id as string | undefined,
      metadata: row.metadata as Record<string, unknown> | undefined,
      createdAt: new Date(row.created_at as string),
    };
  }
}
