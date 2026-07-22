import type { MedicalDocument, DocumentCategory, DocumentStatus } from '../../domain/entities/MedicalDocument.js';
import type { IMedicalDocumentRepository, FindDocumentsOptions } from '../../domain/ports/IMedicalDocumentRepository.js';
import type { PaginatedResult } from '../../domain/ports/IPatientRepository.js';

export class ListPatientDocuments {
  constructor(private readonly documentRepo: IMedicalDocumentRepository) {}

  async execute(
    patientId: string,
    options?: FindDocumentsOptions,
  ): Promise<PaginatedResult<MedicalDocument>> {
    if (!patientId) {
      throw new Error('Patient ID is required to query documents.');
    }

    return this.documentRepo.findByPatientId(patientId, options);
  }
}
