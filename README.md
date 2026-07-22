# Consulta Práctica Web — Sistema de Gestión Médica Clínica

> **Migración integral** del sistema legacy *"Consulta Práctica"* (Visual Basic / Microsoft Access `.mdb`) hacia una plataforma web moderna basada en **Clean Architecture**. Gestiona expedientes clínicos completos, emisión de recetas PDF, agenda de citas en tiempo real, diagnósticos CIE-10, videoconsultas Jitsi, formularios de pre-consulta digitales, registro de pagos manuales y reportes de actividad, garantizando inmutabilidad legal de los historiales médicos y acceso multiusuario seguro basado en roles (RBAC).

---

## Tabla de Contenidos

1. [Stack Tecnológico](#stack-tecnológico)
2. [Dependencias Completas](#dependencias-completas)
3. [Arquitectura del Proyecto (Clean Architecture)](#arquitectura-del-proyecto)
4. [Módulos Implementados (Fases 0-5)](#módulos-implementados)
5. [Instalación y Configuración](#instalación-y-configuración)
6. [Variables de Entorno](#variables-de-entorno)
7. [Comandos de Ejecución](#comandos-de-ejecución)
8. [Migraciones SQL](#migraciones-sql)
9. [Roles y Permisos (RBAC)](#roles-y-permisos)
10. [Seguridad y RLS](#seguridad-y-rls)
11. [Endpoints de la API](#endpoints-de-la-api)
12. [Tests](#tests)

---

## Stack Tecnológico

| Capa | Tecnología | Versión | Descripción |
|---|---|:---:|---|
| **Backend Framework** | Node.js + Fastify | `^4.28.0` | API REST de alto rendimiento y bajo consumo (< 35 MB RAM) |
| **Lenguaje** | TypeScript | `^5.4.0` | `strict: true` en todas las capas |
| **Base de Datos / BaaS** | Supabase (PostgreSQL 16) | `^2.110.8` | Auth JWT, RLS, Storage, Realtime WebSockets |
| **Frontend** | React 18 + Vite + Tailwind CSS | `^18.3.1` | SPA con TanStack Query y React Router |
| **Motor de PDF** | PDFKit | `^0.15.0` | Recetas médicas y reportes clínicos en PDF |
| **Validación** | Zod | `^3.23.0` | Esquemas en capa de interfaces (never in domain) |
| **Notificaciones** | WhatsApp Cloud API (Meta) | — | Recordatorios de citas vía WhatsApp |
| **Videoconsulta** | Jitsi Meet (meet.jit.si) | — | Sin API key — instancia pública, arquitectura desacoplable |
| **Cron Jobs** | node-cron | `^4.6.0` | Automatización de recordatorios programados |
| **Autenticación** | JWT vía Supabase Auth | — | Tokens firmados con claims de rol, RLS integrada |
| **Rate Limiting** | @fastify/rate-limit | `^11.1.0` | Protección en endpoints públicos y de exportación |
| **ETL** | node-adodb | `^5.0.3` | Migración desde Microsoft Access `.mdb` legacy |
| **Testing** | Node.js Test Runner + tsx | `^4.7.0` | 27 tests unitarios de casos de uso |

---

## Dependencias Completas

### Backend (`backend/package.json`)

#### Producción (`dependencies`)

| Paquete | Versión | Rol en el Sistema |
|---|:---:|---|
| `fastify` | `^4.28.0` | Servidor HTTP principal — manejo de rutas, plugins, lifecycle hooks |
| `@fastify/cors` | `^9.0.1` | CORS — habilita acceso cross-origin desde el frontend SPA |
| `@fastify/rate-limit` | `^11.1.0` | Rate limiting en endpoints públicos (`/public/intake`, `/public/video`) y reportes |
| `@supabase/supabase-js` | `^2.110.8` | SDK Supabase — cliente con `anonKey` (frontend) y `service_role` (backend) |
| `dotenv` | `^17.4.2` | Carga de variables de entorno desde `.env` |
| `jsonwebtoken` | `^9.0.3` | Verificación y decodificación de JWTs de Supabase Auth |
| `node-adodb` | `^5.0.3` | ETL — lectura de la base de datos Microsoft Access legacy (`.mdb`) |
| `node-cron` | `^4.6.0` | Cron job de recordatorios de citas vía WhatsApp |
| `pdfkit` | `^0.15.0` | Generación de recetas médicas PDF y reportes de actividad del consultorio |
| `zod` | `^3.23.0` | Validación de DTOs en la capa de interfaces (rutas Fastify) |

#### Desarrollo (`devDependencies`)

| Paquete | Versión | Rol en el Sistema |
|---|:---:|---|
| `typescript` | `^5.4.0` | Compilador TypeScript con `strict: true` |
| `tsx` | `^4.7.0` | Ejecutor TypeScript sin build + runner de tests (`--test`) |
| `@types/jsonwebtoken` | `^9.0.10` | Tipos TypeScript para jsonwebtoken |
| `@types/node` | `^20.12.0` | Tipos TypeScript para APIs de Node.js |
| `@types/node-cron` | `^3.0.11` | Tipos TypeScript para node-cron |
| `@types/pdfkit` | `^0.13.4` | Tipos TypeScript para PDFKit |

---

### Frontend (`frontend/package.json`)

#### Producción (`dependencies`)

| Paquete | Versión | Rol en el Sistema |
|---|:---:|---|
| `react` | `^18.3.1` | Librería UI principal (Concurrent Mode, Suspense) |
| `react-dom` | `^18.3.1` | Renderizado React al DOM del browser |
| `react-router-dom` | `^6.22.0` | Enrutamiento SPA con rutas protegidas por rol (ProtectedRoute) |
| `@supabase/supabase-js` | `^2.110.8` | Cliente Supabase con `anonKey` — Realtime, Auth, Storage, queries directas |
| `@tanstack/react-query` | `^5.28.0` | Gestión de estado servidor, caching y re-fetching asíncrono |
| `lucide-react` | `^1.25.0` | Iconografía SVG moderna y consistente en la UI |

#### Desarrollo (`devDependencies`)

| Paquete | Versión | Rol en el Sistema |
|---|:---:|---|
| `vite` | `^5.4.0` | Bundler ultrarrápido con HMR (Hot Module Replacement) |
| `@vitejs/plugin-react` | `^4.2.1` | Plugin oficial React para Vite |
| `tailwindcss` | `^3.4.3` | Framework CSS utility-first para diseño de la UI |
| `autoprefixer` | `^10.4.19` | Añade prefijos CSS de compatibilidad automáticamente |
| `postcss` | `^8.4.38` | Procesador CSS para Tailwind |
| `typescript` | `^5.4.0` | Compilador TypeScript con `strict: true` |
| `@types/react` | `^18.3.1` | Tipos TypeScript para React |
| `@types/react-dom` | `^18.3.0` | Tipos TypeScript para React DOM |

---

## Arquitectura del Proyecto

```plaintext
consulta-practica-web/
├── backend/                                        # API Node.js + Fastify (Clean Architecture)
│   ├── src/
│   │   ├── domain/                                 # Capa de Dominio (puro, sin dependencias externas)
│   │   │   ├── entities/                           # Entidades del negocio
│   │   │   │   ├── Appointment.ts
│   │   │   │   ├── AuditLog.ts
│   │   │   │   ├── CIE10Diagnosis.ts
│   │   │   │   ├── IntakeForm.ts
│   │   │   │   ├── MedicalDocument.ts
│   │   │   │   ├── MedicalHistory.ts
│   │   │   │   ├── Medication.ts
│   │   │   │   ├── Notification.ts
│   │   │   │   ├── Patient.ts
│   │   │   │   ├── Payment.ts
│   │   │   │   ├── Prescription.ts
│   │   │   │   └── User.ts
│   │   │   ├── value-objects/                      # Objetos de valor
│   │   │   │   └── ICD10Code.ts
│   │   │   ├── exceptions/                         # Excepciones de dominio
│   │   │   │   └── DomainException.ts
│   │   │   └── ports/                              # Puertos / Interfaces (abstracciones)
│   │   │       ├── IAppointmentRepository.ts
│   │   │       ├── IAuditLogRepository.ts
│   │   │       ├── IAuthService.ts
│   │   │       ├── ICIE10Repository.ts
│   │   │       ├── IIntakeFormRepository.ts
│   │   │       ├── IMedicalDocumentRepository.ts
│   │   │       ├── IMedicalHistoryRepository.ts
│   │   │       ├── INotificationLogRepository.ts
│   │   │       ├── INotificationService.ts
│   │   │       ├── IPatientRepository.ts
│   │   │       ├── IPaymentGatewayService.ts
│   │   │       ├── IPaymentRepository.ts
│   │   │       ├── IPdfGeneratorService.ts
│   │   │       ├── IReportingRepository.ts
│   │   │       ├── IStorageService.ts
│   │   │       └── IVideoConferenceService.ts
│   │   │
│   │   ├── application/                            # Capa de Aplicación (23 Casos de Uso)
│   │   │   ├── use-cases/
│   │   │   │   ├── ArchiveMedicalDocument.ts
│   │   │   │   ├── AuthenticateUser.ts
│   │   │   │   ├── CreateIntakeForm.ts
│   │   │   │   ├── CreateVideoConsultation.ts
│   │   │   │   ├── ExportPatientDataCsvJson.ts     # Fase 5
│   │   │   │   ├── ExportPatientRecord.ts          # Fase 5 — requiere confirmación si is_protected
│   │   │   │   ├── GenerateClinicReport.ts         # Fase 5
│   │   │   │   ├── GeneratePrescription.ts
│   │   │   │   ├── GetIntakeFormByToken.ts
│   │   │   │   ├── GetPatientIntakeForms.ts
│   │   │   │   ├── GetPatientPaymentsSummary.ts
│   │   │   │   ├── GetPaymentsByAppointment.ts
│   │   │   │   ├── GetVideoConsultationLink.ts
│   │   │   │   ├── ListPatientDocuments.ts
│   │   │   │   ├── LogAuditEvent.ts                # Fase 5
│   │   │   │   ├── RegisterConsultation.ts
│   │   │   │   ├── RegisterPayment.ts
│   │   │   │   ├── ScheduleUpcomingReminders.ts
│   │   │   │   ├── SearchCIE10.ts
│   │   │   │   ├── SendAppointmentReminder.ts
│   │   │   │   ├── SubmitIntakeForm.ts
│   │   │   │   ├── UpdatePaymentStatus.ts
│   │   │   │   └── UploadMedicalDocument.ts
│   │   │   └── dtos/
│   │   │       ├── AuthDTO.ts
│   │   │       ├── ConsultationDTO.ts
│   │   │       └── PatientDTO.ts
│   │   │
│   │   ├── infrastructure/                         # Capa de Infraestructura (adaptadores técnicos)
│   │   │   ├── supabase/
│   │   │   │   ├── PostgresAppointmentRepository.ts
│   │   │   │   ├── PostgresAuditLogRepository.ts
│   │   │   │   ├── PostgresCIE10Repository.ts
│   │   │   │   ├── PostgresIntakeFormRepository.ts
│   │   │   │   ├── PostgresMedicalDocumentRepository.ts
│   │   │   │   ├── PostgresMedicalHistoryRepository.ts
│   │   │   │   ├── PostgresNotificationLogRepository.ts
│   │   │   │   ├── PostgresPatientRepository.ts
│   │   │   │   ├── PostgresPaymentRepository.ts
│   │   │   │   ├── PostgresReportingRepository.ts
│   │   │   │   ├── SupabaseAuthService.ts
│   │   │   │   └── SupabaseClient.ts               # supabase (anon) + supabaseAdmin (service_role)
│   │   │   ├── pdf/
│   │   │   │   ├── PdfKitService.ts                # Recetas médicas + documentos clínicos
│   │   │   │   └── PdfKitReportService.ts          # Reporte de actividad + expediente completo
│   │   │   ├── notifications/
│   │   │   │   └── WhatsAppNotificationService.ts  # Meta Cloud API — recordatorios WhatsApp
│   │   │   ├── video/
│   │   │   │   └── JitsiVideoConferenceService.ts  # Jitsi Meet (meet.jit.si) — desacoplado
│   │   │   ├── storage/
│   │   │   │   └── SupabaseStorageService.ts
│   │   │   ├── jobs/
│   │   │   │   └── reminderCronJob.ts              # Cron de recordatorios de citas
│   │   │   └── utils/
│   │   │       └── CsvJsonExportService.ts         # Exportación CSV/JSON de expedientes
│   │   │
│   │   ├── interfaces/                             # Adaptadores HTTP / Rutas Fastify
│   │   │   ├── routes/
│   │   │   │   ├── appointmentRoutes.ts
│   │   │   │   ├── authRoutes.ts
│   │   │   │   ├── cie10Routes.ts
│   │   │   │   ├── consultationRoutes.ts
│   │   │   │   ├── documentRoutes.ts
│   │   │   │   ├── intakeRoutes.ts
│   │   │   │   ├── patientRoutes.ts
│   │   │   │   ├── paymentRoutes.ts
│   │   │   │   ├── reportRoutes.ts                 # Fase 5 — exclusivo ADMINISTRATOR
│   │   │   │   └── videoRoutes.ts
│   │   │   ├── middlewares/
│   │   │   │   ├── authMiddleware.ts               # Verificación JWT Supabase
│   │   │   │   └── roleGuard.ts                    # Control de acceso por rol RBAC
│   │   │   └── etl/
│   │   │       └── mdbReader.ts                    # Lectura de base de datos Access legacy
│   │   ├── tests/
│   │   │   └── use-cases.test.ts                   # 27 tests unitarios (Fases 1-5)
│   │   └── server.ts                               # Entry point Fastify + DI container
│   ├── sql/
│   │   ├── 001_initial_schema.sql                  # Esquema base: users, patients, medical_histories
│   │   ├── 002_medical_documents.sql               # Documentos clínicos adjuntos
│   │   ├── 003_notifications.sql                   # Tabla notifications_log + reminder_sent
│   │   ├── 004_intake_forms.sql                    # Formularios de pre-consulta con tokens
│   │   ├── 005_video_sessions.sql                  # Campos de videoconsulta en appointments
│   │   ├── 006_payments.sql                        # Tabla payments (HNL — Lempira hondureño)
│   │   └── 007_reports_and_audit.sql               # Tabla audit_log + índices
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                                       # SPA React 18 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/                                 # Componentes reutilizables
│   │   │   └── layout/
│   │   │       ├── ProtectedRoute.tsx              # HOC de rutas protegidas por rol
│   │   │       ├── Sidebar.tsx                     # Navegación lateral con visibilidad RBAC
│   │   │       └── Topbar.tsx
│   │   ├── features/
│   │   │   ├── auth/                               # Login, AuthContext, Dashboard
│   │   │   ├── appointments/                       # Agenda en tiempo real (Supabase Realtime)
│   │   │   ├── consultation/                       # Formulario de consulta médica + CIE-10
│   │   │   ├── intake/                             # Formularios públicos y listado interno
│   │   │   ├── patients/                           # Expedientes, galería, documentos, pagos
│   │   │   ├── prescriptions/                      # Visualización de recetas
│   │   │   ├── reports/                            # Reportes + exportación (solo ADMINISTRATOR)
│   │   │   └── video/                              # Sala de videoconsulta pública (Jitsi)
│   │   ├── lib/
│   │   │   └── supabaseClient.ts                   # Cliente Supabase JS con anonKey
│   │   ├── App.tsx                                 # Enrutador con rutas protegidas por rol
│   │   └── main.tsx
│   ├── .env.example
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── docs/
│   ├── SSD.md                                      # Solution Design Document (especificación autoritativa)
│   └── INSTRUCTIONS.md                             # Instrucciones por fases
│
├── AGENTS.md                                       # Guía operativa para agentes de IA
└── index.html                                      # Fuente de verdad — solo lectura
```

---

## Módulos Implementados

| Fase | Módulo | Estado | Descripción |
|:---:|---|:---:|---|
| **Fase 0** | Core / Auth / Consulta Médica | ✅ | Login JWT, registro de pacientes, notas clínicas inmutables, recetas PDF, CIE-10 |
| **Fase 1** | Recordatorios WhatsApp | ✅ | Cron job de recordatorios automáticos vía Meta Cloud API |
| **Fase 2** | Intake Digital (Pre-consulta) | ✅ | Formularios con token de 72h, acceso público sin login, flujo interno autenticado |
| **Fase 3** | Videoconsulta Integrada | ✅ | Salas Jitsi generadas por cita, enlace seguro vía token, acceso médico y paciente |
| **Fase 4** | Registro de Pagos Manuales | ✅ | Efectivo, transferencia y depósito en Lempiras HNL — arquitectura preparada para pasarela |
| **Fase 5** | Reportes y Exportación | ✅ | Reporte PDF del consultorio, expediente PDF/CSV/JSON, log de auditoría, pacientes protegidos |

---

## Instalación y Configuración

### Requisitos Previos
- **Node.js** `>= 18.0.0`
- **npm** `>= 9.0.0`
- **Cuenta Supabase** con proyecto PostgreSQL 16

### 1. Clonar el repositorio

```bash
git clone https://github.com/Quiroz-Zuniga/Consulta-Pr-ctica.git
cd Consulta-Pr-ctica
```

### 2. Instalar dependencias del Backend

```bash
cd backend
npm install
```

### 3. Instalar dependencias del Frontend

```bash
cd frontend
npm install
```

### 4. Ejecutar Migraciones SQL en Supabase

En el editor SQL de Supabase, ejecutar en orden:

```sql
-- En la consola SQL de Supabase (Settings > SQL Editor):
\i sql/001_initial_schema.sql
\i sql/002_medical_documents.sql
\i sql/003_notifications.sql
\i sql/004_intake_forms.sql
\i sql/005_video_sessions.sql
\i sql/006_payments.sql
\i sql/007_reports_and_audit.sql
```

---

## Variables de Entorno

### Backend (`backend/.env`)

```env
# ── Supabase Project ──────────────────────────────────
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # NUNCA exponer en cliente

# ── Servidor ──────────────────────────────────────────
PORT=3000
HOST=0.0.0.0

# ── Autenticación JWT ─────────────────────────────────
JWT_SECRET=your-jwt-secret                        # Copiado desde Supabase > Settings > API

# ── Storage Buckets ───────────────────────────────────
STORAGE_BUCKET_PRESCRIPTIONS=prescription-pdfs
STORAGE_BUCKET_PHOTOS=patient-photos

# ── WhatsApp Cloud API (Meta Business) ── Fase 1 ─────
WHATSAPP_API_TOKEN=your-whatsapp-api-token        # Token permanente de Meta Business
WHATSAPP_PHONE_ID=your-whatsapp-phone-id          # ID del número de WhatsApp Business
WHATSAPP_TEMPLATE_NAME=recordatorio_cita_medica   # Nombre del template aprobado por Meta
```

### Frontend (`frontend/.env`)

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:3000                # URL del backend en desarrollo
```

> **Nota sobre Jitsi:** No requiere variables de entorno. Usa la instancia pública `meet.jit.si`. La arquitectura está desacoplada detrás del puerto `IVideoConferenceService` para migrar a self-hosted sin modificar la capa de aplicación.

> **Nota sobre Pagos:** Actualmente en modo manual (HNL — Lempira). El puerto `IPaymentGatewayService` está preparado para conectar PayPal u otra pasarela sin reescribir los casos de uso.

---

## Comandos de Ejecución

### Backend (`backend/`)

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con hot-reload (`tsx watch`) |
| `npm run build` | Compila TypeScript a JavaScript en `dist/` |
| `npm start` | Servidor de producción (`node dist/server.js`) |
| `npm run typecheck` | Verificación estática de tipos sin compilar (`tsc --noEmit`) |
| `npm test` | Suite de 27 tests unitarios de todos los casos de uso |
| `npm run etl` | Migración de datos desde Microsoft Access `.mdb` |
| `npm run etl:dry` | Migración en modo simulación (sin escribir en DB) |

### Frontend (`frontend/`)

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor Vite con HMR en `http://localhost:5173` |
| `npm run build` | Bundle de producción en `dist/` |
| `npm run preview` | Preview del bundle de producción |
| `npm run typecheck` | Verificación estática de tipos (`tsc --noEmit`) |

---

## Migraciones SQL

| Archivo | Contenido |
|---|---|
| `001_initial_schema.sql` | Tablas: `users`, `patients`, `medical_histories`, `prescriptions`, `prescription_items`, `cie10_diagnoses`, `medical_attachments`. Función `get_user_role()`, políticas RLS base |
| `002_medical_documents.sql` | Tabla `medical_documents` — adjuntos clínicos (PDF, imágenes, laboratorio) |
| `003_notifications.sql` | Tabla `notifications_log` + columna `reminder_sent` en `appointments` |
| `004_intake_forms.sql` | Tabla `intake_forms` con token de 72h para formularios de pre-consulta públicos |
| `005_video_sessions.sql` | Columnas `video_room_name`, `video_room_url`, `video_session_status` en `appointments` |
| `006_payments.sql` | Tabla `payments` (monto, método, estado, Lempiras HNL) |
| `007_reports_and_audit.sql` | Tabla `audit_log` con índices — trazabilidad de accesos a expedientes |

---

## Roles y Permisos

| Rol | Valor en DB | Acceso |
|---|:---:|---|
| **Médico Administrador** | `ADMINISTRATOR` | Acceso completo: todas las funciones, reportes, exportaciones, gestión de usuarios |
| **Médico Especialista** | `DOCTOR` | Consultas, recetas, videoconsultas, historial clínico (sin reportes ni gestión de usuarios) |
| **Secretaria / Asistente** | `RECEPTIONIST` | Agenda de citas, registro de pacientes, formularios de intake (sin acceso a notas clínicas) |

---

## Seguridad y RLS

El sistema implementa **defensa en profundidad** en tres capas:

### 1. Backend Fastify — Middleware
- Todos los endpoints autenticados pasan por `authMiddleware` (verifica JWT) + `roleGuard` (verifica rol RBAC).
- Los endpoints públicos (`/public/intake`, `/public/video`) usan tokens criptográficos con expiración.

### 2. PostgreSQL — Row Level Security (RLS)
Todas las 12 tablas tienen `rls_enabled: true`:

| Tabla | Estrategia de Acceso |
|---|---|
| `medical_histories`, `prescriptions`, `prescription_items` | **`SELECT` únicamente** para `authenticated` — INSERT/UPDATE/DELETE solo vía `service_role` |
| `patients`, `appointments`, `cie10_diagnoses`, `users` | `authenticated` con diferenciación de rol vía `get_user_role(auth.uid())` |
| `medical_attachments` | `authenticated` (DOCTOR/ADMIN) |
| `payments`, `intake_forms`, `notifications_log`, `audit_log` | **Sin políticas públicas — acceso exclusivo `service_role`** |

### 3. PostgreSQL — Triggers de Inmutabilidad
Triggers instalados directamente en el motor de base de datos:

| Trigger | Tabla | Protección |
|---|---|---|
| `trg_prevent_locked_medical_history_modification` | `medical_histories` | Bloquea `UPDATE`/`DELETE` cuando `is_locked = TRUE` — inmutabilidad legal |
| `trg_protect_patient_sensitivity_flag` | `patients` | Solo `ADMINISTRATOR` puede modificar el campo `is_protected` |
| `trg_protect_appointment_automation_fields` | `appointments` | Bloquea escritura de `reminder_sent`, `video_room_*`, `video_session_status` desde sesiones `authenticated` (solo `service_role`) |

---

## Endpoints de la API

### Endpoints Públicos (sin JWT, con token propio + rate limiting)

| Método | Ruta | Protección | Límite |
|---|---|---|:---:|
| `GET` | `/health` | — | Global |
| `POST` | `/api/v1/auth/login` | Zod validation | Global |
| `GET` | `/api/v1/public/intake/:token` | Token 72h | 30/min |
| `POST` | `/api/v1/public/intake/:token` | Token 72h | 10/min |
| `GET` | `/api/v1/public/appointments/:id/video-consultation?token=` | Token de cita | 30/min |

### Endpoints Autenticados (JWT + roleGuard)

| Módulo | Rutas | Roles |
|---|---|---|
| **Pacientes** | `GET/POST /api/v1/patients`, `GET/PATCH /api/v1/patients/:id` | ADMIN, DOCTOR, RECEPTIONIST |
| **Consultas** | `POST /api/v1/consultations` | ADMIN, DOCTOR |
| **CIE-10** | `GET /api/v1/cie10/search` | ADMIN, DOCTOR |
| **Citas** | `GET/POST /api/v1/appointments`, `PATCH /api/v1/appointments/:id` | ADMIN, DOCTOR, RECEPTIONIST |
| **Recordatorios** | `POST /api/v1/appointments/:id/send-reminder` | ADMIN, DOCTOR |
| **Intake Forms** | `POST/GET /api/v1/patients/:id/intake-forms` | ADMIN, DOCTOR, RECEPTIONIST |
| **Videoconsulta** | `POST/GET /api/v1/appointments/:id/video-consultation` | ADMIN, DOCTOR, RECEPTIONIST |
| **Pagos** | `POST/GET /api/v1/appointments/:id/payments`, `GET /api/v1/patients/:id/payments-summary` | ADMIN, DOCTOR |
| **Documentos** | `POST/GET /api/v1/patients/:id/documents` | ADMIN, DOCTOR |
| **Reportes** | `GET /api/v1/reports/clinic-stats` | **ADMINISTRATOR únicamente** |
| **Exportación** | `GET /api/v1/patients/:id/export/pdf\|csv\|json` | **ADMINISTRATOR únicamente** |
| **Auditoría** | `GET /api/v1/audit-log` | **ADMINISTRATOR únicamente** |

---

## Tests

```bash
cd backend
npm test
```

```
▶ Phase 2 & Phase 1 Use Cases (20 tests)
▶ Phase 5 - Reportes y Exportacion (7 tests)
ℹ tests 27 | pass 27 | fail 0
```

Los tests están implementados con mocks de repositorios (sin dependencias de base de datos) para máxima velocidad y portabilidad.

---

## Licencia y Propiedad

Proyecto privado para gestión clínica médica — **Honduras**. Todos los derechos reservados.  
© 2024–2026 Consulta Práctica Web.
