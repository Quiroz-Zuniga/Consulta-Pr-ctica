import { Search, Filter, RefreshCw, Stethoscope, User, Shield } from 'lucide-react'
import type { AppointmentFilters } from '../types'
import { DEFAULT_SPECIALTIES } from '../types'
import { Input } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import { Button } from '../../../components/ui/Button'

interface QueueFiltersProps {
  filters: AppointmentFilters
  onFilterChange: (updated: Partial<AppointmentFilters>) => void
  onReset: () => void
  doctorsList: Array<{ id: string; name: string }>
}

export function QueueFilters({
  filters,
  onFilterChange,
  onReset,
  doctorsList,
}: QueueFiltersProps) {
  const hasActiveFilters =
    filters.patientSearch.trim() !== '' ||
    filters.doctorFilter !== 'all' ||
    filters.specialtyFilter !== 'all' ||
    filters.statusFilter !== 'all'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
          <Filter className="h-4 w-4 text-primary-600" />
          <span>Filtros de Búsqueda</span>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="xs"
            leftIcon={<RefreshCw className="h-3.5 w-3.5 text-slate-500" />}
            onClick={onReset}
            className="text-slate-600 hover:bg-slate-100"
          >
            Limpiar Filtros
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Search Patient */}
        <div>
          <Input
            placeholder="Buscar por paciente..."
            value={filters.patientSearch}
            onChange={(e) => onFilterChange({ patientSearch: e.target.value })}
            leftIcon={<Search className="h-4 w-4 text-slate-400" />}
          />
        </div>

        {/* Filter Doctor */}
        <div>
          <Select
            value={filters.doctorFilter}
            onChange={(e) => onFilterChange({ doctorFilter: e.target.value })}
            leftIcon={<User className="h-4 w-4 text-slate-400" />}
          >
            <option value="all">Todos los Médicos</option>
            {doctorsList.map((doc) => (
              <option key={doc.id} value={doc.name}>
                Dr. {doc.name}
              </option>
            ))}
          </Select>
        </div>

        {/* Filter Specialty */}
        <div>
          <Select
            value={filters.specialtyFilter}
            onChange={(e) => onFilterChange({ specialtyFilter: e.target.value })}
            leftIcon={<Stethoscope className="h-4 w-4 text-slate-400" />}
          >
            <option value="all">Todas las Especialidades</option>
            {DEFAULT_SPECIALTIES.map((spec) => (
              <option key={spec} value={spec}>
                {spec}
              </option>
            ))}
          </Select>
        </div>

        {/* Filter Status */}
        <div>
          <Select
            value={filters.statusFilter}
            onChange={(e) => onFilterChange({ statusFilter: e.target.value })}
            leftIcon={<Shield className="h-4 w-4 text-slate-400" />}
          >
            <option value="all">Todos los Estados</option>
            <option value="scheduled">Pendientes</option>
            <option value="in_progress">En Atención</option>
            <option value="completed">Atendidas</option>
            <option value="cancelled">Canceladas</option>
          </Select>
        </div>
      </div>
    </div>
  )
}
