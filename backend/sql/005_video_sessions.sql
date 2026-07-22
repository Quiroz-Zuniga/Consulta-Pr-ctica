-- =============================================================================
-- Migration: 005_video_sessions.sql
-- Descripción: Campos de videoconsulta integrada (Jitsi Meet) en la tabla appointments
-- =============================================================================

ALTER TABLE appointments
ADD COLUMN IF NOT EXISTS video_room_name VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS video_room_url TEXT NULL,
ADD COLUMN IF NOT EXISTS video_session_status VARCHAR(50) DEFAULT 'not_created',
ADD COLUMN IF NOT EXISTS consultation_type VARCHAR(50) DEFAULT 'in_person';

-- Índice para búsquedas rápidas por room_name
CREATE INDEX IF NOT EXISTS idx_appointments_video_room_name ON appointments(video_room_name);
