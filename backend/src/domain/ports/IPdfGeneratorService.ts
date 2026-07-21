import type { Prescription } from '../entities/Prescription.js';
import type { Patient } from '../entities/Patient.js';

export interface IPdfGeneratorService {
  generatePrescriptionPdf(
    prescription: Prescription,
    patient: Patient,
    doctorName: string,
  ): Promise<Buffer>;
}
