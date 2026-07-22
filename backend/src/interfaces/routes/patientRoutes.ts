import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { CreatePatientSchema, UpdatePatientSchema } from '../../application/dtos/PatientDTO.js';
import type { IPatientRepository } from '../../domain/ports/IPatientRepository.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleGuard } from '../middlewares/roleGuard.js';

export function patientRoutes(
  app: FastifyInstance,
  patientRepository: IPatientRepository,
): void {
  app.addHook('onRequest', authMiddleware);

  app.get('/api/v1/patients', {
    preHandler: [roleGuard('ADMINISTRATOR', 'DOCTOR', 'RECEPTIONIST')],
  }, async (request, reply) => {
    const { q, page, limit } = request.query as { q?: string; page?: string; limit?: string };
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 20;

    let patients;
    if (q) {
      patients = await patientRepository.search(q, { page: pageNum, limit: limitNum }, request.user?.token);
    } else {
      patients = await patientRepository.findAll({ page: pageNum, limit: limitNum }, request.user?.token);
    }
    reply.status(200).send(patients);
  });

  app.get('/api/v1/patients/:id', {
    preHandler: [roleGuard('ADMINISTRATOR', 'DOCTOR', 'RECEPTIONIST')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const patient = await patientRepository.findById(id, request.user?.token);
    if (!patient) {
      reply.status(404).send({ error: 'Paciente no encontrado' });
      return;
    }
    reply.status(200).send(patient);
  });

  app.post('/api/v1/patients', {
    preHandler: [roleGuard('ADMINISTRATOR', 'DOCTOR', 'RECEPTIONIST')],
  }, async (request, reply) => {
    const parsed = CreatePatientSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400).send({ error: 'Datos inválidos', details: parsed.error.flatten() });
      return;
    }

    const patient = {
      id: randomUUID(),
      ...parsed.data,
      createdAt: new Date(),
    };

    try {
      await patientRepository.save(patient, request.user?.token);
      reply.status(201).send(patient);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno';
      reply.status(500).send({ error: message });
    }
  });

  app.put('/api/v1/patients/:id', {
    preHandler: [roleGuard('ADMINISTRATOR', 'DOCTOR', 'RECEPTIONIST')],
  }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const parsed = UpdatePatientSchema.safeParse(request.body);
    if (!parsed.success) {
      reply.status(400).send({ error: 'Datos inválidos', details: parsed.error.flatten() });
      return;
    }

    const existing = await patientRepository.findById(id, request.user?.token);
    if (!existing) {
      reply.status(404).send({ error: 'Paciente no encontrado' });
      return;
    }

    const updated = { ...existing, ...parsed.data };
    try {
      await patientRepository.update(updated, request.user?.token);
      reply.status(200).send(updated);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error interno';
      reply.status(500).send({ error: message });
    }
  });
}
