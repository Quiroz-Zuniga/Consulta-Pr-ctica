-- =============================================================================
-- Migration 007: Reports & Audit Log
-- Crea la tabla audit_log separada para trazabilidad de acceso a expedientes
-- y exportaciones (UC-8, sección 9 del SSD).
-- =============================================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Tabla audit_log
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID          NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  action        VARCHAR(80)   NOT NULL,
  resource_type VARCHAR(60)   NOT NULL,
  resource_id   UUID,
  metadata      JSONB,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────────────────────
-- 2. Índices para queries de auditoría rápidas
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audit_log_resource
  ON audit_log (resource_type, resource_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_user_date
  ON audit_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at
  ON audit_log (created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 3. RLS — exclusivo service_role (mismo patrón que las tablas
--    notifications_log, intake_forms, payments)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Sin políticas para anon ni authenticated → denegado por defecto.
-- El backend accede con service_role (supabaseAdmin), que omite RLS.
