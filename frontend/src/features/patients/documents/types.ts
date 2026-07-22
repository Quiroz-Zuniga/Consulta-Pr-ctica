import type { BadgeVariant } from '../../../components/ui/Badge'
import {
  FlaskConical,
  FileText,
  ImageIcon,
  Share2,
  FileDigit,
  ShieldCheck,
  FolderOpen,
} from 'lucide-react'

export type DocumentCategory =
  | 'laboratory'
  | 'prescription'
  | 'imaging'
  | 'reference'
  | 'incapacity'
  | 'consent'
  | 'other'

export type DocumentStatus = 'active' | 'archived'

export interface MedicalDocument {
  id: string
  patient_id: string
  history_id?: string
  title: string
  category: DocumentCategory
  file_path: string
  file_url: string
  file_type: string
  file_size: number
  uploaded_by?: string
  uploaded_by_name?: string
  uploaded_at: string
  status: DocumentStatus
  notes?: string
}

export interface DocumentFilters {
  searchQuery: string
  categoryFilter: string
  statusFilter: 'all' | 'active' | 'archived'
  sortBy: 'date_desc' | 'date_asc' | 'title' | 'size_desc'
}

export const CATEGORY_CONFIG: Record<
  DocumentCategory,
  { label: string; icon: any; variant: BadgeVariant; colorClass: string }
> = {
  laboratory: {
    label: 'Laboratorio',
    icon: FlaskConical,
    variant: 'info',
    colorClass: 'text-sky-700 bg-sky-50 border-sky-200',
  },
  prescription: {
    label: 'Receta Médica',
    icon: FileText,
    variant: 'success',
    colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  },
  imaging: {
    label: 'Estudio de Imagen',
    icon: ImageIcon,
    variant: 'primary',
    colorClass: 'text-primary-700 bg-primary-50 border-primary-200',
  },
  reference: {
    label: 'Referencia Médica',
    icon: Share2,
    variant: 'warning',
    colorClass: 'text-amber-800 bg-amber-50 border-amber-200',
  },
  incapacity: {
    label: 'Incapacidad',
    icon: FileDigit,
    variant: 'neutral',
    colorClass: 'text-slate-700 bg-slate-100 border-slate-200',
  },
  consent: {
    label: 'Consentimiento',
    icon: ShieldCheck,
    variant: 'success',
    colorClass: 'text-teal-800 bg-teal-50 border-teal-200',
  },
  other: {
    label: 'Otro Documento',
    icon: FolderOpen,
    variant: 'neutral',
    colorClass: 'text-slate-600 bg-slate-50 border-slate-200',
  },
}

export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
