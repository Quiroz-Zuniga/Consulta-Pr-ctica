import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { IMedicalDocumentRepository } from '../../domain/ports/IMedicalDocumentRepository.js';
import { UploadMedicalDocument } from '../../application/use-cases/UploadMedicalDocument.js';
import { ListPatientDocuments } from '../../application/use-cases/ListPatientDocuments.js';
import { ArchiveMedicalDocument } from '../../application/use-cases/ArchiveMedicalDocument.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleGuard } from '../middlewares/roleGuard.js';

const uploadSchema = z.object({
  historyId: z.string().optional(),
  title: z.string().min(1, 'El título es obligatorio'),
  category: z.enum(['laboratory', 'prescription', 'imaging', 'reference', 'incapacity', 'consent', 'other']),
  filePath: z.string().min(1),
  fileUrl: z.string().url('URL inválida'),
  fileType: z.string().min(1),
  fileSize: z.number().nonnegative(),
  notes: z.string().optional(),
});

const statusSchema = z.object({
  status: z.enum(['active', 'archived']),
});

export function documentRoutes(
  fastify: FastifyInstance,
  documentRepository: IMedicalDocumentRepository,
) {
  fastify.register(async function authenticated(scopedApp) {
    scopedApp.addHook('onRequest', authMiddleware);

  // GET /api/v1/patients/:id/documents — Buscar/Listar documentos de paciente
  scopedApp.get(
    '/api/v1/patients/:id/documents',
    { preHandler: [roleGuard('ADMINISTRATOR', 'DOCTOR', 'RECEPTIONIST')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { category, query, status, page, limit } = request.query as {
        category?: string;
        query?: string;
        status?: string;
        page?: string;
        limit?: string;
      };

      const useCase = new ListPatientDocuments(documentRepository);

      const docs = await useCase.execute(id, {
        category: category as any,
        query,
        status: status as any,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      });

      return reply.send(docs);
    },
  );

  // POST /api/v1/patients/:id/documents — Registrar nuevo documento
  scopedApp.post(
    '/api/v1/patients/:id/documents',
    { preHandler: [roleGuard('ADMINISTRATOR', 'DOCTOR', 'RECEPTIONIST')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const parsed = uploadSchema.parse(request.body);
      const useCase = new UploadMedicalDocument(documentRepository);

      const doc = await useCase.execute(
        {
          patientId: id,
          ...parsed,
        },
        request.user?.id,
        request.user?.fullName,
      );

      return reply.status(201).send(doc);
    },
  );

  // PATCH /api/v1/documents/:id/status — Alternar estado activo/archivado
  scopedApp.patch(
    '/api/v1/documents/:id/status',
    { preHandler: [roleGuard('ADMINISTRATOR', 'DOCTOR', 'RECEPTIONIST')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { status } = statusSchema.parse(request.body);

      const useCase = new ArchiveMedicalDocument(documentRepository);

      await useCase.execute(id, status);
      return reply.send({ success: true, status });
    },
  );

  // DELETE /api/v1/documents/:id — Eliminar documento
  scopedApp.delete(
    '/api/v1/documents/:id',
    { preHandler: [roleGuard('ADMINISTRATOR', 'DOCTOR', 'RECEPTIONIST')] },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      await documentRepository.delete(id);

      return reply.send({ success: true });
    },
  );
  });
}
