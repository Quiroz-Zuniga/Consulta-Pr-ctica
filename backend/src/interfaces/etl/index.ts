import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';
import { runMigration } from './mdbMigrator.js';
import type { ETLConfig } from './types.js';

config({ path: resolve(import.meta.dirname ?? '.', '../../.env') });

function printUsage(): void {
  console.log(`
Usage: tsx src/interfaces/etl/index.ts <path-to-mdb-or-csv-dir> [options]

Options:
  --dry-run           Simulate migration without writing to database
  --batch-size <n>    Rows per batch insert (default: 200)
  --output-dir <dir>  Output directory for reports and mappings (default: ./etl-output)
  --help              Show this help message

Examples:
  tsx src/interfaces/etl/index.ts ./data/consulta.mdb
  tsx src/interfaces/etl/index.ts ./data/csv-exports/ --dry-run
  tsx src/interfaces/etl/index.ts ./data/consulta.mdb --batch-size 100 --output-dir ./migration-report
`);
}

function parseArgs(argv: string[]): { mdbPath: string; options: Partial<ETLConfig> } {
  const args = argv.slice(2);
  const options: Partial<ETLConfig> = {
    batchSize: 200,
    dryRun: false,
    outputDir: resolve(process.cwd(), 'etl-output'),
  };

  let mdbPath = '';

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);

      case '--dry-run':
        options.dryRun = true;
        break;

      case '--batch-size':
      case '-b':
        i++;
        options.batchSize = parseInt(args[i], 10);
        if (isNaN(options.batchSize!) || options.batchSize! < 1) {
          console.error('Error: --batch-size must be a positive integer');
          process.exit(1);
        }
        break;

      case '--output-dir':
      case '-o':
        i++;
        options.outputDir = resolve(args[i]);
        break;

      default:
        if (!arg.startsWith('-')) {
          mdbPath = resolve(arg);
        } else {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
    }
  }

  return { mdbPath, options };
}

async function main(): Promise<void> {
  const { mdbPath, options } = parseArgs(process.argv);

  if (!mdbPath) {
    console.error('Error: No path to .mdb file or CSV directory provided.\n');
    printUsage();
    process.exit(1);
  }

  if (!existsSync(mdbPath)) {
    console.error(`Error: Path not found: ${mdbPath}`);
    process.exit(1);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!options.dryRun && (!supabaseUrl || !supabaseServiceKey)) {
    console.error(
      'Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env (or use --dry-run)',
    );
    process.exit(1);
  }

  const etlConfig: ETLConfig = {
    mdbPath,
    supabaseUrl: supabaseUrl ?? '',
    supabaseServiceKey: supabaseServiceKey ?? '',
    batchSize: options.batchSize ?? 200,
    outputDir: options.outputDir!,
    dryRun: options.dryRun ?? false,
  };

  try {
    const report = await runMigration(etlConfig);

    if (report.totalErrors > 0) {
      console.log(`\nMigration completed with ${report.totalErrors} errors. Check the report for details.`);
      process.exit(1);
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('\nFATAL ERROR:', err instanceof Error ? err.message : String(err));
    if (err instanceof Error && err.stack) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

main();
