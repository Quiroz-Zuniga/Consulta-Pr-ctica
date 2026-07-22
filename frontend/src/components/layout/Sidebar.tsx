import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FilePlus,
  Calendar,
  Activity,
  ChevronLeft,
  ChevronRight,
  Shield,
  Stethoscope,
  BarChart2,
} from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Inicio', icon: LayoutDashboard, roles: ['ADMINISTRATOR', 'DOCTOR', 'RECEPTIONIST'] },
  { to: '/patients', label: 'Pacientes', icon: Users, roles: ['ADMINISTRATOR', 'DOCTOR', 'RECEPTIONIST'] },
  { to: '/consultation', label: 'Nueva Consulta', icon: FilePlus, roles: ['ADMINISTRATOR', 'DOCTOR'] },
  { to: '/appointments', label: 'Agenda', icon: Calendar, roles: ['ADMINISTRATOR', 'DOCTOR', 'RECEPTIONIST'] },
  { to: '/reports', label: 'Reportes', icon: BarChart2, roles: ['ADMINISTRATOR'] },
]

export function Sidebar() {
  const { profile } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const visibleItems = navItems.filter(
    (item) => profile && item.roles.includes(profile.role),
  )

  const roleLabel =
    profile?.role === 'ADMINISTRATOR'
      ? 'Administrador'
      : profile?.role === 'DOCTOR'
        ? 'Médico'
        : 'Secretaría'

  return (
    <aside
      className={`relative flex h-full flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out shadow-subtle ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header / Branding */}
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-sm">
            <Activity className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col animate-fade-in">
              <span className="text-sm font-bold tracking-tight text-slate-900 leading-none">
                Consulta Práctica
              </span>
              <span className="mt-1 text-[10px] font-semibold text-primary-600 uppercase tracking-widest leading-none">
                Web Edition
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5 p-3">
        {visibleItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-primary-50/80 text-primary-700 font-semibold shadow-subtle border border-primary-200/50'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                } ${collapsed ? 'justify-center px-0' : ''}`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Profile & Footer */}
      <div className="border-t border-slate-100 p-3">
        {!collapsed ? (
          <div className="rounded-xl bg-slate-50/80 p-3 border border-slate-100 animate-fade-in flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-xs">
              {profile?.full_name?.charAt(0) || 'M'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800">
                {profile?.full_name || 'Usuario'}
              </p>
              <p className="truncate text-[10px] text-slate-500 flex items-center gap-1">
                {profile?.role === 'ADMINISTRATOR' ? (
                  <Shield className="h-3 w-3 text-amber-500 inline" />
                ) : (
                  <Stethoscope className="h-3 w-3 text-primary-500 inline" />
                )}
                {roleLabel}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div
              title={profile?.full_name}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold text-xs"
            >
              {profile?.full_name?.charAt(0) || 'M'}
            </div>
          </div>
        )}
        {!collapsed && (
          <div className="mt-2 text-center text-[10px] font-medium text-slate-400">
            v2.0.0 — Sistema Clínico
          </div>
        )}
      </div>
    </aside>
  )
}
