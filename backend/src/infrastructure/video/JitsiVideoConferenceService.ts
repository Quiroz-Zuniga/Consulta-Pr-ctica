import { randomBytes } from 'node:crypto';
import type { IVideoConferenceService, VideoConferenceRoom } from '../../domain/ports/IVideoConferenceService.js';

export class JitsiVideoConferenceService implements IVideoConferenceService {
  private readonly jitsiDomain: string;

  constructor() {
    this.jitsiDomain = (process.env.JITSI_DOMAIN || 'meet.jit.si').replace(/^https?:\/\//, '').replace(/\/$/, '');
  }

  async generateRoomForAppointment(appointmentId: string): Promise<VideoConferenceRoom> {
    // Generar un token aleatorio seguro de 16 caracteres hexadecimales (8 bytes)
    const randomSecret = randomBytes(8).toString('hex');
    const shortId = appointmentId.replace(/-/g, '').slice(0, 8);

    // Nombre de sala impredecible sin PII (sin nombres ni teléfonos de pacientes)
    const roomName = `cp-consultation-${shortId}-${randomSecret}`;
    const roomUrl = `https://${this.jitsiDomain}/${roomName}`;

    return {
      roomName,
      roomUrl,
    };
  }
}
