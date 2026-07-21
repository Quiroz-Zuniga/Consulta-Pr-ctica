import type { Medication } from './Medication.js';

export interface Prescription {
  id: string;
  historyId: string;
  medications: Medication[];
  customIndications: string;
  nextAppointment: Date | null;
  createdAt: Date;
}
