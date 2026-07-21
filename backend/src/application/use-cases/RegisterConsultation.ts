import { randomUUID } from 'node:crypto';
import type { MedicalHistory } from '../../domain/entities/MedicalHistory.js';
import type { Prescription } from '../../domain/entities/Prescription.js';
import type { IPatientRepository } from '../../domain/ports/IPatientRepository.js';
import type { IMedicalHistoryRepository } from '../../domain/ports/IMedicalHistoryRepository.js';
import type { IPdfGeneratorService } from '../../domain/ports/IPdfGeneratorService.js';
import type { IStorageService } from '../../domain/ports/IStorageService.js';
import { lockHistory } from '../../domain/entities/MedicalHistory.js';
import type { CreateConsultationDTO, ConsultationResponseDTO } from '../dtos/ConsultationDTO.js';

export class RegisterConsultation {
  constructor(
    private readonly _patientRepository: IPatientRepository,
    private readonly _historyRepository: IMedicalHistoryRepository,
    private readonly _pdfService: IPdfGeneratorService,
    private readonly _storageService: IStorageService,
  ) {}

  async execute(
    dto: CreateConsultationDTO,
    doctorId: string,
    doctorName: string,
  ): Promise<ConsultationResponseDTO> {
    const patient = await this._patientRepository.findById(dto.patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    const prescriptionId = randomUUID();
    const historyId = randomUUID();

    const prescription: Prescription = {
      id: prescriptionId,
      historyId,
      medications: dto.medications,
      customIndications: dto.customIndications,
      nextAppointment: dto.nextAppointment ?? null,
      createdAt: new Date(),
    };

    let history: MedicalHistory = {
      id: historyId,
      patientId: dto.patientId,
      doctorId,
      cie10Code: dto.cie10Code,
      clinicalNote: dto.clinicalNote,
      isLocked: false,
      createdAt: new Date(),
      prescription,
    };

    history = lockHistory(history);

    await this._historyRepository.save(history);

    const pdfBuffer = await this._pdfService.generatePrescriptionPdf(
      prescription,
      patient,
      doctorName,
    );

    const fileName = `prescription_${prescriptionId}.pdf`;
    const pdfUrl = await this._storageService.uploadPdf(pdfBuffer, fileName);

    return { historyId, pdfUrl };
  }
}
