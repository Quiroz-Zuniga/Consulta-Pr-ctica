# Reglas de Seguridad — Consulta Práctica Web

## Autenticación y Autorización

- Todos los endpoints que expongan datos de pacientes o historiales clínicos DEBEN pasar por `authMiddleware` (validación JWT) y `roleGuard` (verificación de rol).
- Nunca confiar en el `userId` o `role` del body del request; leerlos siempre del token JWT validado.
- Los tokens JWT deben ser de corta duración. Usar refresh tokens con rotación provisto por Supabase Auth.
- El flujo de autenticación es: `POST /api/v1/auth/login` → Supabase `signInWithPassword` → JWT devuelto al SPA.
- Almacenar el token en memoria del SPA o en HTTP-Only Cookie. Nunca en `localStorage`.

## Row Level Security (RLS)

- RLS OBLIGATORIO en TODAS las tablas que contengan datos clínicos: `medical_histories`, `prescriptions`, `prescription_items`, `medical_attachments`.
- El rol `RECEPTIONIST` (Secretaria/Asistente) NO debe tener política RLS que permita SELECT sobre `clinical_note` (columna de `medical_histories`) ni sobre `prescriptions`.
- Las políticas RLS deben ser revisadas ante cualquier migración SQL nueva.
- Nunca deshabilitar RLS en tablas clínicas, ni siquiera temporalmente en staging.

## Inmutabilidad de Historiales Médicos

- Un registro `medical_histories` con `is_locked = TRUE` es INMUTABLE. No implementar UPDATE sobre notas clínicas bloqueadas.
- La operación de bloqueo (`is_locked = TRUE`) se ejecuta en el mismo INSERT, nunca en un UPDATE posterior.
- Implementar la invariante de inmutabilidad en la entidad de dominio `MedicalHistory`, no solo en la BD.
- Documentar cualquier excepción a esta regla con aprobación explícita del usuario; tal excepción es extremadamente improbable y requiere justificación legal.

## Cifrado

- Toda comunicación en producción bajo HTTPS / TLS 1.3. Sin HTTP plano.
- Supabase PostgreSQL y Storage cifrados en reposo con AES-256 (provisto por defecto por Supabase).
- Las URLs de archivos en Storage deben ser pre-firmadas (signed URLs) temporales, nunca URLs públicas permanentes para adjuntos clínicos.

## Datos Sensibles

- El campo `password_hash` NUNCA debe ser serializado en respuestas HTTP. Excluirlo explícitamente de todos los DTOs de respuesta.
- No exponer datos de diagnóstico (`clinical_note`, `cie10_code`) a usuarios con rol `RECEPTIONIST`.
- Usar datos claramente sintéticos en tests (no inventar nombres, fechas o diagnósticos que parezcan reales).

## Auditoría

- Registrar logs de auditoría en cada consulta o descarga de expediente clínico (`medical_histories`, `medical_attachments`).
- Los logs deben contener: `timestamp`, `user_id`, `action`, `resource_id`, `ip_address` (cuando disponible).
- Los logs de auditoría son inmutables; solo append, nunca delete.

## Prohibiciones Absolutas

- Nunca deshabilitar `authMiddleware` en endpoints de datos clínicos.
- Nunca exponer `password_hash` en ninguna respuesta HTTP o log de aplicación.
- Nunca permitir acceso de `RECEPTIONIST` a `clinical_note` o `prescriptions`.
- Nunca usar HTTP sin TLS en producción.
- Nunca eliminar `is_locked` para "facilitar" ediciones de historial.
