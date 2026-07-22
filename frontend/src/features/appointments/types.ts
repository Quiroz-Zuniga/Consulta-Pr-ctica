import type { BadgeVariant } from '../../components/ui/Badge'

export type AppointmentStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type ConsultationType = 'in_person' | 'video'

export interface Appointment {
  id: string
  patient_id: string
  patient_name?: string
  doctor_id?: string
  doctor_name?: string
  specialty?: string
  appointment_date: string
  reason?: string
  status: AppointmentStatus
  video_room_name?: string
  video_room_url?: string
  video_session_status?: string
  consultation_type?: ConsultationType
  created_at?: string
}

export interface AppointmentFilters {
  patientSearch: string
  doctorFilter: string
  specialtyFilter: string
  statusFilter: string
  dateRangeStart?: string
  dateRangeEnd?: string
}

export interface StatusBadgeConfig {
  label: string
  variant: BadgeVariant
  bgClass: string
  borderClass: string
  textClass: string
}

export const STATUS_CONFIG: Record<AppointmentStatus, StatusBadgeConfig> = {
  scheduled: {
    label: 'Pendiente',
    variant: 'info',
    bgClass: 'bg-sky-50',
    borderClass: 'border-sky-200',
    textClass: 'text-sky-700',
  },
  in_progress: {
    label: 'En Atención',
    variant: 'warning',
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-300',
    textClass: 'text-amber-800',
  },
  completed: {
    label: 'Atendida',
    variant: 'success',
    bgClass: 'bg-emerald-50',
    borderClass: 'border-emerald-200',
    textClass: 'text-emerald-700',
  },
  cancelled: {
    label: 'Cancelada',
    variant: 'error',
    bgClass: 'bg-rose-50',
    borderClass: 'border-rose-200',
    textClass: 'text-rose-700',
  },
}

export const DEFAULT_SPECIALTIES = [
  'Medicina General',
  'Pediatría',
  'Ginecología y Obstetricia',
  'Cardiología',
  'Dermatología',
  'Medicina Interna',
  'Traumatología y Ortopedia',
  'Oftalmología',
  'Otorrinolaringología',
  'Neurología',
  'Psiquiatría',
]
