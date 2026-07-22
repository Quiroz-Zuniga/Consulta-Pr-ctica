import type { MedicalDocument, DocumentCategory, DocumentStatus } from '../../domain/entities/MedicalDocument.js';
import type { IMedicalDocumentRepository, FindDocumentsOptions } from '../../domain/ports/IMedicalDocumentRepository.js';
import type { PaginatedResult } from '../../domain/ports/IPatientRepository.js';
import { createScopedClient } from './SupabaseClient.js';

export class PostgresMedicalDocumentRepository implements IMedicalDocumentRepository {
  constructor(private readonly getAuthToken?: () => string | undefined) {}

  async save(document: MedicalDocument): Promise<void> {
    const client = createScopedClient(this.getAuthToken?.());
    
    // Intentar primero con la tabla canónica 'medical_documents'
    const { error } = await client.from('medical_documents').insert({
      id: document.id,
      patient_id: document.patientId,
      history_id: document.historyId || null,
      title: document.title,
      category: document.category,
      file_path: document.filePath,
      file_url: document.fileUrl,
      file_type: document.fileType,
      file_size: document.fileSize,
      uploaded_by: document.uploadedBy || null,
      uploaded_by_name: document.uploadedByName || null,
      uploaded_at: document.uploadedAt.toISOString(),
      status: document.status,
      notes: document.notes || null,
    });

    if (error) {
      // Fallback a 'medical_attachments' en caso de que la migración SQL aún no esté aplicada
      const { error: fallbackErr } = await client.from('medical_attachments').insert({
        id: document.id,
        patient_id: document.patientId,
        history_id: document.historyId || document.patientId,
        file_url: document.fileUrl,
        file_type: document.fileType,
        title: document.title,
        category: document.category,
        file_size: document.fileSize,
        uploaded_by: document.uploadedBy || null,
        uploaded_by_name: document.uploadedByName || null,
        uploaded_at: document.uploadedAt.toISOString(),
        status: document.status,
        notes: document.notes || null,
      });

      if (fallbackErr) {
        throw new Error(`Failed to save medical document: ${error.message} (Fallback error: ${fallbackErr.message})`);
      }
    }
  }

  async findByPatientId(
    patientId: string,
    options?: FindDocumentsOptions,
  ): Promise<PaginatedResult<MedicalDocument>> {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.max(1, options?.limit || 20);
    const offset = (page - 1) * limit;

    const client = createScopedClient(this.getAuthToken?.());

    // Probar primero en 'medical_documents'
    let req = client
      .from('medical_documents')
      .select('*', { count: 'exact' })
      .eq('patient_id', patientId)
      .order('uploaded_at', { ascending: false });

    if (options?.category && options.category !== ('all' as any)) {
      req = req.eq('category', options.category);
    }

    if (options?.status && options.status !== 'all') {
      req = req.eq('status', options.status);
    }

    if (options?.query && options.query.trim()) {
      req = req.ilike('title', `%${options.query.trim()}%`);
    }

    req = req.range(offset, offset + limit - 1);

    const { data, count, error } = await req;

    if (error) {
      // Fallback a 'medical_attachments' si 'medical_documents' no existe aún en DB
      let fallbackReq = client
        .from('medical_attachments')
        .select('*', { count: 'exact' })
        .or(`patient_id.eq.${patientId},history_id.eq.${patientId}`)
        .order('uploaded_at', { ascending: false });

      if (options?.category && options.category !== ('all' as any)) {
        fallbackReq = fallbackReq.eq('category', options.category);
      }

      fallbackReq = fallbackReq.range(offset, offset + limit - 1);

      const { data: fallbackData, count: fallbackCount, error: fallbackErr } = await fallbackReq;
      if (fallbackErr) return { data: [], total: 0, page, pageSize: limit };

      return {
        data: (fallbackData || []).map((row: any) => this.mapRowToEntity(row, patientId)),
        total: fallbackCount ?? (fallbackData?.length || 0),
        page,
        pageSize: limit,
      };
    }

    return {
      data: (data || []).map((row: any) => this.mapRowToEntity(row, patientId)),
      total: count ?? (data?.length || 0),
      page,
      pageSize: limit,
    };
  }

  async findById(id: string): Promise<MedicalDocument | null> {
    const client = createScopedClient(this.getAuthToken?.());

    // Buscar en 'medical_documents'
    const { data, error } = await client
      .from('medical_documents')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      return this.mapRowToEntity(data, data.patient_id);
    }

    // Fallback a 'medical_attachments'
    const { data: fallbackData, error: fallbackErr } = await client
      .from('medical_attachments')
      .select('*')
      .eq('id', id)
      .single();

    if (fallbackErr || !fallbackData) return null;

    return this.mapRowToEntity(fallbackData, fallbackData.patient_id || fallbackData.history_id);
  }

  async updateStatus(id: string, status: DocumentStatus): Promise<void> {
    const client = createScopedClient(this.getAuthToken?.());

    const { error } = await client
      .from('medical_documents')
      .update({ status })
      .eq('id', id);

    if (error) {
      // Fallback a 'medical_attachments'
      await client
        .from('medical_attachments')
        .update({ status })
        .eq('id', id);
    }
  }

  async delete(id: string): Promise<void> {
    const client = createScopedClient(this.getAuthToken?.());

    const { error } = await client.from('medical_documents').delete().eq('id', id);
    if (error) {
      // Fallback a 'medical_attachments'
      await client.from('medical_attachments').delete().eq('id', id);
    }
  }

  private mapRowToEntity(row: any, fallbackPatientId: string): MedicalDocument {
    return {
      id: row.id,
      patientId: row.patient_id || fallbackPatientId,
      historyId: row.history_id,
      title: row.title || `Documento ${row.id.substring(0, 6)}`,
      category: (row.category as DocumentCategory) || (row.file_type?.startsWith('image/') ? 'imaging' : 'other'),
      filePath: row.file_path || row.file_url,
      fileUrl: row.file_url,
      fileType: row.file_type || 'application/pdf',
      fileSize: Number(row.file_size) || 0,
      uploadedBy: row.uploaded_by,
      uploadedByName: row.uploaded_by_name,
      uploadedAt: new Date(row.uploaded_at || Date.now()),
      status: (row.status as DocumentStatus) || 'active',
      notes: row.notes,
    };
  }
}
