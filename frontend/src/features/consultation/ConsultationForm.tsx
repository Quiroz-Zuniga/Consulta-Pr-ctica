import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  User,
  Search,
  FileText,
  Stethoscope,
  Pill,
  Save,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ClipboardList,
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { useToast } from '../../components/ui/Toast'
import { CIE10Search } from './CIE10Search'
import { PrescriptionForm } from '../prescriptions/PrescriptionForm'
import { PdfViewerModal } from '../prescriptions/PdfViewerModal'

interface PatientOption {
  id: string
  full_name: string
}

interface MedicationInput {
  name: string
  dosage: string
  frequency: string
  durationDays: number
}

function SubmittedIntakeCard({ patientId, onAutofillSubjective }: { patientId: string; onAutofillSubjective: (text: string) => void }) {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

  const { data: intakeForms } = useQuery({
    queryKey: ['patient-intake-forms', patientId],
    enabled: Boolean(patientId),
    queryFn: async () => {
      const session = (await supabase.auth.getSession()).data.session
      const res = await fetch(`${backendUrl}/api/v1/patients/${patientId}/intake-forms`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      })
      if (!res.ok) return []
      return await res.json()
    },
  })

  const submittedForm = intakeForms?.find((f: any) => f.status === 'submitted')
  if (!submittedForm || !submittedForm.formData) return null

  const fd = submittedForm.formData

  const handleCopy = () => {
    const textParts = []
    if (fd.chiefComplaint) textParts.push(`Motivo de consulta (Preconsulta): ${fd.chiefComplaint}`)
    if (fd.symptoms) textParts.push(`Síntomas actuales: ${fd.symptoms} (${fd.symptomDuration || 'duración N/E'})`)
    if (fd.allergies) textParts.push(`Alergias declaradas: ${fd.allergies}`)
    if (fd.currentMedications) textParts.push(`Medicamentos actuales: ${fd.currentMedications}`)
    if (fd.medicalHistoryNotes) textParts.push(`Antecedentes: ${fd.medicalHistoryNotes}`)
    onAutofillSubjective(textParts.join('\n'))
  }

  return (
    <Card className="border-teal-300 bg-teal-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-600" />
            <CardTitle className="text-teal-900 text-base">
              Preconsulta Digital Llenada por el Paciente
            </CardTitle>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={handleCopy} className="text-xs">
            Copiar a Subjetivo (S)
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 text-xs text-slate-700">
        <div>
          <span className="font-bold text-teal-900">Motivo de Consulta:</span>{' '}
          <span className="text-slate-900 font-semibold">{fd.chiefComplaint}</span>
        </div>
        {fd.symptoms && (
          <div>
            <span className="font-bold text-teal-900">Síntomas & Duración:</span> {fd.symptoms} ({fd.symptomDuration || 'sin especificar'})
          </div>
        )}
        {fd.allergies && (
          <div>
            <span className="font-bold text-teal-900">Alergias:</span> {fd.allergies}
          </div>
        )}
        {fd.currentMedications && (
          <div>
            <span className="font-bold text-teal-900">Medicamentos Actuales:</span> {fd.currentMedications}
          </div>
        )}
        {fd.medicalHistoryNotes && (
          <div>
            <span className="font-bold text-teal-900">Antecedentes:</span> {fd.medicalHistoryNotes}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function ConsultationForm() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const { success, error: toastError } = useToast()

  const [patientId, setPatientId] = useState('')
  const [patientSearch, setPatientSearch] = useState('')
  const [subjective, setSubjective] = useState('')
  const [objective, setObjective] = useState('')
  const [plan, setPlan] = useState('')
  const [cie10Code, setCie10Code] = useState('')
  const [cie10Desc, setCie10Desc] = useState('')
  const [medications, setMedications] = useState<MedicationInput[]>([])
  const [indications, setIndications] = useState('')
  const [nextAppointment, setNextAppointment] = useState('')
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { data: patients } = useQuery({
    queryKey: ['patient-search', patientSearch],
    enabled: patientSearch.trim().length >= 2,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('id, full_name')
        .ilike('full_name', `%${patientSearch.trim()}%`)
        .limit(10)
      if (error) throw error
      return data as PatientOption[]
    },
  })

  const consultationMutation = useMutation({
    mutationFn: async () => {
      const clinicalNoteParts = []
      if (subjective) clinicalNoteParts.push(`Subjetivo: ${subjective}`)
      if (objective) clinicalNoteParts.push(`Objetivo: ${objective}`)
      if (plan) clinicalNoteParts.push(`Plan: ${plan}`)
      const clinicalNote = clinicalNoteParts.join('\n---\n') || 'Consulta médica general'

      const payload = {
        patientId,
        clinicalNote,
        cie10Code: cie10Code || 'Z00.0',
        medications: medications.map((m) => ({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          durationDays: Number(m.durationDays),
        })),
        customIndications: indications || '',
        nextAppointment: nextAppointment ? new Date(nextAppointment).toISOString() : null,
      }

      const res = await fetch('/api/v1/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        let msg = err.error || err.message || 'Error al guardar la consulta'
        if (err.details?.fieldErrors) {
          const details = Object.entries(err.details.fieldErrors)
            .map(([field, msgs]) => `${field}: ${(msgs as string[]).join(', ')}`)
            .join(' | ')
          msg += ` (${details})`
        }
        throw new Error(msg)
      }

      return await res.json()
    },
    onSuccess: (data) => {
      success('Consulta registrada con éxito', 'La nota médica ha sido guardada de forma segura.')
      if (data.pdfUrl) setPdfUrl(data.pdfUrl)
      else navigate('/patients')
    },
    onError: (err: Error) => {
      setError(err.message)
      toastError('Error en consulta médica', err.message)
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!patientId) {
      setError('Por favor selecciona un paciente de la lista.')
      return
    }
    if (!cie10Code) {
      setError('Por favor selecciona un código o diagnóstico CIE-10.')
      return
    }
    if (!subjective && !objective && !plan) {
      setError('Por favor completa al menos una sección de la Nota Clínica Tripartita (Subjetivo, Objetivo o Plan).')
      return
    }
    consultationMutation.mutate()
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6 animate-fade-in">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Nueva Consulta Médica
              </h2>
              <Badge variant="primary" dot size="md">
                Nota SOAP + Receta PDF
              </Badge>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Registra el diagnóstico, examen físico, nota clínica y prescripción médica.
            </p>
          </div>
        </div>

        {/* Section 1: Patient Selection & CIE-10 Diagnosis */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary-600" />
              <CardTitle>1. Identificación de Paciente & Diagnóstico</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="relative space-y-1.5">
              <Input
                label="Buscar paciente"
                placeholder="Escribe al menos 2 caracteres del nombre del paciente..."
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value)
                  if (patientId) setPatientId('')
                }}
                leftIcon={<Search className="h-4 w-4 text-slate-400" />}
                required
              />

              {patients && patients.length > 0 && !patientId && (
                <div className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-2xl border border-slate-200 bg-white shadow-2xl animate-scale-in">
                  {patients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="w-full px-4 py-3 text-left text-xs font-medium hover:bg-primary-50/80 transition-colors flex items-center justify-between border-b border-slate-100 last:border-0"
                      onClick={() => {
                        setPatientId(p.id)
                        setPatientSearch(p.full_name)
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-100 font-bold text-primary-700 text-xs">
                          {p.full_name.charAt(0)}
                        </div>
                        <span className="text-slate-900 font-semibold">{p.full_name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">Seleccionar</span>
                    </button>
                  ))}
                </div>
              )}

              {patientId && (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 animate-fade-in">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>Paciente verificado: {patientSearch}</span>
                </div>
              )}
            </div>

            <CIE10Search
              onSelect={(code, desc) => {
                setCie10Code(code)
                setCie10Desc(desc)
              }}
              value={cie10Desc || cie10Code}
            />
          </CardContent>
        </Card>

        {/* Section 1.5: Submitted Intake Form Preview (if available) */}
        {patientId && (
          <SubmittedIntakeCard patientId={patientId} onAutofillSubjective={(text) => setSubjective((prev) => prev ? `${prev}\n\n${text}` : text)} />
        )}

        {/* Section 2: Tripartite SOAP Clinical Note */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary-600" />
                <CardTitle>2. Nota Clínica Tripartita (S.O.A.P.)</CardTitle>
              </div>
              <Badge variant="neutral" size="sm">
                Formato Estándar Sanitario
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              label="Subjetivo (S) — Motivo & Síntomas"
              value={subjective}
              onChange={(e) => setSubjective(e.target.value)}
              rows={3}
              placeholder="Síntomas referidos por el paciente, tiempo de evolución, antecedentes..."
            />
            <Textarea
              label="Objetivo (O) — Exploración & Signos Vitales"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={3}
              placeholder="Hallazgos en examen físico, signos vitales (presión, FC, T°), resultados de laboratorios..."
            />
            <Textarea
              label="Plan (P) — Tratamiento & Seguimiento"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              rows={3}
              placeholder="Estrategia terapéutica, órdenes de estudios adicionales, recomendaciones..."
            />
          </CardContent>
        </Card>

        {/* Section 3: Prescription Form */}
        <PrescriptionForm
          medications={medications}
          onMedicationsChange={setMedications}
          indications={indications}
          onIndicationsChange={setIndications}
          nextAppointment={nextAppointment}
          onNextAppointmentChange={setNextAppointment}
        />

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 animate-fade-in">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/dashboard')}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            loading={consultationMutation.isPending}
            variant="primary"
            size="lg"
            leftIcon={<Save className="h-5 w-5" />}
            className="shadow-lg shadow-primary-600/30"
          >
            Guardar & Emitir Receta PDF
          </Button>
        </div>
      </form>

      <PdfViewerModal
        pdfUrl={pdfUrl}
        onClose={() => {
          setPdfUrl(null)
          navigate('/patients')
        }}
      />
    </>
  )
}
