-- ==========================================================
-- Consulta Práctica Web - Migración SQL
-- Módulo: Gestión de Documentos Clínicos de Pacientes
-- ==========================================================

-- Extensión para UUID v4 si no existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================
-- TABLA: medical_documents
-- ==========================================================
CREATE TABLE IF NOT EXISTS medical_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    history_id UUID REFERENCES medical_histories(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (
        category IN ('laboratory', 'prescription', 'imaging', 'reference', 'incapacity', 'consent', 'other')
    ),
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_by_name VARCHAR(255),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    notes TEXT
);

-- Índices de búsqueda y rendimiento
CREATE INDEX IF NOT EXISTS idx_medical_docs_patient ON medical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_docs_category ON medical_documents(category);
CREATE INDEX IF NOT EXISTS idx_medical_docs_uploaded_at ON medical_documents(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_medical_docs_status ON medical_documents(status);
CREATE INDEX IF NOT EXISTS idx_medical_docs_title ON medical_documents USING GIN(to_tsvector('spanish', title));

-- ==========================================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================================
ALTER TABLE medical_documents ENABLE ROW LEVEL SECURITY;

-- Eliminar política previa si existe
DROP POLICY IF EXISTS medical_documents_doctor_access ON medical_documents;

-- Política: Solo Médicos y Administradores activos tienen acceso total a documentos clínicos
CREATE POLICY medical_documents_doctor_access ON medical_documents
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
