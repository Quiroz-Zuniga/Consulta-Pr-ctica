export interface DateRange {
  from: Date;
  to: Date;
}

export interface AppointmentsStats {
  total: number;
  completed: number;
  cancelled: number;
  scheduled: number;
  noShows: number;
  noShowRate: number; // percentage 0-100
}

export interface RevenueStats {
  totalRevenue: number;
  totalPaid: number;
  totalPending: number;
  totalRefunded: number;
  currency: string;
  byMethod: Array<{
    method: string;
    amount: number;
    count: number;
  }>;
}

export interface TopDiagnosis {
  code: string;
  description: string;
  count: number;
}

export interface PatientVisitFrequency {
  patientId: string;
  patientName: string;
  visitCount: number;
  lastVisit: Date;
}

export interface ClinicReportData {
  dateRange: DateRange;
  generatedAt: Date;
  appointments: AppointmentsStats;
  revenue: RevenueStats;
  topDiagnoses: TopDiagnosis[];
  patientVisitFrequency: PatientVisitFrequency[];
  totalPatients: number;
  newPatients: number;
}

export interface PatientExpedientData {
  patient: {
    id: string;
    fullName: string;
    birthDate?: Date;
    gender?: string;
    phone: string;
    photoUrl?: string;
    isProtected: boolean;
    createdAt: Date;
  };
  medicalHistories: Array<{
    id: string;
    cie10Code?: string;
    clinicalNote: string;
    isLocked: boolean;
    createdAt: Date;
    doctorName?: string;
  }>;
  prescriptions: Array<{
    id: string;
    historyId: string;
    medications: Array<{
      name: string;
      dosage: string;
      frequency: string;
      durationDays: number;
    }>;
    customIndications?: string;
    nextAppointment?: Date | null;
    createdAt: Date;
  }>;
  intakeForms: Array<{
    id: string;
    status: string;
    chiefComplaint?: string;
    symptoms?: string;
    allergies?: string;
    currentMedications?: string;
    medicalBackground?: string;
    createdAt: Date;
    submittedAt?: Date;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    status: string;
    notes?: string;
    paidAt?: Date;
    createdAt: Date;
  }>;
  appointments: Array<{
    id: string;
    appointmentDate: Date;
    status: string;
    doctorName?: string;
    notes?: string;
    createdAt: Date;
  }>;
}

export interface IReportingRepository {
  getPatientExpedientData(patientId: string): Promise<PatientExpedientData>;
  getAppointmentsStats(dateRange: DateRange): Promise<AppointmentsStats>;
  getRevenueStats(dateRange: DateRange): Promise<RevenueStats>;
  getNoShowRate(dateRange: DateRange): Promise<number>;
  getTopDiagnoses(dateRange: DateRange, limit?: number): Promise<TopDiagnosis[]>;
  getPatientVisitFrequency(dateRange: DateRange, limit?: number): Promise<PatientVisitFrequency[]>;
  getClinicReport(dateRange: DateRange): Promise<ClinicReportData>;
}
