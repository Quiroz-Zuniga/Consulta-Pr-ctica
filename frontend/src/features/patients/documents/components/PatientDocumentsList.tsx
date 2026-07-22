import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FolderOpen,
  UploadCloud,
  Eye,
  Download,
  Trash2,
  Calendar,
  User,
  HardDrive,
  Archive,
  ArchiveRestore,
  CheckCircle2,
} from 'lucide-react'
import { supabase } from '../../../../lib/supabaseClient'
import type { MedicalDocument, DocumentFilters } from '../types'
import { CATEGORY_CONFIG, formatFileSize } from '../types'
import { Button } from '../../../../components/ui/Button'
import { Badge } from '../../../../components/ui/Badge'
import { EmptyState } from '../../../../components/ui/EmptyState'
import { useToast } from '../../../../components/ui/Toast'
import { DocumentFilterBar } from './DocumentFilterBar'
import { DocumentUploadModal } from './DocumentUploadModal'
import { DocumentViewerModal } from './DocumentViewerModal'

interface PatientDocumentsListProps {
  patientId: string
  patientName?: string
}

export function PatientDocumentsList({
  patientId,
  patientName,
}: PatientDocumentsListProps) {
  const queryClient = useQueryClient()
  const { success, error: toastError } = useToast()

  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [activeViewerDoc, setActiveViewerDoc] = useState<MedicalDocument | null>(null)

  const [page, setPage] = useState(1)
  const pageSize = 12

  const [filters, setFilters] = useState<DocumentFilters>({
    searchQuery: '',
    categoryFilter: 'all',
    statusFilter: 'all',
    sortBy: 'date_desc',
  })

  // Consulta de documentos clínicos paginados
  const { data: documentsResult, isLoading } = useQuery({
    queryKey: ['patient-medical-documents', patientId, page, filters],
    enabled: Boolean(patientId),
    queryFn: async () => {
      let req = supabase
        .from('medical_documents')
        .select('*', { count: 'exact' })
        .eq('patient_id', patientId)
        .order('uploaded_at', { ascending: false })

      if (filters.categoryFilter !== 'all') {
        req = req.eq('category', filters.categoryFilter)
      }
      if (filters.statusFilter !== 'all') {
        req = req.eq('status', filters.statusFilter)
      }
      if (filters.searchQuery.trim()) {
        req = req.ilike('title', `%${filters.searchQuery.trim()}%`)
      }

      req = req.range((page - 1) * pageSize, page * pageSize - 1)

      const { data, count, error } = await req

      if (error) {
        let fallbackReq = supabase
          .from('medical_attachments')
          .select('*', { count: 'exact' })
          .or(`patient_id.eq.${patientId},history_id.eq.${patientId}`)
          .order('uploaded_at', { ascending: false })

        if (filters.categoryFilter !== 'all') {
          fallbackReq = fallbackReq.eq('category', filters.categoryFilter)
        }

        fallbackReq = fallbackReq.range((page - 1) * pageSize, page * pageSize - 1)

        const { data: legacy, count: legacyCount, error: legacyErr } = await fallbackReq

        if (legacyErr) return { data: [] as MedicalDocument[], total: 0, page, pageSize }

        return {
          data: (legacy || []).map((att: any) => ({
            id: att.id,
            patient_id: patientId,
            history_id: att.history_id,
            title: att.title || `Adjunto (${att.file_type?.split('/')[1] || 'doc'})`,
            category: att.category || (att.file_type?.startsWith('image/') ? 'imaging' : 'other'),
            file_path: att.file_url,
            file_url: att.file_url,
            file_type: att.file_type || 'application/pdf',
            file_size: att.file_size || 0,
            uploaded_by: att.uploaded_by,
            uploaded_by_name: att.uploaded_by_name,
            uploaded_at: att.uploaded_at || new Date().toISOString(),
            status: att.status || 'active',
            notes: att.notes,
          })) as MedicalDocument[],
          total: legacyCount ?? (legacy?.length || 0),
          page,
          pageSize,
        }
      }

      return {
        data: (data || []).map((d: any) => ({
          id: d.id,
          patient_id: d.patient_id || patientId,
          history_id: d.history_id,
          title: d.title || `Documento (${d.file_type?.split('/')[1] || 'doc'})`,
          category: d.category || (d.file_type?.startsWith('image/') ? 'imaging' : 'other'),
          file_path: d.file_url,
          file_url: d.file_url,
          file_type: d.file_type || 'application/pdf',
          file_size: d.file_size || 0,
          uploaded_by: d.uploaded_by,
          uploaded_by_name: d.uploaded_by_name,
          uploaded_at: d.uploaded_at || new Date().toISOString(),
          status: d.status || 'active',
          notes: d.notes,
        })) as MedicalDocument[],
        total: count ?? (data?.length || 0),
        page,
        pageSize,
      }
    },
  })

  const rawDocuments = documentsResult?.data || []
  const totalDocs = documentsResult?.total || 0

  // Alternar estado activo / archivado
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ docId, newStatus }: { docId: string; newStatus: 'active' | 'archived' }) => {
      const { error } = await supabase
        .from('medical_documents')
        .update({ status: newStatus })
        .eq('id', docId)

      if (error) {
        // Fallback a 'medical_attachments'
        const { error: fallbackErr } = await supabase
          .from('medical_attachments')
          .update({ status: newStatus })
          .eq('id', docId)

        if (fallbackErr) throw fallbackErr
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['patient-medical-documents', patientId] })
      success(
        variables.newStatus === 'archived' ? 'Documento archivado' : 'Documento activado',
        `El documento ha cambiado su estado a ${variables.newStatus === 'archived' ? 'archivado' : 'activo'}.`,
      )
    },
    onError: (err: Error) => {
      toastError('Error al cambiar estado', err.message)
    },
  })

  // Mutation de eliminación
  const deleteMutation = useMutation({
    mutationFn: async (docId: string) => {
      const { error } = await supabase
        .from('medical_documents')
        .delete()
        .eq('id', docId)

      if (error) {
        const { error: fallbackErr } = await supabase
          .from('medical_attachments')
          .delete()
          .eq('id', docId)

        if (fallbackErr) throw fallbackErr
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-medical-documents', patientId] })
      success('Documento eliminado', 'El documento fue removido del expediente.')
    },
    onError: (err: Error) => {
      toastError('Error al eliminar', err.message)
    },
  })

  const handleDelete = (doc: MedicalDocument) => {
    if (window.confirm(`¿Estás seguro de eliminar el documento "${doc.title}"? Esta acción no se puede deshacer.`)) {
      deleteMutation.mutate(doc.id)
    }
  }

  // Filtrado y Ordenamiento
  const filteredDocuments = useMemo(() => {
    return rawDocuments
      .filter((doc) => {
        // Búsqueda por término
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.trim().toLowerCase()
          const matchTitle = doc.title.toLowerCase().includes(q)
          const matchNotes = doc.notes?.toLowerCase().includes(q)
          if (!matchTitle && !matchNotes) return false
        }

        // Filtro de Categoría
        if (filters.categoryFilter !== 'all' && doc.category !== filters.categoryFilter) {
          return false
        }

        // Filtro de Estado
        if (filters.statusFilter !== 'all' && doc.status !== filters.statusFilter) {
          return false
        }

        return true
      })
      .sort((a, b) => {
        if (filters.sortBy === 'date_asc') {
          return new Date(a.uploaded_at).getTime() - new Date(b.uploaded_at).getTime()
        }
        if (filters.sortBy === 'title') {
          return a.title.localeCompare(b.title)
        }
        if (filters.sortBy === 'size_desc') {
          return b.file_size - a.file_size
        }
        return new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
      })
  }, [rawDocuments, filters])

  const activeCount = rawDocuments.filter((d) => d.status === 'active').length
  const archivedCount = rawDocuments.filter((d) => d.status === 'archived').length

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary-700 font-bold">
            <FolderOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Expediente Documental Clínico
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {rawDocuments.length} {rawDocuments.length === 1 ? 'documento' : 'documentos'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Almacenamiento e historial clínico documental de {patientName || 'paciente'} ({activeCount} activos, {archivedCount} archivados).
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<UploadCloud className="h-4 w-4" />}
          onClick={() => setIsUploadOpen(true)}
          className="shadow-sm whitespace-nowrap self-start sm:self-auto"
        >
          Subir Documento Clínico
        </Button>
      </div>

      {/* Filter Toolbar */}
      <DocumentFilterBar
        filters={filters}
        onFilterChange={(updated) => setFilters((prev) => ({ ...prev, ...updated }))}
        onReset={() =>
          setFilters({
            searchQuery: '',
            categoryFilter: 'all',
            statusFilter: 'all',
            sortBy: 'date_desc',
          })
        }
      />

      {/* Documents Grid / List */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-8">
          <EmptyState
            icon={<FolderOpen className="h-10 w-10 text-slate-400" />}
            title="Sin documentos clínicos encontrados"
            description={
              rawDocuments.length === 0
                ? 'Este expediente aún no cuenta con documentos médicos guardados. Haz clic en "Subir Documento Clínico" para adjuntar el primero.'
                : 'No se encontraron documentos que coincidan con los criterios de búsqueda o filtros seleccionados.'
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((doc) => {
            const categoryInfo = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.other
            const Icon = categoryInfo.icon
            const isArchived = doc.status === 'archived'
            const dateStr = new Date(doc.uploaded_at).toLocaleDateString('es-MX', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })

            return (
              <div
                key={doc.id}
                className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 ${
                  isArchived
                    ? 'border-slate-200 bg-slate-50/70 opacity-80'
                    : 'border-slate-200 hover:border-primary-300 hover:shadow-md'
                }`}
              >
                <div className="space-y-3">
                  {/* Header Card: Icon, Badges */}
                  <div className="flex items-center justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${categoryInfo.colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isArchived ? (
                        <Badge variant="neutral" size="sm">
                          Archivado
                        </Badge>
                      ) : (
                        <Badge variant={categoryInfo.variant} dot size="sm">
                          {categoryInfo.label}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Title & Notes */}
                  <div>
                    <h4 className={`text-sm font-bold line-clamp-1 transition-colors ${
                      isArchived ? 'text-slate-600 line-through' : 'text-slate-900 group-hover:text-primary-700'
                    }`}>
                      {doc.title}
                    </h4>
                    {doc.notes && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2 italic">
                        &quot;{doc.notes}&quot;
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Metadata & Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {dateStr}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <HardDrive className="h-3 w-3" />
                      {formatFileSize(doc.file_size)}
                    </span>
                  </div>

                  {doc.uploaded_by_name && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                      <User className="h-3 w-3 text-slate-400" />
                      <span>Cargado por: {doc.uploaded_by_name}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-1 pt-1">
                    <Button
                      variant="primary"
                      size="xs"
                      leftIcon={<Eye className="h-3.5 w-3.5" />}
                      onClick={() => setActiveViewerDoc(doc)}
                      className="flex-1"
                    >
                      Visualizar
                    </Button>

                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                      title="Descargar o Abrir"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>

                    <button
                      onClick={() =>
                        toggleStatusMutation.mutate({
                          docId: doc.id,
                          newStatus: isArchived ? 'active' : 'archived',
                        })
                      }
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
                      title={isArchived ? 'Reactivar documento' : 'Archivar documento'}
                    >
                      {isArchived ? (
                        <ArchiveRestore className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Archive className="h-3.5 w-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(doc)}
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                      title="Eliminar documento"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        patientId={patientId}
        onSuccess={() =>
          queryClient.invalidateQueries({ queryKey: ['patient-medical-documents', patientId] })
        }
      />

      <DocumentViewerModal
        isOpen={Boolean(activeViewerDoc)}
        onClose={() => setActiveViewerDoc(null)}
        document={activeViewerDoc}
        onStatusChange={(docId, newStatus) => {
          toggleStatusMutation.mutate({ docId, newStatus })
          setActiveViewerDoc((prev) => (prev ? { ...prev, status: newStatus } : null))
        }}
      />
    </div>
  )
}
