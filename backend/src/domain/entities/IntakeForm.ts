export type IntakeFormStatus = 'pending' | 'submitted' | 'expired';

export interface IntakeClinicalData {
  chiefComplaint?: string;
  symptoms?: string;
  symptomDuration?: string;
  allergies?: string;
  currentMedications?: string;
  medicalHistoryNotes?: string;
  additionalNotes?: string;
}

export interface IntakeForm {
  id: string;
  patientId: string;
  patientName?: string;
  appointmentId?: string;
  status: IntakeFormStatus;
  accessToken: string;
  tokenExpiresAt: Date;
  submittedAt?: Date;
  formData?: IntakeClinicalData;
  createdAt: Date;
}
