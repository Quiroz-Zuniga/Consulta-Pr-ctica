# Reglas de Clean Architecture — Consulta Práctica Web

## Regla de Dependencia (The Dependency Rule)

- La dirección de las dependencias es siempre hacia adentro: `Infrastructure → Application → Domain`.
- El `Domain` no importa nada externo (ni Supabase, ni Fastify, ni PDFKit, ni ninguna librería de terceros).
- La capa `Application` solo importa interfaces (`I*Repository`, `I*Service`) definidas en `domain/ports/`, nunca implementaciones concretas.
- La capa `Infrastructure` implementa los puertos definidos por `Application` / `Domain`.
- La capa `Interface Adapters` solo importa casos de uso de `Application`, nunca directamente el dominio ni la infraestructura.

## Entidades y Dominio

- Ubicar TODAS las entidades en `backend/src/domain/entities/`.
- Entidades permitidas: `Patient`, `MedicalHistory`, `CIE10Diagnosis`, `Prescription`, `Medication`, `User`.
- Ubicar Value Objects en `backend/src/domain/value-objects/` (`ICD10Code`, `PasscodeHash`, `PatientID`).
- Las entidades de dominio son clases o tipos puros TypeScript, sin decoradores de ORM ni referencias a Supabase.
- La invariante de negocio crítica: un `MedicalHistory` con `isLocked = true` es inmutable. Implementar este control en la entidad, no en la base de datos solamente.

## Casos de Uso

- Ubicar TODOS los casos de uso en `backend/src/application/use-cases/`.
- Casos de uso reconocidos: `RegisterConsultation`, `AuthenticateUser`, `SearchCIE10`, `GeneratePrescription`.
- Un caso de uso solo puede llamar puertos/interfaces, nunca SDKs concretos.
- Los DTOs de entrada/salida van en `backend/src/application/dtos/`.

## Puertos (Interfaces)

- Definir los puertos en `backend/src/domain/ports/`.
- Puertos obligatorios: `IPatientRepository`, `IMedicalHistoryRepository`, `IPdfGeneratorService`.
- Toda implementación concreta de un puerto va en `backend/src/infrastructure/`.
- Nunca instanciar implementaciones concretas dentro de casos de uso; usar inyección de dependencias.

## Infraestructura

- Ubicar adaptadores en `backend/src/infrastructure/supabase/`, `backend/src/infrastructure/pdf/`, `backend/src/infrastructure/storage/`.
- La infraestructura puede importar el dominio, pero nunca al revés.
- Los repositorios concretos (`PostgresPatientRepository`) deben implementar exactamente la interfaz del puerto correspondiente.

## Controladores HTTP (Interface Adapters)

- Ubicar rutas en `backend/src/interfaces/routes/`.
- Los controladores Fastify NO contienen lógica de negocio. Su único trabajo: deserializar request, llamar al caso de uso, serializar response.
- Validar con Zod los DTOs de entrada ANTES de invocar el caso de uso.
- Aplicar `authMiddleware` y `roleGuard` en todos los endpoints con datos clínicos.

## Prohibiciones Absolutas

- Nunca colocar lógica de negocio en `interfaces/routes/`.
- Nunca importar Supabase SDK desde `domain/` o `application/`.
- Nunca renombrar entidades, casos de uso o puertos respecto al SSD (`docs/SSD.md`).
- Nunca añadir capas arquitectónicas no definidas en el SSD.
