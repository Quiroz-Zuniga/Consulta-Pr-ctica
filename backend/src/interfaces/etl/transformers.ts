import type {
  ETLWarning,
} from './types.js';
import {
  convertEncoding,
  normalizeWhitespace,
  parseAccessDate,
  buildFullName,
  mapRole,
  mapAppointmentStatus,
} from './mappers.js';

export interface TransformResult<T> {
  data: T[];
  warnings: ETLWarning[];
}

function cleanString(value: unknown): string {
  if (value === null || value === undefined) return '';
  return normalizeWhitespace(convertEncoding(String(value)));
}

function cleanPhone(value: unknown): string {
  const raw = cleanString(value);
  return raw.replace(/[^0-9+\-() ]/g, '');
}

function safeString(row: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v !== null && v !== undefined && String(v).trim() !== '') return String(v);
  }
  return '';
}

function safeNumber(row: Record<string, unknown>, ...keys: string[]): number {
  for (const k of keys) {
    const v = row[k];
    if (v !== null && v !== undefined) {
      const n = Number(v);
      if (!isNaN(n)) return n;
    }
  }
  return 0;
}

export function transformPatients(rows: Record<string, unknown>[]): TransformResult<Record<string, unknown>> {
  const result: Record<string, unknown>[] = [];
  const warnings: ETLWarning[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const legacyId = safeNumber(row, 'IdPaciente', 'id_paciente', 'ID') || i;

    try {
      const nombre = cleanString(safeString(row, 'Nombre', 'nombre', 'name'));
      const apPat = cleanString(safeString(row, 'ApellidoPaterno', 'apellido_paterno', 'apellido1'));
      const apMat = cleanString(safeString(row, 'ApellidoMaterno', 'apellido_materno', 'apellido2'));

      const fullName = buildFullName(nombre, apPat, apMat);
      if (!fullName) {
        warnings.push({
          row: legacyId,
          field: 'full_name',
          message: 'Patient has no name — using fallback',
          value: row,
        });
      }

      const birthDateRaw = row.FechaNacimiento ?? row.fecha_nacimiento ?? row.fecha_nac ?? null;
      const birthDate = parseAccessDate(birthDateRaw as string | Date | null);
      if (!birthDate && birthDateRaw) {
        warnings.push({
          row: legacyId,
          field: 'birth_date',
          message: 'Could not parse birth date — defaulting to 1900-01-01',
          value: birthDateRaw,
        });
      }

      const genderRaw = safeString(row, 'Sexo', 'sexo', 'gender');
      const genderKey = genderRaw.toUpperCase();
      const genderMap: Record<string, string> = {
        M: 'M', MASCULINO: 'M', H: 'M', HOMBRE: 'M', MALE: 'M',
        F: 'F', FEMENINO: 'F', MUJER: 'F', FEMALE: 'F',
      };
      const gender = genderMap[genderKey] ?? 'O';
      if (gender === 'O' && genderKey) {
        warnings.push({
          row: legacyId,
          field: 'gender',
          message: `Unknown gender "${genderKey}" — mapped to "O"`,
          value: genderRaw,
        });
      }

      const phone = cleanPhone(safeString(row, 'Telefono', 'telefono', 'phone'));

      const photoUrl = cleanString(safeString(row, 'FotoUrl', 'foto_url', 'foto'));
      const esProtegido = row.EsProtegido ?? row.es_protegido ?? row.protegido;
      const isProtected = esProtegido === true || esProtegido === 1 || esProtegido === '1' || esProtegido === 'S' || esProtegido === 'SI';

      result.push({
        full_name: fullName || `Paciente ${legacyId}`,
        birth_date: birthDate ? birthDate.toISOString().split('T')[0] : '1900-01-01',
        gender,
        phone,
        photo_url: photoUrl,
        is_protected: isProtected,
      });
    } catch (err) {
      warnings.push({
        row: legacyId,
        field: '*',
        message: `Error transforming patient row: ${err instanceof Error ? err.message : String(err)}`,
        value: row,
      });
    }
  }

  return { data: result, warnings };
}

export function transformDoctors(rows: Record<string, unknown>[]): TransformResult<Record<string, unknown>> {
  const result: Record<string, unknown>[] = [];
  const warnings: ETLWarning[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const legacyId = safeNumber(row, 'IdDoctor', 'id_doctor', 'ID') || i;

    try {
      const fullName = buildFullName(
        cleanString(safeString(row, 'Nombre', 'nombre')),
        cleanString(safeString(row, 'ApellidoPaterno', 'apellido_paterno')),
        cleanString(safeString(row, 'ApellidoMaterno', 'apellido_materno')),
      );

      const email = cleanString(safeString(row, 'Email', 'email', 'correo'));
      const role = mapRole(safeString(row, 'Rol', 'rol', 'role') || 'DOCTOR');

      result.push({
        full_name: fullName || `Doctor ${legacyId}`,
        email,
        role,
        is_active: true,
      });
    } catch (err) {
      warnings.push({
        row: legacyId,
        field: '*',
        message: `Error transforming doctor row: ${err instanceof Error ? err.message : String(err)}`,
        value: row,
      });
    }
  }

  return { data: result, warnings };
}

export function transformHistories(rows: Record<string, unknown>[]): TransformResult<Record<string, unknown>> {
  const result: Record<string, unknown>[] = [];
  const warnings: ETLWarning[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const legacyId = safeNumber(row, 'IdConsulta', 'id_consulta', 'Id') || i;

    try {
      const clinicalNote = cleanString(safeString(row, 'NotasClinicas', 'notas_clinicas', 'notas', 'nota', 'clinical_note'));
      if (!clinicalNote) {
        warnings.push({
          row: legacyId,
          field: 'clinical_note',
          message: 'Empty clinical note — will be inserted as empty string',
          value: row,
        });
      }

      const diagnostico = cleanString(safeString(row, 'Diagnostico', 'diagnostico', 'diagnostico_texto'));

      const fechaConsultaRaw = row.FechaConsulta ?? row.fecha_consulta ?? row.fecha ?? null;
      const createdAt = parseAccessDate(fechaConsultaRaw as string | Date | null);

      result.push({
        patient_legacy_id: safeNumber(row, 'IdPaciente', 'id_paciente'),
        doctor_legacy_id: safeNumber(row, 'IdDoctor', 'id_doctor'),
        clinical_note: clinicalNote,
        diagnostico_texto: diagnostico,
        created_at: createdAt ? createdAt.toISOString() : new Date().toISOString(),
        is_locked: true,
      });
    } catch (err) {
      warnings.push({
        row: legacyId,
        field: '*',
        message: `Error transforming history row: ${err instanceof Error ? err.message : String(err)}`,
        value: row,
      });
    }
  }

  return { data: result, warnings };
}

export function transformPrescriptions(rows: Record<string, unknown>[]): TransformResult<Record<string, unknown>> {
  const result: Record<string, unknown>[] = [];
  const warnings: ETLWarning[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const legacyId = safeNumber(row, 'IdReceta', 'id_receta', 'Id') || i;

    try {
      const indicaciones = cleanString(safeString(row, 'Indicaciones', 'indicaciones', 'custom_indications'));

      const fechaCitaRaw = row.FechaCita ?? row.fecha_cita ?? row.fecha ?? null;
      const nextAppointment = parseAccessDate(fechaCitaRaw as string | Date | null);

      result.push({
        history_legacy_id: safeNumber(row, 'IdConsulta', 'id_consulta'),
        custom_indications: indicaciones,
        next_appointment: nextAppointment ? nextAppointment.toISOString().split('T')[0] : null,
      });
    } catch (err) {
      warnings.push({
        row: legacyId,
        field: '*',
        message: `Error transforming prescription row: ${err instanceof Error ? err.message : String(err)}`,
        value: row,
      });
    }
  }

  return { data: result, warnings };
}

export function transformMedications(rows: Record<string, unknown>[]): TransformResult<Record<string, unknown>> {
  const result: Record<string, unknown>[] = [];
  const warnings: ETLWarning[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const legacyId = safeNumber(row, 'IdMedicamento', 'id_medicamento', 'Id') || i;

    try {
      const name = cleanString(safeString(row, 'NombreMedicamento', 'nombre_medicamento', 'nombre', 'medication'));
      if (!name) {
        warnings.push({
          row: legacyId,
          field: 'medication_name',
          message: 'Empty medication name — skipping row',
          value: row,
        });
        continue;
      }

      const dosage = cleanString(safeString(row, 'Dosis', 'dosis', 'dosage'));
      const frequency = cleanString(safeString(row, 'Frecuencia', 'frecuencia', 'frequency'));

      let durationDays = safeNumber(row, 'DuracionDias', 'duracion_dias', 'duracion');
      if (durationDays <= 0) {
        const rawDur = row.DuracionDias ?? row.duracion_dias ?? row.duracion;
        warnings.push({
          row: legacyId,
          field: 'duration_days',
          message: `Invalid duration "${String(rawDur)}" — defaulting to 7`,
          value: rawDur,
        });
        durationDays = 7;
      }

      result.push({
        prescription_legacy_id: safeNumber(row, 'IdReceta', 'id_receta'),
        medication_name: name,
        dosage: dosage || 'N/A',
        frequency: frequency || 'N/A',
        duration_days: durationDays,
      });
    } catch (err) {
      warnings.push({
        row: legacyId,
        field: '*',
        message: `Error transforming medication row: ${err instanceof Error ? err.message : String(err)}`,
        value: row,
      });
    }
  }

  return { data: result, warnings };
}

export function transformAppointments(rows: Record<string, unknown>[]): TransformResult<Record<string, unknown>> {
  const result: Record<string, unknown>[] = [];
  const warnings: ETLWarning[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const legacyId = safeNumber(row, 'IdCita', 'id_cita', 'Id') || i;

    try {
      const fechaCitaRaw = row.FechaCita ?? row.fecha_cita ?? row.fecha ?? null;
      const appointmentDate = parseAccessDate(fechaCitaRaw as string | Date | null);
      if (!appointmentDate && fechaCitaRaw) {
        warnings.push({
          row: legacyId,
          field: 'appointment_date',
          message: `Could not parse date "${String(fechaCitaRaw)}" — skipping row`,
          value: fechaCitaRaw,
        });
        continue;
      }

      const reason = cleanString(safeString(row, 'Motivo', 'motivo', 'reason'));
      const status = mapAppointmentStatus(safeString(row, 'Estado', 'estado', 'status') || 'scheduled');

      result.push({
        patient_legacy_id: safeNumber(row, 'IdPaciente', 'id_paciente'),
        appointment_date: appointmentDate ? appointmentDate.toISOString() : new Date().toISOString(),
        reason,
        status,
      });
    } catch (err) {
      warnings.push({
        row: legacyId,
        field: '*',
        message: `Error transforming appointment row: ${err instanceof Error ? err.message : String(err)}`,
        value: row,
      });
    }
  }

  return { data: result, warnings };
}
