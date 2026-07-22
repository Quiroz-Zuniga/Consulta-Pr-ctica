import { useQuery } from '@tanstack/react-query'
import { DollarSign, Clock, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'

interface PatientPaymentsSectionProps {
  patientId: string
}

export function PatientPaymentsSection({ patientId }: PatientPaymentsSectionProps) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['patient-payments-summary', patientId],
    queryFn: async () => {
      const session = (await supabase.auth.getSession()).data.session
      const token = session?.access_token

      const res = await fetch(`/api/v1/patients/${patientId}/payments-summary`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })
      if (!res.ok) throw new Error('Error al cargar historial de pagos.')
      return res.json()
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
        <span>Ocurrió un error al cargar los pagos del paciente.</span>
        <button onClick={() => refetch()} className="font-bold underline text-rose-800">
          Reintentar
        </button>
      </div>
    )
  }

  const summary = data?.summary || { totalPaid: 0, totalPending: 0, totalRefunded: 0, count: 0 }
  const payments: any[] = data?.payments || []

  const methodLabels: Record<string, string> = {
    cash: '💵 Efectivo',
    bank_transfer: '🏦 Transferencia',
    card_manual: '💳 Tarjeta POS',
    other: '📝 Otro',
  }

  return (
    <div className="space-y-6">
      {/* Summary KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="bg-emerald-50/50 border-emerald-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 block">
                Total Pagado
              </span>
              <span className="text-xl font-extrabold text-emerald-900 mt-1 block">
                HNL {summary.totalPaid.toFixed(2)}
              </span>
            </div>
            <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 border-amber-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 block">
                Pendiente de Cobro
              </span>
              <span className="text-xl font-extrabold text-amber-900 mt-1 block">
                HNL {summary.totalPending.toFixed(2)}
              </span>
            </div>
            <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50 border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Total Transacciones
              </span>
              <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                {summary.count} recibos
              </span>
            </div>
            <div className="p-2.5 bg-slate-200 rounded-xl text-slate-700">
              <DollarSign className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historical Payments Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Historial de Pagos y Recibos</CardTitle>
          <button
            onClick={() => refetch()}
            className="text-xs text-primary-600 hover:text-primary-800 font-semibold flex items-center gap-1"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </button>
        </CardHeader>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No hay pagos ni cobros registrados para este paciente aún.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Fecha</th>
                    <th className="py-3 px-4">Monto</th>
                    <th className="py-3 px-4">Método</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Notas / Referencia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {new Date(p.createdAt).toLocaleDateString('es-MX', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {p.currency} {parseFloat(p.amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {methodLabels[p.paymentMethod] || p.paymentMethod}
                      </td>
                      <td className="py-3 px-4">
                        {p.status === 'paid' && <Badge variant="success">✅ Pagado</Badge>}
                        {p.status === 'pending' && <Badge variant="warning">⏳ Pendiente</Badge>}
                        {p.status === 'partial' && <Badge variant="warning">🟧 Parcial</Badge>}
                        {p.status === 'refunded' && <Badge variant="error">↩️ Reembolsado</Badge>}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                        {p.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
