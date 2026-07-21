import type { IStorageService } from '../../domain/ports/IStorageService.js';
import { supabaseAdmin } from '../supabase/SupabaseClient.js';

const PRESCRIPTIONS_BUCKET = process.env.STORAGE_BUCKET_PRESCRIPTIONS ?? 'prescription-pdfs';

export class SupabaseStorageService implements IStorageService {
  async uploadPdf(
    buffer: Buffer,
    fileName: string,
    contentType = 'application/pdf',
  ): Promise<string> {
    const { data, error } = await supabaseAdmin.storage
      .from(PRESCRIPTIONS_BUCKET)
      .upload(fileName, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload PDF: ${error.message}`);
    }

    const { data: urlData } = await supabaseAdmin.storage
      .from(PRESCRIPTIONS_BUCKET)
      .createSignedUrl(data.path, 60 * 60 * 24);

    if (!urlData) {
      throw new Error('Failed to generate signed URL');
    }

    return urlData.signedUrl;
  }

  async getSignedUrl(path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await supabaseAdmin.storage
      .from(PRESCRIPTIONS_BUCKET)
      .createSignedUrl(path, expiresIn);

    if (error || !data) {
      throw new Error(`Failed to get signed URL: ${error?.message}`);
    }

    return data.signedUrl;
  }
}
