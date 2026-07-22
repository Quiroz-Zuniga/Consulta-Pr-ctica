import type { MedicalHistory } from '../entities/MedicalHistory.js';

export interface IMedicalHistoryRepository {
  findById(id: string, token?: string): Promise<MedicalHistory | null>;
  findByPatient(patientId: string, token?: string): Promise<MedicalHistory[]>;
  save(history: MedicalHistory, token?: string): Promise<void>;
}
