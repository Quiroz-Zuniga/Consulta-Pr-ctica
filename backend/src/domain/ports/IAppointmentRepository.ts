import type { Appointment, AppointmentStatus, VideoSessionStatus, ConsultationType } from '../entities/Appointment.js';

export interface UpdateVideoSessionInput {
  videoRoomName: string;
  videoRoomUrl: string;
  videoSessionStatus: VideoSessionStatus;
  consultationType?: ConsultationType;
}

export interface IAppointmentRepository {
  findById(id: string, token?: string): Promise<Appointment | null>;
  findUpcomingWithoutReminder(windowHours?: number): Promise<Appointment[]>;
  updateStatus(id: string, status: AppointmentStatus, token?: string): Promise<void>;
  updateReminderSent(id: string, sent: boolean): Promise<void>;
  updateVideoSession(id: string, data: UpdateVideoSessionInput, token?: string): Promise<void>;
  save(appointment: Appointment, token?: string): Promise<void>;
}
