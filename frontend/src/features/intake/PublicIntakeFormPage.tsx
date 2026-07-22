import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Activity, CheckCircle2, AlertTriangle, Clock, XCircle, Send } from 'lucide-react';

interface PublicIntakeData {
  token: string;
  patientName: string;
  status: 'pending' | 'submitted' | 'expired';
  tokenExpiresAt: string;
  isValid: boolean;
  reasonForInvalidity?: 'not_found' | 'expired' | 'already_submitted';
}

export function PublicIntakeFormPage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [intakeInfo, setIntakeInfo] = useState<PublicIntakeData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [symptomDuration, setSymptomDuration] = useState('');
  const [allergies, setAllergies] = useState('');
  const [currentMedications, setCurrentMedications] = useState('');
  const [medicalHistoryNotes, setMedicalHistoryNotes] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${backendUrl}/api/v1/public/intake/${token}`)
      .then((res) => res.json())
      .then((data: PublicIntakeData) => {
        setIntakeInfo(data);
        setLoading(false);
      })
      .catch(() => {
        setErrorMsg('Error al conectar con el servidor.');
        setLoading(false);
      });
  }, [token, backendUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chiefComplaint.trim()) {
      setErrorMsg('Por favor describe el motivo principal de tu consulta.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`${backendUrl}/api/v1/public/intake/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chiefComplaint: chiefComplaint.trim(),
          symptoms: symptoms.trim(),
          symptomDuration: symptomDuration.trim(),
          allergies: allergies.trim(),
          currentMedications: currentMedications.trim(),
          medicalHistoryNotes: medicalHistoryNotes.trim(),
          additionalNotes: additionalNotes.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorMsg(data.error || 'Error al enviar el formulario.');
        setSubmitting(false);
        return;
      }

      setSubmittedSuccess(true);
      setSubmitting(false);
    } catch (err: any) {
      setErrorMsg('Error de red al enviar el formulario.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <Activity className="w-12 h-12 text-teal-400 animate-spin mb-4" />
        <p className="text-slate-300 font-medium text-lg">Cargando formulario de preconsulta...</p>
      </div>
    );
  }

  if (submittedSuccess) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 border border-slate-700 text-center shadow-2xl">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">¡Formulario Enviado!</h2>
          <p className="text-slate-300 mb-6">
            Gracias <span className="font-semibold text-teal-300">{intakeInfo?.patientName}</span>. Tu información de preconsulta ha sido recibida y será revisada por tu médico antes de la cita.
          </p>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700 text-sm text-slate-400">
            Puedes cerrar esta pestaña de forma segura.
          </div>
        </div>
      </div>
    );
  }

  if (!intakeInfo || !intakeInfo.isValid) {
    const isExpired = intakeInfo?.reasonForInvalidity === 'expired';
    const isAlreadySubmitted = intakeInfo?.reasonForInvalidity === 'already_submitted';

    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 border border-slate-700 text-center shadow-2xl">
          {isExpired && <Clock className="w-16 h-16 text-amber-400 mx-auto mb-4" />}
          {isAlreadySubmitted && <CheckCircle2 className="w-16 h-16 text-teal-400 mx-auto mb-4" />}
          {!isExpired && !isAlreadySubmitted && <XCircle className="w-16 h-16 text-rose-400 mx-auto mb-4" />}

          <h2 className="text-2xl font-bold text-white mb-2">
            {isExpired && 'Enlace Expirado'}
            {isAlreadySubmitted && 'Formulario Ya Enviado'}
            {!isExpired && !isAlreadySubmitted && 'Enlace Inválido'}
          </h2>

          <p className="text-slate-300 mb-6">
            {isExpired && 'Este enlace de preconsulta ha vencido por seguridad. Ponte en contacto con la clínica para solicitar un nuevo enlace.'}
            {isAlreadySubmitted && `Este formulario para ${intakeInfo?.patientName || 'el paciente'} ya fue respondido previamente.`}
            {!isExpired && !isAlreadySubmitted && 'El enlace ingresado no existe o no es válido.'}
          </p>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700 text-sm text-slate-400">
            Consulta Práctica Web — Sistema Médico Clínico
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 py-8 px-4 flex justify-center">
      <div className="max-w-2xl w-full">
        {/* Header Branding */}
        <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-t-2xl p-6 text-white shadow-lg">
          <div className="flex items-center space-x-3 mb-2">
            <Activity className="w-8 h-8 text-teal-200" />
            <h1 className="text-xl font-bold tracking-tight">Consulta Práctica</h1>
          </div>
          <h2 className="text-2xl font-extrabold text-white">Formulario de Preconsulta Médica</h2>
          <p className="text-teal-100 text-sm mt-1">
            Hola <span className="font-bold underline decoration-teal-300">{intakeInfo.patientName}</span>, por favor completa tus síntomas y datos de salud antes de tu consulta.
          </p>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="bg-slate-800 border-x border-b border-slate-700 rounded-b-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-xl flex items-start space-x-3 text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Motivo de consulta */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Motivo principal de consulta <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="¿Por qué acudes al médico hoy? (Ej: dolor de cabeza persistente, dolor de estómago, chequeo de rutina)"
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          {/* Síntomas y duración */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Síntomas actuales
              </label>
              <input
                type="text"
                placeholder="Fiebre, náuseas, tos, mareos..."
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Duración de síntomas
              </label>
              <input
                type="text"
                placeholder="Ej: Hace 3 días, 2 semanas..."
                value={symptomDuration}
                onChange={(e) => setSymptomDuration(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
          </div>

          {/* Alergias y Medicamentos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Alergias a medicamentos o alimentos
              </label>
              <input
                type="text"
                placeholder="Ej: Penicilina, sulfas, ninguna..."
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-2">
                Medicamentos que toma actualmente
              </label>
              <input
                type="text"
                placeholder="Ej: Losartán 50mg diario, Paracetamol..."
                value={currentMedications}
                onChange={(e) => setCurrentMedications(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
          </div>

          {/* Antecedentes */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Antecedentes médicos relevantes
            </label>
            <textarea
              rows={2}
              placeholder="Enfermedades crónicas (hipertensión, diabetes), cirugías previas..."
              value={medicalHistoryNotes}
              onChange={(e) => setMedicalHistoryNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          {/* Notas adicionales */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Notas o preguntas adicionales para el médico
            </label>
            <textarea
              rows={2}
              placeholder="Cualquier otro detalle que quieras comentar al doctor..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 px-6 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-base disabled:opacity-50 cursor-pointer"
          >
            {submitting ? (
              <>
                <Activity className="w-5 h-5 animate-spin" />
                <span>Enviando información...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Enviar Preconsulta al Médico</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
