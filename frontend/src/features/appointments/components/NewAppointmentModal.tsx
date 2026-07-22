import { useState, type FormEvent } from 'react'
import {
  Calendar as CalendarIcon,
  Search,
  CheckCircle2,
  Clock,
  User,
  Stethoscope,
  FileText,
  AlertCircle,
  Plus,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabaseClient'
import { DEFAULT_SPECIALTIES } from '../types'
import { Dialog } from '../../../components/ui/Dialog'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { Button } from '../../../components/ui/Button'

interface NewAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  doctorsList?: Array<{ id: string; name: string }>
  initialDate?: string
}

export function NewAppointmentModal({
  isOpen,
  onClose,
  onSuccess,
  doctorsList,
  initialDate,
}: NewAppointmentModalProps) {
  const [patientSearch, setPatientSearch] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [selectedPatientName, setSelectedPatientName] = useState('')
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedDoctorName, setSelectedDoctorName] = useState('')
  const [specialty, setSpecialty] = useState(DEFAULT_SPECIALTIES[0])
  const [consultationType, setConsultationType] = useState<'in_person' | 'video'>('in_person')
  const [appointmentDate, setAppointmentDate] = useState(initialDate || '')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch doctors list directly in case the parent prop is empty due to RLS
  const { data: fetchedDoctors = [] } = useQuery({
    queryKey: ['doctors-list-modal'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name')
        .in('role', ['DOCTOR', 'ADMINISTRATOR'])
        .eq('is_active', true)
      if (error) {
        console.warn('Error fetching doctors from users table:', error)
        return []
      }
      return (data || []).map((d: any) => ({ id: d.id, name: d.full_name || 'Médico' }))
    },
  })
  const doctors = doctorsList && doctorsList.length > 0 ? doctorsList : fetchedDoctors

  // Live patient search query
  const { data: patients } = useQuery({
    queryKey: ['patient-search-modal', patientSearch],
    enabled: patientSearch.trim().length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name')
        .ilike('full_name', `%${patientSearch.trim()}%`)
        .limit(8)
      if (error) throw error
      return data
    },
  })

  const resetForm = () => {
    setPatientSearch('')
    setSelectedPatientId('')
    setSelectedPatientName('')
    setSelectedDoctorId('')
    setSelectedDoctorName('')
    setSpecialty(DEFAULT_SPECIALTIES[0])
    setAppointmentDate('')
    setReason('')
    setError(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedPatientId || !appointmentDate) {
      setError('Por favor selecciona un paciente y la fecha/hora de la cita.')
      return
    }

    setLoading(true)
    try {
      const payload: any = {
        patient_id: selectedPatientId,
        appointment_date: appointmentDate,
        reason: reason.trim() || undefined,
        status: 'scheduled',
        consultation_type: consultationType,
      }

      if (selectedDoctorId) {
        payload.doctor_id = selectedDoctorId
      }
      if (selectedDoctorName) {
        payload.doctor_name = selectedDoctorName
      }
      if (specialty) {
        payload.specialty = specialty
      }

      const { error: err } = await supabase.from('appointments').insert(payload)
      if (err) throw err

      resetForm()
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al registrar la cita')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        resetForm()
        onClose()
      }}
      title="Agendar Nueva Cita Médica"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Patient Autocomplete Search */}
        <div className="relative space-y-1.5">
          <Input
            label="Buscar Paciente *"
            placeholder="Escribe el nombre del paciente..."
            value={patientSearch}
            onChange={(e) => {
              setPatientSearch(e.target.value)
              if (selectedPatientId) {
                setSelectedPatientId('')
                setSelectedPatientName('')
              }
            }}
            leftIcon={<Search className="h-4 w-4 text-slate-400" />}
            required
          />

          {patients && patients.length > 0 && !selectedPatientId && (
            <div className="absolute z-30 mt-1 max-h-48 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-2xl animate-scale-in">
              {patients.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-primary-50 transition-colors flex items-center justify-between border-b border-slate-100 last:border-0"
                  onClick={() => {
                    setSelectedPatientId(p.id)
                    setSelectedPatientName(p.full_name)
                    setPatientSearch(p.full_name)
                  }}
                >
                  <span className="font-semibold text-slate-900">{p.full_name}</span>
                  <span className="text-[10px] text-primary-600 font-mono">Seleccionar</span>
                </button>
              ))}
            </div>
          )}

          {selectedPatientId && (
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Paciente seleccionado: <strong>{selectedPatientName}</strong></span>
            </div>
          )}
        </div>

        {/* Doctor & Specialty Grid */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Select
              label="Médico Asignado"
              value={selectedDoctorId}
              onChange={(e) => {
                const docId = e.target.value
                setSelectedDoctorId(docId)
                const doc = doctors.find((d) => d.id === docId)
                setSelectedDoctorName(doc ? doc.name : '')
              }}
              leftIcon={<User className="h-4 w-4 text-slate-400" />}
            >
              <option value="">Seleccionar Médico...</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Select
              label="Especialidad"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              leftIcon={<Stethoscope className="h-4 w-4 text-slate-400" />}
            >
              {DEFAULT_SPECIALTIES.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Modalidad de Consulta (Presencial / Video) */}
        <div>
          <Select
            label="Modalidad de Consulta *"
            value={consultationType}
            onChange={(e) => setConsultationType(e.target.value as 'in_person' | 'video')}
          >
            <option value="in_person">🏢 Presencial en Clínica</option>
            <option value="video">📹 Videoconsulta Online (Jitsi Meet)</option>
          </Select>
        </div>

        {/* Date and Time */}
        <Input
          label="Fecha y Hora de la Cita *"
          type="datetime-local"
          value={appointmentDate}
          onChange={(e) => setAppointmentDate(e.target.value)}
          leftIcon={<Clock className="h-4 w-4 text-slate-400" />}
          required
        />

        {/* Reason */}
        <Input
          label="Motivo de Consulta"
          placeholder="Ej. Control semestral, síntomas de gripe..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          leftIcon={<FileText className="h-4 w-4 text-slate-400" />}
        />

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              resetForm()
              onClose()
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={loading}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Confirmar y Agendar
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
