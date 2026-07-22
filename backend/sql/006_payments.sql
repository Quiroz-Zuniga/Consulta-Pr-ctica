-- =============================================================================
-- FASE 4 — MIGRACIÓN 006: REGISTRO DE PAGOS MANUALES
-- =============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(10) DEFAULT 'HNL',
  payment_method VARCHAR(50) NOT NULL, -- 'cash', 'bank_transfer', 'card_manual', 'other'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'partial', 'refunded'
  notes TEXT,
  registered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_appointment_id ON payments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- RLS: Habilitado con denegación por defecto (acceso exclusivo del backend con service_role)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
