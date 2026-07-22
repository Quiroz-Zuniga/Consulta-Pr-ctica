-- =============================================================================
-- Migration: 004_intake_forms.sql
-- Descripción: Tabla de formularios de preconsulta (Intake Digital) con tokens de un solo uso
-- =============================================================================

CREATE TABLE IF NOT EXISTS intake_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    access_token VARCHAR(255) UNIQUE NOT NULL,
    token_expires_at TIMESTAMPTZ NOT NULL,
    form_data JSONB,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices de rendimiento
CREATE UNIQUE INDEX IF NOT EXISTS idx_intake_forms_access_token ON intake_forms(access_token);
CREATE INDEX IF NOT EXISTS idx_intake_forms_patient_id ON intake_forms(patient_id);
CREATE INDEX IF NOT EXISTS idx_intake_forms_appointment_id ON intake_forms(appointment_id);

-- RLS: Habilitar RLS y restringir acceso directo (solo service_role mediante backend Fastify)
ALTER TABLE intake_forms ENABLE ROW LEVEL SECURITY;

-- Ninguna política para 'anon' ni 'authenticated', asegurando que solo service_role opere la tabla
