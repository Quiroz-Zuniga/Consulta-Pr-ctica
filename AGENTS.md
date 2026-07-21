# AGENTS.md — Guía Operativa para Agentes de IA

> Este archivo es la guía de operación para cualquier agente de IA (Antigravity, Claude Code, GitHub Copilot, u otro) que trabaje en este repositorio. Léelo completo antes de escribir una sola línea de código.

---

## Propósito del Proyecto

**Consulta Práctica Web** es la migración integral del sistema médico legacy **"Consulta Práctica"** (Visual Basic / Microsoft Access `.mdb`) hacia una plataforma web moderna basada en **Clean Architecture**. El nuevo sistema gestiona expedientes clínicos, emisión de recetas PDF, agenda de citas en tiempo real y diagnósticos CIE-10, con acceso multiusuario seguro desde cualquier dispositivo. El objetivo central es eliminar la fragilidad del monolito de escritorio, garantizar inmutabilidad legal de los historiales médicos, y operar con costos mínimos en hardware de bajo recurso.

---

## Fuente de Verdad

- **`index.html`** (raíz del repositorio) y **`docs/SSD.md`** son la especificación autoritativa del proyecto.
- Ante cualquier ambigüedad sobre arquitectura, entidades, nombres de tablas, casos de uso o fases, el agente **debe consultar el SSD antes de inventar comportamiento**.
- Si el código implementado diverge del SSD, el agente **debe señalarlo explícitamente al usuario**, no "corregir" o modificar el SSD por su cuenta.
- No se deben añadir entidades, tablas, rutas o casos de uso que no estén documentados en `index.html` / `docs/SSD.md`.

---

## Stack y Versiones Fijadas

| Capa | Tecnología | Notas |
|---|---|---|
| **Backend** | Node.js + Fastify, TypeScript (`strict: true`) | < 35 MB RAM, < 10ms latencia |
| **Base de datos / BaaS** | Supabase — PostgreSQL 16, Auth JWT, RLS, Realtime, Storage | Sin alternativas |
| **Frontend** | React 18 + Vite + Tailwind CSS + TanStack Query + Supabase JS SDK | SPA puro |
| **Edge / CDN** | Cloudflare Pages + R2 | Despliegue del SPA estático |
| **Generación de PDF** | PDFKit | Sin Word/OLE ni otras librerías PDF |
| **Validación** | Zod / JSON Schema | En el borde de la API, no en el dominio |
| **ETL** | Python (`pyodbc`) o Node.js (`node-adodb`) | Solo para migración desde `.mdb` |

> **Regla:** No introducir dependencias fuera de este stack sin aprobación explícita del usuario y documentación del motivo.

---

## Arquitectura Obligatoria (Clean Architecture)

### El agente NUNCA debe:
- Colocar lógica de negocio en controladores Fastify (capa `interfaces/`).
- Acceder a Supabase SDK directamente desde `domain/` o `application/`.
- Saltarse los puertos/interfaces (`IPatientRepository`, `IMedicalHistoryRepository`, `IPdfGeneratorService`) al implementar infraestructura.
- Crear archivos de entidades fuera de `backend/src/domain/entities/`.
- Hacer `UPDATE` sobre registros de `medical_histories` que tengan `is_locked = TRUE`.
- Exponer `password_hash` en ninguna respuesta HTTP.

### El agente SIEMPRE debe:
- Ubicar entidades y reglas de negocio puras en `backend/src/domain/`.
- Ubicar casos de uso en `backend/src/application/use-cases/`.
- Implementar adaptadores concretos en `backend/src/infrastructure/`.
- Exponer HTTP únicamente en `backend/src/interfaces/routes/`.
- Validar con Zod en la capa `interfaces/` antes de pasar DTOs a `application/`.
- Pasar por `authMiddleware` + `roleGuard` en todos los endpoints con datos clínicos.

### Regla de Dependencia (The Dependency Rule)
```
Domain ← Application ← Infrastructure
Domain ← Application ← Interface Adapters
```
Las dependencias apuntan **siempre hacia adentro**. El dominio no importa nada externo.

---

## Estructura de Carpetas de Referencia

```plaintext
consulta-practica-web/
├── backend/                                 # API Node.js + Fastify (Clean Architecture)
│   ├── src/
│   │   ├── domain/                          # CAPA DE DOMINIO (Entidades puras y Reglas)
│   │   │   ├── entities/                    # Patient.ts, MedicalHistory.ts, Prescription.ts
│   │   │   ├── value-objects/               # ICD10Code.ts, PasscodeHash.ts
│   │   │   ├── exceptions/                  # DomainException.ts
│   │   │   └── ports/                       # Interfaces (IPatientRepository.ts, IPdfService.ts)
│   │   ├── application/                     # CAPA DE APLICACIÓN (Casos de Uso)
│   │   │   ├── use-cases/                   # RegisterConsultation.ts, AuthenticateUser.ts
│   │   │   └── dtos/                        # ConsultationDTO.ts, PatientDTO.ts
│   │   ├── infrastructure/                  # CAPA DE INFRAESTRUCTURA (Técnica)
│   │   │   ├── supabase/                    # SupabaseClient.ts, PostgresPatientRepository.ts
│   │   │   ├── pdf/                         # PdfKitService.ts (Generador de recetas)
│   │   │   └── storage/                     # SupabaseStorageService.ts
│   │   ├── interfaces/                      # ADAPTADORES HTTP / API (Fastify)
│   │   │   ├── routes/                      # patientRoutes.ts, consultationRoutes.ts
│   │   │   ├── middlewares/                 # authMiddleware.ts, roleGuard.ts
│   │   │   └── etl/                         # mdb_migrator.py (Script de migración legacy)
│   │   └── server.ts                        # Entry point Fastify
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                                # CLIENTE WEB SPA (Cloudflare Pages)
│   ├── src/
│   │   ├── assets/                          # Estilos CSS, Tailwind Setup
│   │   ├── components/
│   │   │   ├── ui/                          # Button.tsx, Dialog.tsx, Input.tsx (Shadcn)
│   │   │   └── layout/                      # Sidebar.tsx, Topbar.tsx
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   ├── patients/
│   │   │   ├── consultation/
│   │   │   ├── prescriptions/
│   │   │   └── appointments/
│   │   ├── lib/                             # supabaseClient.ts (SDK Supabase JS)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── docs/
│   ├── SSD.md                               # Solution Design Document (este repo)
│   └── INSTRUCTIONS.md                      # Instrucciones de ejecución por fases
│
├── .antigravity/rules/                      # Reglas de arquitectura para agentes
├── AGENTS.md                                # Este archivo
└── index.html                               # Fuente de verdad (solo lectura)
```

---

## Convenciones de Código

- **TypeScript estricto** (`strict: true` en `tsconfig.json`). Prohibido `any` salvo con comentario justificativo explícito.
- **Nombres canónicos:** Los nombres de entidades, casos de uso y puertos son exactamente los del SSD. No renombrar:
  - `Patient`, `MedicalHistory`, `CIE10Diagnosis`, `Prescription`, `Medication`, `User`
  - `RegisterConsultation` / `RegisterClinicalConsultationUseCase`
  - `AuthenticateUser`
  - `SearchCIE10` / `SearchICD10UseCase`
  - `GeneratePrescription` / `GeneratePrescriptionPdfUseCase`
  - `IPatientRepository`, `IMedicalHistoryRepository`, `IPdfGeneratorService`
- **Archivos:** PascalCase para entidades/componentes (`Patient.ts`, `MedicalHistory.ts`), camelCase para utilidades (`supabaseClient.ts`).
- **Historiales inmutables:** `medical_histories` con `is_locked = TRUE` son de solo lectura. Ningún agente debe implementar UPDATE sobre notas clínicas ya bloqueadas.
- **ESLint + Prettier** configurados. Todo código debe pasar lint sin errores antes de commitear.

---

## Seguridad — No Negociable

- **RLS activo** en TODAS las tablas de Supabase que contengan datos clínicos (`medical_histories`, `prescriptions`, `prescription_items`, `medical_attachments`).
- El rol **`RECEPTIONIST`** (Secretaria/Asistente) **jamás** debe tener acceso de lectura a `clinical_note` ni a `prescriptions`.
- **HTTPS/TLS 1.3** obligatorio en toda comunicación. Sin HTTP plano en producción.
- **Cifrado en reposo AES-256** en Supabase PostgreSQL y Storage.
- Todo endpoint que exponga datos de pacientes debe pasar por `authMiddleware` + `roleGuard`.
- El campo `password_hash` **nunca** debe ser serializado en respuestas HTTP.
- Logs de auditoría en cada consulta o descarga de expediente clínico.

### Roles del Sistema

| Rol | Valor en DB | Permisos |
|---|---|---|
| Médico Administrador | `ADMINISTRATOR` | UC-1, UC-4, UC-7, UC-8 (todos los accesos) |
| Médico Especialista | `DOCTOR` | UC-1, UC-2, UC-3, UC-4, UC-5, UC-6 |
| Secretaria / Asistente | `RECEPTIONIST` | UC-1, UC-2, UC-6 (sin acceso a notas clínicas) |

---

## Casos de Uso Reconocidos (UC)

| ID | Nombre | Acceso |
|---|---|---|
| UC-1 | Iniciar Sesión JWT | ADMINISTRATOR, DOCTOR, RECEPTIONIST |
| UC-2 | Buscar / Registrar Paciente | ADMINISTRATOR, DOCTOR, RECEPTIONIST |
| UC-3 | Consultar Catálogo CIE-10 | DOCTOR |
| UC-4 | Crear Nota Médica Tripartita | ADMINISTRATOR, DOCTOR |
| UC-5 | Emitir e Imprimir Receta PDF | DOCTOR |
| UC-6 | Agendar Cita en Realtime | ADMINISTRATOR, DOCTOR, RECEPTIONIST |
| UC-7 | Administrar Usuarios y Clave Maestra | ADMINISTRATOR |
| UC-8 | Exportar Base de Datos / Backups | ADMINISTRATOR |

---

## Flujo de Trabajo Esperado del Agente

1. **Leer el SSD** (`docs/SSD.md`) y verificar en qué fase del roadmap se está trabajando (`docs/INSTRUCTIONS.md`).
2. **Antes de escribir código:** listar explícitamente qué capas de Clean Architecture toca el cambio propuesto.
3. **Verificar el diagrama ER** (sección 4.7 del SSD) antes de crear o modificar cualquier migración SQL.
4. Escribir o actualizar **tests antes o junto con la implementación** (si aplica).
5. **No mezclar cambios de más de una fase** del roadmap en un mismo commit/PR.
6. **Actualizar `docs/SSD.md`** solo si el cambio implica una decisión de arquitectura nueva aprobada por el usuario.
7. Seguir las reglas en `.antigravity/rules/` para cada tipo de cambio.

---

## Qué NO Debe Hacer el Agente

- ❌ No introducir dependencias fuera del stack aprobado sin justificarlo explícitamente al usuario.
- ❌ No generar datos de pacientes ficticios "realistas" para pruebas; usar datos claramente sintéticos (p.ej. `Paciente Test`, `test@ejemplo.com`).
- ❌ No eliminar ni ignorar la marca de inmutabilidad (`is_locked`) para "facilitar" ediciones.
- ❌ No añadir lógica de negocio fuera de `domain/` y `application/`.
- ❌ No acceder a Supabase desde el dominio.
- ❌ No renombrar entidades, casos de uso o puertos del SSD.
- ❌ No crear fases de migración nuevas; respetar las 6 fases definidas en `docs/INSTRUCTIONS.md`.
- ❌ No modificar `index.html`; es de solo lectura, fuente de verdad histórica.
- ❌ No exponer `password_hash` en ninguna respuesta HTTP.

---

*Última actualización derivada de `index.html` versión 2.0 Web.*
