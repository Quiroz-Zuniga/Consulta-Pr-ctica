import { z } from 'zod';
import type { Patient } from '../../domain/entities/Patient.js';

export const CreatePatientSchema = z.object({
  fullName: z.string().min(1).max(255),
  birthDate: z.coerce.date(),
  gender: z.string().min(1).max(20),
  phone: z.string().max(50).optional().default(''),
  photoUrl: z.string().optional().default(''),
  isProtected: z.boolean().optional().default(false),
});

export type CreatePatientDTO = z.infer<typeof CreatePatientSchema>;

export const UpdatePatientSchema = CreatePatientSchema.partial();
export type UpdatePatientDTO = z.infer<typeof UpdatePatientSchema>;

export interface PatientResponseDTO extends Patient {}
