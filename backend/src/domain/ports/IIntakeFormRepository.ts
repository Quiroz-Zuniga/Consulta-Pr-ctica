import type { IntakeForm, IntakeClinicalData } from '../entities/IntakeForm.js';

export interface IIntakeFormRepository {
  create(form: IntakeForm): Promise<void>;
  findByToken(token: string): Promise<IntakeForm | null>;
  findByPatientId(patientId: string): Promise<IntakeForm[]>;
  markAsSubmitted(id: string, formData: IntakeClinicalData): Promise<void>;
  isTokenValid(token: string): Promise<boolean>;
}
