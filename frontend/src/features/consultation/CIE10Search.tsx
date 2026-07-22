import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Stethoscope, CheckCircle, Tag, X } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { Badge } from '../../components/ui/Badge'

interface CIE10Result {
  code: string
  description: string
  category: string
}

interface CIE10SearchProps {
  onSelect: (code: string, description: string) => void
  value?: string
}

export function CIE10Search({ onSelect, value }: CIE10SearchProps) {
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)

  const { data: results, isLoading } = useQuery({
    queryKey: ['cie10-search', query],
    enabled: query.trim().length >= 2,
    queryFn: async () => {
      const params = new URLSearchParams({ q: query.trim() })
      const session = (await supabase.auth.getSession()).data.session
      const res = await fetch(`/api/v1/cie10/search?${params}`, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      })
      if (!res.ok) throw new Error('Error al buscar CIE-10')
      return (await res.json()) as CIE10Result[]
    },
  })

  const handleSelect = (item: CIE10Result) => {
    onSelect(item.code, item.description)
    setQuery(`${item.code} — ${item.description}`)
    setShowDropdown(false)
  }

  const clearSelection = () => {
    onSelect('', '')
    setQuery('')
  }

  return (
    <div className="relative space-y-1.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
        Diagnóstico CIE-10 <span className="text-rose-500">*</span>
      </label>

      {value && !query && (
        <div className="flex items-center justify-between rounded-xl border border-primary-200 bg-primary-50/70 p-3 text-xs text-primary-900 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-primary-600 shrink-0" />
            <span className="font-medium">Diagnóstico seleccionado:</span>
            <span className="font-semibold">{value}</span>
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="p-1 text-primary-400 hover:text-primary-700 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-3 flex items-center text-slate-400">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const val = e.target.value
            setQuery(val)
            setShowDropdown(true)
            if (val.trim()) {
              onSelect('Z00.0', val.trim())
            } else {
              onSelect('', '')
            }
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Buscar por código (ej. Z00.0, I10, J00) o descripción del diagnóstico..."
          className="block w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-800 shadow-subtle placeholder:text-slate-400 transition-all duration-150 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 hover:border-slate-300"
        />
      </div>

      {showDropdown && query.trim().length >= 2 && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-2xl animate-scale-in">
          {isLoading && (
            <div className="flex items-center gap-2 p-4 text-xs text-slate-500 font-medium">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              <span>Buscando en catálogo CIE-10...</span>
            </div>
          )}
          {results?.length === 0 && !isLoading && (
            <div className="p-4 text-xs text-slate-500 text-center">
              Sin coincidencias para &quot;{query}&quot;
            </div>
          )}
          {results?.map((item) => (
            <button
              key={item.code}
              type="button"
              onClick={() => handleSelect(item)}
              className="w-full px-4 py-3 text-left text-xs hover:bg-primary-50/80 transition-colors border-b border-slate-100 last:border-0 flex items-center justify-between group"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary-700 bg-primary-100 px-2 py-0.5 rounded text-[11px]">
                    {item.code}
                  </span>
                  <span className="font-semibold text-slate-800 group-hover:text-primary-700">
                    {item.description}
                  </span>
                </div>
              </div>
              {item.category && (
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider shrink-0 ml-2">
                  {item.category}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
