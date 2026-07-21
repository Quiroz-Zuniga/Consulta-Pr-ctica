# Reglas ETL — Migración desde MS Access (.mdb) — Consulta Práctica Web

## Herramientas Autorizadas

- Usar `pyodbc` (Python) o `node-adodb` (Node.js) para conectar al archivo `.mdb` legacy.
- El script ETL vive en `backend/src/interfaces/etl/mdb_migrator.py`.
- El ETL debe ejecutarse ÚNICAMENTE en un entorno de staging/desarrollo; nunca apuntar directamente a la BD de producción en la primera ejecución.

## Extracción (Extract)

- Leer las tablas del `.mdb` en modo solo lectura; nunca modificar el archivo `.mdb` original.
- Las tablas legacy de origen son: Pacientes, Historias/Consultas, Fármacos/Recetas, Citas, Diagnósticos.
- Registrar el conteo de filas extraídas por tabla antes de la transformación.
- Si la conexión ODBC falla, el script debe fallar con error claro; no continuar con datos parciales.

## Codificación de Texto

- Asumir que el archivo `.mdb` legacy usa codificación `Windows-1252` (Latin-1 extendido).
- Convertir TODOS los campos de texto a `UTF-8` antes de insertar en PostgreSQL.
- Verificar caracteres especiales del español (acentos, ñ) tras la conversión.
- No silenciar errores de codificación (`errors='replace'` solo como último recurso documentado).

## Transformación de Identificadores

- Todos los IDs enteros correlativos (o cadenas) del legacy se mapean a `UUID v4` nuevos.
- Mantener una tabla de mapeo en memoria o archivo temporal `{ legacy_id → new_uuid }` para preservar las relaciones entre tablas durante la carga.
- Nunca reutilizar IDs del legacy como UUIDs; generar UUIDs nuevos siempre.

## Validación de Fechas

- Detectar y registrar fechas nulas, vacías o en formato no ISO (p.ej. `DD/MM/YYYY`).
- Convertir fechas al formato ISO 8601 (`YYYY-MM-DD` o `YYYY-MM-DDTHH:MM:SSZ`).
- Si una fecha no puede ser parseada, asignar `NULL` y registrar la fila en el log de errores ETL.
- No inventar ni imputar fechas faltantes.

## Mapeo de Diagnósticos a CIE-10

- Los diagnósticos en texto libre del legacy deben mapearse al código CIE-10 estándar antes de insertar en `medical_histories`.
- Si no existe correspondencia directa, registrar el diagnóstico original en el log de advertencias y dejar `cie10_code` como `NULL` (si el esquema lo permite) o usar un código de "No especificado" documentado.
- Nunca inventar códigos CIE-10; solo usar códigos del catálogo oficial.
- Pre-cargar la tabla `cie10_diagnoses` ANTES de cargar `medical_histories`.

## Carga (Load)

- Insertar en lotes (batch loading) de 100-500 filas por transacción para evitar timeouts.
- Respetar el orden de carga: `users` → `patients` → `cie10_diagnoses` → `medical_histories` → `prescriptions` → `prescription_items` → `appointments` → `medical_attachments`.
- Usar transacciones SQL (`BEGIN` / `COMMIT` / `ROLLBACK`). Si una transacción falla, hacer rollback y registrar el error.
- Todos los registros de `medical_histories` migrados deben insertarse con `is_locked = TRUE`.
- Verificar restricciones de FK después de cada lote; no deshabilitar FK checks.

## Validación Post-Carga

- Comparar el conteo de filas fuente vs. filas destino por tabla y reportar discrepancias.
- Ejecutar queries de sanidad: p.ej. contar registros con `cie10_code NULL` en `medical_histories`.
- El ETL debe generar un informe de resultado con: filas procesadas, filas insertadas, errores y advertencias.

## Prohibiciones Absolutas

- Nunca ejecutar el ETL sobre la BD de producción sin validación previa en staging.
- Nunca modificar el archivo `.mdb` original.
- Nunca silenciar errores de codificación sin registrarlos.
- Nunca insertar datos en `medical_histories` sin `is_locked = TRUE`.
- Nunca inventar o imponer códigos CIE-10 sin correspondencia documentada.
- Nunca deshabilitar restricciones de FK durante la carga.
