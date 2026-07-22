import { useState, type FormEvent, type ChangeEvent } from 'react'
import {
  UploadCloud,
  FileText,
  AlertCircle,
  Plus,
  X,
} from 'lucide-react'
import { supabase } from '../../../../lib/supabaseClient'
import { useAuth } from '../../../auth/AuthContext'
import type { DocumentCategory } from '../types'
import { CATEGORY_CONFIG, formatFileSize } from '../types'
import { Dialog } from '../../../../components/ui/Dialog'
import { Input } from '../../../../components/ui/Input'
import { Select } from '../../../../components/ui/Select'
import { Textarea } from '../../../../components/ui/Textarea'
import { Button } from '../../../../components/ui/Button'

interface DocumentUploadModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string
  onSuccess: () => void
}

export function DocumentUploadModal({
  isOpen,
  onClose,
  patientId,
  onSuccess,
}: DocumentUploadModalProps) {
  const { profile } = useAuth()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<DocumentCategory>('laboratory')
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setSelectedFile(null)
    setTitle('')
    setCategory('laboratory')
    setNotes('')
    setError(null)
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 15 * 1024 * 1024) {
        setError('El archivo excede el tamaño máximo permitido de 15 MB.')
        return
      }
      setSelectedFile(file)
      setError(null)
      if (!title) {
        const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
        setTitle(baseName)
      }
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedFile || !title.trim()) {
      setError('Por favor adjunta un archivo y escribe un título descriptivo.')
      return
    }

    setUploading(true)
    try {
      const fileExt = selectedFile.name.split('.').pop() || 'file'
      const uniqueId = crypto.randomUUID()
      const filePath = `patients/${patientId}/${category}/${uniqueId}.${fileExt}`

      // Subir archivo a Supabase Storage — bucket principal 'clinical-documents'
      const { error: uploadErr } = await supabase.storage
        .from('clinical-documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: true,
        })

      let activeBucket = 'clinical-documents'
      if (uploadErr) {
        // Fallback al bucket 'prescription-pdfs'
        const { error: fallbackErr } = await supabase.storage
          .from('prescription-pdfs')
          .upload(filePath, selectedFile, {
            cacheControl: '3600',
            upsert: true,
          })
        if (fallbackErr) throw new Error(`Error al subir archivo: ${uploadErr.message}`)
        activeBucket = 'prescription-pdfs'
      }

      // Generar Signed URL (expiración a 1 año)
      let fileUrl = ''
      const { data: signedData } = await supabase.storage
        .from(activeBucket)
        .createSignedUrl(filePath, 60 * 60 * 24 * 365)

      if (signedData?.signedUrl) {
        fileUrl = signedData.signedUrl
      } else {
        const { data: pubData } = supabase.storage.from(activeBucket).getPublicUrl(filePath)
        fileUrl = pubData.publicUrl
      }

      // Probar inserción primero en la tabla canónica 'medical_documents'
      const payload = {
        id: uniqueId,
        patient_id: patientId,
        title: title.trim(),
        category,
        file_path: filePath,
        file_url: fileUrl,
        file_type: selectedFile.type || `application/${fileExt}`,
        file_size: selectedFile.size,
        uploaded_by: profile?.id || null,
        uploaded_by_name: profile?.full_name || 'Personal Médico',
        notes: notes.trim() || null,
        status: 'active',
      }

      const { error: dbErr } = await supabase.from('medical_documents').insert(payload)

      if (dbErr) {
        // Fallback a 'medical_attachments'
        const { error: fallbackDbErr } = await supabase.from('medical_attachments').insert({
          id: uniqueId,
          patient_id: patientId,
          history_id: patientId,
          file_url: fileUrl,
          file_type: selectedFile.type || `application/${fileExt}`,
          title: title.trim(),
          category,
          file_size: selectedFile.size,
          uploaded_by: profile?.id || null,
          uploaded_by_name: profile?.full_name || 'Personal Médico',
          notes: notes.trim() || null,
          status: 'active',
        })

        if (fallbackDbErr) {
          throw new Error(`Error al guardar en base de datos: ${dbErr.message}`)
        }
      }

      resetForm()
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al cargar el documento')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        resetForm()
        onClose()
      }}
      title="Cargar Nuevo Documento Clínico"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Dropzone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Archivo adjunto (PDF o Imagen, Máx. 15MB) *
          </label>
          {selectedFile ? (
            <div className="flex items-center justify-between rounded-xl border border-emerald-300 bg-emerald-50/70 p-3 text-xs text-emerald-900 animate-fade-in">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <FileText className="h-5 w-5 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-emerald-700 font-mono">
                    {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Archivo'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100 transition-colors"
                title="Quitar archivo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-center hover:border-primary-500 hover:bg-primary-50/30 transition-all cursor-pointer">
              <UploadCloud className="h-10 w-10 text-slate-400 group-hover:text-primary-600 transition-colors mb-2" />
              <span className="text-xs font-bold text-slate-800 group-hover:text-primary-700">
                Haz clic o arrastra un archivo aquí
              </span>
              <span className="text-[10px] text-slate-500 mt-1">
                Formatos permitidos: PDF, PNG, JPG, WEBP (hasta 15 MB)
              </span>
              <input
                type="file"
                className="hidden"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={handleFileChange}
              />
            </label>
          )}
        </div>

        {/* Title & Category */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Título del Documento *"
            placeholder="Ej. Análisis de Sangre 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Select
            label="Categoría Clínica *"
            value={category}
            onChange={(e) => setCategory(e.target.value as DocumentCategory)}
          >
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Notes */}
        <Textarea
          label="Observaciones o Notas Clínicas"
          placeholder="Ej. Muestra tomada en ayuno de 12 horas. Valores de glucosa elevados..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 animate-fade-in">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              resetForm()
              onClose()
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            loading={uploading}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Subir Documento
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
