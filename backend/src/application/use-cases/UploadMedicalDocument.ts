import { randomUUID } from 'crypto';
import type { MedicalDocument, DocumentCategory } from '../../domain/entities/MedicalDocument.js';
import type { IMedicalDocumentRepository } from '../../domain/ports/IMedicalDocumentRepository.js';

export interface UploadDocumentInput {
  patientId: string;
  historyId?: string;
  title: string;
  category: DocumentCategory;
  filePath: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  notes?: string;
}

export class UploadMedicalDocument {
  constructor(private readonly documentRepo: IMedicalDocumentRepository) {}

  async execute(
    input: UploadDocumentInput,
    uploadedBy?: string,
    uploadedByName?: string,
  ): Promise<MedicalDocument> {
    if (!input.patientId) {
      throw new Error('Patient ID is required to link medical document.');
    }

    if (!input.title || !input.title.trim()) {
      throw new Error('Document title cannot be empty.');
    }

    const document: MedicalDocument = {
      id: randomUUID(),
      patientId: input.patientId,
      historyId: input.historyId,
      title: input.title.trim(),
      category: input.category,
      filePath: input.filePath,
      fileUrl: input.fileUrl,
      fileType: input.fileType,
      fileSize: input.fileSize || 0,
      uploadedBy,
      uploadedByName,
      uploadedAt: new Date(),
      status: 'active',
      notes: input.notes?.trim(),
    };

    await this.documentRepo.save(document);
    return document;
  }
}
