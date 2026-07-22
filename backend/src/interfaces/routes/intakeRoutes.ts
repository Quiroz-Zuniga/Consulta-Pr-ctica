import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { CreateIntakeForm } from '../../application/use-cases/CreateIntakeForm.js';
import type { GetIntakeFormByToken } from '../../application/use-cases/GetIntakeFormByToken.js';
import type { SubmitIntakeForm } from '../../application/use-cases/SubmitIntakeForm.js';
import type { GetPatientIntakeForms } from '../../application/use-cases/GetPatientIntakeForms.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';
import { roleGuard } from '../middlewares/roleGuard.js';

const submitBodySchema = z.object({
  chiefComplaint: z.string().min(1, 'El motivo de consulta es obligatorio'),
  symptoms: z.string().optional(),
  symptomDuration: z.string().optional(),
  allergies: z.string().optional(),
  currentMedications: z.string().optional(),
  medicalHistoryNotes: z.string().optional(),
  additionalNotes: z.string().optional(),
});

const createIntakeBodySchema = z.object({
  appointmentId: z.string().optional(),
  expiresInHours: z.number().positive().optional().default(72),
});

export function intakeRoutes(
  fastify: FastifyInstance,
  createIntakeForm: CreateIntakeForm,
  getIntakeFormByToken: GetIntakeFormByToken,
  submitIntakeForm: SubmitIntakeForm,
  getPatientIntakeForms: GetPatientIntakeForms,
) {
  // ---------------------------------------------------------------------------
  // RUTAS PÚBLICAS (SIN authMiddleware, protegidas únicamente por TOKEN único)
  // ---------------------------------------------------------------------------
  fastify.get(
    '/api/v1/public/intake/:token',
    {
      config: {
        rateLimit: {
          max: 30,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      const { token } = request.params as { token: string };
      const publicData = await getIntakeFormByToken.execute(token);
      return reply.status(200).send(publicData);
    },
  );

  fastify.post(
    '/api/v1/public/intake/:token',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      const { token } = request.params as { token: string };
      const parsedBody = submitBodySchema.parse(request.body);

      try {
        const result = await submitIntakeForm.execute(token, parsedBody);
        return reply.status(200).send(result);
      } catch (err: any) {
        return reply.status(400).send({ error: err.message, success: false });
      }
    },
  );

  // ---------------------------------------------------------------------------
  // RUTAS INTERNAS (AUTENTICADAS con authMiddleware + roleGuard)
  // ---------------------------------------------------------------------------
  fastify.register(async function internalRoutes(app) {
    app.addHook('onRequest', authMiddleware);

    // POST /api/v1/patients/:id/intake-forms — Generar formulario de intake interno
    app.post(
      '/api/v1/patients/:id/intake-forms',
      { preHandler: [roleGuard('ADMINISTRATOR', 'DOCTOR', 'RECEPTIONIST')] },
      async (request, reply) => {
        const { id } = request.params as { id: string };
        const body = createIntakeBodySchema.parse(request.body || {});

        try {
          const form = await createIntakeForm.execute(
            {
              patientId: id,
              appointmentId: body.appointmentId,
              expiresInHours: body.expiresInHours,
            },
            request.user?.token,
          );

          const baseUrl = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
          const publicUrl = `${baseUrl}/intake/${form.accessToken}`;

          return reply.status(201).send({
            form,
            publicUrl,
          });
        } catch (err: any) {
          return reply.status(400).send({ error: err.message });
        }
      },
    );

    // GET /api/v1/patients/:id/intake-forms — Listar formularios de intake de un paciente
    app.get(
      '/api/v1/patients/:id/intake-forms',
      { preHandler: [roleGuard('ADMINISTRATOR', 'DOCTOR', 'RECEPTIONIST')] },
      async (request, reply) => {
        const { id } = request.params as { id: string };
        const forms = await getPatientIntakeForms.execute(id);
        return reply.status(200).send(forms);
      },
    );
  });
}
