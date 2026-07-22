import type { DocumentStatus } from '../../domain/entities/MedicalDocument.js';
import type { IMedicalDocumentRepository } from '../../domain/ports/IMedicalDocumentRepository.js';

export class ArchiveMedicalDocument {
  constructor(private readonly documentRepo: IMedicalDocumentRepository) {}

  async execute(documentId: string, status: DocumentStatus): Promise<void> {
    const doc = await this.documentRepo.findById(documentId);
    if (!doc) {
      throw new Error(`Medical document with ID ${documentId} not found.`);
    }

    await this.documentRepo.updateStatus(documentId, status);
  }
}
