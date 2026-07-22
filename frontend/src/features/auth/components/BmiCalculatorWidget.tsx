import { useState } from 'react'
import { Calculator, Activity, Scale, Ruler, Info } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card'
import { Input } from '../../../components/ui/Input'
import { Badge } from '../../../components/ui/Badge'

export function BmiCalculatorWidget() {
  const [weightKg, setWeightKg] = useState<string>('70')
  const [heightCm, setHeightCm] = useState<string>('170')

  const weight = parseFloat(weightKg) || 0
  const heightM = (parseFloat(heightCm) || 0) / 100

  const bmi = heightM > 0 && weight > 0 ? weight / (heightM * heightM) : 0

  const getBmiCategory = (val: number) => {
    if (val <= 0) return { label: 'Sin datos', color: 'text-slate-400', bg: 'bg-slate-100', border: 'border-slate-200', desc: 'Ingresa peso y estatura válidos' }
    if (val < 18.5) return { label: 'Bajo Peso', color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-300', desc: 'Peso inferior al rango saludable recomendado.' }
    if (val < 25) return { label: 'Peso Normal / Saludable', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300', desc: 'Rango de peso corporat adecuado.' }
    if (val < 30) return { label: 'Sobrepeso', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300', desc: 'Ligero exceso de peso respecto a la estatura.' }
    if (val < 35) return { label: 'Obesidad Grado I', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-300', desc: 'Riesgo moderado para la salud cardiovascular.' }
    if (val < 40) return { label: 'Obesidad Grado II', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-300', desc: 'Riesgo elevado. Requiere valoración médica.' }
    return { label: 'Obesidad Grado III (Mórbida)', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-300', desc: 'Riesgo muy alto de complicaciones de salud.' }
  }

  const category = getBmiCategory(bmi)

  // Progress Bar Percentage calculation (capped between 15 and 45 BMI)
  const progressPercent = bmi > 0 ? Math.min(Math.max(((bmi - 12) / (42 - 12)) * 100, 0), 100) : 0

  return (
    <Card className="h-full border-slate-200 shadow-sm overflow-hidden">
      <CardHeader className="bg-slate-50/70 border-b border-slate-100 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-100 text-primary-700">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Calculadora de Masa Corporal (IMC)
              </CardTitle>
              <p className="text-[11px] text-slate-500">
                Herramienta interactiva de evaluación antropométrica rápida
              </p>
            </div>
          </div>
          <Badge variant="primary" size="sm">
            Herramienta Clínica
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Form Inputs Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Peso del Paciente (kg)"
            type="number"
            step="0.1"
            min="1"
            max="300"
            value={weightKg}
            onChange={(e) => setWeightKg(e.target.value)}
            placeholder="Ej. 70"
            leftIcon={<Scale className="h-4 w-4 text-slate-400" />}
          />

          <Input
            label="Estatura / Talla (cm)"
            type="number"
            step="1"
            min="30"
            max="250"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            placeholder="Ej. 170"
            leftIcon={<Ruler className="h-4 w-4 text-slate-400" />}
          />
        </div>

        {/* BMI Output Card */}
        <div className={`rounded-2xl border p-5 transition-all ${category.bg} ${category.border}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Resultado IMC
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-3xl font-black tracking-tight ${category.color}`}>
                  {bmi > 0 ? bmi.toFixed(1) : '--'}
                </span>
                <span className="text-xs font-semibold text-slate-600 font-mono">kg/m²</span>
              </div>
            </div>

            <div className="sm:text-right">
              <span className={`inline-block text-xs font-extrabold px-3 py-1 rounded-full border ${category.border} ${category.bg} ${category.color}`}>
                {category.label}
              </span>
              <p className="text-xs text-slate-600 mt-1 max-w-xs">
                {category.desc}
              </p>
            </div>
          </div>

          {/* Visual Scale Bar */}
          {bmi > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-200/60 space-y-1.5">
              <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                <span>15 (Bajo)</span>
                <span>18.5</span>
                <span>25.0</span>
                <span>30.0</span>
                <span>40+ (Mórbida)</span>
              </div>
              <div className="relative h-2.5 w-full rounded-full bg-slate-200 overflow-hidden flex">
                <div className="h-full w-[22%] bg-sky-400" title="Bajo peso (<18.5)" />
                <div className="h-full w-[21%] bg-emerald-500" title="Normal (18.5 - 24.9)" />
                <div className="h-full w-[17%] bg-amber-400" title="Sobrepeso (25 - 29.9)" />
                <div className="h-full w-[17%] bg-orange-500" title="Obesidad I (30 - 34.9)" />
                <div className="h-full w-[23%] bg-rose-600" title="Obesidad II/III (>=35)" />
              </div>
              <div
                className="h-2 w-2 rounded-full bg-slate-900 shadow-md transition-all duration-300"
                style={{ marginLeft: `calc(${progressPercent}% - 4px)` }}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
