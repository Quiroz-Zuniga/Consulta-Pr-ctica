import type { FastifyInstance } from 'fastify';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleGuard } from '../middlewares/roleGuard.js';
import type { RegisterPayment } from '../../application/use-cases/RegisterPayment.js';
import type { UpdatePaymentStatus } from '../../application/use-cases/UpdatePaymentStatus.js';
import type { GetPaymentsByAppointment } from '../../application/use-cases/GetPaymentsByAppointment.js';
import type { GetPatientPaymentsSummary } from '../../application/use-cases/GetPatientPaymentsSummary.js';

export function paymentRoutes(
  fastify: FastifyInstance,
  registerPayment: RegisterPayment,
  updatePaymentStatus: UpdatePaymentStatus,
  getPaymentsByAppointment: GetPaymentsByAppointment,
  getPatientPaymentsSummary: GetPatientPaymentsSummary,
) {
  // 1. POST /api/v1/appointments/:id/payments — Registrar un pago manual para una cita
  fastify.post(
    '/api/v1/appointments/:id/payments',
    {
      preHandler: [authMiddleware, roleGuard('ADMINISTRATOR', 'RECEPTIONIST', 'DOCTOR')],
    },
    async (request, reply) => {
      try {
        const { id: appointmentId } = request.params as { id: string };
        const body = request.body as any;

        const userId = (request as any).user?.id;

        const result = await registerPayment.execute({
          ...body,
          appointmentId,
          registeredBy: userId,
        });

        return reply.status(201).send(result);
      } catch (err: any) {
        if (err.name === 'ZodError') {
          return reply.status(400).send({
            error: 'Datos de pago inválidos',
            details: err.errors,
          });
        }
        return reply.status(400).send({ error: err.message });
      }
    },
  );

  // 2. GET /api/v1/appointments/:id/payments — Listar pagos de una cita
  fastify.get(
    '/api/v1/appointments/:id/payments',
    {
      preHandler: [authMiddleware, roleGuard('ADMINISTRATOR', 'RECEPTIONIST', 'DOCTOR')],
    },
    async (request, reply) => {
      try {
        const { id: appointmentId } = request.params as { id: string };
        const result = await getPaymentsByAppointment.execute(appointmentId);
        return reply.send(result);
      } catch (err: any) {
        return reply.status(400).send({ error: err.message });
      }
    },
  );

  // 3. PATCH /api/v1/payments/:id/status — Actualizar estado de un pago (paid, refunded, etc.)
  fastify.patch(
    '/api/v1/payments/:id/status',
    {
      preHandler: [authMiddleware, roleGuard('ADMINISTRATOR', 'RECEPTIONIST')],
    },
    async (request, reply) => {
      try {
        const { id: paymentId } = request.params as { id: string };
        const { status } = request.body as { status: string };

        const result = await updatePaymentStatus.execute({
          paymentId,
          status: status as any,
        });

        return reply.send(result);
      } catch (err: any) {
        if (err.name === 'ZodError') {
          return reply.status(400).send({
            error: 'Estado de pago inválido',
            details: err.errors,
          });
        }
        return reply.status(400).send({ error: err.message });
      }
    },
  );

  // 4. GET /api/v1/patients/:id/payments-summary — Resumen y lista de pagos de un paciente
  fastify.get(
    '/api/v1/patients/:id/payments-summary',
    {
      preHandler: [authMiddleware, roleGuard('ADMINISTRATOR', 'RECEPTIONIST', 'DOCTOR')],
    },
    async (request, reply) => {
      try {
        const { id: patientId } = request.params as { id: string };
        const result = await getPatientPaymentsSummary.execute(patientId);
        return reply.send(result);
      } catch (err: any) {
        return reply.status(400).send({ error: err.message });
      }
    },
  );
}
