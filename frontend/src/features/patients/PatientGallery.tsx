import { useQuery } from '@tanstack/react-query'
import { FileText, ExternalLink, Image as ImageIcon, Download } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { EmptyState } from '../../components/ui/EmptyState'

interface PatientGalleryProps {
  patientId: string
}

export function PatientGallery({ patientId }: PatientGalleryProps) {
  const { data: attachments, isLoading } = useQuery({
    queryKey: ['patient-attachments', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('medical_attachments')
        .select('id, file_url, file_type, uploaded_at')
        .eq('history_id', patientId)
        .order('uploaded_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: Boolean(patientId),
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-36 rounded-xl bg-slate-200/70 animate-pulse" />
        ))}
      </div>
    )
  }

  if (!attachments || attachments.length === 0) {
    return (
      <EmptyState
        icon={<ImageIcon className="h-8 w-8" />}
        title="Sin adjuntos clínicos"
        description="Este expediente no cuenta con imágenes o archivos PDF guardados."
      />
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {attachments.map((att) => {
        const isImage = att.file_type?.startsWith('image/')
        return (
          <div
            key={att.id}
            className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 transition-all duration-200 hover:shadow-elevated hover:border-slate-300"
          >
            {isImage ? (
              <img
                src={att.file_url}
                alt="Adjunto clínico"
                className="h-36 w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-36 flex-col items-center justify-center bg-slate-100/80 text-slate-400 p-4 text-center">
                <FileText className="h-10 w-10 text-primary-600 mb-1" />
                <span className="text-[10px] font-semibold text-slate-500 uppercase">
                  {att.file_type?.split('/')[1] || 'Documento'}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 flex flex-col justify-end p-3 text-white">
              <span className="text-[10px] opacity-75 font-mono">
                {att.uploaded_at
                  ? new Date(att.uploaded_at).toLocaleDateString('es-MX', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : ''}
              </span>
              <a
                href={att.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:text-primary-300 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Abrir documento</span>
              </a>
            </div>
          </div>
        )
      })}
    </div>
  )
}
