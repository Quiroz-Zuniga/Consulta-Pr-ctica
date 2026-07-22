import { useState } from 'react'
import {
  Download,
  Calendar,
  User,
  HardDrive,
  FileText,
  ExternalLink,
  Info,
  Archive,
  ArchiveRestore,
} from 'lucide-react'
import type { MedicalDocument, DocumentStatus } from '../types'
import { CATEGORY_CONFIG, formatFileSize } from '../types'
import { Dialog } from '../../../../components/ui/Dialog'
import { Badge } from '../../../../components/ui/Badge'
import { Button } from '../../../../components/ui/Button'

interface DocumentViewerModalProps {
  isOpen: boolean
  onClose: () => void
  document: MedicalDocument | null
  onStatusChange?: (docId: string, newStatus: DocumentStatus) => void
}

export function DocumentViewerModal({
  isOpen,
  onClose,
  document,
  onStatusChange,
}: DocumentViewerModalProps) {
  const [loadingMedia, setLoadingMedia] = useState(true)

  if (!document) return null

  const categoryInfo = CATEGORY_CONFIG[document.category] || CATEGORY_CONFIG.other
  const Icon = categoryInfo.icon
  const isImage = document.file_type.startsWith('image/')
  const isPdf = document.file_type.includes('pdf')
  const isArchived = document.status === 'archived'

  const formattedDate = new Date(document.uploaded_at).toLocaleDateString('es-MX', {
    weekday: 'short',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const handleDownload = () => {
    const link = window.document.createElement('a')
    link.href = document.file_url
    link.download = `${document.title.replace(/\s+/g, '_')}.${
      isPdf ? 'pdf' : document.file_type.split('/')[1] || 'file'
    }`
    link.target = '_blank'
    window.document.body.appendChild(link)
    link.click()
    window.document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onClose={onClose} title={document.title} size="xl">
      <div className="space-y-4">
        {/* Document Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${categoryInfo.colorClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">{document.title}</h4>
                <Badge variant={categoryInfo.variant} dot size="sm">
                  {categoryInfo.label}
                </Badge>
                {isArchived && (
                  <Badge variant="neutral" size="sm">
                    Archivado
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-medium mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-slate-400" />
                  {formattedDate}
                </span>
                <span className="flex items-center gap-1 font-mono">
                  <HardDrive className="h-3 w-3 text-slate-400" />
                  {formatFileSize(document.file_size)}
                </span>
                {document.uploaded_by_name && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3 text-slate-400" />
                    Cargado por: {document.uploaded_by_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onStatusChange && (
              <Button
                variant="ghost"
                size="xs"
                leftIcon={isArchived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                onClick={() => onStatusChange(document.id, isArchived ? 'active' : 'archived')}
              >
                {isArchived ? 'Reactivar' : 'Archivar'}
              </Button>
            )}

            <Button
              variant="outline"
              size="xs"
              leftIcon={<Download className="h-3.5 w-3.5" />}
              onClick={handleDownload}
            >
              Descargar
            </Button>

            <a
              href={document.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Abrir Pestaña</span>
            </a>
          </div>
        </div>

        {document.notes && (
          <div className="flex items-start gap-2 bg-amber-50/60 border border-amber-200 rounded-xl p-3 text-xs text-amber-900">
            <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <p><strong>Observaciones:</strong> {document.notes}</p>
          </div>
        )}

        {/* Viewer Container */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 flex items-center justify-center min-h-[500px] max-h-[70vh]">
          {isImage ? (
            <img
              src={document.file_url}
              alt={document.title}
              className="max-h-[68vh] w-auto object-contain transition-all"
              onLoad={() => setLoadingMedia(false)}
            />
          ) : isPdf ? (
            <iframe
              src={`${document.file_url}#toolbar=1`}
              title={document.title}
              className="w-full h-[65vh] border-0"
              onLoad={() => setLoadingMedia(false)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-white text-center space-y-3">
              <FileText className="h-16 w-16 text-slate-400" />
              <p className="text-sm font-semibold">Previsualización no disponible para este formato</p>
              <Button variant="primary" size="sm" onClick={handleDownload} leftIcon={<Download className="h-4 w-4" />}>
                Descargar archivo para ver
              </Button>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  )
}
