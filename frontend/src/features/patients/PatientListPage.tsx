import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, UserPlus, User, Calendar, Phone, Edit, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { TableSkeleton } from '../../components/ui/Skeleton'
import { EmptyState } from '../../components/ui/EmptyState'

interface PatientRow {
  id: string
  full_name: string
  birth_date: string
  gender: string
  phone: string
  is_protected: boolean
}

export function PatientListPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 15

  const { data: result, isLoading } = useQuery({
    queryKey: ['patients', search, page],
    queryFn: async () => {
      let query = supabase
        .from('patients')
        .select('id, full_name, birth_date, gender, phone, is_protected', { count: 'exact' })
        .order('full_name', { ascending: true })
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (search.trim()) {
        query = query.ilike('full_name', `%${search.trim()}%`)
      }

      const { data, count, error } = await query
      if (error) throw error
      return {
        data: (data || []) as PatientRow[],
        total: count ?? (data?.length || 0),
        page,
        pageSize,
      }
    },
  })

  const patients = result?.data || []
  const total = result?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
  }

  const handleSearchChange = (val: string) => {
    setSearch(val)
    setPage(1)
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Expedientes de Pacientes
            </h2>
            <Badge variant="primary" size="md">
              {total} {total === 1 ? 'paciente' : 'pacientes'}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Catálogo unificado de historiales clínicos y datos demográficos.
          </p>
        </div>

        <Link to="/patients/new">
          <Button leftIcon={<UserPlus className="h-4 w-4" />}>
            Registrar Paciente
          </Button>
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <Card>
        <div className="p-4 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Input
              placeholder="Buscar paciente por nombre completo..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              leftIcon={<Search className="h-4 w-4 text-slate-400" />}
              rightIcon={
                search ? (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded"
                    aria-label="Limpiar búsqueda"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : undefined
              }
            />
          </div>
        </div>
      </Card>

      {/* Table Container */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="p-6">
            <TableSkeleton rows={5} cols={5} />
          </div>
        ) : !patients || patients.length === 0 ? (
          <EmptyState
            icon={<User className="h-10 w-10" />}
            title={search ? 'No se encontraron resultados' : 'No hay pacientes registrados'}
            description={
              search
                ? `No existen coincidencias para "${search}". Intenta con otros términos.`
                : 'Comienza registrando el primer expediente clínico en la plataforma.'
            }
            action={
              <Link to="/patients/new">
                <Button size="sm" leftIcon={<UserPlus className="h-4 w-4" />}>
                  Registrar nuevo paciente
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-3.5">Nombre del Paciente</th>
                  <th className="px-6 py-3.5">Fecha de Nacimiento</th>
                  <th className="px-6 py-3.5">Género</th>
                  <th className="px-6 py-3.5">Teléfono</th>
                  <th className="px-6 py-3.5 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {patients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-100 font-bold text-primary-700 text-xs shadow-subtle">
                          {getInitials(p.full_name)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 group-hover:text-primary-600 transition-colors">
                              {p.full_name}
                            </span>
                            {p.is_protected && (
                              <Badge variant="warning" dot size="sm">
                                Protegido
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {p.id.substring(0, 8)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          {p.birth_date
                            ? new Date(p.birth_date).toLocaleDateString('es-MX', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {p.gender ? (
                        <Badge
                          variant={
                            p.gender === 'Masculino'
                              ? 'info'
                              : p.gender === 'Femenino'
                                ? 'primary'
                                : 'neutral'
                          }
                          size="sm"
                        >
                          {p.gender}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {p.phone ? (
                        <div className="flex items-center gap-1.5 font-mono">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          <span>{p.phone}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/patients/${p.id}`}>
                        <Button
                          variant="outline"
                          size="xs"
                          leftIcon={<Edit className="h-3.5 w-3.5" />}
                        >
                          Editar
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {total > 0 && (
          <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <div>
              Mostrando <span className="font-semibold text-slate-700">{(page - 1) * pageSize + 1}</span> a{' '}
              <span className="font-semibold text-slate-700">{Math.min(page * pageSize, total)}</span> de{' '}
              <span className="font-semibold text-slate-700">{total}</span> pacientes
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
              >
                Anterior
              </Button>
              <span className="text-xs font-semibold px-2 text-slate-700">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="xs"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
