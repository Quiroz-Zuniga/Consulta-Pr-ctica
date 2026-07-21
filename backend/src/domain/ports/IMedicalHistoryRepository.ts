import type { MedicalHistory } from '../entities/MedicalHistory.js';

export interface IMedicalHistoryRepository {
  findById(id: string): Promise<MedicalHistory | null>;
  findByPatient(patientId: string): Promise<MedicalHistory[]>;
  save(history: MedicalHistory): Promise<void>;
}
