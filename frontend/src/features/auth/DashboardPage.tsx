import { Link } from 'react-router-dom'
import {
  Users,
  FilePlus,
  Calendar,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Stethoscope,
  BookOpen,
} from 'lucide-react'
import { useAuth } from './AuthContext'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { BmiCalculatorWidget } from './components/BmiCalculatorWidget'
import { Cie10QuickSelectorWidget } from './components/Cie10QuickSelectorWidget'

export function DashboardPage() {
  const { profile } = useAuth()

  const roleLabel =
    profile?.role === 'ADMINISTRATOR'
      ? 'Médico Administrador'
      : profile?.role === 'DOCTOR'
        ? 'Médico Especialista'
        : 'Secretaria / Asistente'

  const canConsult = profile?.role === 'ADMINISTRATOR' || profile?.role === 'DOCTOR'

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-8">
      {/* Header Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 p-8 text-white shadow-elevated border border-slate-800">
        <div className="absolute -right-10 -top-10 h-64 w-64 rounded-full bg-primary-600/10 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="primary" dot size="md" className="bg-primary-950/80 text-primary-300 border-primary-800">
                {roleLabel}
              </Badge>
              <span className="text-xs text-slate-400 font-mono">Sesión Activa</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Bienvenido, Dr. {profile?.full_name}
            </h2>
            <p className="text-xs md:text-sm text-slate-300 max-w-xl leading-relaxed">
              Panel principal de gestión médica. Accede rápidamente a los expedientes de pacientes, agenda en tiempo real, expediente documental y herramientas de diagnóstico.
            </p>
          </div>
          {canConsult && (
            <Link to="/consultation">
              <Button
                variant="primary"
                size="lg"
                leftIcon={<FilePlus className="h-5 w-5" />}
                className="shadow-lg shadow-primary-600/30 whitespace-nowrap"
              >
                Nueva Consulta
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Main Action Modules Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary-600" />
            <span>Módulos de Gestión</span>
          </h3>
          <span className="text-xs text-slate-500">Acceso rápido a las funciones del sistema</span>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <ActionCard
            title="Pacientes"
            description="Gestiona el catálogo de expedientes clínicos y datos demográficos."
            link="/patients"
            icon={Users}
            badgeText="Catálogo"
            accentColor="blue"
          />

          {canConsult && (
            <ActionCard
              title="Nueva Consulta"
              description="Registra nota SOAP tripartita y genera receta PDF estandarizada."
              link="/consultation"
              icon={FilePlus}
              badgeText="Médicos"
              accentColor="emerald"
            />
          )}

          <ActionCard
            title="Agenda de Citas"
            description="Calendario interactivo y cola de atención diaria en tiempo real."
            link="/appointments"
            icon={Calendar}
            badgeText="Tiempo Real"
            accentColor="amber"
          />

          <ActionCard
            title="Documentos Clínicos"
            description="Almacenamiento seguro de laboratorios, recetas y estudios."
            link="/patients"
            icon={FolderOpen}
            badgeText="Documental"
            accentColor="purple"
          />
        </div>
      </div>

      {/* Section 2: Clinical Tools & Calculators */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Interactive BMI Calculator */}
        <div className="lg:col-span-7">
          <BmiCalculatorWidget />
        </div>

        {/* Right Column: CIE-10 & Medical Protocol Interactive Selector */}
        <div className="lg:col-span-5">
          <Cie10QuickSelectorWidget canConsult={canConsult} />
        </div>
      </div>

      {/* System Status & Operational Highlights */}
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="bg-slate-50/50">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-700 shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase">Inmutabilidad Legal</h4>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Las notas clínicas guardadas quedan bloqueadas automáticamente, garantizando cumplimiento normativo.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50/50">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-700 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase">Catálogo CIE-10</h4>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Búsqueda instantánea de diagnósticos estandarizados para recetas y registros médicos.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-50/50">
          <CardContent className="p-5 flex items-start gap-4">
            <div className="rounded-xl bg-amber-100 p-3 text-amber-700 shrink-0">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase">Actualización en Tiempo Real</h4>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                Actualizaciones inmediatas de la agenda entre recepción y consultorio sin recargar.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ActionCard({
  title,
  description,
  link,
  icon: Icon,
  badgeText,
  accentColor,
}: {
  title: string
  description: string
  link: string
  icon: any
  badgeText: string
  accentColor: 'blue' | 'emerald' | 'amber' | 'purple'
}) {
  const iconBg = {
    blue: 'bg-primary-100 text-primary-700 group-hover:bg-primary-600 group-hover:text-white',
    emerald: 'bg-emerald-100 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white',
    amber: 'bg-amber-100 text-amber-700 group-hover:bg-amber-600 group-hover:text-white',
    purple: 'bg-purple-100 text-purple-700 group-hover:bg-purple-600 group-hover:text-white',
  }[accentColor]

  return (
    <Link to={link} className="group block">
      <Card hoverable className="h-full border-slate-200">
        <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-all duration-200 ${iconBg}`}>
                <Icon className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                {badgeText}
              </span>
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
                {title}
              </h4>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-primary-600 pt-2 border-t border-slate-100">
            <span>Acceder al módulo</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
