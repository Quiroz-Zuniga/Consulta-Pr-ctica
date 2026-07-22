import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleGuard } from '../middlewares/roleGuard.js';
import type { ExportPatientRecord } from '../../application/use-cases/ExportPatientRecord.js';
import type { ExportPatientDataCsvJson } from '../../application/use-cases/ExportPatientDataCsvJson.js';
import type { GenerateClinicReport } from '../../application/use-cases/GenerateClinicReport.js';
import type { IAuditLogRepository } from '../../domain/ports/IAuditLogRepository.js';
import { DomainException } from '../../domain/exceptions/DomainException.js';

const ClinicStatsQuerySchema = z.object({
  from: z.string().min(1, 'Se requiere from (ISO 8601)'),
  to: z.string().min(1, 'Se requiere to (ISO 8601)'),
});

const ProtectedExportQuerySchema = z.object({
  confirmationReason: z.string().optional(),
});

const AuditLogQuerySchema = z.object({
  resourceType: z.string().optional(),
  resourceId: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export function reportRoutes(
  app: FastifyInstance,
  exportPatientRecord: ExportPatientRecord,
  exportPatientDataCsvJson: ExportPatientDataCsvJson,
  generateClinicReport: GenerateClinicReport,
  auditLogRepository: IAuditLogRepository,
): void {
  app.addHook('onRequest', authMiddleware);

  // ─────────────────────────────────────────────────────────────
  // GET /api/v1/reports/clinic-stats?from=&to=
  // Genera el reporte de actividad del consultorio en PDF
  // ─────────────────────────────────────────────────────────────
  app.get('/api/v1/reports/clinic-stats', {
    preHandler: [roleGuard('ADMINISTRATOR')],
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const parsed = ClinicStatsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parámetros inválidos', details: parsed.error.flatten() });
    }

    try {
      const result = await generateClinicReport.execute({
        from: parsed.data.from,
        to: parsed.data.to,
        requestedByUserId: request.user!.id,
      });

      const fileName = `reporte_consultorio_${parsed.data.from}_${parsed.data.to}.pdf`;
      reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `attachment; filename="${fileName}"`)
        .header('X-Audit-Log-Id', result.auditLogId)
        .send(result.pdfBuffer);
    } catch (err) {
      if (err instanceof DomainException) {
        return reply.status(400).send({ error: err.message });
      }
      const msg = err instanceof Error ? err.message : 'Error al generar reporte';
      return reply.status(500).send({ error: msg });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // GET /api/v1/patients/:id/export/pdf
  // Exporta el expediente completo de un paciente en PDF
  // ─────────────────────────────────────────────────────────────
  app.get('/api/v1/patients/:id/export/pdf', {
    preHandler: [roleGuard('ADMINISTRATOR')],
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = ProtectedExportQuerySchema.safeParse(request.query);

    try {
      const result = await exportPatientRecord.execute({
        patientId: id,
        requestedByUserId: request.user!.id,
        confirmationReason: query.success ? query.data.confirmationReason : undefined,
      });

      const fileName = `expediente_${id}_${Date.now()}.pdf`;
      reply
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `attachment; filename="${fileName}"`)
        .header('X-Audit-Log-Id', result.auditLogId)
        .header('X-Patient-Protected', String(result.isProtected))
        .send(result.pdfBuffer);
    } catch (err) {
      if (err instanceof DomainException) {
        return reply.status(400).send({
          error: err.message,
          requiresConfirmation: true,
        });
      }
      const msg = err instanceof Error ? err.message : 'Error al exportar expediente';
      const status = msg.includes('no encontrado') ? 404 : 500;
      return reply.status(status).send({ error: msg });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // GET /api/v1/patients/:id/export/csv
  // ─────────────────────────────────────────────────────────────
  app.get('/api/v1/patients/:id/export/csv', {
    preHandler: [roleGuard('ADMINISTRATOR')],
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = ProtectedExportQuerySchema.safeParse(request.query);

    try {
      const result = await exportPatientDataCsvJson.execute({
        patientId: id,
        requestedByUserId: request.user!.id,
        format: 'csv',
        confirmationReason: query.success ? query.data.confirmationReason : undefined,
      });

      reply
        .header('Content-Type', result.contentType)
        .header('Content-Disposition', `attachment; filename="${result.fileName}"`)
        .header('X-Audit-Log-Id', result.auditLogId)
        .send(result.content);
    } catch (err) {
      if (err instanceof DomainException) {
        return reply.status(400).send({ error: err.message, requiresConfirmation: true });
      }
      const msg = err instanceof Error ? err.message : 'Error al exportar CSV';
      return reply.status(500).send({ error: msg });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // GET /api/v1/patients/:id/export/json
  // ─────────────────────────────────────────────────────────────
  app.get('/api/v1/patients/:id/export/json', {
    preHandler: [roleGuard('ADMINISTRATOR')],
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const query = ProtectedExportQuerySchema.safeParse(request.query);

    try {
      const result = await exportPatientDataCsvJson.execute({
        patientId: id,
        requestedByUserId: request.user!.id,
        format: 'json',
        confirmationReason: query.success ? query.data.confirmationReason : undefined,
      });

      reply
        .header('Content-Type', result.contentType)
        .header('Content-Disposition', `attachment; filename="${result.fileName}"`)
        .header('X-Audit-Log-Id', result.auditLogId)
        .send(result.content);
    } catch (err) {
      if (err instanceof DomainException) {
        return reply.status(400).send({ error: err.message, requiresConfirmation: true });
      }
      const msg = err instanceof Error ? err.message : 'Error al exportar JSON';
      return reply.status(500).send({ error: msg });
    }
  });

  // ─────────────────────────────────────────────────────────────
  // GET /api/v1/audit-log?resourceType=&resourceId=&from=&to=
  // Consulta el log de auditoría (solo ADMINISTRATOR)
  // ─────────────────────────────────────────────────────────────
  app.get('/api/v1/audit-log', {
    preHandler: [roleGuard('ADMINISTRATOR')],
    config: {
      rateLimit: {
        max: 30,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const parsed = AuditLogQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parámetros inválidos', details: parsed.error.flatten() });
    }

    const { resourceType, resourceId, from, to } = parsed.data;

    try {
      let logs;
      if (resourceType && resourceId) {
        logs = await auditLogRepository.findByResourceId(resourceType, resourceId);
      } else if (from && to) {
        logs = await auditLogRepository.findByDateRange(new Date(from), new Date(to), resourceType);
      } else {
        // Default: últimos 7 días
        const defaultTo = new Date();
        const defaultFrom = new Date(defaultTo.getTime() - 7 * 24 * 60 * 60 * 1000);
        logs = await auditLogRepository.findByDateRange(defaultFrom, defaultTo, resourceType);
      }

      return reply.status(200).send({ data: logs, total: logs.length });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al consultar audit log';
      return reply.status(500).send({ error: msg });
    }
  });
}
