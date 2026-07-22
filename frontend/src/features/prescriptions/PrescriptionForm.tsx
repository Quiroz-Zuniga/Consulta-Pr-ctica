import { Plus, Trash2, Pill, Calendar, FileText } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'

interface Medication {
  name: string
  dosage: string
  frequency: string
  durationDays: number
}

interface PrescriptionFormProps {
  medications: Medication[]
  onMedicationsChange: (meds: Medication[]) => void
  indications: string
  onIndicationsChange: (val: string) => void
  nextAppointment: string
  onNextAppointmentChange: (val: string) => void
}

export function PrescriptionForm({
  medications,
  onMedicationsChange,
  indications,
  onIndicationsChange,
  nextAppointment,
  onNextAppointmentChange,
}: PrescriptionFormProps) {
  const addMedication = () => {
    onMedicationsChange([
      ...medications,
      { name: '', dosage: '', frequency: '', durationDays: 1 },
    ])
  }

  const removeMedication = (index: number) => {
    onMedicationsChange(medications.filter((_, i) => i !== index))
  }

  const updateMedication = (
    index: number,
    field: keyof Medication,
    value: string | number,
  ) => {
    const updated = medications.map((m, i) =>
      i === index ? { ...m, [field]: value } : m,
    )
    onMedicationsChange(updated)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary-600" />
            <CardTitle>Receta & Prescripción Médica</CardTitle>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addMedication}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Agregar Fármaco
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {medications.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
            No se han agregado fármacos a la receta. Presiona <strong className="text-slate-800">&quot;+ Agregar Fármaco&quot;</strong> para incluir medicamentos.
          </div>
        ) : (
          <div className="space-y-3">
            {medications.map((med, idx) => (
              <div
                key={idx}
                className="grid gap-3 sm:grid-cols-12 items-end rounded-xl border border-slate-200 bg-slate-50/50 p-4 transition-all duration-150 hover:border-slate-300"
              >
                <div className="sm:col-span-4">
                  <Input
                    label="Nombre del Medicamento / Fármaco"
                    value={med.name}
                    onChange={(e) => updateMedication(idx, 'name', e.target.value)}
                    placeholder="Ej. Paracetamol, Amoxicilina..."
                  />
                </div>
                <div className="sm:col-span-3">
                  <Input
                    label="Dosis"
                    value={med.dosage}
                    onChange={(e) => updateMedication(idx, 'dosage', e.target.value)}
                    placeholder="Ej. 500 mg, 1 tableta"
                  />
                </div>
                <div className="sm:col-span-3">
                  <Input
                    label="Frecuencia"
                    value={med.frequency}
                    onChange={(e) =>
                      updateMedication(idx, 'frequency', e.target.value)
                    }
                    placeholder="Ej. Cada 8 horas"
                  />
                </div>
                <div className="sm:col-span-1">
                  <Input
                    label="Días"
                    type="number"
                    min={1}
                    value={med.durationDays}
                    onChange={(e) =>
                      updateMedication(idx, 'durationDays', parseInt(e.target.value, 10) || 1)
                    }
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeMedication(idx)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 transition-colors"
                    title="Eliminar fármaco"
                    aria-label="Eliminar fármaco"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Textarea
          label="Indicaciones adicionales / Recomendaciones"
          value={indications}
          onChange={(e) => onIndicationsChange(e.target.value)}
          rows={2}
          placeholder="Ej. Tomar con abundante agua después de los alimentos. Evitar consumo de alcohol."
        />

        <Input
          label="Próxima cita de seguimiento"
          type="date"
          value={nextAppointment}
          onChange={(e) => onNextAppointmentChange(e.target.value)}
          leftIcon={<Calendar className="h-4 w-4 text-slate-400" />}
        />
      </CardContent>
    </Card>
  )
}
