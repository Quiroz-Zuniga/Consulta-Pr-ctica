import type { Patient } from '../entities/Patient.js';

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IPatientRepository {
  findById(id: string, token?: string): Promise<Patient | null>;
  findAll(options?: PaginationOptions, token?: string): Promise<PaginatedResult<Patient>>;
  search(query: string, options?: PaginationOptions, token?: string): Promise<PaginatedResult<Patient>>;
  save(patient: Patient, token?: string): Promise<void>;
  update(patient: Patient, token?: string): Promise<void>;
  delete(id: string, token?: string): Promise<void>;
}
