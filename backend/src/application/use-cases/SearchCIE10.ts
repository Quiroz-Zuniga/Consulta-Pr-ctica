import type { CIE10Diagnosis } from '../../domain/entities/CIE10Diagnosis.js';
import type { ICIE10Repository } from '../../domain/ports/ICIE10Repository.js';

export class SearchCIE10 {
  constructor(private readonly _cie10Repository: ICIE10Repository) {}

  async execute(query: string): Promise<CIE10Diagnosis[]> {
    return this._cie10Repository.search(query);
  }
}
