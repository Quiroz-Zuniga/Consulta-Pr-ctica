import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Calendar as CalendarIcon,
  Plus,
  Radio,
  Clock,
  Sparkles,
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'

import type { Appointment, AppointmentFilters, AppointmentStatus } from './types'
import { MonthlyCalendar } from './components/MonthlyCalendar'
import { DailyQueueList } from './components/DailyQueueList'
import { QueueFilters } from './components/QueueFilters'
import { NewAppointmentModal } from './components/NewAppointmentModal'
import { AppointmentDetailModal } from './components/AppointmentDetailModal'

export function AppointmentPage() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const { success, error: toastError } = useToast()

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  )

  const [isNewModalOpen, setIsNewModalOpen] = useState(false)
  const [detailAppointment, setDetailAppointment] = useState<Appointment | null>(null)

  const [filters, setFilters] = useState<AppointmentFilters>({
    patientSearch: '',
    doctorFilter: 'all',
    specialtyFilter: 'all',
    statusFilter: 'all',
  })

  // Fetch doctors list from 'users' table (tabla oficial según SSD sección 4.7)
  const { data: doctorsList = [] } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, role')
        .in('role', ['DOCTOR', 'ADMINISTRATOR'])
        .eq('is_active', true)
      if (error) {
        console.warn('Error fetching doctors from users table:', error)
        return []
      }
      return (data || []).map((d) => ({
        id: d.id,
        name: d.full_name || 'Médico',
      }))
    },
  })

  // Query appointments for current month view
  const { data: rawAppointments = [], isLoading } = useQuery({
    queryKey: ['appointments', currentMonth.getFullYear(), currentMonth.getMonth()],
    queryFn: async () => {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 2, 0)

      const { data, error } = await supabase
        .from('appointments')
        .select('*, patients!inner(full_name)')
        .gte('appointment_date', startOfMonth.toISOString())
        .lte('appointment_date', endOfMonth.toISOString())
        .order('appointment_date', { ascending: true })

      if (error) throw error

      return (data || []).map((a: any) => ({
        id: a.id,
        patient_id: a.patient_id,
        patient_name: a.patients?.full_name || 'Paciente',
        doctor_id: a.doctor_id,
        doctor_name: a.doctor_name,
        specialty: a.specialty,
        appointment_date: a.appointment_date,
        reason: a.reason,
        status: a.status as AppointmentStatus,
        created_at: a.created_at,
      })) as Appointment[]
    },
  })

  // Realtime subscription setup
  useEffect(() => {
    const channel = supabase
      .channel('appointments-agenda-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['appointments'] })
        },
      )
      .subscribe((status, err) => {
        if (err) {
          console.warn('[Realtime] Subscription warning on appointments:', status, err)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  // Update Status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) => {
      const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      const label =
        variables.status === 'in_progress'
          ? 'En Atención'
          : variables.status === 'completed'
          ? 'Atendida'
          : variables.status === 'cancelled'
          ? 'Cancelada'
          : 'Pendiente'
      success('Estado de Cita Actualizado', `La cita fue marcada como "${label}".`)
    },
    onError: (err: Error) => {
      toastError('Error al cambiar el estado', err.message)
    },
  })

  // Reschedule mutation
  const rescheduleMutation = useMutation({
    mutationFn: async ({ id, newDate }: { id: string; newDate: string }) => {
      const { error } = await supabase
        .from('appointments')
        .update({ appointment_date: newDate })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      success('Cita Reprogramada', 'La fecha y hora fueron actualizadas en la agenda.')
    },
    onError: (err: Error) => {
      toastError('Error al reprogramar cita', err.message)
    },
  })

  const handleUpdateStatus = (id: string, status: AppointmentStatus) => {
    updateStatusMutation.mutate({ id, status })
  }

  const handleReschedule = async (id: string, newDate: string) => {
    await rescheduleMutation.mutateAsync({ id, newDate })
  }

  // Filter appointments for the selected date and criteria
  const selectedDateStr = selectedDate.toISOString().split('T')[0]

  const dailyAppointments = useMemo(() => {
    return rawAppointments.filter((apt) => {
      if (!apt.appointment_date) return false
      const aptDateStr = apt.appointment_date.split('T')[0]
      if (aptDateStr !== selectedDateStr) return false

      // Patient Search Filter
      if (
        filters.patientSearch.trim() &&
        !apt.patient_name?.toLowerCase().includes(filters.patientSearch.trim().toLowerCase())
      ) {
        return false
      }

      // Doctor Filter
      if (filters.doctorFilter !== 'all' && apt.doctor_name !== filters.doctorFilter) {
        return false
      }

      // Specialty Filter
      if (filters.specialtyFilter !== 'all' && apt.specialty !== filters.specialtyFilter) {
        return false
      }

      // Status Filter
      if (filters.statusFilter !== 'all' && apt.status !== filters.statusFilter) {
        return false
      }

      return true
    })
  }, [rawAppointments, selectedDateStr, filters])

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-md">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  Agenda de Consultas
                </h2>
                <Badge variant="success" dot size="md" className="animate-pulse">
                  En Vivo
                </Badge>
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                Centro de planificación diaria y gestión visual de colas de atención.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setIsNewModalOpen(true)}
          className="shadow-md shadow-primary-600/20 whitespace-nowrap self-start sm:self-auto"
        >
          Agendar Nueva Cita
        </Button>
      </div>

      {/* Filter Toolbar */}
      <QueueFilters
        filters={filters}
        onFilterChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
        onReset={() =>
          setFilters({
            patientSearch: '',
            doctorFilter: 'all',
            specialtyFilter: 'all',
            statusFilter: 'all',
          })
        }
        doctorsList={doctorsList}
      />

      {/* Main 2-Column Responsive Layout */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Interactive Monthly Calendar */}
        <div className="lg:col-span-5 space-y-4">
          <MonthlyCalendar
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            appointments={rawAppointments}
          />
        </div>

        {/* Right Column: Daily Queue List */}
        <div className="lg:col-span-7">
          <DailyQueueList
            selectedDate={selectedDate}
            appointments={dailyAppointments}
            onUpdateStatus={handleUpdateStatus}
            onOpenDetail={(apt) => setDetailAppointment(apt)}
            onReschedule={(apt) => setDetailAppointment(apt)}
            userRole={profile?.role}
          />
        </div>
      </div>

      {/* Modals */}
      <NewAppointmentModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['appointments'] })}
        doctorsList={doctorsList}
        initialDate={`${selectedDateStr}T09:00`}
      />

      <AppointmentDetailModal
        isOpen={Boolean(detailAppointment)}
        onClose={() => setDetailAppointment(null)}
        appointment={detailAppointment}
        onUpdateStatus={handleUpdateStatus}
        onReschedule={handleReschedule}
      />
    </div>
  )
}
