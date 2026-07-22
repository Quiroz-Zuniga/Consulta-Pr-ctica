import { useLocation } from 'react-router-dom'
import { LogOut, ChevronRight, ShieldCheck, User, Stethoscope } from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

const routeNames: Record<string, string> = {
  '/dashboard': 'Inicio',
  '/patients': 'Pacientes',
  '/patients/new': 'Registrar Paciente',
  '/consultation': 'Nueva Consulta Médica',
  '/appointments': 'Agenda de Citas',
}

export function Topbar() {
  const { profile, signOut } = useAuth()
  const location = useLocation()

  const pathSegments = location.pathname.split('/').filter(Boolean)
  const currentTitle = routeNames[location.pathname] || (pathSegments[0] === 'patients' && pathSegments[1] ? 'Expediente de Paciente' : 'Consulta Práctica')

  const roleLabel =
    profile?.role === 'ADMINISTRATOR'
      ? 'Administrador'
      : profile?.role === 'DOCTOR'
        ? 'Médico Especialista'
        : 'Secretaría / Recepción'

  const roleVariant =
    profile?.role === 'ADMINISTRATOR'
      ? 'warning'
      : profile?.role === 'DOCTOR'
        ? 'primary'
        : 'info'

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 shadow-subtle">
      {/* Breadcrumb / Title */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-slate-400">Sistema</span>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <h1 className="text-sm font-bold text-slate-900 tracking-tight">
          {currentTitle}
        </h1>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        <Badge variant={roleVariant} dot size="md">
          {roleLabel}
        </Badge>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-700 border-l border-slate-200 pl-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600">
            <User className="h-3.5 w-3.5" />
          </div>
          <span>{profile?.full_name || 'Usuario'}</span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={signOut}
          leftIcon={<LogOut className="h-4 w-4" />}
          className="text-slate-500 hover:text-rose-600 hover:bg-rose-50"
        >
          <span className="hidden md:inline">Cerrar sesión</span>
        </Button>
      </div>
    </header>
  )
}
