import 'dotenv/config';
import { PostgresAppointmentRepository } from '../infrastructure/supabase/PostgresAppointmentRepository.js';
import { PostgresPatientRepository } from '../infrastructure/supabase/PostgresPatientRepository.js';
import { PostgresNotificationLogRepository } from '../infrastructure/supabase/PostgresNotificationLogRepository.js';
import { WhatsAppNotificationService } from '../infrastructure/notifications/WhatsAppNotificationService.js';
import { SendAppointmentReminder } from '../application/use-cases/SendAppointmentReminder.js';

async function main() {
  const appointmentRepo = new PostgresAppointmentRepository();
  const patientRepo = new PostgresPatientRepository();
  const notificationLogRepo = new PostgresNotificationLogRepository();
  const notificationService = new WhatsAppNotificationService();

  const useCase = new SendAppointmentReminder(
    appointmentRepo,
    patientRepo,
    notificationService,
    notificationLogRepo,
  );

  const appointmentId = 'a1b2c3d4-e5f6-7788-9900-112233445566';
  console.log(`Ejecutando SendAppointmentReminder para paciente Ingri (Cita ID: ${appointmentId})...`);

  const result = await useCase.execute(appointmentId, 'whatsapp');
  console.log('\n--- RESPUESTA DE META CLOUD API / REPO LOG ---');
  console.log(JSON.stringify(result, null, 2));
}

main().catch(console.error);
