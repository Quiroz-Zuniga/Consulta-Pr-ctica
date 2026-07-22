import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { BookOpen, CheckCircle2, ArrowRight, Stethoscope, Copy, Loader2 } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card'
import { Select } from '../../../components/ui/Select'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { useToast } from '../../../components/ui/Toast'

// Guías de protocolo clínico por código CIE-10 (metadatos de UI, no en DB según SSD)
const CLINICAL_PROTOCOLS: Record<string, string> = {
  E11: 'Control glucémico, dieta hipocalórica, ejercicio aeróbico 150 min/semana y monitoreo de hemoglobina glucosilada (HbA1c).',
  I10: 'Monitoreo de presión arterial en casa, reducción de ingesta de sodio (< 2g/día) y perfil lipídico.',
  'E78.5': 'Modificación del estilo de vida, dieta baja en grasas saturadas y seguimiento de colesterol LDL.',
  J00: 'Sintomático: hidratación abundante, analgésicos/antipiréticos y reposo. Evitar antibióticos innecesarios.',
  'J02.9': 'Evaluación de criterios de Centor para determinar etiología viral vs bacteriana.',
  J45: 'Espirometría funcional, plan de acción para crisis, broncodilatadores de acción corta según necesidad.',
  'K29.7': 'Dieta blanda sin irritantes ni cafeína, inhibidores de bomba de protones y evitar AINEs prolongados.',
  A09: 'Rehidratación oral (SRO), dieta astringente y monitoreo de signos de deshidratación.',
  'M54.5': 'Higiene postural, termoterapia local, analgesia de corto plazo y evitar reposo en cama prolongado.',
  R51: 'Identificar desencadenantes, evaluar signos de alarma (red flags) e hidratación.',
}

const DEFAULT_PROTOCOL = 'Consultar protocolo clínico específico con base en historia clínica del paciente.'

interface Cie10Diagnosis {
  code: string
  description: string
  category: string
}

export function Cie10QuickSelectorWidget({ canConsult }: { canConsult: boolean }) {
  const { success } = useToast()

  // Fetch all CIE-10 diagnoses from Supabase (tabla oficial: cie10_diagnoses según SSD 4.7)
  const { data: allDiagnoses = [], isLoading } = useQuery({
    queryKey: ['cie10-diagnoses-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cie10_diagnoses')
        .select('code, description, category')
        .order('code', { ascending: true })
        .limit(500)

      if (error) {
        console.warn('Error fetching cie10_diagnoses:', error)
        return []
      }
      return (data || []) as Cie10Diagnosis[]
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
  })

  // Extract unique categories from DB data
  const categories = useMemo(() => {
    const unique = Array.from(new Set(allDiagnoses.map((d) => d.category).filter(Boolean)))
    return unique.sort()
  }, [allDiagnoses])

  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedCode, setSelectedCode] = useState<string>('')

  // Filter diagnoses by selected category
  const filteredDiagnoses = useMemo(() => {
    if (!selectedCategory && categories.length > 0) return allDiagnoses.filter((d) => d.category === categories[0])
    return allDiagnoses.filter((d) => d.category === selectedCategory)
  }, [allDiagnoses, selectedCategory, categories])

  // Auto-select first category and diagnosis when data loads
  const activeCategory = selectedCategory || categories[0] || ''
  const activeDiagnoses = selectedCategory ? filteredDiagnoses : allDiagnoses.filter((d) => d.category === activeCategory)
  const currentDiag = allDiagnoses.find((d) => d.code === selectedCode) || activeDiagnoses[0]

  const protocol = currentDiag ? (CLINICAL_PROTOCOLS[currentDiag.code] ?? DEFAULT_PROTOCOL) : ''

  const handleCopyCode = () => {
    if (!currentDiag) return
    navigator.clipboard.writeText(`${currentDiag.code} - ${currentDiag.description}`)
    success('Código copiado', `${currentDiag.code} copiado al portapapeles.`)
  }

  return (
    <Card className="h-full border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden">
      <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Guía & Catálogo CIE-10
              </CardTitle>
              <p className="text-[11px] text-slate-500">
                Datos en tiempo real desde Supabase · Catálogo {allDiagnoses.length > 0 ? `${allDiagnoses.length} diagnósticos` : '—'}
              </p>
            </div>
          </div>
          <Badge variant="success" size="sm">
            {isLoading ? 'Cargando...' : 'Estándar OMS'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-5 flex-1 flex flex-col justify-between">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <p className="text-xs font-medium">Cargando catálogo CIE-10 desde Supabase...</p>
          </div>
        ) : allDiagnoses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2 text-center">
            <BookOpen className="h-8 w-8 text-slate-300" />
            <p className="text-xs font-semibold text-slate-600">Catálogo CIE-10 no disponible</p>
            <p className="text-[11px] text-slate-400">
              La tabla <code className="font-mono">cie10_diagnoses</code> aún no contiene datos o no es accesible.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Category & Diagnosis Selectors */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Select
                  label="1. Categoría / Capítulo"
                  value={activeCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    setSelectedCode('')
                  }}
                  leftIcon={<Stethoscope className="h-4 w-4 text-slate-400" />}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Select
                  label="2. Diagnóstico CIE-10"
                  value={currentDiag?.code || ''}
                  onChange={(e) => setSelectedCode(e.target.value)}
                  leftIcon={<CheckCircle2 className="h-4 w-4 text-slate-400" />}
                >
                  {activeDiagnoses.map((diag) => (
                    <option key={diag.code} value={diag.code}>
                      {diag.code} — {diag.description}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Diagnosis & Protocol Detail Card */}
            {currentDiag && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3 animate-fade-in">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-lg bg-emerald-700 text-white shadow-xs">
                        CIE-10: {currentDiag.code}
                      </span>
                      {currentDiag.category && (
                        <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wider">
                          {currentDiag.category}
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 mt-1.5">
                      {currentDiag.description}
                    </h4>
                  </div>

                  <Button
                    variant="ghost"
                    size="xs"
                    leftIcon={<Copy className="h-3.5 w-3.5" />}
                    onClick={handleCopyCode}
                    className="text-emerald-800 hover:bg-emerald-100 shrink-0"
                    title="Copiar código al portapapeles"
                  >
                    Copiar
                  </Button>
                </div>

                <div className="pt-2 border-t border-emerald-200/70">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 block mb-1">
                    Guía de Recomendación Clínica:
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    &quot;{protocol}&quot;
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {canConsult && !isLoading && (
          <Link to="/consultation" className="pt-2">
            <Button variant="outline" size="sm" className="w-full justify-between">
              <span>Usar en Nueva Consulta SOAP</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </CardContent>
    </Card>
  )
}
