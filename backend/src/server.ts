import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { supabaseAdmin } from './infrastructure/supabase/SupabaseClient.js';
import { PostgresPatientRepository } from './infrastructure/supabase/PostgresPatientRepository.js';
import { PostgresMedicalHistoryRepository } from './infrastructure/supabase/PostgresMedicalHistoryRepository.js';
import { PostgresMedicalDocumentRepository } from './infrastructure/supabase/PostgresMedicalDocumentRepository.js';
import { PostgresCIE10Repository } from './infrastructure/supabase/PostgresCIE10Repository.js';
import { PostgresAppointmentRepository } from './infrastructure/supabase/PostgresAppointmentRepository.js';
import { PostgresNotificationLogRepository } from './infrastructure/supabase/PostgresNotificationLogRepository.js';
import { PostgresIntakeFormRepository } from './infrastructure/supabase/PostgresIntakeFormRepository.js';
import { PostgresPaymentRepository } from './infrastructure/supabase/PostgresPaymentRepository.js';
import { PostgresAuditLogRepository } from './infrastructure/supabase/PostgresAuditLogRepository.js';
import { PostgresReportingRepository } from './infrastructure/supabase/PostgresReportingRepository.js';
import { PdfKitReportService } from './infrastructure/pdf/PdfKitReportService.js';
import { CsvJsonExportService } from './infrastructure/utils/CsvJsonExportService.js';
import { SupabaseAuthService } from './infrastructure/supabase/SupabaseAuthService.js';
import { PdfKitService } from './infrastructure/pdf/PdfKitService.js';
import { SupabaseStorageService } from './infrastructure/storage/SupabaseStorageService.js';
import { WhatsAppNotificationService } from './infrastructure/notifications/WhatsAppNotificationService.js';
import { JitsiVideoConferenceService } from './infrastructure/video/JitsiVideoConferenceService.js';
import { AuthenticateUser } from './application/use-cases/AuthenticateUser.js';
import { SearchCIE10 } from './application/use-cases/SearchCIE10.js';
import { RegisterConsultation } from './application/use-cases/RegisterConsultation.js';
import { SendAppointmentReminder } from './application/use-cases/SendAppointmentReminder.js';
import { ScheduleUpcomingReminders } from './application/use-cases/ScheduleUpcomingReminders.js';
import { CreateIntakeForm } from './application/use-cases/CreateIntakeForm.js';
import { GetIntakeFormByToken } from './application/use-cases/GetIntakeFormByToken.js';
import { SubmitIntakeForm } from './application/use-cases/SubmitIntakeForm.js';
import { GetPatientIntakeForms } from './application/use-cases/GetPatientIntakeForms.js';
import { CreateVideoConsultation } from './application/use-cases/CreateVideoConsultation.js';
import { GetVideoConsultationLink } from './application/use-cases/GetVideoConsultationLink.js';
import { RegisterPayment } from './application/use-cases/RegisterPayment.js';
import { UpdatePaymentStatus } from './application/use-cases/UpdatePaymentStatus.js';
import { GetPaymentsByAppointment } from './application/use-cases/GetPaymentsByAppointment.js';
import { GetPatientPaymentsSummary } from './application/use-cases/GetPatientPaymentsSummary.js';
import { LogAuditEvent } from './application/use-cases/LogAuditEvent.js';
import { ExportPatientRecord } from './application/use-cases/ExportPatientRecord.js';
import { ExportPatientDataCsvJson } from './application/use-cases/ExportPatientDataCsvJson.js';
import { GenerateClinicReport } from './application/use-cases/GenerateClinicReport.js';
import { authRoutes } from './interfaces/routes/authRoutes.js';
import { patientRoutes } from './interfaces/routes/patientRoutes.js';
import { consultationRoutes } from './interfaces/routes/consultationRoutes.js';
import { cie10Routes } from './interfaces/routes/cie10Routes.js';
import { documentRoutes } from './interfaces/routes/documentRoutes.js';
import { appointmentRoutes } from './interfaces/routes/appointmentRoutes.js';
import { intakeRoutes } from './interfaces/routes/intakeRoutes.js';
import { videoRoutes } from './interfaces/routes/videoRoutes.js';
import { paymentRoutes } from './interfaces/routes/paymentRoutes.js';
import { reportRoutes } from './interfaces/routes/reportRoutes.js';
import { startReminderCronJob } from './infrastructure/jobs/reminderCronJob.js';

const server = Fastify({
  logger: {
    level: 'info',
  },
});

await server.register(cors, {
  origin: true,
  credentials: true,
});

await server.register(rateLimit, {
  global: false,
});

const patientRepository = new PostgresPatientRepository();
const historyRepository = new PostgresMedicalHistoryRepository();
const documentRepository = new PostgresMedicalDocumentRepository();
const appointmentRepository = new PostgresAppointmentRepository();
const notificationLogRepository = new PostgresNotificationLogRepository();
const intakeFormRepository = new PostgresIntakeFormRepository();
const paymentRepository = new PostgresPaymentRepository();
const auditLogRepository = new PostgresAuditLogRepository();
const reportingRepository = new PostgresReportingRepository();
const pdfReportService = new PdfKitReportService();
const csvJsonExportService = new CsvJsonExportService();
const notificationService = new WhatsAppNotificationService();
const videoConferenceService = new JitsiVideoConferenceService();
const authService = new SupabaseAuthService();
const pdfService = new PdfKitService();
const storageService = new SupabaseStorageService();

const authenticateUser = new AuthenticateUser(authService);
const cie10Repository = new PostgresCIE10Repository();
const searchCIE10 = new SearchCIE10(cie10Repository);
const registerConsultation = new RegisterConsultation(
  patientRepository,
  historyRepository,
  pdfService,
  storageService,
);
const sendAppointmentReminder = new SendAppointmentReminder(
  appointmentRepository,
  patientRepository,
  notificationService,
  notificationLogRepository,
);
const scheduleUpcomingReminders = new ScheduleUpcomingReminders(
  appointmentRepository,
  sendAppointmentReminder,
);

const createIntakeForm = new CreateIntakeForm(intakeFormRepository, patientRepository);
const getIntakeFormByToken = new GetIntakeFormByToken(intakeFormRepository);
const submitIntakeForm = new SubmitIntakeForm(intakeFormRepository);
const getPatientIntakeForms = new GetPatientIntakeForms(intakeFormRepository);

const createVideoConsultation = new CreateVideoConsultation(appointmentRepository, videoConferenceService);
const getVideoConsultationLink = new GetVideoConsultationLink(appointmentRepository);

const registerPayment = new RegisterPayment(paymentRepository, patientRepository);
const updatePaymentStatus = new UpdatePaymentStatus(paymentRepository);
const getPaymentsByAppointment = new GetPaymentsByAppointment(paymentRepository);
const getPatientPaymentsSummary = new GetPatientPaymentsSummary(paymentRepository);

const exportPatientRecord = new ExportPatientRecord(reportingRepository, pdfReportService, auditLogRepository);
const exportPatientDataCsvJson = new ExportPatientDataCsvJson(reportingRepository, csvJsonExportService, auditLogRepository);
const generateClinicReport = new GenerateClinicReport(reportingRepository, pdfReportService, auditLogRepository);

authRoutes(server, authenticateUser);
patientRoutes(server, patientRepository);
consultationRoutes(server, registerConsultation);
cie10Routes(server, searchCIE10);
documentRoutes(server, documentRepository);
appointmentRoutes(server, sendAppointmentReminder);
intakeRoutes(
  server,
  createIntakeForm,
  getIntakeFormByToken,
  submitIntakeForm,
  getPatientIntakeForms,
);
videoRoutes(
  server,
  createVideoConsultation,
  getVideoConsultationLink,
  getIntakeFormByToken,
);
reportRoutes(
  server,
  exportPatientRecord,
  exportPatientDataCsvJson,
  generateClinicReport,
  auditLogRepository,
);
paymentRoutes(
  server,
  registerPayment,
  updatePaymentStatus,
  getPaymentsByAppointment,
  getPatientPaymentsSummary,
);

// Inicializar Job Programado de Recordatorios de Citas (Cron)
startReminderCronJob(scheduleUpcomingReminders);

server.get('/health', async (request, reply) => {
  try {
    const { data, error } = await supabaseAdmin.from('users').select('count', { count: 'exact', head: true });
    if (error) {
      return reply.status(500).send({ status: 'error', supabaseConnected: false, error: error.message });
    }
    return reply.send({ status: 'ok', supabaseConnected: true, userCount: data });
  } catch (err: any) {
    return reply.status(500).send({ status: 'error', supabaseConnected: false, error: err.message });
  }
});

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const host = process.env.HOST || '0.0.0.0';

const start = async () => {
  try {
    await server.listen({ port, host });
    const memoryUsage = process.memoryUsage();
    server.log.info(
      `Server started on ${host}:${port} | RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
    );
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

export default server;
