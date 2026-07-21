import { z } from 'zod';
import type { CIE10Diagnosis } from '../../domain/entities/CIE10Diagnosis.js';

export const SearchCIE10Schema = z.object({
  q: z.string().min(1),
});

export type SearchCIE10DTO = z.infer<typeof SearchCIE10Schema>;

export interface CIE10ResponseDTO extends CIE10Diagnosis {}
