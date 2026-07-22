import { Printer, ExternalLink, FileText, CheckCircle2 } from 'lucide-react'
import { Dialog } from '../../components/ui/Dialog'
import { Button } from '../../components/ui/Button'

interface PdfViewerModalProps {
  pdfUrl: string | null
  onClose: () => void
}

export function PdfViewerModal({ pdfUrl, onClose }: PdfViewerModalProps) {
  if (!pdfUrl) return null

  return (
    <Dialog
      open={true}
      onClose={onClose}
      title="Receta Médica PDF Generada"
      description="Documento oficial impreso y firmado digitalmente"
      size="xl"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>La consulta médica ha sido guardada y la receta PDF emitida correctamente.</span>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-inner">
          <iframe
            src={pdfUrl}
            className="h-[65vh] w-full"
            title="Receta Médica PDF"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <span className="text-xs text-slate-500 font-mono">Documento PDFKit generado</span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button variant="secondary" onClick={onClose} className="flex-1 sm:flex-none">
              Cerrar y continuar
            </Button>
            <Button
              onClick={() => window.open(pdfUrl, '_blank')}
              leftIcon={<ExternalLink className="h-4 w-4" />}
              className="flex-1 sm:flex-none"
            >
              Abrir / Imprimir Receta
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  )
}
