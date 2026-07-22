import { z } from 'zod';
import type { Patient } from '../../domain/entities/Patient.js';

export const CreatePatientSchema = z.object({
  fullName: z.string().min(1, 'El nombre completo es obligatorio').max(255),
  birthDate: z.coerce.date().optional(),
  gender: z.string().max(20).optional().default('Sin especificar'),
  phone: z
    .string()
    .optional()
    .default('')
    .transform((val) => (val ? val.replace(/\s+/g, '') : '')),
  photoUrl: z.string().optional().default(''),
  isProtected: z.boolean().optional().default(false),
});

export type CreatePatientDTO = z.infer<typeof CreatePatientSchema>;

export const UpdatePatientSchema = CreatePatientSchema.partial();
export type UpdatePatientDTO = z.infer<typeof UpdatePatientSchema>;

export interface PatientResponseDTO extends Patient {}
