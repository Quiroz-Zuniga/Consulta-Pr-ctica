export type DocumentCategory =
  | 'laboratory'
  | 'prescription'
  | 'imaging'
  | 'reference'
  | 'incapacity'
  | 'consent'
  | 'other';

export type DocumentStatus = 'active' | 'archived';

export interface MedicalDocument {
  id: string;
  patientId: string;
  historyId?: string;
  title: string;
  category: DocumentCategory;
  filePath: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy?: string;
  uploadedByName?: string;
  uploadedAt: Date;
  status: DocumentStatus;
  notes?: string;
}
