import type { CIE10Diagnosis } from '../../domain/entities/CIE10Diagnosis.js';
import type { ICIE10Repository } from '../../domain/ports/ICIE10Repository.js';
import { createScopedClient } from './SupabaseClient.js';

export class PostgresCIE10Repository implements ICIE10Repository {
  async search(query: string, token?: string): Promise<CIE10Diagnosis[]> {
    const client = createScopedClient(token);
    const { data, error } = await client
      .from('cie10_diagnoses')
      .select('*')
      .or(`code.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(20);

    if (error || !data) return [];

    return data.map((row: Record<string, unknown>) => ({
      code: row.code as string,
      description: row.description as string,
      category: row.category as string,
    }));
  }
}
