import { useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react'
import type { Appointment } from '../types'
import { Button } from '../../../components/ui/Button'

interface MonthlyCalendarProps {
  currentMonth: Date
  onMonthChange: (newDate: Date) => void
  selectedDate: Date
  onSelectDate: (date: Date) => void
  appointments: Appointment[]
}

export function MonthlyCalendar({
  currentMonth,
  onMonthChange,
  selectedDate,
  onSelectDate,
  appointments,
}: MonthlyCalendarProps) {
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const handlePrevMonth = () => {
    onMonthChange(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    onMonthChange(new Date(year, month + 1, 1))
  }

  const handleToday = () => {
    const today = new Date()
    onMonthChange(new Date(today.getFullYear(), today.getMonth(), 1))
    onSelectDate(today)
  }

  // Generate calendar grid
  const daysGrid = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1)
    const lastDayOfMonth = new Date(year, month + 1, 0)
    
    // Convert Sunday-indexed day (0=Sun) to Monday-indexed (0=Mon...6=Sun)
    let startDayOfWeek = firstDayOfMonth.getDay() - 1
    if (startDayOfWeek === -1) startDayOfWeek = 6

    const daysInMonth = lastDayOfMonth.getDate()

    const days: Array<{
      date: Date
      isCurrentMonth: boolean
      isToday: boolean
      isSelected: boolean
      dateString: string
    }> = []

    // Previous month padding days
    const prevMonthLastDay = new Date(year, month, 0).getDate()
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay - i)
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        dateString: d.toISOString().split('T')[0],
      })
    }

    const todayStr = new Date().toISOString().split('T')[0]
    const selectedStr = selectedDate.toISOString().split('T')[0]

    // Current month days
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const d = new Date(year, month, dayNum)
      const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        isSelected: dStr === selectedStr,
        dateString: dStr,
      })
    }

    // Next month padding days to complete full grid (multiple of 7)
    const remaining = (7 - (days.length % 7)) % 7
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: false,
        isSelected: false,
        dateString: d.toISOString().split('T')[0],
      })
    }

    return days
  }, [year, month, selectedDate])

  // Map appointments count by date YYYY-MM-DD
  const appointmentsByDate = useMemo(() => {
    const map: Record<string, { total: number; scheduled: number; in_progress: number; completed: number; cancelled: number }> = {}

    appointments.forEach((apt) => {
      if (!apt.appointment_date) return
      const datePart = apt.appointment_date.split('T')[0]
      if (!map[datePart]) {
        map[datePart] = { total: 0, scheduled: 0, in_progress: 0, completed: 0, cancelled: 0 }
      }
      map[datePart].total += 1
      const st = apt.status as 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
      if (map[datePart][st] !== undefined) {
        map[datePart][st] += 1
      }
    })

    return map
  }, [appointments])

  const monthName = currentMonth.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  const dayHeaders = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header with Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              {capitalizedMonth}
            </h3>
            <p className="text-[11px] font-medium text-slate-500">
              Selecciona un día para ver la cola de atención
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="xs" onClick={handleToday}>
            Hoy
          </Button>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={handlePrevMonth}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-all"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {dayHeaders.map((dh) => (
          <div key={dh} className="text-[11px] font-bold uppercase tracking-wider text-slate-400 py-1">
            {dh}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {daysGrid.map((dayItem) => {
          const stats = appointmentsByDate[dayItem.dateString]
          const dayNumber = dayItem.date.getDate()

          return (
            <button
              key={dayItem.dateString}
              onClick={() => onSelectDate(dayItem.date)}
              className={`group relative flex flex-col items-center justify-between rounded-xl p-2 min-h-[64px] transition-all text-left ${
                !dayItem.isCurrentMonth ? 'opacity-35 hover:opacity-70 bg-slate-50/50' : ''
              } ${
                dayItem.isSelected
                  ? 'bg-primary-600 text-white shadow-md ring-2 ring-primary-400 ring-offset-1'
                  : dayItem.isToday
                  ? 'border-2 border-primary-500 bg-primary-50/40 text-primary-950 font-bold'
                  : 'border border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
              }`}
            >
              <div className="w-full flex items-center justify-between">
                <span
                  className={`text-xs font-semibold rounded-md h-5 min-w-[20px] px-1 flex items-center justify-center ${
                    dayItem.isSelected
                      ? 'text-white'
                      : dayItem.isToday
                      ? 'bg-primary-600 text-white font-extrabold'
                      : 'text-slate-700'
                  }`}
                >
                  {dayNumber}
                </span>

                {stats && stats.total > 0 && (
                  <span
                    className={`text-[10px] font-extrabold rounded-full px-1.5 py-0.5 ${
                      dayItem.isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {stats.total}
                  </span>
                )}
              </div>

              {/* Status Badges / Indicators */}
              <div className="w-full mt-1.5 flex items-center justify-center gap-1">
                {stats && (
                  <>
                    {stats.in_progress > 0 && (
                      <span
                        className={`h-2 w-2 rounded-full animate-ping ${
                          dayItem.isSelected ? 'bg-amber-300' : 'bg-amber-500'
                        }`}
                        title={`${stats.in_progress} en atención`}
                      />
                    )}
                    {stats.scheduled > 0 && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          dayItem.isSelected ? 'bg-sky-200' : 'bg-sky-500'
                        }`}
                        title={`${stats.scheduled} pendientes`}
                      />
                    )}
                    {stats.completed > 0 && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          dayItem.isSelected ? 'bg-emerald-200' : 'bg-emerald-500'
                        }`}
                        title={`${stats.completed} atendidas`}
                      />
                    )}
                    {stats.cancelled > 0 && (
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          dayItem.isSelected ? 'bg-rose-300' : 'bg-rose-400'
                        }`}
                        title={`${stats.cancelled} canceladas`}
                      />
                    )}
                  </>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
