import type { Prescription } from './Prescription.js';

export interface MedicalHistory {
  id: string;
  patientId: string;
  doctorId: string;
  cie10Code: string;
  clinicalNote: string;
  isLocked: boolean;
  createdAt: Date;
  prescription: Prescription | null;
}

export function lockHistory(history: MedicalHistory): MedicalHistory {
  return { ...history, isLocked: true };
}

export function addPrescription(
  history: MedicalHistory,
  prescription: Prescription,
): MedicalHistory {
  if (history.isLocked) {
    throw new Error('Cannot add prescription to a locked medical history');
  }
  return { ...history, prescription };
}
