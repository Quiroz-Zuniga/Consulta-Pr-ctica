import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Video, ShieldCheck, Clock, AlertTriangle, Activity, User, Stethoscope } from 'lucide-react';

interface VideoLinkData {
  appointmentId: string;
  patientName?: string;
  doctorName?: string;
  appointmentDate: string;
  roomName?: string;
  roomUrl?: string;
  videoSessionStatus: string;
  hasVideoRoom: boolean;
}

export function PublicVideoCallPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoData, setVideoData] = useState<VideoLinkData | null>(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

  useEffect(() => {
    if (!id || !token) {
      setError('Enlace inválido: Token de cita no especificado.');
      setLoading(false);
      return;
    }

    fetch(`${backendUrl}/api/v1/public/appointments/${id}/video-consultation?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Acceso denegado: El token de videoconsulta es inválido o ha expirado.');
        return res.json();
      })
      .then((data: VideoLinkData) => {
        setVideoData(data);
        setLoading(false);
      })
      .catch((err: any) => {
        setError(err.message || 'Error al conectar con la videoconsulta.');
        setLoading(false);
      });
  }, [id, token, backendUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-white">
        <Activity className="w-12 h-12 text-teal-400 animate-spin mb-4" />
        <p className="text-slate-300 font-medium text-lg">Verificando sala de videoconsulta...</p>
      </div>
    );
  }

  if (error || !videoData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 border border-slate-700 text-center shadow-2xl">
          <AlertTriangle className="w-16 h-16 text-rose-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Acceso No Autorizado</h2>
          <p className="text-slate-300 mb-6">{error || 'No se pudo acceder a la sala de videoconsulta.'}</p>
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700 text-sm text-slate-400">
            Consulta Práctica Web — Videoconsulta Médica Segura
          </div>
        </div>
      </div>
    );
  }

  const handleJoinMeeting = () => {
    if (videoData.roomUrl) {
      window.open(videoData.roomUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-slate-800 rounded-2xl border border-slate-700 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-teal-500/10 rounded-2xl border border-teal-500/20 text-teal-400 mb-2">
            <Video className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Videoconsulta Médica Online</h1>
          <p className="text-sm text-slate-300">
            Hola <span className="font-semibold text-teal-300">{videoData.patientName || 'Paciente'}</span>, tu sala médica virtual está lista.
          </p>
        </div>

        <div className="bg-slate-900/80 rounded-xl p-4 border border-slate-700 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400 flex items-center gap-1.5">
              <User className="w-4 h-4 text-teal-400" /> Paciente
            </span>
            <span className="font-bold text-white">{videoData.patientName}</span>
          </div>

          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-teal-400" /> Médico Tratante
            </span>
            <span className="font-bold text-white">
              {videoData.doctorName ? `Dr. ${videoData.doctorName}` : 'Asignado en clínica'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-400" /> Fecha programada
            </span>
            <span className="font-bold text-white">
              {new Date(videoData.appointmentDate).toLocaleString('es-MX')}
            </span>
          </div>
        </div>

        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-emerald-300">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Esta videollamada es privada y está cifrada punto a punto usando Jitsi Meet. No requiere instalar ninguna aplicación.
          </span>
        </div>

        <button
          type="button"
          onClick={handleJoinMeeting}
          disabled={!videoData.roomUrl}
          className="w-full py-4 px-6 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 text-base cursor-pointer disabled:opacity-50"
        >
          <Video className="w-5 h-5" />
          <span>Ingresar a Videollamada con el Doctor</span>
        </button>
      </div>
    </div>
  );
}
