import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { LoginPage } from './features/auth/LoginPage'
import { DashboardPage } from './features/auth/DashboardPage'
import { PatientListPage } from './features/patients/PatientListPage'
import { PatientFormPage } from './features/patients/PatientFormPage'
import { ConsultationForm } from './features/consultation/ConsultationForm'
import { AppointmentPage } from './features/appointments/AppointmentPage'
import { PublicIntakeFormPage } from './features/intake/PublicIntakeFormPage'
import { PublicVideoCallPage } from './features/video/PublicVideoCallPage'
import { ReportsPage } from './features/reports/ReportsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/intake/:token" element={<PublicIntakeFormPage />} />
      <Route path="/video/:id" element={<PublicVideoCallPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/patients" element={<PatientListPage />} />
        <Route path="/patients/new" element={<PatientFormPage />} />
        <Route path="/patients/:id" element={<PatientFormPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute allowedRoles={['ADMINISTRATOR', 'DOCTOR']} />
        }
      >
        <Route path="/consultation" element={<ConsultationForm />} />
      </Route>

      <Route
        element={
          <ProtectedRoute allowedRoles={['ADMINISTRATOR', 'DOCTOR', 'RECEPTIONIST']} />
        }
      >
        <Route path="/appointments" element={<AppointmentPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute allowedRoles={['ADMINISTRATOR']} />
        }
      >
        <Route path="/reports" element={<ReportsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
