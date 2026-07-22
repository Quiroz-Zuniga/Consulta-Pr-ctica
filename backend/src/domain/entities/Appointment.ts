export type AppointmentStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type VideoSessionStatus = 'not_created' | 'scheduled' | 'active' | 'ended';
export type ConsultationType = 'in_person' | 'video';

export interface Appointment {
  id: string;
  patientId: string;
  patientName?: string;
  doctorId?: string;
  doctorName?: string;
  specialty?: string;
  appointmentDate: Date;
  reason?: string;
  status: AppointmentStatus;
  reminderSent?: boolean;
  videoRoomName?: string;
  videoRoomUrl?: string;
  videoSessionStatus?: VideoSessionStatus;
  consultationType?: ConsultationType;
  createdAt: Date;
}
