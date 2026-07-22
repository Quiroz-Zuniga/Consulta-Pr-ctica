import type { Patient } from '../../domain/entities/Patient.js';
import type { IPatientRepository, PaginatedResult } from '../../domain/ports/IPatientRepository.js';
import { createScopedClient, supabaseAdmin } from './SupabaseClient.js';

export class PostgresPatientRepository implements IPatientRepository {
  async findById(id: string, token?: string): Promise<Patient | null> {
    const client = token ? createScopedClient(token) : supabaseAdmin;
    const { data, error } = await client
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async findAll(options?: { page?: number; limit?: number }, token?: string): Promise<PaginatedResult<Patient>> {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.max(1, options?.limit || 20);
    const offset = (page - 1) * limit;

    const client = createScopedClient(token);
    const { data, count, error } = await client
      .from('patients')
      .select('*', { count: 'exact' })
      .order('full_name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error || !data) return { data: [], total: 0, page, pageSize: limit };
    return {
      data: data.map(this.mapToEntity),
      total: count ?? data.length,
      page,
      pageSize: limit,
    };
  }

  async search(query: string, options?: { page?: number; limit?: number }, token?: string): Promise<PaginatedResult<Patient>> {
    const page = Math.max(1, options?.page || 1);
    const limit = Math.max(1, options?.limit || 20);
    const offset = (page - 1) * limit;

    const client = createScopedClient(token);
    const { data, count, error } = await client
      .from('patients')
      .select('*', { count: 'exact' })
      .ilike('full_name', `%${query}%`)
      .order('full_name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error || !data) return { data: [], total: 0, page, pageSize: limit };
    return {
      data: data.map(this.mapToEntity),
      total: count ?? data.length,
      page,
      pageSize: limit,
    };
  }

  async save(patient: Patient, token?: string): Promise<void> {
    const client = token ? createScopedClient(token) : supabaseAdmin;
    const { error } = await client
      .from('patients')
      .insert(this.mapToRow(patient));

    if (error) throw new Error(`Failed to save patient: ${error.message}`);
  }

  async update(patient: Patient, token?: string): Promise<void> {
    const client = token ? createScopedClient(token) : supabaseAdmin;
    const { error } = await client
      .from('patients')
      .update(this.mapToRow(patient))
      .eq('id', patient.id);

    if (error) throw new Error(`Failed to update patient: ${error.message}`);
  }

  async delete(id: string, token?: string): Promise<void> {
    const client = token ? createScopedClient(token) : supabaseAdmin;
    const { error } = await client
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete patient: ${error.message}`);
  }

  private mapToEntity(row: Record<string, unknown>): Patient {
    return {
      id: row.id as string,
      fullName: row.full_name as string,
      birthDate: row.birth_date ? new Date(row.birth_date as string) : undefined,
      gender: (row.gender as string) ?? '',
      phone: (row.phone as string) ?? '',
      photoUrl: (row.photo_url as string) ?? '',
      isProtected: row.is_protected as boolean,
      createdAt: new Date(row.created_at as string),
    };
  }

  private mapToRow(patient: Patient): Record<string, unknown> {
    return {
      id: patient.id,
      full_name: patient.fullName,
      birth_date: patient.birthDate ? patient.birthDate.toISOString().split('T')[0] : null,
      gender: patient.gender || null,
      phone: patient.phone,
      photo_url: patient.photoUrl,
      is_protected: patient.isProtected,
    };
  }
}
