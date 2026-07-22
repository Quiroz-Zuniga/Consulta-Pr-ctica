import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  User,
  Calendar,
  Phone,
  Save,
  Image as ImageIcon,
  AlertCircle,
  FileText,
  FolderOpen,
  DollarSign,
} from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card'
import { useToast } from '../../components/ui/Toast'
import { PatientGallery } from './PatientGallery'
import { PatientDocumentsList } from './documents/components/PatientDocumentsList'
import { PatientIntakeSection } from '../intake/PatientIntakeSection'
import { PatientPaymentsSection } from './PatientPaymentsSection'

export function PatientFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { success, error: toastError } = useToast()

  const [activeTab, setActiveTab] = useState<'demographics' | 'documents' | 'payments'>('demographics')
  const [fullName, setFullName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: patient, isLoading: loadingPatient } = useQuery({
    queryKey: ['patient', id],
    enabled: isEdit,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
  })

  useEffect(() => {
    if (patient) {
      setFullName(patient.full_name || '')
      setBirthDate(patient.birth_date || '')
      setGender(patient.gender || '')
      setPhone(patient.phone || '')
    }
  }, [patient])

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = {
        full_name: fullName,
        birth_date: birthDate || null,
        gender: gender || null,
        phone: phone || null,
      }

      if (isEdit) {
        const { error } = await supabase
          .from('patients')
          .update(payload)
          .eq('id', id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('patients').insert(payload)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] })
      success(
        isEdit ? 'Expediente actualizado' : 'Paciente registrado',
        `Los datos de ${fullName} se guardaron correctamente.`,
      )
      navigate('/patients')
    },
    onError: (err: Error) => {
      setError(err.message)
      toastError('Error al guardar expediente', err.message)
    },
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!fullName.trim()) {
      setError('El nombre completo es obligatorio.')
      return
    }
    mutation.mutate()
  }

  if (isEdit && loadingPatient) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        <p className="mt-3 text-xs text-slate-500 font-medium">Cargando datos del expediente...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-in pb-8">
      {/* Top Header Navigation */}
      <div className="flex items-center gap-3">
        <Link to="/patients">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Volver a Pacientes
          </Button>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isEdit ? `Expediente: ${fullName || 'Cargando...'}` : 'Registrar Nuevo Paciente'}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {isEdit
              ? 'Gestión de datos demográficos y expediente documental del paciente.'
              : 'Completa los datos demográficos y de contacto del paciente.'}
          </p>
        </div>

        {/* Tab Navigation for Edit Mode */}
        {isEdit && (
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl text-xs font-semibold self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('demographics')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all ${
                activeTab === 'demographics'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Datos Demográficos</span>
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all ${
                activeTab === 'documents'
                  ? 'bg-white text-primary-700 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FolderOpen className="h-4 w-4" />
              <span>Documentos Clínicos</span>
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl transition-all ${
                activeTab === 'payments'
                  ? 'bg-white text-emerald-700 shadow-sm font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <span>Historial de Pagos</span>
            </button>
          </div>
        )}
      </div>

      {/* Tab 1: Demographics Form */}
      {(!isEdit || activeTab === 'demographics') && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Datos Demográficos</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                <Input
                  label="Nombre completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Ej. María Guadalupe González"
                  leftIcon={<User className="h-4 w-4 text-slate-400" />}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Fecha de nacimiento"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    leftIcon={<Calendar className="h-4 w-4 text-slate-400" />}
                  />

                  <Select
                    label="Género"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="">Seleccionar género...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro / No especificado</option>
                  </Select>
                </div>

                <Input
                  label="Teléfono de contacto"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+52 55 1234 5678"
                  leftIcon={<Phone className="h-4 w-4 text-slate-400" />}
                />

                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 animate-fade-in">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </CardContent>

              <CardFooter className="justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/patients')}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  loading={mutation.isPending}
                  leftIcon={<Save className="h-4 w-4" />}
                >
                  {isEdit ? 'Guardar cambios' : 'Registrar Paciente'}
                </Button>
              </CardFooter>
            </Card>
          </form>

          {/* Legacy Patient Clinical Gallery */}
          {isEdit && id && (
            <div className="space-y-6 mt-8">
              <PatientIntakeSection patientId={id} />

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary-600" />
                    <CardTitle>Galería & Adjuntos Médicos Rápidos</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <PatientGallery patientId={id} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Clinical Document Management */}
      {isEdit && id && activeTab === 'documents' && (
        <PatientDocumentsList patientId={id} patientName={fullName} />
      )}

      {/* Tab 3: Payments History */}
      {isEdit && id && activeTab === 'payments' && (
        <PatientPaymentsSection patientId={id} />
      )}
    </div>
  )
}
