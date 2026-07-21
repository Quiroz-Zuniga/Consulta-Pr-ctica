import type { Patient } from '../../domain/entities/Patient.js';
import type { IPatientRepository } from '../../domain/ports/IPatientRepository.js';
import { supabaseAdmin } from './SupabaseClient.js';

export class PostgresPatientRepository implements IPatientRepository {
  async findById(id: string): Promise<Patient | null> {
    const { data, error } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    return this.mapToEntity(data);
  }

  async findAll(): Promise<Patient[]> {
    const { data, error } = await supabaseAdmin
      .from('patients')
      .select('*')
      .order('full_name', { ascending: true });

    if (error || !data) return [];
    return data.map(this.mapToEntity);
  }

  async search(query: string): Promise<Patient[]> {
    const { data, error } = await supabaseAdmin
      .from('patients')
      .select('*')
      .ilike('full_name', `%${query}%`)
      .order('full_name', { ascending: true });

    if (error || !data) return [];
    return data.map(this.mapToEntity);
  }

  async save(patient: Patient): Promise<void> {
    const { error } = await supabaseAdmin
      .from('patients')
      .insert(this.mapToRow(patient));

    if (error) throw new Error(`Failed to save patient: ${error.message}`);
  }

  async update(patient: Patient): Promise<void> {
    const { error } = await supabaseAdmin
      .from('patients')
      .update(this.mapToRow(patient))
      .eq('id', patient.id);

    if (error) throw new Error(`Failed to update patient: ${error.message}`);
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) throw new Error(`Failed to delete patient: ${error.message}`);
  }

  private mapToEntity(row: Record<string, unknown>): Patient {
    return {
      id: row.id as string,
      fullName: row.full_name as string,
      birthDate: new Date(row.birth_date as string),
      gender: row.gender as string,
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
      birth_date: patient.birthDate.toISOString().split('T')[0],
      gender: patient.gender,
      phone: patient.phone,
      photo_url: patient.photoUrl,
      is_protected: patient.isProtected,
    };
  }
}
