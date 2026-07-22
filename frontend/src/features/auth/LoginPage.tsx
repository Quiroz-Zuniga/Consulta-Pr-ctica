import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Activity, Mail, Lock, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react'
import { useAuth } from './AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export function LoginPage() {
  const { session, loading, signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500 animate-pulse">Cargando sistema clínico...</p>
        </div>
      </div>
    )
  }

  if (session) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const err = await signIn(email, password)
    setSubmitting(false)
    if (err) setError(err)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-primary-600/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-emerald-600/10 blur-3xl" />

      <div className="w-full max-w-md animate-scale-in relative z-10">
        {/* Main Login Card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl p-8 shadow-2xl">
          {/* Header & Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-lg shadow-primary-500/20">
              <Activity className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Consulta Práctica
            </h1>
            <p className="mt-1.5 text-xs text-slate-400">
              Plataforma de Expediente Clínico y Gestión Médica
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Input
                label="Correo electrónico"
                labelClassName="text-slate-300"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="medico@consultorio.com"
                leftIcon={<Mail className="h-4 w-4" />}
                className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus:border-primary-500 focus:ring-primary-500/20"
              />
            </div>

            <div>
              <Input
                label="Contraseña"
                labelClassName="text-slate-300"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                leftIcon={<Lock className="h-4 w-4" />}
                className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus:border-primary-500 focus:ring-primary-500/20"
              />
            </div>

            {error && (
              <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 animate-fade-in">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              loading={submitting}
              rightIcon={<ArrowRight className="h-4 w-4" />}
              className="w-full py-2.5 bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white font-semibold shadow-lg shadow-primary-600/30"
            >
              Iniciar sesión
            </Button>
          </form>

          {/* Security Banner */}
          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-slate-800/80 bg-slate-900/50 py-2.5 px-3 text-[11px] font-medium text-slate-400">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Acceso Seguro con Encriptación TLS 1.3 & RLS</span>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          © 2026 Consulta Práctica Web. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}
