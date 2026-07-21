import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import type {
  ETLConfig,
  ETLReport,
  IDMapping,
} from './types.js';
import { mapId, loadMappings, saveMappings } from './mappers.js';
import {
  autoDetectReader,
  type MdbReader,
} from './mdbReader.js';
import {
  transformPatients,
  transformDoctors,
  transformHistories,
  transformPrescriptions,
  transformMedications,
  transformAppointments,
} from './transformers.js';
import { chunkArray } from './mappers.js';

interface TableMigrationPlan {
  legacyTable: string;
  targetTable: string;
  transformFn: (rows: Record<string, unknown>[]) => { data: Record<string, unknown>[]; warnings: { row: number | string; field: string; message: string; value: unknown }[] };
  idColumn?: string;
  postProcess?: (row: Record<string, unknown>, mappings: Record<string, IDMapping[]>) => Record<string, unknown>;
}

export async function runMigration(config: ETLConfig): Promise<ETLReport> {
  const startedAt = new Date();

  console.log('\n========================================');
  console.log('  CONSULTA PRACTICA — ETL MIGRATION');
  console.log('========================================\n');
  console.log(`Source:       ${config.mdbPath}`);
  console.log(`Batch size:   ${config.batchSize}`);
  console.log(`Dry run:      ${config.dryRun}`);
  console.log(`Output dir:   ${config.outputDir}`);
  console.log('');

  mkdirSync(config.outputDir, { recursive: true });

  let mdbHash = '';
  try {
    const fileBuffer = readFileSync(config.mdbPath);
    mdbHash = createHash('sha256').update(fileBuffer).digest('hex');
    console.log(`MDB Hash:     ${mdbHash}`);
  } catch {
    console.log('[WARN] Could not hash input file (may be a directory)');
  }

  const supabase = config.dryRun
    ? null
    : createClient(config.supabaseUrl, config.supabaseServiceKey);
  const mappings = loadMappings(config.outputDir);
  const reader = autoDetectReader(config.mdbPath);

  const plans: TableMigrationPlan[] = [
    {
      legacyTable: 'tblPacientes',
      targetTable: 'patients',
      transformFn: transformPatients,
    },
    {
      legacyTable: 'tblDoctors',
      targetTable: 'users',
      transformFn: transformDoctors,
    },
    {
      legacyTable: 'tblHistorias',
      targetTable: 'medical_histories',
      transformFn: transformHistories,
      postProcess: (row, m) => ({
        ...row,
        patient_id: mapId(row.patient_legacy_id as number, 'patients', m),
        doctor_id: mapId(row.doctor_legacy_id as number, 'users', m),
        cie10_code: resolveCie10(row.diagnostico_texto as string, m),
      }),
    },
    {
      legacyTable: 'tblRecetas',
      targetTable: 'prescriptions',
      transformFn: transformPrescriptions,
      postProcess: (row, m) => ({
        ...row,
        history_id: mapId(row.history_legacy_id as number, 'medical_histories', m),
      }),
    },
    {
      legacyTable: 'tblMedicamentos',
      targetTable: 'prescription_items',
      transformFn: transformMedications,
      postProcess: (row, m) => ({
        ...row,
        prescription_id: mapId(row.prescription_legacy_id as number, 'prescriptions', m),
      }),
    },
    {
      legacyTable: 'tblCitas',
      targetTable: 'appointments',
      transformFn: transformAppointments,
      postProcess: (row, m) => ({
        ...row,
        patient_id: mapId(row.patient_legacy_id as number, 'patients', m),
      }),
    },
  ];

  const availableTables = reader.getTables();
  console.log(`Legacy tables found: ${availableTables.join(', ')}\n`);

  const report: ETLReport = {
    startedAt,
    finishedAt: null,
    mdbPath: config.mdbPath,
    mdbHash,
    tables: [],
    totalExtracted: 0,
    totalLoaded: 0,
    totalErrors: 0,
    totalWarnings: 0,
  };

  const aliasMap: Record<string, string> = {};
  for (const t of availableTables) {
    aliasMap[t.toLowerCase()] = t;
  }

  for (const plan of plans) {
    const legacyName = aliasMap[plan.legacyTable.toLowerCase()];
    if (!legacyName) {
      console.log(`[SKIP] ${plan.legacyTable} not found in legacy DB — skipping`);
      report.tables.push({
        tableName: plan.targetTable,
        rowsExtracted: 0,
        rowsTransformed: 0,
        rowsLoaded: 0,
        errors: [],
        warnings: [{ row: 0, field: '*', message: `Legacy table ${plan.legacyTable} not found`, value: null }],
      });
      continue;
    }

    console.log(`--- ${plan.legacyTable} -> ${plan.targetTable} ---`);

    let rows: Record<string, unknown>[];
    try {
      rows = reader.readTable(legacyName);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`[ERROR] Failed to read ${legacyName}: ${msg}`);
      report.tables.push({
        tableName: plan.targetTable,
        rowsExtracted: 0,
        rowsTransformed: 0,
        rowsLoaded: 0,
        errors: [{ row: 0, field: '*', message: msg, value: null }],
        warnings: [],
      });
      continue;
    }

    console.log(`  Extracted: ${rows.length} rows`);

    const { data: transformed, warnings } = plan.transformFn(rows);
    const postProcessed = plan.postProcess
      ? transformed.map((r) => plan.postProcess!(r, mappings))
      : transformed;

    console.log(`  Transformed: ${postProcessed.length} rows, ${warnings.length} warnings`);

    let loadedCount = 0;
    const loadErrors: { row: number | string; field: string; message: string; value: unknown }[] = [];

    if (!config.dryRun && postProcessed.length > 0) {
      const batches = chunkArray(postProcessed, config.batchSize);
      for (let b = 0; b < batches.length; b++) {
        const batch = batches[b];
        try {
          const { error } = await supabase!.from(plan.targetTable).insert(batch);
          if (error) {
            console.log(`  [ERROR] Batch ${b + 1}/${batches.length}: ${error.message}`);
            loadErrors.push({
              row: b * config.batchSize,
              field: '*',
              message: `Batch insert error: ${error.message}`,
              value: null,
            });
          } else {
            loadedCount += batch.length;
            process.stdout.write(`  Loaded batch ${b + 1}/${batches.length} (${loadedCount}/${postProcessed.length})\r`);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.log(`  [ERROR] Batch ${b + 1}: ${msg}`);
          loadErrors.push({
            row: b * config.batchSize,
            field: '*',
            message: msg,
            value: null,
          });
        }
      }
      console.log('');
    } else if (config.dryRun) {
      loadedCount = postProcessed.length;
      console.log('  [DRY RUN] Skipped actual insert');
    }

    console.log(`  Loaded: ${loadedCount}/${postProcessed.length}`);

    report.tables.push({
      tableName: plan.targetTable,
      rowsExtracted: rows.length,
      rowsTransformed: postProcessed.length,
      rowsLoaded: loadedCount,
      errors: loadErrors,
      warnings,
    });

    report.totalExtracted += rows.length;
    report.totalLoaded += loadedCount;
    report.totalErrors += loadErrors.length;
    report.totalWarnings += warnings.length;
  }

  reader.close();
  saveMappings(config.outputDir, mappings);

  report.finishedAt = new Date();
  writeReport(config.outputDir, report);

  console.log('\n========================================');
  console.log('  MIGRATION SUMMARY');
  console.log('========================================');
  console.log(`  Total extracted: ${report.totalExtracted}`);
  console.log(`  Total loaded:    ${report.totalLoaded}`);
  console.log(`  Total errors:    ${report.totalErrors}`);
  console.log(`  Total warnings:  ${report.totalWarnings}`);
  console.log(`  Mappings saved:  ${join(config.outputDir, 'id_mappings.json')}`);
  console.log(`  Report saved:    ${join(config.outputDir, 'etl_report.json')}`);
  console.log('========================================\n');

  return report;
}

function resolveCie10(diagnosticoTexto: string, _mappings: Record<string, IDMapping[]>): string {
  if (!diagnosticoTexto) return 'Z00.0';

  const normalized = diagnosticoTexto.trim().toUpperCase();
  const codePattern = /^([A-Z]\d{2}(\.\d{1,2})?)$/;
  if (codePattern.test(normalized)) return normalized;

  const embedded = diagnosticoTexto.match(/([A-Z]\d{2}(?:\.\d{1,2})?)/i);
  if (embedded) return embedded[1].toUpperCase();

  console.log(`  [WARN] No CIE-10 code found for diagnosis "${diagnosticoTexto}" — using Z00.0`);
  return 'Z00.0';
}

function writeReport(outputDir: string, report: ETLReport): void {
  const filePath = join(outputDir, 'etl_report.json');
  writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf-8');
}
