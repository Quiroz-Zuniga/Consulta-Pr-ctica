-- ==========================================================
-- Consulta Práctica Web - Esquema Inicial PostgreSQL
-- Fase 1: Infraestructura Cloud & Dominio
-- ==========================================================

-- Extensión para UUID v4
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================
-- TABLA: users
-- ==========================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('ADMINISTRATOR', 'DOCTOR', 'RECEPTIONIST')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ==========================================================
-- TABLA: patients
-- ==========================================================
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    phone VARCHAR(50),
    photo_url TEXT,
    is_protected BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patients_full_name ON patients(full_name);

-- ==========================================================
-- TABLA: cie10_diagnoses
-- ==========================================================
CREATE TABLE cie10_diagnoses (
    code VARCHAR(10) PRIMARY KEY,
    description TEXT NOT NULL,
    category VARCHAR(255) NOT NULL
);

CREATE INDEX idx_cie10_description ON cie10_diagnoses USING GIN(to_tsvector('spanish', description));
CREATE INDEX idx_cie10_category ON cie10_diagnoses(category);

-- ==========================================================
-- TABLA: medical_histories
-- ==========================================================
CREATE TABLE medical_histories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    cie10_code VARCHAR(10) NOT NULL REFERENCES cie10_diagnoses(code) ON DELETE RESTRICT,
    clinical_note TEXT NOT NULL,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medical_histories_patient ON medical_histories(patient_id);
CREATE INDEX idx_medical_histories_doctor ON medical_histories(doctor_id);
CREATE INDEX idx_medical_histories_cie10 ON medical_histories(cie10_code);
CREATE INDEX idx_medical_histories_locked ON medical_histories(is_locked);

-- ==========================================================
-- TABLA: prescriptions
-- ==========================================================
CREATE TABLE prescriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    history_id UUID NOT NULL REFERENCES medical_histories(id) ON DELETE CASCADE,
    custom_indications TEXT,
    next_appointment DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_prescriptions_history ON prescriptions(history_id);

-- ==========================================================
-- TABLA: prescription_items
-- ==========================================================
CREATE TABLE prescription_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100) NOT NULL,
    frequency VARCHAR(100) NOT NULL,
    duration_days INTEGER NOT NULL CHECK (duration_days > 0)
);

CREATE INDEX idx_prescription_items_prescription ON prescription_items(prescription_id);

-- ==========================================================
-- TABLA: appointments
-- ==========================================================
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_date TIMESTAMPTZ NOT NULL,
    reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- ==========================================================
-- TABLA: medical_attachments
-- ==========================================================
CREATE TABLE medical_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    history_id UUID NOT NULL REFERENCES medical_histories(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medical_attachments_history ON medical_attachments(history_id);

-- ==========================================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================================

-- Habilitar RLS en tablas clínicas
ALTER TABLE medical_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_attachments ENABLE ROW LEVEL SECURITY;

-- Política: DOCTOR y ADMINISTRATOR pueden leer/escribir medical_histories
CREATE POLICY medical_histories_doctor_access ON medical_histories
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('DOCTOR', 'ADMINISTRATOR')
            AND users.is_active = TRUE
        )
    );

-- Política: RECEPTIONIST no tiene acceso a medical_histories (denegado por defecto)

-- Política: DOCTOR y ADMINISTRATOR pueden leer/escribir prescriptions
CREATE POLICY prescriptions_doctor_access ON prescriptions
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('DOCTOR', 'ADMINISTRATOR')
            AND users.is_active = TRUE
        )
    );

-- Política: DOCTOR y ADMINISTRATOR pueden leer/escribir prescription_items
CREATE POLICY prescription_items_doctor_access ON prescription_items
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('DOCTOR', 'ADMINISTRATOR')
            AND users.is_active = TRUE
        )
    );

-- Política: DOCTOR y ADMINISTRATOR pueden leer/escribir medical_attachments
CREATE POLICY medical_attachments_doctor_access ON medical_attachments
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('DOCTOR', 'ADMINISTRATOR')
            AND users.is_active = TRUE
        )
    );

-- ==========================================================
-- BUCKETS DE STORAGE (ejecutar en Supabase Dashboard)
-- ==========================================================
-- NOTA: Crear manualmente en Supabase Storage:
-- 1. Bucket 'prescription-pdfs' (privado)
-- 2. Bucket 'patient-photos' (privado)
-- Luego aplicar políticas RLS desde la UI de Supabase.
