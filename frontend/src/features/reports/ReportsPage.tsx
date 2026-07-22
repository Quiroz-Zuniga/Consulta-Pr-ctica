import { useState, useCallback } from 'react'
import {
  BarChart2,
  Download,
  FileText,
  FileJson,
  AlertTriangle,
  Search,
  CalendarRange,
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  Loader2,
  Shield,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

// ─────────────────────────────────────────────────────────────
// Tipos
// ─────────────────────────────────────────────────────────────
interface ClinicStats {
  appointments: {
    total: number
    completed: number
    cancelled: number
    noShows: number
    noShowRate: number
  }
  revenue: {
    totalRevenue: number
    totalPaid: number
    totalPending: number
    currency: string
  }
  topDiagnoses: Array<{ code: string; description: string; count: number }>
  totalPatients: number
  newPatients: number
}

// ─────────────────────────────────────────────────────────────
// Componente auxiliar: KPI card
// ─────────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  color: string
}) {
  return (
    <div className={`rounded-2xl border p-5 bg-white shadow-sm flex items-start gap-4 ${color}`}>
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50">
        <Icon className="h-5 w-5 text-primary-600" />
      </div>
      <div>
        <p className="text-xs font-medium text-slate-500 mb-0.5">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Modal de confirmación para paciente protegido
// ─────────────────────────────────────────────────────────────
function ProtectedPatientModal({
  onConfirm,
  onCancel,
  isLoading,
}: {
  onConfirm: (reason: string) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [reason, setReason] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <Shield className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Paciente Protegido</h3>
            <p className="text-xs text-slate-500">Se requiere motivo para continuar</p>
          </div>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Este expediente está marcado como <strong>PROTEGIDO</strong>. La exportación quedará
          registrada en el log de auditoría con tu motivo de acceso.
        </p>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Motivo de acceso <span className="text-red-500">*</span>
        </label>
        <textarea
          id="confirmation-reason"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Ej: Referencia a especialista Dr. García para cardiología..."
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none resize-none"
        />
        <div className="mt-4 flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            id="confirm-protected-export"
            disabled={reason.trim().length < 5 || isLoading}
            onClick={() => onConfirm(reason.trim())}
            className="px-4 py-2 text-sm font-semibold bg-amber-600 text-white rounded-xl hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmar y Exportar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Página Principal
// ─────────────────────────────────────────────────────────────
export function ReportsPage() {
  const { session } = useAuth()
  const token = session?.access_token

  // ── Estado del reporte de clínica ────────────────────────
  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const [dateFrom, setDateFrom] = useState(firstOfMonth.toISOString().slice(0, 10))
  const [dateTo, setDateTo] = useState(today.toISOString().slice(0, 10))
  const [clinicStats, setClinicStats] = useState<ClinicStats | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)
  const [reportError, setReportError] = useState<string | null>(null)

  // ── Estado de exportación de paciente ─────────────────────
  const [patientId, setPatientId] = useState('')
  const [patientSearchName, setPatientSearchName] = useState('')
  const [loadingExport, setLoadingExport] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [pendingExport, setPendingExport] = useState<{
    format: 'pdf' | 'csv' | 'json'
    requiresConfirmation: boolean
  } | null>(null)

  // ── Generar PDF de reporte clínica ────────────────────────
  const handleGenerateClinicReport = useCallback(async () => {
    if (!token) return
    setLoadingReport(true)
    setReportError(null)
    try {
      const res = await fetch(
        `${API_URL}/api/v1/reports/clinic-stats?from=${dateFrom}&to=${dateTo}`,
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? `Error ${res.status}`)
      }
      // Download PDF
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reporte_${dateFrom}_${dateTo}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setReportError(err instanceof Error ? err.message : 'Error al generar reporte')
    } finally {
      setLoadingReport(false)
    }
  }, [token, dateFrom, dateTo])

  // ── Exportar expediente de paciente ───────────────────────
  const doExport = useCallback(
    async (format: 'pdf' | 'csv' | 'json', confirmationReason?: string) => {
      if (!token || !patientId.trim()) return
      setLoadingExport(true)
      setExportError(null)
      setPendingExport(null)

      const endpoint = `/api/v1/patients/${patientId.trim()}/export/${format}`
      const url = confirmationReason
        ? `${API_URL}${endpoint}?confirmationReason=${encodeURIComponent(confirmationReason)}`
        : `${API_URL}${endpoint}`

      try {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })

        if (res.status === 400) {
          const data = await res.json()
          if (data.requiresConfirmation) {
            setPendingExport({ format, requiresConfirmation: true })
            setLoadingExport(false)
            return
          }
          throw new Error(data.error ?? 'Solicitud inválida')
        }

        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error ?? `Error ${res.status}`)
        }

        const blob = await res.blob()
        const blobUrl = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = blobUrl
        a.download = `expediente_${patientId}_${Date.now()}.${format}`
        a.click()
        URL.revokeObjectURL(blobUrl)
      } catch (err) {
        setExportError(err instanceof Error ? err.message : 'Error al exportar')
      } finally {
        setLoadingExport(false)
      }
    },
    [token, patientId],
  )

  const handleExport = (format: 'pdf' | 'csv' | 'json') => doExport(format)

  const handleConfirmProtected = (reason: string) => {
    if (pendingExport) doExport(pendingExport.format, reason)
  }

  return (
    <div className="flex flex-col gap-8 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-md">
          <BarChart2 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Reportes y Exportaciones</h1>
          <p className="text-sm text-slate-500">Acceso exclusivo para Administrador. Toda acción queda registrada en auditoría.</p>
        </div>
      </div>

      {/* ── SECCIÓN 1: Reporte de Clínica ─────────────────── */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <TrendingUp className="h-5 w-5 text-primary-600" />
          <h2 className="text-base font-semibold text-slate-900">Reporte de Actividad del Consultorio</h2>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600" htmlFor="date-from">
                <CalendarRange className="inline h-3.5 w-3.5 mr-1" />Desde
              </label>
              <input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-600" htmlFor="date-to">
                <CalendarRange className="inline h-3.5 w-3.5 mr-1" />Hasta
              </label>
              <input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
              />
            </div>
            <button
              id="generate-clinic-report"
              onClick={handleGenerateClinicReport}
              disabled={loadingReport}
              className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {loadingReport ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Generar Reporte PDF
            </button>
          </div>

          {reportError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {reportError}
            </div>
          )}

          {clinicStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              <KpiCard icon={Clock} label="Citas Totales" value={String(clinicStats.appointments.total)}
                sub={`${clinicStats.appointments.completed} completadas`} color="border-slate-100" />
              <KpiCard icon={Users} label="Pacientes Únicos" value={String(clinicStats.totalPatients)}
                sub={`${clinicStats.newPatients} nuevos`} color="border-slate-100" />
              <KpiCard icon={DollarSign} label="Ingresos Cobrados"
                value={`${clinicStats.revenue.currency} ${clinicStats.revenue.totalPaid.toFixed(2)}`}
                sub={`Pendiente: ${clinicStats.revenue.currency} ${clinicStats.revenue.totalPending.toFixed(2)}`}
                color="border-slate-100" />
              <KpiCard icon={AlertTriangle} label="Tasa Inasistencia"
                value={`${clinicStats.appointments.noShowRate}%`}
                sub={`${clinicStats.appointments.noShows} no presentados`}
                color="border-slate-100" />
            </div>
          )}

          {clinicStats && clinicStats.topDiagnoses.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-700 mb-2">Top Diagnósticos CIE-10</h3>
              <div className="space-y-1.5">
                {clinicStats.topDiagnoses.slice(0, 5).map((d) => (
                  <div key={d.code} className="flex items-center gap-3 text-sm">
                    <span className="w-16 text-xs font-mono font-semibold text-primary-700 shrink-0">{d.code}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-primary-500"
                        style={{ width: `${Math.min(100, (d.count / clinicStats.appointments.total) * 100 * 3)}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500 shrink-0">{d.count} casos</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── SECCIÓN 2: Exportar Expediente de Paciente ─────── */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
          <FileText className="h-5 w-5 text-primary-600" />
          <h2 className="text-base font-semibold text-slate-900">Exportar Expediente de Paciente</h2>
        </div>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex flex-col gap-1 min-w-64">
              <label className="text-xs font-medium text-slate-600" htmlFor="patient-id-input">
                <Search className="inline h-3.5 w-3.5 mr-1" />ID del Paciente
              </label>
              <input
                id="patient-id-input"
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="Ingrese el ID del paciente"
                className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-mono focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                id="export-pdf-button"
                onClick={() => handleExport('pdf')}
                disabled={loadingExport || !patientId.trim()}
                className="flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loadingExport ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                PDF
              </button>
              <button
                id="export-csv-button"
                onClick={() => handleExport('csv')}
                disabled={loadingExport || !patientId.trim()}
                className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loadingExport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                CSV
              </button>
              <button
                id="export-json-button"
                onClick={() => handleExport('json')}
                disabled={loadingExport || !patientId.trim()}
                className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loadingExport ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileJson className="h-4 w-4" />}
                JSON
              </button>
            </div>
          </div>

          {exportError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {exportError}
            </div>
          )}

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2">
            <Shield className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800">
              <strong>Auditoría:</strong> Toda exportación queda registrada con tu usuario y timestamp en el log de auditoría.
              Para pacientes marcados como <strong>protegidos</strong>, se solicitará un motivo de acceso antes de generar el archivo.
            </p>
          </div>
        </div>
      </section>

      {/* Modal de confirmación para paciente protegido */}
      {pendingExport?.requiresConfirmation && (
        <ProtectedPatientModal
          onConfirm={handleConfirmProtected}
          onCancel={() => setPendingExport(null)}
          isLoading={loadingExport}
        />
      )}
    </div>
  )
}
