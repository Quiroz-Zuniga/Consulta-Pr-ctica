import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../../components/ui/Button';

interface Participant {
  name: string;
  label: string;
  avatarColor: string;
}

export function VideoSimulationRoom() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await supabase
        .from('users')
        .select('full_name, role, email')
        .eq('id', user.id)
        .single();
      return data as { full_name: string; role: string; email: string } | null;
    },
  });

  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [isDoctor, setIsDoctor] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const participants: Participant[] = [
    { name: profile?.full_name ?? 'Tú', label: profile?.role === 'DOCTOR' ? 'Médico' : 'Paciente', avatarColor: '#3b82f6' },
    { name: isDoctor ? 'Paciente' : 'Dr. Especialista', label: isDoctor ? 'Paciente' : 'Médico', avatarColor: '#10b981' },
  ];

  useEffect(() => {
    if (profile?.role === 'DOCTOR' || profile?.role === 'ADMINISTRATOR') {
      setIsDoctor(true);
    }
  }, [profile]);

  useEffect(() => {
    const timer = setInterval(() => setCallDuration((d) => d + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    setMessages((m) => [...m, { sender: profile?.full_name ?? 'Tú', text: chatInput.trim() }]);
    setChatInput('');
    if (chatInput.trim().toLowerCase().includes('hola')) {
      setTimeout(() => {
        setMessages((m) => [...m, { sender: participants[1].name, text: '¡Hola! ¿Cómo te sientes hoy?' }]);
      }, 1500);
    }
    if (chatInput.trim().toLowerCase().includes('medicamento') || chatInput.trim().toLowerCase().includes('receta')) {
      setTimeout(() => {
        setMessages((m) => [...m, { sender: participants[1].name, text: 'Te enviaré la receta al finalizar la consulta.' }]);
      }, 1800);
    }
    if (chatInput.trim().endsWith('?')) {
      setTimeout(() => {
        setMessages((m) => [...m, { sender: participants[1].name, text: 'Déjame revisar tu expediente y te confirmo.' }]);
      }, 2000);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 grid grid-cols-1 gap-2 p-2 auto-rows-fr relative">
          <div className="grid grid-cols-2 gap-2">
            {participants.map((p, i) => (
              <div
                key={i}
                className="relative rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center border border-slate-700 shadow-lg"
              >
                {cameraOff && i === 0 ? (
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white"
                      style={{ backgroundColor: p.avatarColor }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-slate-400">Cámara apagada</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold text-white animate-pulse"
                      style={{ backgroundColor: p.avatarColor }}
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-base">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.label}</div>
                    </div>
                    <div className="flex gap-1 items-center text-xs text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Conectado
                    </div>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 text-xs bg-black/50 px-2 py-0.5 rounded">
                  {i === 0 ? 'Tú' : p.name}
                </div>
              </div>
            ))}
          </div>
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 px-4 py-1.5 rounded-full text-sm font-mono">
            {formatTime(callDuration)}
          </div>
        </div>

        <div className="bg-slate-800/90 backdrop-blur border-t border-slate-700 px-4 py-3 flex items-center justify-center gap-3">
          <button
            onClick={() => setMuted((m) => !m)}
            className={`p-3 rounded-full transition-colors ${muted ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'}`}
            title={muted ? 'Activar micrófono' : 'Silenciar'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
          </button>
          <button
            onClick={() => setCameraOff((c) => !c)}
            className={`p-3 rounded-full transition-colors ${cameraOff ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'}`}
            title={cameraOff ? 'Encender cámara' : 'Apagar cámara'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          </button>
          <button
            onClick={() => setChatOpen((c) => !c)}
            className={`p-3 rounded-full transition-colors ${chatOpen ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 hover:bg-slate-600'}`}
            title="Chat"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          </button>
          <div className="w-px h-8 bg-slate-600 mx-1" />
          <button
            onClick={() => navigate('/appointments')}
            className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
            title="Finalizar llamada"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" /></svg>
          </button>
        </div>
      </div>

      {chatOpen && (
        <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700 font-semibold flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            Chat de la consulta
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <p className="text-sm text-slate-500 text-center mt-8">
                No hay mensajes aún. Escribe algo para iniciar la conversación.
              </p>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === profile?.full_name ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                  msg.sender === profile?.full_name
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-slate-700 text-slate-200 rounded-bl-md'
                }`}>
                  <div className="text-xs opacity-70 mb-0.5">{msg.sender}</div>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <div className="p-3 border-t border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-slate-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-500"
              />
              <Button onClick={sendMessage} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
