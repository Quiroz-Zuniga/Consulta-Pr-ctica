import { randomUUID } from 'crypto';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { IDMapping } from './types.js';

const MAPPING_FILE = 'id_mappings.json';

export function loadMappings(outputDir: string): Record<string, IDMapping[]> {
  const filePath = join(outputDir, MAPPING_FILE);
  if (!existsSync(filePath)) return {};
  const raw = readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

export function saveMappings(outputDir: string, mappings: Record<string, IDMapping[]>): void {
  const filePath = join(outputDir, MAPPING_FILE);
  writeFileSync(filePath, JSON.stringify(mappings, null, 2), 'utf-8');
}

export function mapId(
  legacyId: number | string,
  tableName: string,
  mappings: Record<string, IDMapping[]>,
): string {
  if (!mappings[tableName]) mappings[tableName] = [];

  const existing = mappings[tableName].find(
    (m) => String(m.legacyId) === String(legacyId),
  );
  if (existing) return existing.newUuid;

  const newUuid = randomUUID();
  mappings[tableName].push({ legacyId, newUuid, tableName });
  return newUuid;
}

export function parseAccessDate(
  value: string | Date | null | undefined,
): Date | null {
  if (value === null || value === undefined) return null;

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'NULL') return null;

  const isoParsed = new Date(trimmed);
  if (!isNaN(isoParsed.getTime())) return isoParsed;

  const parts = trimmed.split(/[\/\-\.]/);
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number);
    if (c > 31) {
      const d = new Date(c, a - 1, b);
      if (!isNaN(d.getTime())) return d;
    }
    if (a > 31) {
      const d = new Date(a, b - 1, c);
      if (!isNaN(d.getTime())) return d;
    }
  }

  return null;
}

export function convertEncoding(text: unknown): string {
  if (text === null || text === undefined) return '';
  if (typeof text !== 'string') return String(text);

  return text
    .replace(/[\u00C0-\u00FF]/g, (ch) => {
      const map: Record<string, string> = {
        '\u00C0': 'A', '\u00C1': 'A', '\u00C2': 'A', '\u00C3': 'A',
        '\u00C8': 'E', '\u00C9': 'E', '\u00CA': 'E', '\u00CB': 'E',
        '\u00CC': 'I', '\u00CD': 'I', '\u00CE': 'I', '\u00CF': 'I',
        '\u00D2': 'O', '\u00D3': 'O', '\u00D4': 'O', '\u00D5': 'O',
        '\u00D9': 'U', '\u00DA': 'U', '\u00DB': 'U', '\u00DC': 'U',
        '\u00E1': 'a', '\u00E2': 'a', '\u00E3': 'a',
        '\u00E9': 'e', '\u00EA': 'e',
        '\u00ED': 'i', '\u00EE': 'i',
        '\u00F3': 'o', '\u00F4': 'o', '\u00F5': 'o',
        '\u00FA': 'u', '\u00FB': 'u', '\u00FC': 'u',
        '\u00F1': 'n', '\u00D1': 'N',
      };
      return map[ch] ?? ch;
    })
    .trim();
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

export function buildFullName(
  nombre: unknown,
  apellidoPaterno: unknown,
  apellidoMaterno: unknown,
): string {
  const parts = [nombre, apellidoPaterno, apellidoMaterno]
    .map((p) => convertEncoding(String(p ?? '')).trim())
    .filter(Boolean);
  return normalizeWhitespace(parts.join(' '));
}

export function mapGender(sexo: unknown): string {
  const s = String(sexo ?? '').trim().toUpperCase();
  if (s === 'M' || s === 'MASCULINO' || s === 'H' || s === 'HOMBRE') return 'M';
  if (s === 'F' || s === 'FEMENINO' || s === 'MUJER') return 'F';
  return 'O';
}

export function mapRole(rol: unknown): string {
  const r = String(rol ?? '').trim().toUpperCase();
  if (r.includes('ADMIN')) return 'ADMINISTRATOR';
  if (r.includes('DOCT') || r.includes('MEDIC')) return 'DOCTOR';
  return 'RECEPTIONIST';
}

export function mapAppointmentStatus(estado: unknown): string {
  const s = String(estado ?? '').trim().toUpperCase();
  if (s.includes('COMPLET') || s.includes('ATEND')) return 'completed';
  if (s.includes('CANCEL')) return 'cancelled';
  if (s.includes('NO_ASIST') || s.includes('NO ASIST') || s.includes('FALTA')) return 'no_show';
  return 'scheduled';
}
