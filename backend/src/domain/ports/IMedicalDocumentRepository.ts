import type { MedicalDocument, DocumentCategory, DocumentStatus } from '../entities/MedicalDocument.js';
import type { PaginatedResult } from './IPatientRepository.js';

export interface FindDocumentsOptions {
  category?: DocumentCategory;
  query?: string;
  status?: DocumentStatus | 'all';
  page?: number;
  limit?: number;
}

export interface IMedicalDocumentRepository {
  save(document: MedicalDocument): Promise<void>;
  findByPatientId(
    patientId: string,
    options?: FindDocumentsOptions,
  ): Promise<PaginatedResult<MedicalDocument>>;
  findById(id: string): Promise<MedicalDocument | null>;
  updateStatus(id: string, status: DocumentStatus): Promise<void>;
  delete(id: string): Promise<void>;
}
