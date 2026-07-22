import { z } from 'zod';

const MedicationSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  durationDays: z.number().int().positive(),
});

export const CreateConsultationSchema = z.object({
  patientId: z.string().uuid(),
  cie10Code: z.string().min(1).max(10),
  clinicalNote: z.string().min(1),
  medications: z.array(MedicationSchema).optional().default([]),
  customIndications: z.string().optional().default(''),
  nextAppointment: z.coerce.date().optional().nullable().default(null),
});

export type CreateConsultationDTO = z.infer<typeof CreateConsultationSchema>;

export interface ConsultationResponseDTO {
  historyId: string;
  pdfUrl: string;
}
