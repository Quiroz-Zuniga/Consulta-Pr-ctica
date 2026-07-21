import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { AuthenticateUser } from '../application/use-cases/AuthenticateUser.js';
import { SearchCIE10 } from '../application/use-cases/SearchCIE10.js';
import { RegisterConsultation } from '../application/use-cases/RegisterConsultation.js';
import { GeneratePrescription } from '../application/use-cases/GeneratePrescription.js';

import type { IAuthService } from '../domain/ports/IAuthService.js';
import type { ICIE10Repository } from '../domain/ports/ICIE10Repository.js';
import type { IPatientRepository } from '../domain/ports/IPatientRepository.js';
import type { IMedicalHistoryRepository } from '../domain/ports/IMedicalHistoryRepository.js';
import type { IPdfGeneratorService } from '../domain/ports/IPdfGeneratorService.js';
import type { IStorageService } from '../domain/ports/IStorageService.js';
import type { Patient } from '../domain/entities/Patient.js';
import type { MedicalHistory } from '../domain/entities/MedicalHistory.js';
import type { Prescription } from '../domain/entities/Prescription.js';
import type { CIE10Diagnosis } from '../domain/entities/CIE10Diagnosis.js';
import { UserRole } from '../domain/entities/User.js';

describe('Phase 2 Use Cases', () => {

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
      async findAll() { return []; },
      async search() { return []; },
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
      async findAll() { return []; },
      async search() { return []; },
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

});
