import { useState, useEffect } from 'react'
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Stethoscope,
  FileText,
  RotateCcw,
  CheckCircle2,
  Play,
  XCircle,
  Send,
  Video,
  ExternalLink,
  DollarSign,
  CreditCard,
  Plus,
} from 'lucide-react'
import type { Appointment, AppointmentStatus } from '../types'
import { STATUS_CONFIG } from '../types'
import { Dialog } from '../../../components/ui/Dialog'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { useToast } from '../../../components/ui/Toast'
import { supabase } from '../../../lib/supabaseClient'

interface AppointmentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
  onUpdateStatus: (id: string, newStatus: AppointmentStatus) => void
  onReschedule: (id: string, newDate: string) => Promise<void>
}

export function AppointmentDetailModal({
  isOpen,
  onClose,
  appointment,
  onUpdateStatus,
  onReschedule,
}: AppointmentDetailModalProps) {
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [newDate, setNewDate] = useState('')
  const [loadingReschedule, setLoadingReschedule] = useState(false)
  const [sendingReminder, setSendingReminder] = useState(false)
  const [loadingVideo, setLoadingVideo] = useState(false)
<<<<<<< HEAD
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
=======
  const [videoUrl, setVideoUrl] = useState<string | null>(appointment?.video_room_url || null)

  // Payment State
>>>>>>> 2af189efb6574de0cf90e9b2f8a94821e9306a1a
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [payAmount, setPayAmount] = useState('500')
  const [payMethod, setPayMethod] = useState<'cash' | 'bank_transfer' | 'card_manual' | 'other'>('cash')
  const [payStatus, setPayStatus] = useState<'paid' | 'pending' | 'partial' | 'refunded'>('paid')
  const [payNotes, setPayNotes] = useState('')
  const [loadingPayment, setLoadingPayment] = useState(false)

  const { success, error: toastError } = useToast()

  useEffect(() => {
    if (appointment?.video_room_url) {
      setVideoUrl(appointment.video_room_url)
    }
  }, [appointment?.video_room_url])

  if (!appointment) return null

  const statusConfig = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.scheduled
  const aptDate = new Date(appointment.appointment_date)
  const formattedDate = aptDate.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const formattedTime = aptDate.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  })

  const handleSaveReschedule = async () => {
    if (!newDate) return
    setLoadingReschedule(true)
    try {
      await onReschedule(appointment.id, newDate)
      setIsRescheduling(false)
      onClose()
    } finally {
      setLoadingReschedule(false)
    }
  }

  const handleSendReminder = async () => {
    setSendingReminder(true)
    try {
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token

      const response = await fetch(`/api/v1/appointments/${appointment.id}/send-reminder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ channel: 'whatsapp' }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al enviar el recordatorio de la cita.')
      }

      success(
        'Recordatorio enviado',
        `Se ha enviado la notificación por WhatsApp a ${appointment.patient_name || 'el paciente'}.`,
      )
    } catch (err: any) {
      toastError('Fallo al enviar recordatorio', err.message || 'Ocurrió un error inesperado.')
    } finally {
      setSendingReminder(false)
    }
  }

<<<<<<< HEAD
  const handleStartVideoConsultation = () => {
    window.open(`/video-simulation/${appointment.id}`, 'VideoConsulta', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no')
=======
  const handleStartVideoConsultation = async () => {
    setLoadingVideo(true)
    try {
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token

      const response = await fetch(`/api/v1/appointments/${appointment.id}/video-consultation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      const data = await response.json()
      if (!response.ok || !data.roomUrl) {
        throw new Error(data.error || 'Error al iniciar la videoconsulta.')
      }

      setVideoUrl(data.roomUrl)
      window.open(data.roomUrl, '_blank', 'noopener,noreferrer')
      success('Sala de Videoconsulta Iniciada', 'La videollamada de Jitsi Meet ha sido abierta en una pestaña segura.')
    } catch (err: any) {
      toastError('Fallo al iniciar videoconsulta', err.message || 'Ocurrió un error inesperado.')
    } finally {
      setLoadingVideo(false)
    }
>>>>>>> 2af189efb6574de0cf90e9b2f8a94821e9306a1a
  }

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingPayment(true)
    try {
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token

      const response = await fetch(`/api/v1/appointments/${appointment.id}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          patientId: appointment.patient_id,
          amount: parseFloat(payAmount),
          currency: 'HNL',
          paymentMethod: payMethod,
          status: payStatus,
          notes: payNotes.trim() || undefined,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Error al registrar el pago.')
      }

      success('Pago Registrado', `Se ha registrado el pago de HNL ${payAmount} exitosamente.`)
      setIsPaymentModalOpen(false)
      setPayNotes('')
    } catch (err: any) {
      toastError('Fallo al registrar pago', err.message || 'Ocurrió un error inesperado.')
    } finally {
      setLoadingPayment(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        setIsRescheduling(false)
        onClose()
      }}
      title="Detalle de Consulta Programada"
      size="lg"
    >
      <div className="space-y-6">
        {/* Status Header Badge */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 font-bold">
              {appointment.patient_name?.charAt(0) || 'P'}
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900">
                {appointment.patient_name || 'Paciente'}
              </h4>
              <p className="text-xs text-slate-500 font-mono">ID Cita: {appointment.id.slice(0, 8)}</p>
            </div>
          </div>
          <Badge variant={statusConfig.variant} dot size="md">
            {statusConfig.label}
          </Badge>
        </div>

        {/* Detailed Fields Grid */}
        <div className="grid gap-4 sm:grid-cols-2 text-xs">
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <CalendarIcon className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-500 block">Fecha y Hora</span>
              <span className="font-bold text-slate-800 capitalize">{formattedDate}</span>
              <span className="block font-semibold text-primary-700 mt-0.5">{formattedTime} hs</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <User className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-500 block">Médico Asignado</span>
              <span className="font-bold text-slate-800">
                {appointment.doctor_name ? `Dr. ${appointment.doctor_name}` : 'Sin asignar'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Stethoscope className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-500 block">Especialidad</span>
              <span className="font-bold text-slate-800">
                {appointment.specialty || 'Medicina General'}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <FileText className="h-4 w-4 text-primary-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-500 block">Motivo de Consulta</span>
              <span className="font-medium text-slate-800">
                {appointment.reason || 'No especificado'}
              </span>
            </div>
          </div>
        </div>

        {/* Reschedule Subsection */}
        {isRescheduling ? (
          <div className="space-y-3 p-4 rounded-2xl border border-primary-200 bg-primary-50/50 animate-fade-in">
            <h5 className="text-xs font-bold text-primary-900 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary-600" />
              <span>Seleccionar Nueva Fecha y Hora</span>
            </h5>
            <Input
              type="datetime-local"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              required
            />
            <div className="flex items-center gap-2 justify-end pt-1">
              <Button variant="ghost" size="xs" onClick={() => setIsRescheduling(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="xs"
                loading={loadingReschedule}
                onClick={handleSaveReschedule}
              >
                Guardar Nueva Fecha
              </Button>
            </div>
          </div>
        ) : (
          /* Workflow Action Controls */
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Acciones y Notificaciones
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {(appointment.consultation_type === 'video' || appointment.status === 'scheduled' || appointment.status === 'in_progress') && (
                <Button
                  variant="primary"
                  size="xs"
                  loading={loadingVideo}
                  leftIcon={<Video className="h-3.5 w-3.5" />}
                  onClick={handleStartVideoConsultation}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  'Iniciar Videoconsulta'
                </Button>
              )}

              {appointment.status === 'scheduled' && (
                <>
                  <Button
                    variant="primary"
                    size="xs"
                    leftIcon={<Play className="h-3.5 w-3.5" />}
                    onClick={() => {
                      onUpdateStatus(appointment.id, 'in_progress')
                      onClose()
                    }}
                    className="bg-amber-600 hover:bg-amber-700"
                  >
                    Iniciar Atención
                  </Button>

                  <Button
                    variant="outline"
                    size="xs"
                    loading={sendingReminder}
                    leftIcon={<Send className="h-3.5 w-3.5 text-emerald-600" />}
                    onClick={handleSendReminder}
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  >
                    Reenviar recordatorio
                  </Button>
                </>
              )}

              {appointment.status === 'in_progress' && (
                <Button
                  variant="primary"
                  size="xs"
                  leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}
                  onClick={() => {
                    onUpdateStatus(appointment.id, 'completed')
                    onClose()
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Marcar Atendida
                </Button>
              )}

              {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                <Button
                  variant="outline"
                  size="xs"
                  leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
                  onClick={() => {
                    const isoLocal = new Date(appointment.appointment_date).toISOString().slice(0, 16)
                    setNewDate(isoLocal)
                    setIsRescheduling(true)
                  }}
                >
                  Reprogramar Cita
                </Button>
              )}

              {/* Registrar Pago Button */}
              <Button
                variant="outline"
                size="xs"
                leftIcon={<DollarSign className="h-3.5 w-3.5 text-emerald-600" />}
                onClick={() => setIsPaymentModalOpen(true)}
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 font-semibold"
              >
                Registrar Pago
              </Button>

              {appointment.status !== 'cancelled' && (
                <Button
                  variant="ghost"
                  size="xs"
                  leftIcon={<XCircle className="h-3.5 w-3.5 text-rose-500" />}
                  onClick={() => {
                    onUpdateStatus(appointment.id, 'cancelled')
                    onClose()
                  }}
                  className="text-rose-600 hover:bg-rose-50"
                >
                  Cancelar Cita
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal Secundario: Registrar Pago Manual */}
      {isPaymentModalOpen && (
        <Dialog
          open={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title="Registrar Pago de Consulta"
          size="md"
        >
          <form onSubmit={handleRegisterPayment} className="space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
              <div className="font-bold text-slate-900">{appointment.patient_name || 'Paciente'}</div>
              <div className="text-slate-500 font-mono">Cita ID: {appointment.id.slice(0, 8)}</div>
            </div>

            <Input
              label="Monto del Pago (HNL - Lempiras) *"
              type="number"
              step="0.01"
              min="0.01"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              leftIcon={<DollarSign className="h-4 w-4 text-slate-400" />}
              required
            />

            <Select
              label="Método de Pago *"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as any)}
            >
              <option value="cash">💵 Efectivo</option>
              <option value="bank_transfer">🏦 Transferencia Bancaria / Depósito</option>
              <option value="card_manual">💳 Tarjeta (POS Manual)</option>
              <option value="other">📝 Otro / Cheque</option>
            </Select>

            <Select
              label="Estado del Pago *"
              value={payStatus}
              onChange={(e) => setPayStatus(e.target.value as any)}
            >
              <option value="paid">✅ Pagado Totalmente</option>
              <option value="pending">⏳ Pendiente de Pago</option>
              <option value="partial">🟧 Pago Parcial (Abono)</option>
              <option value="refunded">↩️ Reembolsado</option>
            </Select>

            <Input
              label="Notas o Número de Referencia (Opcional)"
              placeholder="Ej. Recibo #1042, Transf. Bac Credomatic #8891"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsPaymentModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={loadingPayment}
                leftIcon={<Plus className="h-4 w-4" />}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
              >
                Confirmar Registro de Pago
              </Button>
            </div>
          </form>
        </Dialog>
      )}
    </Dialog>
  )
}
