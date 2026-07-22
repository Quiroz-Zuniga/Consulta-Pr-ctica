import { Search, Filter, RefreshCw, ArrowUpDown, Archive } from 'lucide-react'
import type { DocumentFilters } from '../types'
import { CATEGORY_CONFIG } from '../types'
import { Input } from '../../../../components/ui/Input'
import { Select } from '../../../../components/ui/Select'
import { Button } from '../../../../components/ui/Button'

interface DocumentFilterBarProps {
  filters: DocumentFilters
  onFilterChange: (updated: Partial<DocumentFilters>) => void
  onReset: () => void
}

export function DocumentFilterBar({
  filters,
  onFilterChange,
  onReset,
}: DocumentFilterBarProps) {
  const hasActiveFilters =
    filters.searchQuery.trim() !== '' ||
    filters.categoryFilter !== 'all' ||
    filters.statusFilter !== 'all' ||
    filters.sortBy !== 'date_desc'

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
          <Filter className="h-4 w-4 text-primary-600" />
          <span>Búsqueda y Filtros de Documentos</span>
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
        {/* Search Input */}
        <div>
          <Input
            placeholder="Buscar por título u observaciones..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange({ searchQuery: e.target.value })}
            leftIcon={<Search className="h-4 w-4 text-slate-400" />}
          />
        </div>

        {/* Category Select */}
        <div>
          <Select
            value={filters.categoryFilter}
            onChange={(e) => onFilterChange({ categoryFilter: e.target.value })}
            leftIcon={<Filter className="h-4 w-4 text-slate-400" />}
          >
            <option value="all">Todas las Categorías</option>
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Status Select */}
        <div>
          <Select
            value={filters.statusFilter}
            onChange={(e) => onFilterChange({ statusFilter: e.target.value as any })}
            leftIcon={<Archive className="h-4 w-4 text-slate-400" />}
          >
            <option value="all">Todos los Estados</option>
            <option value="active">Activos</option>
            <option value="archived">Archivados</option>
          </Select>
        </div>

        {/* Sort Select */}
        <div>
          <Select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
            leftIcon={<ArrowUpDown className="h-4 w-4 text-slate-400" />}
          >
            <option value="date_desc">Más recientes primero</option>
            <option value="date_asc">Más antiguos primero</option>
            <option value="title">Título (A-Z)</option>
            <option value="size_desc">Mayor tamaño primero</option>
          </Select>
        </div>
      </div>
    </div>
  )
}
