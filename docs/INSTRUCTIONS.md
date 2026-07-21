# Instrucciones de Ejecución — Consulta Práctica Web

## Cómo Usar Este Documento

Cada fase describe:
- **Objetivo**: qué se logra al completar la fase.
- **Entregables concretos**: artefactos verificables que deben existir al finalizar.
- **Capas de Clean Architecture involucradas**: qué parte del código toca esta fase.
- **Definition of Done (DoD)**: criterios objetivos que deben cumplirse antes de avanzar a la siguiente fase.

> **Regla crítica:** No avanzar a la siguiente fase sin haber cumplido el DoD de la fase anterior. Las fases son incrementales y sus entregables son acumulativos.

---

## Fase 1 — Dominio & Setup de Infraestructura Cloud

### Objetivo
Establecer los cimientos del proyecto: repositorio configurado, proyecto Supabase activo con el esquema SQL inicial aplicado, y las entidades/puertos del dominio definidos en TypeScript.

### Entregables Concretos
1. **Proyecto Supabase creado** con las 8 tablas del diagrama ER aplicadas en PostgreSQL:
   - `users`, `patients`, `cie10_diagnoses`, `medical_histories`, `prescriptions`, `prescription_items`, `appointments`, `medical_attachments`
   - Todas las FK definidas. RLS habilitado en tablas clínicas.
2. **Buckets de Storage** creados en Supabase: uno para PDFs de recetas (privado) y uno para fotos de pacientes (privado).
3. **Proyecto Node.js + Fastify + TypeScript** inicializado en `backend/` con `tsconfig.json` (`strict: true`).
4. **Entidades de dominio** escritas en `backend/src/domain/entities/`:
   - `Patient.ts`, `MedicalHistory.ts`, `CIE10Diagnosis.ts`, `Prescription.ts`, `Medication.ts`, `User.ts`
   - `UserRole` enum con valores `ADMINISTRATOR`, `DOCTOR`, `RECEPTIONIST`
5. **Value Objects** en `backend/src/domain/value-objects/`: `ICD10Code.ts`, `PatientID.ts`.
6. **Puertos (interfaces)** en `backend/src/domain/ports/`: `IPatientRepository.ts`, `IMedicalHistoryRepository.ts`, `IPdfGeneratorService.ts`.
7. **Variables de entorno** configuradas (`.env.example` documentado): `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

### Capas de Clean Architecture Involucradas
- **Domain Layer** (primaria): entidades, value objects, puertos.
- **Infrastructure Layer** (secundaria): conexión Supabase, esquema SQL.

### Definition of Done (DoD)
- [ ] Script SQL del esquema inicial (`001_initial_schema.sql`) aplica sin errores en Supabase Studio.
- [ ] RLS habilitado en `medical_histories`, `prescriptions`, `prescription_items`, `medical_attachments`.
- [ ] Las entidades TypeScript compilan sin errores con `tsc --noEmit`.
- [ ] Los puertos están definidos como interfaces TypeScript puras (sin imports externos).
- [ ] Documentación: actualizar `docs/SSD.md` si hubo alguna decisión de implementación que difiera del diseño original (con justificación).

---

## Fase 2 — Backend API & Motor PDF

### Objetivo
Implementar la API REST completa con Fastify, los casos de uso del dominio y el servicio de generación de recetas PDF, reemplazando la integración OLE/Word del sistema legacy.

### Entregables Concretos
1. **Servidor Fastify** operativo en `backend/src/server.ts` con consumo < 35 MB RAM.
2. **Casos de uso** implementados en `backend/src/application/use-cases/`:
   - `RegisterConsultation.ts` — con lógica de inmutabilidad: al guardar, `is_locked = TRUE` desde el INSERT.
   - `AuthenticateUser.ts` — integración con Supabase Auth `signInWithPassword`.
   - `SearchCIE10.ts` — búsqueda full-text en catálogo `cie10_diagnoses`.
   - `GeneratePrescription.ts` — orquesta generación PDF + subida a Storage.
3. **Repositorios concretos** en `backend/src/infrastructure/supabase/`:
   - `PostgresPatientRepository.ts` implementando `IPatientRepository`.
   - `PostgresMedicalHistoryRepository.ts` implementando `IMedicalHistoryRepository`.
4. **Servicio PDF** en `backend/src/infrastructure/pdf/PdfKitService.ts` implementando `IPdfGeneratorService`.
5. **Servicio Storage** en `backend/src/infrastructure/storage/SupabaseStorageService.ts`.
6. **Rutas HTTP** en `backend/src/interfaces/routes/`:
   - `POST /api/v1/auth/login`
   - `GET /api/v1/patients`, `POST /api/v1/patients`, `GET /api/v1/patients/:id`
   - `POST /api/v1/consultations` (RegisterConsultation + GeneratePrescription)
   - `GET /api/v1/cie10/search?q=`
7. **Middlewares** en `backend/src/interfaces/middlewares/`:
   - `authMiddleware.ts` — valida JWT de Supabase.
   - `roleGuard.ts` — verifica rol del usuario contra el endpoint.
8. **Schemas Zod** para todos los DTOs de entrada.

### Capas de Clean Architecture Involucradas
- **Application Layer** (primaria): casos de uso, DTOs.
- **Infrastructure Layer** (primaria): repositorios concretos, PdfKitService, StorageService.
- **Interface Adapters** (primaria): rutas Fastify, middlewares, schemas Zod.

### Definition of Done (DoD)
- [ ] `POST /api/v1/auth/login` devuelve JWT válido con perfil de usuario.
- [ ] `POST /api/v1/consultations` inserta en `medical_histories` con `is_locked = TRUE` y genera PDF en Storage.
- [ ] Los endpoints de datos clínicos devuelven `401` sin JWT y `403` con rol no autorizado.
- [ ] El servidor arranca con < 35 MB RAM medidos con `process.memoryUsage()`.
- [ ] Los casos de uso no importan Supabase SDK directamente (solo a través de los puertos).
- [ ] Tests de integración básicos para los 4 casos de uso ejecutan sin errores.

---

## Fase 3 — Script ETL & Migración de Datos de Prueba

### Objetivo
Ejecutar el pipeline de migración desde el archivo `.mdb` legacy hacia la instancia de staging de Supabase, validando integridad de expedientes históricos.

### Entregables Concretos
1. **Script ETL** en `backend/src/interfaces/etl/mdb_migrator.py` (o equivalente Node.js):
   - Extracción via ODBC (`pyodbc`) del `.mdb`.
   - Conversión de codificación `Windows-1252` → `UTF-8`.
   - Mapeo de IDs enteros → UUID v4 con tabla de mapeo persistida.
   - Parseo y normalización de fechas a ISO 8601.
   - Correspondencia de diagnósticos texto libre → códigos CIE-10.
   - Inserción por lotes (batch de 100-500 filas) con transacciones SQL.
2. **Informe de resultados ETL** generado automáticamente: filas procesadas, insertadas, errores, advertencias.
3. **Instancia staging** de Supabase con datos migrados del `.mdb` de prueba.
4. **Archivo de mapeo** guardado: `{ legacy_id: integer → new_uuid: string }` para trazabilidad.

### Capas de Clean Architecture Involucradas
- **Interface Adapters / ETL** (primaria): script de migración.
- **Infrastructure Layer** (secundaria): cliente Supabase para inserción.

### Definition of Done (DoD)
- [ ] El script ETL ejecuta sin errores fatales contra un `.mdb` de muestra real.
- [ ] Conteo de filas fuente = conteo de filas destino (o discrepancias documentadas con justificación).
- [ ] Todos los registros migrados de `medical_histories` tienen `is_locked = TRUE`.
- [ ] 0 errores de FK constraint en la BD de staging tras la carga.
- [ ] Diagnósticos sin correspondencia CIE-10 están registrados en el log de advertencias (no silenciados).
- [ ] El script NO modifica el archivo `.mdb` original (verificar con hash antes/después).

---

## Fase 4 — Frontend SPA & Módulos Clave

### Objetivo
Construir la interfaz gráfica React completa con los módulos funcionales del sistema: expedientes, nota médica tripartita, buscador CIE-10, recetas PDF y agenda.

### Entregables Concretos
1. **Proyecto React 18 + Vite + Tailwind** inicializado en `frontend/`.
2. **Módulo Auth** en `frontend/src/features/auth/`:
   - Pantalla de login con email/password.
   - Contexto de sesión con token almacenado en memoria / HTTP-Only Cookie.
   - Redirección por rol al dashboard correspondiente.
3. **Módulo Pacientes** en `frontend/src/features/patients/`:
   - Listado alfabético de expedientes.
   - Formulario de registro/edición de datos demográficos.
   - Galería clínica (fotos del paciente).
4. **Módulo Consulta** en `frontend/src/features/consultation/`:
   - Formulario tripartita: datos subjetivos, objetivos y plan.
   - Buscador de diagnósticos CIE-10 (autocomplete con TanStack Query).
5. **Módulo Recetas** en `frontend/src/features/prescriptions/`:
   - Selección de fármacos con dosis, frecuencia y duración.
   - Botón "Guardar y Emitir Receta" que dispara `POST /api/v1/consultations`.
   - Modal visor de PDF generado con opción de imprimir.
6. **Módulo Citas** en `frontend/src/features/appointments/`:
   - Agenda interactiva sincronizada en tiempo real con Supabase Realtime (WebSockets).
7. **Componentes UI** en `frontend/src/components/ui/`: `Button.tsx`, `Dialog.tsx`, `Input.tsx` (Shadcn-style).
8. **Layout** en `frontend/src/components/layout/`: `Sidebar.tsx`, `Topbar.tsx`.
9. **Cliente Supabase** en `frontend/src/lib/supabaseClient.ts` (SDK Supabase JS).

### Capas de Clean Architecture Involucradas
- **Presentation Layer** (primaria): componentes React, TanStack Query, Supabase JS SDK.

### Definition of Done (DoD)
- [ ] Login funciona para los 3 roles (`ADMINISTRATOR`, `DOCTOR`, `RECEPTIONIST`) con redirección correcta.
- [ ] El módulo Consulta permite crear una nota médica, seleccionar CIE-10 y emitir receta PDF.
- [ ] El PDF generado se descarga/visualiza correctamente desde el modal.
- [ ] La Secretaria (`RECEPTIONIST`) NO puede ver la pantalla de nota clínica ni recetas (validación en frontend + backend).
- [ ] La agenda de citas se actualiza en tiempo real cuando otro usuario modifica una cita.
- [ ] El frontend compila sin errores TypeScript con `tsc --noEmit`.
- [ ] Todas las llamadas al servidor pasan por TanStack Query (no `useEffect` + `fetch` directo).

---

## Fase 5 — Operación en Paralelo & Pruebas en Vivo

### Objetivo
Validar el nuevo sistema en condiciones reales del consultorio durante 1-2 semanas, ejecutando en paralelo con el sistema legacy, sin migración de datos de producción aún.

### Entregables Concretos
1. **Instancia de producción** de Supabase configurada (separada de staging).
2. **Despliegue en Cloudflare Pages** del frontend React.
3. **Despliegue de la API Fastify** en servidor de producción (VPS / Render / Railway con 512MB RAM).
4. **Acceso real** para médico y secretaria al nuevo sistema durante el periodo de paralelo.
5. **Checklist de validación** completado (ver DoD).
6. **Log de incidencias** documentando cualquier problema encontrado durante el periodo paralelo.

### Capas de Clean Architecture Involucradas
- Todas las capas en entorno de producción.
- **ETL**: aún no se ejecuta sobre datos de producción.

### Definition of Done (DoD)
- [ ] El médico puede registrar al menos 5 consultas reales nuevas en el nuevo sistema.
- [ ] Las recetas PDF generadas son aceptadas como válidas para impresión en el consultorio.
- [ ] La secretaria puede agendar citas sin acceder a datos clínicos (verificado en sesión real).
- [ ] No se producen errores 500 ni pérdidas de datos durante el periodo de operación paralela.
- [ ] Tiempo de respuesta de la API < 500ms en el 95% de las peticiones (medido con logs de Fastify).
- [ ] El médico y la secretaria aprueban la usabilidad del nuevo sistema.
- [ ] RLS verificado: intento de acceso de `RECEPTIONIST` a `clinical_note` devuelve error en producción.

---

## Fase 6 — Despliegue Definitivo & Cierre Legacy

### Objetivo
Migrar los datos de producción del `.mdb` legacy, hacer la conmutación definitiva al sistema web y archivar el sistema legacy de forma segura.

### Entregables Concretos
1. **ETL de producción ejecutado** sobre el `.mdb` real con todos los datos históricos del consultorio.
   - Informe final de ETL validado por el médico.
   - 0 errores de integridad referencial.
2. **Migración delta** de los últimos registros generados durante el periodo de operación paralela (si aplica).
3. **Conmutación oficial**: el DNS / acceso del consultorio apunta exclusivamente al nuevo sistema en Cloudflare Pages.
4. **Archivo seguro del legacy**: el archivo `.mdb` original guardado en almacenamiento en frío (encriptado, con fecha de archivo documentada).
5. **Backups automáticos** configurados en Supabase (Point-in-Time Recovery activo).
6. **Documentación de cierre** entregada al equipo médico: guía de usuario, contacto de soporte, proceso de recuperación ante fallos.

### Capas de Clean Architecture Involucradas
- **ETL / Infrastructure** (primaria): migración final a producción.
- Todas las capas en validación final de producción.

### Definition of Done (DoD)
- [ ] ETL final ejecutado sin errores fatales. Informe aprobado por el médico administrador.
- [ ] Conteo de pacientes y consultas en Supabase coincide con el conteo en el `.mdb` original.
- [ ] El sistema legacy (MS Access) está desinstalado o archivado y no se usa más para nuevos registros.
- [ ] El `.mdb` original está guardado en frío, encriptado, con hash de integridad documentado.
- [ ] Point-in-Time Recovery activo en Supabase y probado con al menos un restore de prueba.
- [ ] El equipo médico recibió capacitación mínima de 30 minutos sobre el nuevo sistema.
- [ ] No hay datos nuevos siendo ingresados en el sistema legacy tras la conmutación.

---

*Estas instrucciones derivan directamente de la sección 8 (Plan de Migración por Fases) de `index.html` y `docs/SSD.md`. No añadir fases nuevas ni renombrar las existentes sin actualizar ambos documentos.*
