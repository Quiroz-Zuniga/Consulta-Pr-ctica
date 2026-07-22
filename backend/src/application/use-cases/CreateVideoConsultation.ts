import type { IAppointmentRepository } from '../../domain/ports/IAppointmentRepository.js';
import type { IVideoConferenceService } from '../../domain/ports/IVideoConferenceService.js';
import type { VideoSessionStatus } from '../../domain/entities/Appointment.js';

export interface CreateVideoConsultationOutput {
  appointmentId: string;
  roomName: string;
  roomUrl: string;
  videoSessionStatus: VideoSessionStatus;
  consultationType: 'video';
}

export class CreateVideoConsultation {
  constructor(
    private readonly appointmentRepo: IAppointmentRepository,
    private readonly videoService: IVideoConferenceService,
  ) {}

  async execute(appointmentId: string, token?: string): Promise<CreateVideoConsultationOutput> {
    if (!appointmentId) {
      throw new Error('El ID de la cita es requerido.');
    }

    const appointment = await this.appointmentRepo.findById(appointmentId, token);
    if (!appointment) {
      throw new Error(`Cita con ID ${appointmentId} no encontrada.`);
    }

    if (appointment.status === 'cancelled') {
      throw new Error('No se puede crear una videoconsulta para una cita cancelada.');
    }

    // Si ya fue creada previamente, reutilizar la sala existente
    if (appointment.videoRoomName && appointment.videoRoomUrl) {
      return {
        appointmentId: appointment.id,
        roomName: appointment.videoRoomName,
        roomUrl: appointment.videoRoomUrl,
        videoSessionStatus: appointment.videoSessionStatus || 'scheduled',
        consultationType: 'video',
      };
    }

    // Generar sala impredecible con Jitsi Meet
    const room = await this.videoService.generateRoomForAppointment(appointmentId);

    // Persistir en base de datos
    await this.appointmentRepo.updateVideoSession(
      appointmentId,
      {
        videoRoomName: room.roomName,
        videoRoomUrl: room.roomUrl,
        videoSessionStatus: 'scheduled',
        consultationType: 'video',
      },
      token,
    );

    return {
      appointmentId: appointment.id,
      roomName: room.roomName,
      roomUrl: room.roomUrl,
      videoSessionStatus: 'scheduled',
      consultationType: 'video',
    };
  }
}
