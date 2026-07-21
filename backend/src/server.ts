import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { supabaseAdmin } from './infrastructure/supabase/SupabaseClient.js';
import { PostgresPatientRepository } from './infrastructure/supabase/PostgresPatientRepository.js';
import { PostgresMedicalHistoryRepository } from './infrastructure/supabase/PostgresMedicalHistoryRepository.js';
import { PostgresCIE10Repository } from './infrastructure/supabase/PostgresCIE10Repository.js';
import { SupabaseAuthService } from './infrastructure/supabase/SupabaseAuthService.js';
import { PdfKitService } from './infrastructure/pdf/PdfKitService.js';
import { SupabaseStorageService } from './infrastructure/storage/SupabaseStorageService.js';
import { AuthenticateUser } from './application/use-cases/AuthenticateUser.js';
import { SearchCIE10 } from './application/use-cases/SearchCIE10.js';
import { RegisterConsultation } from './application/use-cases/RegisterConsultation.js';
import { authRoutes } from './interfaces/routes/authRoutes.js';
import { patientRoutes } from './interfaces/routes/patientRoutes.js';
import { consultationRoutes } from './interfaces/routes/consultationRoutes.js';
import { cie10Routes } from './interfaces/routes/cie10Routes.js';

const server = Fastify({
  logger: {
    level: 'info',
  },
});

await server.register(cors, {
  origin: true,
  credentials: true,
});

const patientRepository = new PostgresPatientRepository();
const historyRepository = new PostgresMedicalHistoryRepository();
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

authRoutes(server, authenticateUser);
patientRoutes(server, patientRepository);
consultationRoutes(server, registerConsultation);
cie10Routes(server, searchCIE10);

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
