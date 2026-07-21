export interface ETLConfig {
  mdbPath: string;
  supabaseUrl: string;
  supabaseServiceKey: string;
  batchSize: number;
  outputDir: string;
  dryRun: boolean;
}

export interface LegacyRow {
  [key: string]: unknown;
}

export interface LegacyTableConfig {
  legacyTable: string;
  targetTable: string;
  transformations: Record<string, (value: unknown, row: LegacyRow) => unknown>;
}

export interface IDMapping {
  legacyId: number | string;
  newUuid: string;
  tableName: string;
}

export interface ETLMetrics {
  tableName: string;
  rowsExtracted: number;
  rowsTransformed: number;
  rowsLoaded: number;
  errors: ETLWarning[];
  warnings: ETLWarning[];
}

export interface ETLWarning {
  row: number | string;
  field: string;
  message: string;
  value: unknown;
}

export interface ETLReport {
  startedAt: Date;
  finishedAt: Date | null;
  mdbPath: string;
  mdbHash: string;
  tables: ETLMetrics[];
  totalExtracted: number;
  totalLoaded: number;
  totalErrors: number;
  totalWarnings: number;
}

export interface LegacyPatient {
  IdPaciente: number;
  Nombre: string;
  ApellidoPaterno: string;
  ApellidoMaterno: string;
  FechaNacimiento: string | Date | null;
  Sexo: string;
  Telefono: string;
  FotoUrl: string;
  EsProtegido: number | boolean;
}

export interface LegacyHistory {
  IdConsulta: number;
  IdPaciente: number;
  IdDoctor: number;
  FechaConsulta: string | Date | null;
  NotasClinicas: string;
  Diagnostico: string;
}

export interface LegacyDoctor {
  IdDoctor: number;
  Nombre: string;
  ApellidoPaterno: string;
  ApellidoMaterno: string;
  Email: string;
  Rol: string;
}

export interface LegacyPrescription {
  IdReceta: number;
  IdConsulta: number;
  Indicaciones: string;
  FechaCita: string | Date | null;
}

export interface LegacyMedication {
  IdMedicamento: number;
  IdReceta: number;
  NombreMedicamento: string;
  Dosis: string;
  Frecuencia: string;
  DuracionDias: number;
}

export interface LegacyAppointment {
  IdCita: number;
  IdPaciente: number;
  FechaCita: string | Date | null;
  Motivo: string;
  Estado: string;
}
