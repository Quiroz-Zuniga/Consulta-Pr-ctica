# Reglas de Estilo de Código — Consulta Práctica Web

## TypeScript

- Usar TypeScript con `strict: true` en `tsconfig.json` (backend y frontend).
- Prohibido el uso de `any`. Si es absolutamente necesario, añadir comentario `// TODO: type this properly` con justificación.
- Preferir `interface` sobre `type` para entidades y DTOs. Usar `type` para uniones y tipos utilitarios.
- Todas las funciones exportadas deben tener tipos de retorno explícitos.
- Nunca usar `!` (non-null assertion) sin comentario justificativo.

## Nomenclatura de Archivos

- **PascalCase** para entidades de dominio, componentes React, casos de uso e interfaces: `Patient.ts`, `MedicalHistory.ts`, `RegisterConsultation.ts`, `PatientCard.tsx`, `IPatientRepository.ts`.
- **camelCase** para utilidades, hooks, servicios y configuraciones: `supabaseClient.ts`, `authMiddleware.ts`, `usePatients.ts`.
- **kebab-case** para archivos de rutas Fastify: `patient-routes.ts`, `consultation-routes.ts`.
- Los archivos de migraciones SQL: prefijo numérico + descripción en snake_case: `001_initial_schema.sql`.

## Nombres de Entidades y Casos de Uso (Canónicos — No Renombrar)

- Entidades: `Patient`, `MedicalHistory`, `CIE10Diagnosis`, `Prescription`, `Medication`, `User`, `UserRole`.
- Casos de uso: `RegisterConsultation`, `AuthenticateUser`, `SearchCIE10`, `GeneratePrescription`.
- Puertos: `IPatientRepository`, `IMedicalHistoryRepository`, `IPdfGeneratorService`.
- Infraestructura: `SupabaseClient`, `PostgresPatientRepository`, `PdfKitService`, `SupabaseStorageService`.
- Middlewares: `authMiddleware`, `roleGuard`.

## ESLint y Prettier

- ESLint configurado con reglas TypeScript estrictas. Todo código debe pasar `eslint --max-warnings 0` antes de commitear.
- Prettier para formateo automático. Usar la configuración del proyecto; no sobrescribir reglas individualmente.
- No deshabilitar reglas ESLint con `// eslint-disable` sin justificación en comentario.

## Componentes React (Frontend)

- Solo componentes funcionales con hooks. No usar componentes de clase.
- Nombrar hooks personalizados con prefijo `use`: `usePatients`, `useConsultation`, `useAuth`.
- Tailwind CSS para estilos. No añadir CSS-in-JS (`styled-components`, `emotion`) ni módulos CSS adicionales.
- TanStack Query para todas las llamadas al servidor. No usar `useEffect` + `fetch` directamente para datos del servidor.
- Supabase JS SDK para Auth/Storage/Realtime desde el frontend. No hacer llamadas directas a la API REST de Supabase manualmente.

## Backend Fastify

- Cada ruta en su propio archivo dentro de `interfaces/routes/`.
- Schemas Zod/JSON Schema definidos en el mismo archivo de ruta o en `application/dtos/`.
- Controladores ultra-delgados: solo deserializar → llamar caso de uso → serializar. Máximo ~20 líneas por handler.
- Usar `async/await`, no callbacks. Manejar errores con `try/catch` y relanzar como `FastifyError`.

## Organización de Imports

- Orden de imports: 1) librerías node_modules, 2) importaciones absolutas del proyecto, 3) importaciones relativas.
- Usar paths absolutos configurados en `tsconfig.json` (`@domain/`, `@application/`, `@infrastructure/`, `@interfaces/`).

## Prohibiciones Absolutas

- Nunca usar `any` sin justificación comentada.
- Nunca usar componentes de clase React.
- Nunca añadir CSS-in-JS al proyecto.
- Nunca renombrar entidades, casos de uso o puertos del SSD.
- Nunca mezclar lógica de negocio en archivos de rutas o componentes de UI.
