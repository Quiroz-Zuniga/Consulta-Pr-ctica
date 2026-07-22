import type {
  INotificationService,
  NotificationChannel,
  NotificationPayload,
  NotificationSendResult,
} from '../../domain/ports/INotificationService.js';

export class WhatsAppNotificationService implements INotificationService {
  private readonly apiToken: string;
  private readonly phoneId: string;
  private readonly templateName: string;

  constructor() {
    this.apiToken = (process.env.WHATSAPP_API_TOKEN || '').trim();
    this.phoneId = (process.env.WHATSAPP_PHONE_ID || '').trim();
    this.templateName = (process.env.WHATSAPP_TEMPLATE_NAME || 'recordatorio_cita_medica').trim();
  }

  async send(
    channel: NotificationChannel,
    payload: NotificationPayload,
    appointmentId: string,
  ): Promise<NotificationSendResult> {
    if (channel !== 'whatsapp') {
      return { success: false, error: `Canal ${channel} no soportado por WhatsAppNotificationService` };
    }

    if (!payload.to) {
      return { success: false, error: 'Número de teléfono del paciente no especificado.' };
    }

    // Normalizar a formato E.164 sin espacios (ej. +50489831488 -> 50489831488 para Meta API)
    const cleanedPhone = payload.to.replace(/\s+/g, '').replace(/[^\d+]/g, '').replace(/^\+/, '');

    // Comprobar si hay credenciales reales de Meta Cloud API
    const isMock = !this.apiToken || !this.phoneId || this.apiToken.startsWith('your-') || this.phoneId.startsWith('your-');

    if (isMock) {
      console.warn(
        `⚠️ [MODO SIMULADO ACTIVO - WHATSAPP] El mensaje NO se envió a la API real de Meta porque WHATSAPP_API_TOKEN o WHATSAPP_PHONE_ID no tienen un token/ID válido. Teléfono: +${cleanedPhone}, Plantilla: '${this.templateName}'`,
      );
      return {
        success: true,
        messageId: `sim_${Date.now()}_${appointmentId}`,
      };
    }

    try {
      const url = `https://graph.facebook.com/v18.0/${this.phoneId}/messages`;

      const requestBody = {
        messaging_product: 'whatsapp',
        to: cleanedPhone,
        type: 'template',
        template: {
          name: this.templateName,
          language: { code: 'es_MX' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: payload.patientName },
                { type: 'text', text: payload.appointmentDate },
                { type: 'text', text: payload.appointmentTime },
                { type: 'text', text: payload.doctorName || 'Médico Tratante' },
              ],
            },
          ],
        },
      };

      console.log(`[WHATSAPP META API REAL] Enviando petición a ${url} para +${cleanedPhone}...`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = (await response.json()) as any;

      if (!response.ok) {
        const errorMsg = data.error?.message || response.statusText || 'Error en Meta Cloud API';
        console.error('[WHATSAPP META API ERROR RES]', JSON.stringify(data, null, 2));
        return { success: false, error: errorMsg };
      }

      const messageId = data.messages?.[0]?.id || `wamid_${Date.now()}`;
      return { success: true, messageId };
    } catch (err: any) {
      console.error('[WHATSAPP META API EXCEPTION]', err);
      return { success: false, error: err.message || 'Error de red en envío WhatsApp' };
    }
  }
}
