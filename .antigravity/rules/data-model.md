# Reglas del Modelo de Datos — Consulta Práctica Web

## Esquema Canónico

- El esquema de tablas es exactamente el definido en el diagrama ER (sección 4.7 de `docs/SSD.md`). No crear tablas, columnas ni relaciones que no estén en ese diagrama.
- Tablas reconocidas: `users`, `patients`, `cie10_diagnoses`, `medical_histories`, `prescriptions`, `prescription_items`, `appointments`, `medical_attachments`.
- Toda migración SQL nueva DEBE ser revisada contra el diagrama ER antes de aplicarse en staging o producción.

## Tipos de Datos Obligatorios

- Claves primarias: tipo `uuid` con generación `gen_random_uuid()`. Nunca usar `serial` / `bigserial`.
- Timestamps: tipo `timestamp` (o `timestamptz`). Nunca `varchar` para fechas.
- Claves foráneas explícitas con `REFERENCES` y `ON DELETE` apropiado.
- `is_locked` y `is_active` e `is_protected`: tipo `boolean`, nunca `integer` ni `varchar`.
- `clinical_note`: tipo `text`, no `varchar(n)` con límite artificial.
- `cie10_code` en `medical_histories`: `string` FK referenciando `cie10_diagnoses(code)`.

## Relaciones Exactas

- `users` (1) → (0..*) `medical_histories` [registers] — `doctor_id FK`
- `patients` (1) → (0..*) `medical_histories` [has] — `patient_id FK`
- `medical_histories` (1) → (0..1) `prescriptions` [generates] — `history_id FK`
- `medical_histories` (*) → (1) `cie10_diagnoses` [classified_by] — `cie10_code FK`
- `prescriptions` (1) → (1..*) `prescription_items` [contains] — `prescription_id FK`
- `patients` (1) → (0..*) `appointments` [schedules] — `patient_id FK`
- `medical_histories` (1) → (0..*) `medical_attachments` [includes] — `history_id FK`

## Migraciones SQL

- Cada migración SQL es un archivo versionado e incremental. No modificar migraciones ya aplicadas en producción.
- Toda migración debe incluir transacción (`BEGIN` / `COMMIT`) y ser reversible cuando sea posible.
- Antes de aplicar una migración, verificar:
  1. Las FKs referencian tablas y columnas que ya existen.
  2. Las columnas nuevas coinciden con los tipos de dato del diagrama ER.
  3. RLS sigue activo en tablas clínicas tras la migración.
- No crear columnas calculadas ni vistas que expongan `clinical_note` sin restricción de RLS.

## Columnas de Auditoría

- Toda tabla principal debe tener columna `created_at timestamp DEFAULT now()`.
- No implementar `updated_at` en `medical_histories` (son inmutables).

## Catálogo CIE-10

- La tabla `cie10_diagnoses` es de solo lectura para aplicación; su contenido es el catálogo oficial CIE-10.
- El campo `code` es PK de tipo `string` (p.ej. `J18.9`), no `uuid`.
- No insertar diagnósticos inventados; usar solo códigos del catálogo oficial CIE-10.

## Prohibiciones Absolutas

- Nunca usar `serial` / `bigserial` como PK; siempre `uuid`.
- Nunca usar `varchar` para almacenar timestamps o fechas.
- Nunca crear tablas fuera del esquema definido en el ER sin aprobación del usuario.
- Nunca hacer `UPDATE` en `medical_histories` cuando `is_locked = TRUE`.
- Nunca deshabilitar FKs ni RLS en tablas clínicas.
