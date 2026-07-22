export interface VideoConferenceRoom {
  roomName: string;
  roomUrl: string;
}

export interface IVideoConferenceService {
  generateRoomForAppointment(appointmentId: string): Promise<VideoConferenceRoom>;
}
