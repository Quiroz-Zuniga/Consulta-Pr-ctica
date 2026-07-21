import type { Patient } from '../../domain/entities/Patient.js';
import type { Prescription } from '../../domain/entities/Prescription.js';
import type { IPatientRepository } from '../../domain/ports/IPatientRepository.js';
import type { IPdfGeneratorService } from '../../domain/ports/IPdfGeneratorService.js';
import type { IStorageService } from '../../domain/ports/IStorageService.js';

export class GeneratePrescription {
  constructor(
    private readonly _pdfService: IPdfGeneratorService,
    private readonly _storageService: IStorageService,
    private readonly _patientRepository: IPatientRepository,
  ) {}

  async execute(
    prescription: Prescription,
    patientId: string,
    doctorName: string,
  ): Promise<string> {
    const patient = await this._patientRepository.findById(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    const pdfBuffer = await this._pdfService.generatePrescriptionPdf(
      prescription,
      patient,
      doctorName,
    );

    const fileName = `prescription_${prescription.id}.pdf`;
    const pdfUrl = await this._storageService.uploadPdf(pdfBuffer, fileName);

    return pdfUrl;
  }
}
