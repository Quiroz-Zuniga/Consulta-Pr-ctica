import type { CIE10Diagnosis } from '../entities/CIE10Diagnosis.js';

export interface ICIE10Repository {
  search(query: string): Promise<CIE10Diagnosis[]>;
}
