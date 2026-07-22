import { useEffect, useState } from 'react';
import { FileText, Link, Copy, Check, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface IntakeFormItem {
  id: string;
  patientId: string;
  status: 'pending' | 'submitted' | 'expired';
  accessToken: string;
  tokenExpiresAt: string;
  submittedAt?: string;
  createdAt: string;
  formData?: {
    chiefComplaint?: string;
    symptoms?: string;
    allergies?: string;
    currentMedications?: string;
  };
}

interface Props {
  patientId: string;
}

export function PatientIntakeSection({ patientId }: Props) {
  const [forms, setForms] = useState<IntakeFormItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newPublicUrl, setNewPublicUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  const fetchForms = async () => {
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;

      const res = await fetch(`${backendUrl}/api/v1/patients/${patientId}/intake-forms`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setForms(data);
      }
    } catch (err) {
      console.error('Error fetching intake forms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (patientId) {
      fetchForms();
    }
  }, [patientId]);

  const handleGenerateLink = async () => {
    setGenerating(true);
    setCopied(false);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;

      const res = await fetch(`${backendUrl}/api/v1/patients/${patientId}/intake-forms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ expiresInHours: 72 }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewPublicUrl(data.publicUrl);
        await fetchForms();
      }
    } catch (err) {
      console.error('Error generating intake form:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (newPublicUrl) {
      navigator.clipboard.writeText(newPublicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-400" />
            Formulario de Preconsulta (Intake Digital)
          </h3>
          <p className="text-sm text-slate-400">
            Genera un enlace público para que el paciente complete sus datos clínicos antes de la cita.
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerateLink}
          disabled={generating}
          className="py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-medium rounded-lg text-sm transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{generating ? 'Generando...' : 'Generar Link de Preconsulta'}</span>
        </button>
      </div>

      {newPublicUrl && (
        <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-teal-300 uppercase tracking-wider">
            ¡Enlace generado exitosamente (Válido por 72 horas)!
          </p>
          <div className="flex items-center gap-2 bg-slate-900/80 p-2.5 rounded-lg border border-slate-700">
            <Link className="w-4 h-4 text-teal-400 shrink-0" />
            <input
              type="text"
              readOnly
              value={newPublicUrl}
              className="bg-transparent text-sm text-white w-full focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="py-1 px-3 bg-teal-600 hover:bg-teal-500 text-white rounded text-xs font-semibold flex items-center gap-1 shrink-0 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Lista de Formularios */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-300">Historial de Formularios</h4>
        {loading ? (
          <p className="text-slate-400 text-sm">Cargando formularios...</p>
        ) : forms.length === 0 ? (
          <p className="text-slate-500 text-sm italic">No hay formularios de preconsulta generados para este paciente.</p>
        ) : (
          <div className="space-y-2.5">
            {forms.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900/60 border border-slate-700/70 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {item.status === 'submitted' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" /> Enviado
                      </span>
                    )}
                    {item.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Clock className="w-3 h-3" /> Pendiente
                      </span>
                    )}
                    {item.status === 'expired' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
                        <AlertCircle className="w-3 h-3" /> Expirado
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      Creado: {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {item.formData?.chiefComplaint && (
                    <p className="text-sm text-slate-200">
                      <span className="font-semibold text-teal-300">Motivo:</span> {item.formData.chiefComplaint}
                    </p>
                  )}
                </div>

                <div className="text-xs text-slate-400 shrink-0">
                  {item.submittedAt ? (
                    <span>Respondido: {new Date(item.submittedAt).toLocaleString()}</span>
                  ) : (
                    <span>Vence: {new Date(item.tokenExpiresAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
