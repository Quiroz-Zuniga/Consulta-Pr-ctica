import {
  Clock,
  UserCheck,
  CheckCircle2,
  XCircle,
  Play,
  Calendar,
  Stethoscope,
  Eye,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import type { Appointment, AppointmentStatus } from '../types'
import { STATUS_CONFIG } from '../types'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { EmptyState } from '../../../components/ui/EmptyState'

interface DailyQueueListProps {
  selectedDate: Date
  appointments: Appointment[]
  onUpdateStatus: (id: string, newStatus: AppointmentStatus) => void
  onOpenDetail: (appointment: Appointment) => void
  onReschedule: (appointment: Appointment) => void
  userRole?: string
}

export function DailyQueueList({
  selectedDate,
  appointments,
  onUpdateStatus,
  onOpenDetail,
  onReschedule,
}: DailyQueueListProps) {
  const formattedDate = selectedDate.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)

  // Sort queue chronologically by time
  const sortedQueue = [...appointments].sort((a, b) => {
    return new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime()
  })

  const inProgressApt = sortedQueue.find((a) => a.status === 'in_progress')
  const pendingCount = sortedQueue.filter((a) => a.status === 'scheduled').length
  const completedCount = sortedQueue.filter((a) => a.status === 'completed').length

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Cola de Atención del Día
            </h3>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-100 text-primary-800">
              {sortedQueue.length} {sortedQueue.length === 1 ? 'cita' : 'citas'}
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            {capitalizedDate}
          </p>
        </div>

        {/* Status Counters Pill */}
        <div className="flex items-center gap-2 text-xs font-semibold">
          {inProgressApt && (
            <span className="flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl animate-pulse">
              <Sparkles className="h-3.5 w-3.5" /> En Atención
            </span>
          )}
          <span className="text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-xl">
            {pendingCount} Pendientes
          </span>
          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
            {completedCount} Atendidas
          </span>
        </div>
      </div>

      {/* Queue List */}
      {sortedQueue.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          <EmptyState
            icon={<Calendar className="h-10 w-10 text-slate-400" />}
            title="Sin consultas programadas"
            description="No hay citas en la cola de atención para esta fecha."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {sortedQueue.map((apt, index) => {
            const statusConfig = STATUS_CONFIG[apt.status] || STATUS_CONFIG.scheduled
            const isCurrent = apt.status === 'in_progress'
            const timeStr = new Date(apt.appointment_date).toLocaleTimeString('es-MX', {
              hour: '2-digit',
              minute: '2-digit',
            })

            return (
              <div
                key={apt.id}
                className={`relative overflow-hidden rounded-2xl border p-4 transition-all duration-200 ${
                  isCurrent
                    ? 'border-amber-300 bg-amber-50/60 ring-2 ring-amber-400 shadow-md'
                    : apt.status === 'completed'
                    ? 'border-slate-200 bg-slate-50/70 opacity-80'
                    : apt.status === 'cancelled'
                    ? 'border-rose-100 bg-rose-50/40 opacity-70'
                    : 'border-slate-200 bg-white hover:border-primary-300 hover:shadow-sm'
                }`}
              >
                {/* Position Queue Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl font-mono text-xs font-bold ${
                        isCurrent
                          ? 'bg-amber-500 text-white shadow-sm'
                          : apt.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : apt.status === 'cancelled'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-primary-100 text-primary-800'
                      }`}
                    >
                      <span className="text-[9px] uppercase tracking-tighter opacity-80 leading-none">Turno</span>
                      <span className="text-sm font-extrabold leading-none mt-0.5">#{index + 1}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          {apt.patient_name || 'Paciente sin nombre'}
                        </h4>
                        <Badge variant={statusConfig.variant} dot size="sm">
                          {statusConfig.label}
                        </Badge>
                        {isCurrent && (
                          <span className="text-[10px] font-extrabold text-amber-900 bg-amber-200 border border-amber-300 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                            Paciente Actual
                          </span>
                        )}
                      </div>

                      {/* Doctor & Specialty */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-800">{timeStr} hs</span>
                        </div>
                        {apt.doctor_name && (
                          <div className="flex items-center gap-1">
                            <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                            <span>Dr. {apt.doctor_name}</span>
                          </div>
                        )}
                        {apt.specialty && (
                          <div className="flex items-center gap-1">
                            <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                            <span className="text-slate-500">{apt.specialty}</span>
                          </div>
                        )}
                      </div>

                      {/* Reason */}
                      {apt.reason && (
                        <p className="text-xs text-slate-600 mt-1 italic">
                          Motivo: &quot;{apt.reason}&quot;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 w-full sm:w-auto justify-end">
                    {/* State workflow transitions */}
                    {apt.status === 'scheduled' && (
                      <Button
                        variant="primary"
                        size="xs"
                        leftIcon={<Play className="h-3.5 w-3.5" />}
                        onClick={() => onUpdateStatus(apt.id, 'in_progress')}
                        className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                      >
                        Atender
                      </Button>
                    )}

                    {apt.status === 'in_progress' && (
                      <Button
                        variant="primary"
                        size="xs"
                        leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                        onClick={() => onUpdateStatus(apt.id, 'completed')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                      >
                        Completar
                      </Button>
                    )}

                    {apt.status !== 'completed' && apt.status !== 'cancelled' && (
                      <Button
                        variant="outline"
                        size="xs"
                        leftIcon={<RotateCcw className="h-3.5 w-3.5 text-slate-500" />}
                        onClick={() => onReschedule(apt)}
                      >
                        Reprogramar
                      </Button>
                    )}

                    {apt.status !== 'cancelled' && (
                      <Button
                        variant="ghost"
                        size="xs"
                        leftIcon={<XCircle className="h-3.5 w-3.5 text-rose-500" />}
                        onClick={() => onUpdateStatus(apt.id, 'cancelled')}
                        className="text-rose-600 hover:bg-rose-50"
                      >
                        Cancelar
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="xs"
                      leftIcon={<Eye className="h-3.5 w-3.5 text-slate-500" />}
                      onClick={() => onOpenDetail(apt)}
                    >
                      Detalle
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
