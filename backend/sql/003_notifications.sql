-- =============================================================================
-- Migration: 003_notifications.sql
-- Descripción: Tabla de registro de notificaciones y campo reminder_sent en appointments
-- =============================================================================

-- 1. Agregar columna reminder_sent a la tabla appointments (si aún no existe)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='appointments' AND column_name='reminder_sent'
    ) THEN
        ALTER TABLE appointments ADD COLUMN reminder_sent BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. Crear tabla notifications_log
CREATE TABLE IF NOT EXISTS notifications_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    sent_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Índices para acelerar búsquedas de recordatorios pendientes y auditoría
CREATE INDEX IF NOT EXISTS idx_appointments_reminder_sent ON appointments(reminder_sent, appointment_date, status);
CREATE INDEX IF NOT EXISTS idx_notifications_log_appointment ON notifications_log(appointment_id);

-- 4. Habilitar RLS en notifications_log
ALTER TABLE notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los usuarios autenticados pueden ver notificaciones" 
    ON notifications_log FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Los usuarios autenticados pueden registrar notificaciones" 
    ON notifications_log FOR INSERT 
    TO authenticated 
    WITH CHECK (true);
