import type { IAppointmentRepository } from '../../domain/ports/IAppointmentRepository.js';

export interface VideoConsultationLinkOutput {
  appointmentId: string;
  patientName?: string;
  doctorName?: string;
  appointmentDate: Date;
  roomName?: string;
  roomUrl?: string;
  videoSessionStatus: string;
  consultationType: string;
  hasVideoRoom: boolean;
}

export class GetVideoConsultationLink {
  constructor(private readonly appointmentRepo: IAppointmentRepository) {}

  async execute(appointmentId: string, token?: string): Promise<VideoConsultationLinkOutput> {
    if (!appointmentId) {
      throw new Error('El ID de la cita es requerido.');
    }

    const appointment = await this.appointmentRepo.findById(appointmentId, token);
    if (!appointment) {
      throw new Error(`Cita con ID ${appointmentId} no encontrada.`);
    }

    const hasVideoRoom = Boolean(appointment.videoRoomName && appointment.videoRoomUrl);

    return {
      appointmentId: appointment.id,
      patientName: appointment.patientName,
      doctorName: appointment.doctorName,
      appointmentDate: appointment.appointmentDate,
      roomName: appointment.videoRoomName,
      roomUrl: appointment.videoRoomUrl,
      videoSessionStatus: appointment.videoSessionStatus || 'not_created',
      consultationType: appointment.consultationType || 'in_person',
      hasVideoRoom,
    };
  }
}
