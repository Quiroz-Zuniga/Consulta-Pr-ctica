import 'dotenv/config';
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { AuthenticateUser } from '../application/use-cases/AuthenticateUser.js';
import { SearchCIE10 } from '../application/use-cases/SearchCIE10.js';
import { RegisterConsultation } from '../application/use-cases/RegisterConsultation.js';
import { GeneratePrescription } from '../application/use-cases/GeneratePrescription.js';
import { UploadMedicalDocument } from '../application/use-cases/UploadMedicalDocument.js';
import { ListPatientDocuments } from '../application/use-cases/ListPatientDocuments.js';
import { ArchiveMedicalDocument } from '../application/use-cases/ArchiveMedicalDocument.js';
import { SendAppointmentReminder } from '../application/use-cases/SendAppointmentReminder.js';
import { ScheduleUpcomingReminders } from '../application/use-cases/ScheduleUpcomingReminders.js';
import { CreateIntakeForm } from '../application/use-cases/CreateIntakeForm.js';
import { GetIntakeFormByToken } from '../application/use-cases/GetIntakeFormByToken.js';
import { SubmitIntakeForm } from '../application/use-cases/SubmitIntakeForm.js';
import { CreateVideoConsultation } from '../application/use-cases/CreateVideoConsultation.js';
import { GetVideoConsultationLink } from '../application/use-cases/GetVideoConsultationLink.js';
import { RegisterPayment } from '../application/use-cases/RegisterPayment.js';
import { UpdatePaymentStatus } from '../application/use-cases/UpdatePaymentStatus.js';
import { GetPatientPaymentsSummary } from '../application/use-cases/GetPatientPaymentsSummary.js';

import type { IAuthService } from '../domain/ports/IAuthService.js';
import type { ICIE10Repository } from '../domain/ports/ICIE10Repository.js';
import type { IPatientRepository } from '../domain/ports/IPatientRepository.js';
import type { IMedicalHistoryRepository } from '../domain/ports/IMedicalHistoryRepository.js';
import type { IPdfGeneratorService } from '../domain/ports/IPdfGeneratorService.js';
import type { IStorageService } from '../domain/ports/IStorageService.js';
import type { IMedicalDocumentRepository } from '../domain/ports/IMedicalDocumentRepository.js';
import type { IAppointmentRepository } from '../domain/ports/IAppointmentRepository.js';
import type { INotificationService } from '../domain/ports/INotificationService.js';
import type { INotificationLogRepository } from '../domain/ports/INotificationLogRepository.js';
import type { IIntakeFormRepository } from '../domain/ports/IIntakeFormRepository.js';
import type { IVideoConferenceService } from '../domain/ports/IVideoConferenceService.js';
import type { IPaymentRepository } from '../domain/ports/IPaymentRepository.js';

import type { Patient } from '../domain/entities/Patient.js';
import type { MedicalHistory } from '../domain/entities/MedicalHistory.js';
import type { Prescription } from '../domain/entities/Prescription.js';
import type { CIE10Diagnosis } from '../domain/entities/CIE10Diagnosis.js';
import type { MedicalDocument } from '../domain/entities/MedicalDocument.js';
import type { Appointment } from '../domain/entities/Appointment.js';
import type { NotificationLog } from '../domain/entities/Notification.js';
import type { IntakeForm } from '../domain/entities/IntakeForm.js';
import { UserRole } from '../domain/entities/User.js';

describe('Phase 2 & Phase 1 Use Cases', () => {

  test('AuthenticateUser - executes login via IAuthService', async () => {
    const mockAuthService: IAuthService = {
      async signIn(email, password) {
        assert.equal(email, 'doctor@test.com');
        assert.equal(password, 'password123');
        return {
          accessToken: 'fake-jwt-token',
          user: {
            id: 'user-1',
            email: 'doctor@test.com',
            fullName: 'Dr. Test',
            role: UserRole.DOCTOR,
            isActive: true,
            createdAt: new Date(),
          },
          expiresAt: 1234567890,
        };
      },
      async verifyToken() {
        return null;
      },
    };

    const useCase = new AuthenticateUser(mockAuthService);
    const result = await useCase.execute({
      email: 'doctor@test.com',
      password: 'password123',
    });

    assert.equal(result.accessToken, 'fake-jwt-token');
    assert.equal(result.user.role, UserRole.DOCTOR);
  });

  test('SearchCIE10 - delegates search to ICIE10Repository', async () => {
    const mockCIE10Repo: ICIE10Repository = {
      async search(query: string): Promise<CIE10Diagnosis[]> {
        assert.equal(query, 'diabetes');
        return [
          { code: 'E11', description: 'Diabetes mellitus tipo 2', category: 'Endocrinas' },
        ];
      },
    };

    const useCase = new SearchCIE10(mockCIE10Repo);
    const results = await useCase.execute('diabetes');

    assert.equal(results.length, 1);
    assert.equal(results[0].code, 'E11');
  });

  test('RegisterConsultation - saves history with is_locked=true and generates PDF URL', async () => {
    const mockPatient: Patient = {
      id: 'patient-123',
      fullName: 'Paciente Test',
      birthDate: new Date('1990-01-01'),
      gender: 'M',
      phone: '12345678',
      photoUrl: '',
      isProtected: false,
      createdAt: new Date(),
    };

    let savedHistory: MedicalHistory | null = null;

    const mockPatientRepo: IPatientRepository = {
      async findById(id) {
        return id === 'patient-123' ? mockPatient : null;
      },
      async findAll() { return { data: [], total: 0, page: 1, pageSize: 20 }; },
      async search() { return { data: [], total: 0, page: 1, pageSize: 20 }; },
      async save() {},
      async update() {},
      async delete() {},
    };

    const mockHistoryRepo: IMedicalHistoryRepository = {
      async findById() { return null; },
      async findByPatient() { return []; },
      async save(history) {
        savedHistory = history;
      },
    };

    const mockPdfService: IPdfGeneratorService = {
      async generatePrescriptionPdf() {
        return Buffer.from('%PDF-dummy-content');
      },
    };

    const mockStorageService: IStorageService = {
      async uploadPdf(buffer, fileName) {
        assert.ok(fileName.startsWith('prescription_'));
        return `https://storage.supabase.co/signed/${fileName}`;
      },
    };

    const useCase = new RegisterConsultation(
      mockPatientRepo,
      mockHistoryRepo,
      mockPdfService,
      mockStorageService,
    );

    const response = await useCase.execute(
      {
        patientId: 'patient-123',
        cie10Code: 'J00',
        clinicalNote: 'Nota clinica de prueba',
        medications: [
          { name: 'Paracetamol', dosage: '500mg', frequency: '8h', durationDays: 5 },
        ],
        customIndications: 'Tomar con abundante agua',
        nextAppointment: null,
      },
      'doctor-456',
      'Dr. Test',
    );

    assert.ok(response.historyId);
    assert.ok(response.pdfUrl.includes('prescription_'));
    assert.notEqual(savedHistory, null);
    assert.equal(savedHistory!.isLocked, true, 'Medical history must be locked upon registration');
    assert.equal(savedHistory!.cie10Code, 'J00');
  });

  test('GeneratePrescription - generates and uploads PDF prescription', async () => {
    const mockPatient: Patient = {
      id: 'patient-123',
      fullName: 'Paciente Test',
      birthDate: new Date('1990-01-01'),
      gender: 'F',
      phone: '87654321',
      photoUrl: '',
      isProtected: false,
      createdAt: new Date(),
    };

    const mockPrescription: Prescription = {
      id: 'prescription-789',
      historyId: 'history-456',
      medications: [
        { name: 'Amoxicilina', dosage: '500mg', frequency: '8h', durationDays: 7 },
      ],
      customIndications: 'Completar tratamiento',
      nextAppointment: null,
      createdAt: new Date(),
    };

    const mockPatientRepo: IPatientRepository = {
      async findById(id) {
        return id === 'patient-123' ? mockPatient : null;
      },
      async findAll() { return { data: [], total: 0, page: 1, pageSize: 20 }; },
      async search() { return { data: [], total: 0, page: 1, pageSize: 20 }; },
      async save() {},
      async update() {},
      async delete() {},
    };

    const mockPdfService: IPdfGeneratorService = {
      async generatePrescriptionPdf(prescription, patient, doctorName) {
        assert.equal(doctorName, 'Dr. Smith');
        assert.equal(patient.id, 'patient-123');
        return Buffer.from('%PDF-test-file');
      },
    };

    const mockStorageService: IStorageService = {
      async uploadPdf(buffer, fileName) {
        assert.equal(fileName, 'prescription_prescription-789.pdf');
        return 'https://storage.supabase.co/signed/prescription_prescription-789.pdf';
      },
    };

    const useCase = new GeneratePrescription(
      mockPdfService,
      mockStorageService,
      mockPatientRepo,
    );

    const pdfUrl = await useCase.execute(mockPrescription, 'patient-123', 'Dr. Smith');
    assert.equal(pdfUrl, 'https://storage.supabase.co/signed/prescription_prescription-789.pdf');
  });

  test('UploadMedicalDocument - creates and saves medical document entity', async () => {
    let savedDocument: MedicalDocument | null = null;

    const mockDocRepo: IMedicalDocumentRepository = {
      async save(doc) {
        savedDocument = doc;
      },
      async findByPatientId() {
        return { data: [], total: 0, page: 1, pageSize: 20 };
      },
      async findById() { return null; },
      async updateStatus() {},
      async delete() {},
    };

    const useCase = new UploadMedicalDocument(mockDocRepo);
    const doc = await useCase.execute(
      {
        patientId: 'patient-100',
        title: ' Examen de Sangre ',
        category: 'laboratory',
        filePath: 'patient-100/lab_test.pdf',
        fileUrl: 'https://storage.supabase.co/lab_test.pdf',
        fileType: 'application/pdf',
        fileSize: 1024,
        notes: 'Resultados dentro de rango normal',
      },
      'user-1',
      'Dr. Test',
    );

    assert.ok(doc.id);
    assert.equal(doc.patientId, 'patient-100');
    assert.equal(doc.title, 'Examen de Sangre');
    assert.equal(doc.category, 'laboratory');
    assert.equal(doc.status, 'active');
    assert.equal(savedDocument, doc);
  });

  test('ListPatientDocuments - delegates query to IMedicalDocumentRepository', async () => {
    const sampleDoc: MedicalDocument = {
      id: 'doc-1',
      patientId: 'patient-100',
      title: 'Radiografía de Tórax',
      category: 'imaging',
      filePath: 'path/radio.png',
      fileUrl: 'https://storage.supabase.co/radio.png',
      fileType: 'image/png',
      fileSize: 2048,
      uploadedAt: new Date(),
      status: 'active',
    };

    const mockDocRepo: IMedicalDocumentRepository = {
      async save() {},
      async findByPatientId(patientId, options) {
        assert.equal(patientId, 'patient-100');
        assert.equal(options?.category, 'imaging');
        return { data: [sampleDoc], total: 1, page: 1, pageSize: 20 };
      },
      async findById() { return null; },
      async updateStatus() {},
      async delete() {},
    };

    const useCase = new ListPatientDocuments(mockDocRepo);
    const result = await useCase.execute('patient-100', { category: 'imaging' });

    assert.equal(result.total, 1);
    assert.equal(result.data.length, 1);
    assert.equal(result.data[0].title, 'Radiografía de Tórax');
  });

  test('ArchiveMedicalDocument - updates status of existing document', async () => {
    let updatedStatus: string | null = null;

    const mockDoc: MedicalDocument = {
      id: 'doc-55',
      patientId: 'patient-100',
      title: 'Consentimiento Informado',
      category: 'consent',
      filePath: 'path/consent.pdf',
      fileUrl: 'https://storage.supabase.co/consent.pdf',
      fileType: 'application/pdf',
      fileSize: 500,
      uploadedAt: new Date(),
      status: 'active',
    };

    const mockDocRepo: IMedicalDocumentRepository = {
      async save() {},
      async findByPatientId() {
        return { data: [], total: 0, page: 1, pageSize: 20 };
      },
      async findById(id) {
        return id === 'doc-55' ? mockDoc : null;
      },
      async updateStatus(id, status) {
        assert.equal(id, 'doc-55');
        updatedStatus = status;
      },
      async delete() {},
    };

    const useCase = new ArchiveMedicalDocument(mockDocRepo);
    await useCase.execute('doc-55', 'archived');

    assert.equal(updatedStatus, 'archived');
  });

  test('SendAppointmentReminder - successful send updates reminder_sent=true and logs sent status', async () => {
    const mockAppointment: Appointment = {
      id: 'apt-777',
      patientId: 'patient-999',
      patientName: 'Juan Pérez',
      appointmentDate: new Date('2026-07-25T10:00:00Z'),
      status: 'scheduled',
      reminderSent: false,
      createdAt: new Date(),
    };

    const mockPatient: Patient = {
      id: 'patient-999',
      fullName: 'Juan Pérez',
      birthDate: new Date('1985-05-10'),
      gender: 'Masculino',
      phone: '525551234567',
      photoUrl: '',
      isProtected: false,
      createdAt: new Date(),
    };

    let updatedReminderSent = false;
    let savedLog: NotificationLog | null = null;

    const mockAptRepo: IAppointmentRepository = {
      async findById(id) { return id === 'apt-777' ? mockAppointment : null; },
      async findUpcomingWithoutReminder() { return []; },
      async updateStatus() {},
      async updateReminderSent(id, sent) {
        assert.equal(id, 'apt-777');
        updatedReminderSent = sent;
      },
      async updateVideoSession() {},
      async save() {},
    };

    const mockPatientRepo: IPatientRepository = {
      async findById(id) { return id === 'patient-999' ? mockPatient : null; },
      async findAll() { return { data: [], total: 0, page: 1, pageSize: 20 }; },
      async search() { return { data: [], total: 0, page: 1, pageSize: 20 }; },
      async save() {},
      async update() {},
      async delete() {},
    };

    const mockNotificationService: INotificationService = {
      async send(channel, payload, appointmentId) {
        assert.equal(channel, 'whatsapp');
        assert.equal(payload.to, '525551234567');
        assert.equal(appointmentId, 'apt-777');
        return { success: true, messageId: 'wa-msg-100' };
      },
    };

    const mockLogRepo: INotificationLogRepository = {
      async save(log) {
        savedLog = log;
      },
      async findByAppointmentId() { return []; },
    };

    const useCase = new SendAppointmentReminder(
      mockAptRepo,
      mockPatientRepo,
      mockNotificationService,
      mockLogRepo,
    );

    const result = await useCase.execute('apt-777', 'whatsapp');

    assert.equal(result.success, true);
    assert.equal(result.messageId, 'wa-msg-100');
    assert.equal(updatedReminderSent, true, 'reminder_sent must be set to true on successful send');
    assert.notEqual(savedLog, null);
    assert.equal(savedLog!.status, 'sent');
  });

  test('SendAppointmentReminder - failed send logs status=failed and keeps reminder_sent=false for cron retry', async () => {
    const mockAppointment: Appointment = {
      id: 'apt-888',
      patientId: 'patient-999',
      patientName: 'Maria Garcia',
      appointmentDate: new Date('2026-07-26T15:00:00Z'),
      status: 'scheduled',
      reminderSent: false,
      createdAt: new Date(),
    };

    let updatedReminderSentCalled = false;
    let savedLog: NotificationLog | null = null;

    const mockAptRepo: IAppointmentRepository = {
      async findById(id) { return id === 'apt-888' ? mockAppointment : null; },
      async findUpcomingWithoutReminder() { return []; },
      async updateStatus() {},
      async updateReminderSent() {
        updatedReminderSentCalled = true;
      },
      async updateVideoSession() {},
      async save() {},
    };

    const mockPatientRepo: IPatientRepository = {
      async findById() { return null; },
      async findAll() { return { data: [], total: 0, page: 1, pageSize: 20 }; },
      async search() { return { data: [], total: 0, page: 1, pageSize: 20 }; },
      async save() {},
      async update() {},
      async delete() {},
    };

    const mockNotificationService: INotificationService = {
      async send() {
        return { success: false, error: 'Meta Cloud API 500 Server Error' };
      },
    };

    const mockLogRepo: INotificationLogRepository = {
      async save(log) {
        savedLog = log;
      },
      async findByAppointmentId() { return []; },
    };

    const useCase = new SendAppointmentReminder(
      mockAptRepo,
      mockPatientRepo,
      mockNotificationService,
      mockLogRepo,
    );

    const result = await useCase.execute('apt-888', 'whatsapp');

    assert.equal(result.success, false);
    assert.equal(result.error, 'Meta Cloud API 500 Server Error');
    assert.equal(updatedReminderSentCalled, false, 'reminder_sent must NOT be updated when send fails');
    assert.notEqual(savedLog, null);
    assert.equal(savedLog!.status, 'failed');
    assert.equal(savedLog!.errorMessage, 'Meta Cloud API 500 Server Error');
  });

  test('ScheduleUpcomingReminders - queries upcoming appointments without reminder and processes them', async () => {
    const upcomingList: Appointment[] = [
      {
        id: 'apt-1',
        patientId: 'p-1',
        appointmentDate: new Date(),
        status: 'scheduled',
        reminderSent: false,
        createdAt: new Date(),
      },
      {
        id: 'apt-2',
        patientId: 'p-2',
        appointmentDate: new Date(),
        status: 'scheduled',
        reminderSent: false,
        createdAt: new Date(),
      },
    ];

    const mockAptRepo: IAppointmentRepository = {
      async findById(id) {
        return upcomingList.find((a) => a.id === id) || null;
      },
      async findUpcomingWithoutReminder() {
        return upcomingList;
      },
      async updateStatus() {},
      async updateReminderSent() {},
      async updateVideoSession() {},
      async save() {},
    };

    const mockPatientRepo: IPatientRepository = {
      async findById() { return null; },
      async findAll() { return { data: [], total: 0, page: 1, pageSize: 20 }; },
      async search() { return { data: [], total: 0, page: 1, pageSize: 20 }; },
      async save() {},
      async update() {},
      async delete() {},
    };

    const mockNotificationService: INotificationService = {
      async send() {
        return { success: true, messageId: 'wa-cron-msg' };
      },
    };

    const mockLogRepo: INotificationLogRepository = {
      async save() {},
      async findByAppointmentId() { return []; },
    };

    const sendReminderUseCase = new SendAppointmentReminder(
      mockAptRepo,
      mockPatientRepo,
      mockNotificationService,
      mockLogRepo,
    );

    const scheduleUseCase = new ScheduleUpcomingReminders(mockAptRepo, sendReminderUseCase);
    const summary = await scheduleUseCase.execute(24);

    assert.equal(summary.processed, 2);
    assert.equal(summary.sent, 2);
    assert.equal(summary.failed, 0);
  });

  // ---------------------------------------------------------------------------
  // FASE 2: INTAKE DIGITAL USE CASES TESTS
  // ---------------------------------------------------------------------------

  test('CreateIntakeForm - creates intake form with 72h token linked to patient', async () => {
    const mockPatient: Patient = {
      id: 'patient-500',
      fullName: 'Ingri Caceres',
      phone: '+50489831488',
      photoUrl: '',
      isProtected: false,
      createdAt: new Date(),
    };

    let createdForm: IntakeForm | null = null;

    const mockPatientRepo: IPatientRepository = {
      async findById(id) { return id === 'patient-500' ? mockPatient : null; },
      async findAll() { return { data: [], total: 0, page: 1, pageSize: 20 }; },
      async search() { return { data: [], total: 0, page: 1, pageSize: 20 }; },
      async save() {},
      async update() {},
      async delete() {},
    };

    const mockIntakeRepo: IIntakeFormRepository = {
      async create(form) { createdForm = form; },
      async findByToken() { return null; },
      async findByPatientId() { return []; },
      async markAsSubmitted() {},
      async isTokenValid() { return true; },
    };

    const useCase = new CreateIntakeForm(mockIntakeRepo, mockPatientRepo);
    const form = await useCase.execute({ patientId: 'patient-500' });

    assert.ok(form.id);
    assert.equal(form.patientId, 'patient-500');
    assert.equal(form.patientName, 'Ingri Caceres');
    assert.equal(form.status, 'pending');
    assert.ok(form.accessToken.length >= 32);
    assert.notEqual(createdForm, null);
  });

  test('GetIntakeFormByToken - valid token returns public patient data', async () => {
    const validForm: IntakeForm = {
      id: 'form-1',
      patientId: 'patient-500',
      patientName: 'Ingri Caceres',
      status: 'pending',
      accessToken: 'valid-token-123',
      tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };

    const mockIntakeRepo: IIntakeFormRepository = {
      async create() {},
      async findByToken(token) { return token === 'valid-token-123' ? validForm : null; },
      async findByPatientId() { return []; },
      async markAsSubmitted() {},
      async isTokenValid() { return true; },
    };

    const useCase = new GetIntakeFormByToken(mockIntakeRepo);
    const data = await useCase.execute('valid-token-123');

    assert.equal(data.isValid, true);
    assert.equal(data.patientName, 'Ingri Caceres');
    assert.equal(data.status, 'pending');
  });

  test('GetIntakeFormByToken - handles expired, already_submitted, and non_existent tokens', async () => {
    const expiredForm: IntakeForm = {
      id: 'form-2',
      patientId: 'patient-500',
      patientName: 'Ingri Caceres',
      status: 'pending',
      accessToken: 'expired-token',
      tokenExpiresAt: new Date(Date.now() - 1000),
      createdAt: new Date(),
    };

    const submittedForm: IntakeForm = {
      id: 'form-3',
      patientId: 'patient-500',
      patientName: 'Ingri Caceres',
      status: 'submitted',
      accessToken: 'submitted-token',
      tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };

    const mockIntakeRepo: IIntakeFormRepository = {
      async create() {},
      async findByToken(token) {
        if (token === 'expired-token') return expiredForm;
        if (token === 'submitted-token') return submittedForm;
        return null;
      },
      async findByPatientId() { return []; },
      async markAsSubmitted() {},
      async isTokenValid() { return false; },
    };

    const useCase = new GetIntakeFormByToken(mockIntakeRepo);

    const nonExistentRes = await useCase.execute('invalid-token');
    assert.equal(nonExistentRes.isValid, false);
    assert.equal(nonExistentRes.reasonForInvalidity, 'not_found');

    const expiredRes = await useCase.execute('expired-token');
    assert.equal(expiredRes.isValid, false);
    assert.equal(expiredRes.reasonForInvalidity, 'expired');

    const submittedRes = await useCase.execute('submitted-token');
    assert.equal(submittedRes.isValid, false);
    assert.equal(submittedRes.reasonForInvalidity, 'already_submitted');
  });

  test('SubmitIntakeForm - validates input, marks form submitted and invalidates token', async () => {
    const pendingForm: IntakeForm = {
      id: 'form-100',
      patientId: 'patient-500',
      patientName: 'Ingri Caceres',
      status: 'pending',
      accessToken: 'active-token-999',
      tokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };

    let submittedId: string | null = null;
    let savedData: any = null;

    const mockIntakeRepo: IIntakeFormRepository = {
      async create() {},
      async findByToken(token) { return token === 'active-token-999' ? pendingForm : null; },
      async findByPatientId() { return []; },
      async markAsSubmitted(id, formData) {
        submittedId = id;
        savedData = formData;
      },
      async isTokenValid() { return true; },
    };

    const useCase = new SubmitIntakeForm(mockIntakeRepo);
    const result = await useCase.execute('active-token-999', {
      chiefComplaint: 'Dolor abdominal agudo',
      symptoms: 'Fiebre, náuseas',
      allergies: 'Penicilina',
    });

    assert.equal(result.success, true);
    assert.equal(submittedId, 'form-100');
    assert.equal(savedData.chiefComplaint, 'Dolor abdominal agudo');
    assert.equal(savedData.allergies, 'Penicilina');
  });

  // ---------------------------------------------------------------------------
  // FASE 3: VIDEOCONSULTA INTEGRADA USE CASES TESTS
  // ---------------------------------------------------------------------------

  test('CreateVideoConsultation - generates unguessable room, updates DB and returns room info', async () => {
    const scheduledApt: Appointment = {
      id: 'apt-video-1',
      patientId: 'patient-500',
      appointmentDate: new Date(),
      status: 'scheduled',
      createdAt: new Date(),
    };

    let updatedSessionData: any = null;

    const mockAptRepo: IAppointmentRepository = {
      async findById(id) { return id === 'apt-video-1' ? scheduledApt : null; },
      async findUpcomingWithoutReminder() { return []; },
      async updateStatus() {},
      async updateReminderSent() {},
      async updateVideoSession(id, data) {
        assert.equal(id, 'apt-video-1');
        updatedSessionData = data;
      },
      async save() {},
    };

    const mockVideoService: IVideoConferenceService = {
      async generateRoomForAppointment(appointmentId) {
        assert.equal(appointmentId, 'apt-video-1');
        return {
          roomName: 'cp-consultation-aptvideo-a1b2c3d4e5f6',
          roomUrl: 'https://meet.jit.si/cp-consultation-aptvideo-a1b2c3d4e5f6',
        };
      },
    };

    const useCase = new CreateVideoConsultation(mockAptRepo, mockVideoService);
    const result = await useCase.execute('apt-video-1');

    assert.equal(result.appointmentId, 'apt-video-1');
    assert.equal(result.roomName, 'cp-consultation-aptvideo-a1b2c3d4e5f6');
    assert.equal(result.roomUrl, 'https://meet.jit.si/cp-consultation-aptvideo-a1b2c3d4e5f6');
    assert.equal(result.consultationType, 'video');
    assert.notEqual(updatedSessionData, null);
    assert.equal(updatedSessionData.videoSessionStatus, 'scheduled');
  });

  test('CreateVideoConsultation - rejects cancelled appointments and non-existent IDs', async () => {
    const cancelledApt: Appointment = {
      id: 'apt-cancelled',
      patientId: 'patient-500',
      appointmentDate: new Date(),
      status: 'cancelled',
      createdAt: new Date(),
    };

    const mockAptRepo: IAppointmentRepository = {
      async findById(id) { return id === 'apt-cancelled' ? cancelledApt : null; },
      async findUpcomingWithoutReminder() { return []; },
      async updateStatus() {},
      async updateReminderSent() {},
      async updateVideoSession() {},
      async save() {},
    };

    const mockVideoService: IVideoConferenceService = {
      async generateRoomForAppointment() {
        return { roomName: 'dummy', roomUrl: 'https://meet.jit.si/dummy' };
      },
    };

    const useCase = new CreateVideoConsultation(mockAptRepo, mockVideoService);

    await assert.rejects(
      async () => useCase.execute('apt-cancelled'),
      /No se puede crear una videoconsulta para una cita cancelada/,
    );

    await assert.rejects(
      async () => useCase.execute('non-existent-id'),
      /Cita con ID non-existent-id no encontrada/,
    );
  });

  test('GetVideoConsultationLink - returns room details for doctor and patient', async () => {
    const videoApt: Appointment = {
      id: 'apt-video-2',
      patientId: 'patient-500',
      patientName: 'Ingri Caceres',
      doctorName: 'Dr. Medico',
      appointmentDate: new Date('2026-07-25T14:00:00Z'),
      status: 'scheduled',
      videoRoomName: 'cp-consultation-aptvideo2-1234567890abcdef',
      videoRoomUrl: 'https://meet.jit.si/cp-consultation-aptvideo2-1234567890abcdef',
      videoSessionStatus: 'scheduled',
      consultationType: 'video',
      createdAt: new Date(),
    };

    const mockAptRepo: IAppointmentRepository = {
      async findById(id) { return id === 'apt-video-2' ? videoApt : null; },
      async findUpcomingWithoutReminder() { return []; },
      async updateStatus() {},
      async updateReminderSent() {},
      async updateVideoSession() {},
      async save() {},
    };

    const useCase = new GetVideoConsultationLink(mockAptRepo);
    const result = await useCase.execute('apt-video-2');

    assert.equal(result.appointmentId, 'apt-video-2');
    assert.equal(result.hasVideoRoom, true);
    assert.equal(result.roomName, 'cp-consultation-aptvideo2-1234567890abcdef');
    assert.equal(result.roomUrl, 'https://meet.jit.si/cp-consultation-aptvideo2-1234567890abcdef');
    assert.equal(result.consultationType, 'video');
  });

  // ---------------------------------------------------------------------------
  // FASE 4: REGISTRO DE PAGOS MANUALES USE CASES TESTS
  // ---------------------------------------------------------------------------

  test('RegisterPayment - validates amount > 0, valid paymentMethod and saves payment', async () => {
    const validPatientId = '483e1b9e-1987-41a0-8758-76f500350928';
    const validPatient: Patient = {
      id: validPatientId,
      fullName: 'Paciente Pago Test',
      phone: '+50499998888',
      photoUrl: '',
      isProtected: false,
      createdAt: new Date(),
    };

    let savedPayment: any = null;

    const mockPatientRepo: IPatientRepository = {
      async findById(id) { return id === validPatientId ? validPatient : null; },
      async findAll() { return { data: [], total: 0, page: 1, pageSize: 20 }; },
      async search() { return { data: [], total: 0, page: 1, pageSize: 20 }; },
      async save() {},
      async update() {},
      async delete() {},
    };

    const mockPaymentRepo: IPaymentRepository = {
      async create(payment) { savedPayment = payment; },
      async findById() { return null; },
      async findByAppointmentId() { return []; },
      async findByPatientId() { return []; },
      async updateStatus() {},
      async getSummaryByPatient() { return { totalPaid: 0, totalPending: 0, totalRefunded: 0, count: 0 }; },
    };

    const useCase = new RegisterPayment(mockPaymentRepo, mockPatientRepo);

    // Valid Payment
    const result = await useCase.execute({
      patientId: validPatientId,
      amount: 650.00,
      paymentMethod: 'cash',
      status: 'paid',
      notes: 'Pago en efectivo en recepción',
    });

    assert.equal(result.patientId, validPatientId);
    assert.equal(result.amount, 650.00);
    assert.equal(result.currency, 'HNL');
    assert.equal(result.paymentMethod, 'cash');
    assert.equal(result.status, 'paid');
    assert.notEqual(savedPayment, null);
    assert.equal(savedPayment.amount, 650.00);

    // Invalid Amount validation (amount <= 0)
    await assert.rejects(
      async () => useCase.execute({
        patientId: validPatientId,
        amount: -50,
        paymentMethod: 'cash',
      }),
      /El monto debe ser un número positivo mayor que cero/,
    );
  });

  test('UpdatePaymentStatus - updates payment status and paidAt timestamp', async () => {
    const validPaymentId = 'a1b2c3d4-e5f6-4788-9900-112233445566';
    const pendingPayment = {
      id: validPaymentId,
      patientId: '483e1b9e-1987-41a0-8758-76f500350928',
      amount: 500,
      currency: 'HNL',
      paymentMethod: 'bank_transfer' as const,
      status: 'pending' as const,
      createdAt: new Date(),
    };

    let updatedStatus: string | null = null;
    let updatedPaidAt: Date | undefined = undefined;

    const mockPaymentRepo: IPaymentRepository = {
      async create() {},
      async findById(id) { return id === validPaymentId ? pendingPayment : null; },
      async findByAppointmentId() { return []; },
      async findByPatientId() { return []; },
      async updateStatus(id, status, paidAt) {
        updatedStatus = status;
        updatedPaidAt = paidAt;
      },
      async getSummaryByPatient() { return { totalPaid: 0, totalPending: 0, totalRefunded: 0, count: 0 }; },
    };

    const useCase = new UpdatePaymentStatus(mockPaymentRepo);
    const result = await useCase.execute({
      paymentId: validPaymentId,
      status: 'paid',
    });

    assert.equal(result.paymentId, validPaymentId);
    assert.equal(result.status, 'paid');
    assert.equal(updatedStatus, 'paid');
    assert.notEqual(updatedPaidAt, undefined);
  });

  test('GetPatientPaymentsSummary - calculates summary totalPaid, totalPending, totalRefunded', async () => {
    const mockPayments = [
      { id: 'p1', patientId: 'p-summary', amount: 500, currency: 'HNL', paymentMethod: 'cash' as const, status: 'paid' as const, createdAt: new Date() },
      { id: 'p2', patientId: 'p-summary', amount: 300, currency: 'HNL', paymentMethod: 'bank_transfer' as const, status: 'pending' as const, createdAt: new Date() },
      { id: 'p3', patientId: 'p-summary', amount: 150, currency: 'HNL', paymentMethod: 'cash' as const, status: 'refunded' as const, createdAt: new Date() },
    ];

    const mockPaymentRepo: IPaymentRepository = {
      async create() {},
      async findById() { return null; },
      async findByAppointmentId() { return []; },
      async findByPatientId() { return mockPayments; },
      async updateStatus() {},
      async getSummaryByPatient() {
        return { totalPaid: 500, totalPending: 300, totalRefunded: 150, count: 3 };
      },
    };

    const useCase = new GetPatientPaymentsSummary(mockPaymentRepo);
    const result = await useCase.execute('p-summary');

    assert.equal(result.patientId, 'p-summary');
    assert.equal(result.summary.totalPaid, 500);
    assert.equal(result.summary.totalPending, 300);
    assert.equal(result.summary.totalRefunded, 150);
    assert.equal(result.summary.count, 3);
    assert.equal(result.payments.length, 3);
  });

});

// =============================================================================
// FASE 5: REPORTES Y EXPORTACION DE EXPEDIENTES
// =============================================================================
import { LogAuditEvent } from '../application/use-cases/LogAuditEvent.js';
import { ExportPatientRecord } from '../application/use-cases/ExportPatientRecord.js';
import { GenerateClinicReport } from '../application/use-cases/GenerateClinicReport.js';
import type { IAuditLogRepository } from '../domain/ports/IAuditLogRepository.js';
import type { IReportingRepository, PatientExpedientData, ClinicReportData } from '../domain/ports/IReportingRepository.js';
import type { AuditLog } from '../domain/entities/AuditLog.js';

function makeExpedientData(isProtected: boolean): PatientExpedientData {
  return {
    patient: { id: 'p-rpt-001', fullName: isProtected ? 'Protegido Test' : 'Normal Test', phone: '+50412345678', isProtected, createdAt: new Date('2024-01-15') },
    medicalHistories: [{ id: 'h-1', cie10Code: 'J00', clinicalNote: 'Nota test', isLocked: true, createdAt: new Date() }],
    prescriptions: [], intakeForms: [],
    payments: [{ id: 'pay-1', amount: 500, currency: 'HNL', paymentMethod: 'cash', status: 'paid', createdAt: new Date() }],
    appointments: [],
  };
}

function makeClinicReport5(): ClinicReportData {
  return {
    dateRange: { from: new Date('2026-01-01'), to: new Date('2026-06-30') }, generatedAt: new Date(),
    appointments: { total: 50, completed: 40, cancelled: 5, scheduled: 3, noShows: 2, noShowRate: 4 },
    revenue: { totalRevenue: 25000, totalPaid: 22000, totalPending: 3000, totalRefunded: 0, currency: 'HNL', byMethod: [] },
    topDiagnoses: [{ code: 'J00', description: 'Rinofaringitis', count: 15 }],
    patientVisitFrequency: [], totalPatients: 35, newPatients: 8,
  };
}

const makeNullAudit = (): IAuditLogRepository => ({
  async create() {}, async findByResourceId() { return []; },
  async findByUserId() { return []; }, async findByDateRange() { return []; },
});

describe('Phase 5 - Reportes y Exportacion', () => {

  test('LogAuditEvent - creates audit log with correct fields', async () => {
    let created: AuditLog | null = null;
    const repo: IAuditLogRepository = { async create(l) { created = l; }, async findByResourceId() { return []; }, async findByUserId() { return []; }, async findByDateRange() { return []; } };
    const uc = new LogAuditEvent(repo);
    const r = await uc.execute({ userId: 'admin-1', action: 'report_generated', resourceType: 'report' });
    assert.ok(r.id);
    assert.equal(r.userId, 'admin-1');
    assert.equal(r.action, 'report_generated');
    assert.notEqual(created, null);
  });

  test('ExportPatientRecord - exports non-protected patient without confirmationReason', async () => {
    let created: AuditLog | null = null;
    const repo = { async getPatientExpedientData() { return makeExpedientData(false); } };
    const pdf = { async generatePatientExpedientPdf(): Promise<Buffer> { return Buffer.from('%PDF'); } };
    const audit: IAuditLogRepository = { async create(l) { created = l; }, async findByResourceId() { return []; }, async findByUserId() { return []; }, async findByDateRange() { return []; } };
    const uc = new ExportPatientRecord(repo as unknown as IReportingRepository, pdf as any, audit);
    const r = await uc.execute({ patientId: 'p-rpt-001', requestedByUserId: 'admin-1' });
    assert.ok(r.pdfBuffer.length > 0);
    assert.equal(r.isProtected, false);
    assert.equal(created!.action, 'patient_pdf_exported');
  });

  test('ExportPatientRecord - REJECTS protected patient without confirmationReason', async () => {
    const repo = { async getPatientExpedientData() { return makeExpedientData(true); } };
    const pdf = { async generatePatientExpedientPdf(): Promise<Buffer> { return Buffer.from(''); } };
    const uc = new ExportPatientRecord(repo as unknown as IReportingRepository, pdf as any, makeNullAudit());
    await assert.rejects(async () => uc.execute({ patientId: 'p-rpt-001', requestedByUserId: 'admin-1' }), /PROTEGIDO/);
    await assert.rejects(async () => uc.execute({ patientId: 'p-rpt-001', requestedByUserId: 'admin-1', confirmationReason: '   ' }), /PROTEGIDO/);
  });

  test('ExportPatientRecord - allows protected patient export WITH confirmationReason and logs protected_patient_export_confirmed', async () => {
    let created: AuditLog | null = null;
    const repo = { async getPatientExpedientData() { return makeExpedientData(true); } };
    const pdf = { async generatePatientExpedientPdf(): Promise<Buffer> { return Buffer.from('%PDF-prot'); } };
    const audit: IAuditLogRepository = { async create(l) { created = l; }, async findByResourceId() { return []; }, async findByUserId() { return []; }, async findByDateRange() { return []; } };
    const uc = new ExportPatientRecord(repo as unknown as IReportingRepository, pdf as any, audit);
    const r = await uc.execute({ patientId: 'p-rpt-001', requestedByUserId: 'admin-1', confirmationReason: 'Referencia cardiologia' });
    assert.ok(r.pdfBuffer.length > 0);
    assert.equal(r.isProtected, true);
    assert.equal(created!.action, 'protected_patient_export_confirmed');
    assert.equal((created!.metadata as Record<string, unknown>)?.confirmationReason, 'Referencia cardiologia');
  });

  test('GenerateClinicReport - generates PDF and logs report_generated', async () => {
    let created: AuditLog | null = null;
    const repo = { async getClinicReport() { return makeClinicReport5(); } };
    const pdf = { async generateClinicReportPdf(): Promise<Buffer> { return Buffer.from('%PDF-clinic'); } };
    const audit: IAuditLogRepository = { async create(l) { created = l; }, async findByResourceId() { return []; }, async findByUserId() { return []; }, async findByDateRange() { return []; } };
    const uc = new GenerateClinicReport(repo as unknown as IReportingRepository, pdf as any, audit);
    const r = await uc.execute({ from: '2026-01-01', to: '2026-06-30', requestedByUserId: 'admin-1' });
    assert.ok(r.pdfBuffer.length > 0);
    assert.equal(r.reportData.appointments.total, 50);
    assert.equal(created!.action, 'report_generated');
  });

  test('GenerateClinicReport - rejects from > to', async () => {
    const repo = { async getClinicReport() { return makeClinicReport5(); } };
    const pdf = { async generateClinicReportPdf(): Promise<Buffer> { return Buffer.from(''); } };
    const uc = new GenerateClinicReport(repo as unknown as IReportingRepository, pdf as any, makeNullAudit());
    await assert.rejects(async () => uc.execute({ from: '2026-12-31', to: '2026-01-01', requestedByUserId: 'admin-1' }), /"from"/);
  });

  test('GenerateClinicReport - rejects range > 366 days', async () => {
    const repo = { async getClinicReport() { return makeClinicReport5(); } };
    const pdf = { async generateClinicReportPdf(): Promise<Buffer> { return Buffer.from(''); } };
    const uc = new GenerateClinicReport(repo as unknown as IReportingRepository, pdf as any, makeNullAudit());
    await assert.rejects(async () => uc.execute({ from: '2020-01-01', to: '2026-12-31', requestedByUserId: 'admin-1' }), /rango/i);
  });

});
