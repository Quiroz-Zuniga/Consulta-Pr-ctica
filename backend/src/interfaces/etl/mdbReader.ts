import type { LegacyRow } from './types.js';
import { readdirSync, readFileSync, statSync } from 'fs';
import { join, extname } from 'path';

export interface MdbReader {
  getTables(): string[];
  readTable(tableName: string): LegacyRow[];
  close(): void;
}

export function createMdbReader(mdbPath: string): MdbReader {
  let ADODB: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ADODB = require('node-adodb');
  } catch {
    throw new Error(
      'node-adodb is required for .mdb reading. Install with: npm install node-adodb',
    );
  }

  const connection = ADODB.open(
    `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${mdbPath};`,
  );

  const schemaCache: Map<string, LegacyRow[]> = new Map();

  function syncQuery(sql: string): LegacyRow[] {
    let result: LegacyRow[] = [];
    let done = false;

    connection.query(sql).then(
      (data: unknown) => {
        if (Array.isArray(data)) {
          result = data as LegacyRow[];
        }
        done = true;
      },
      (_err: unknown) => {
        done = true;
      },
    );

    const start = Date.now();
    while (!done && Date.now() - start < 30000) {
      // busy wait — node-adodb uses Windows COM which requires event loop pumping
    }

    return result;
  }

  return {
    getTables(): string[] {
      const tables: string[] = [];
      let done = false;

      connection.schema(13).then(
        (data: unknown) => {
          if (Array.isArray(data)) {
            for (const row of data) {
              const r = row as Record<string, unknown>;
              const type = r.TABLE_TYPE;
              const name = r.TABLE_NAME;
              if (type === 'TABLE' && typeof name === 'string' && !name.startsWith('MSys')) {
                tables.push(name);
              }
            }
          }
          done = true;
        },
        () => {
          done = true;
        },
      );

      const start = Date.now();
      while (!done && Date.now() - start < 30000) {
        // busy wait
      }

      return tables;
    },

    readTable(tableName: string): LegacyRow[] {
      if (schemaCache.has(tableName)) {
        return schemaCache.get(tableName)!;
      }

      const rows = syncQuery(`SELECT * FROM [${tableName}]`);
      schemaCache.set(tableName, rows);
      return rows;
    },

    close(): void {
      schemaCache.clear();
    },
  };
}

export interface CsvReaderOptions {
  delimiter: string;
  encoding: BufferEncoding;
}

export function createCsvReader(
  directoryPath: string,
  options: CsvReaderOptions = { delimiter: ',', encoding: 'utf-8' },
): MdbReader {
  const csvFiles: Map<string, string> = new Map();

  const files = readdirSync(directoryPath);
  for (const file of files) {
    if (extname(file).toLowerCase() === '.csv') {
      const tableName = file.slice(0, -4);
      csvFiles.set(tableName.toLowerCase(), join(directoryPath, file));
    }
  }

  return {
    getTables(): string[] {
      return Array.from(csvFiles.keys());
    },

    readTable(tableName: string): LegacyRow[] {
      const filePath = csvFiles.get(tableName.toLowerCase());
      if (!filePath) {
        throw new Error(`Table "${tableName}" not found in CSV directory`);
      }

      const content = readFileSync(filePath, options.encoding);
      const lines = content.split('\n').filter((line) => line.trim());
      if (lines.length === 0) return [];

      const headers = parseCsvLine(lines[0], options.delimiter);
      const rows: LegacyRow[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = parseCsvLine(lines[i], options.delimiter);
        const row: LegacyRow = {};
        for (let j = 0; j < headers.length; j++) {
          row[headers[j].trim()] = values[j]?.trim() ?? '';
        }
        rows.push(row);
      }

      return rows;
    },

    close(): void {
      csvFiles.clear();
    },
  };
}

function parseCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === delimiter) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

export function autoDetectReader(path: string): MdbReader {
  const stat = statSync(path);

  if (stat.isFile() && extname(path).toLowerCase() === '.mdb') {
    return createMdbReader(path);
  }

  if (stat.isDirectory()) {
    return createCsvReader(path);
  }

  throw new Error(`Unsupported path: ${path}. Provide a .mdb file or a directory of CSV exports.`);
}
