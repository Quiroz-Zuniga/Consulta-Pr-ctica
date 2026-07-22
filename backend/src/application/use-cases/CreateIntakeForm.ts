import { randomUUID } from 'node:crypto';
import type { IntakeForm } from '../../domain/entities/IntakeForm.js';
import type { IIntakeFormRepository } from '../../domain/ports/IIntakeFormRepository.js';
import type { IPatientRepository } from '../../domain/ports/IPatientRepository.js';
import { generateSecureToken } from '../../infrastructure/utils/cryptoUtils.js';

export interface CreateIntakeInput {
  patientId: string;
  appointmentId?: string;
  expiresInHours?: number;
}

export class CreateIntakeForm {
  constructor(
    private readonly intakeRepo: IIntakeFormRepository,
    private readonly patientRepo: IPatientRepository,
  ) {}

  async execute(input: CreateIntakeInput, token?: string): Promise<IntakeForm> {
    if (!input.patientId) {
      throw new Error('Patient ID is required to create intake form.');
    }

    const patient = await this.patientRepo.findById(input.patientId, token);
    if (!patient) {
      throw new Error(`Patient with ID ${input.patientId} not found.`);
    }

    const hours = input.expiresInHours || 72;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + hours * 60 * 60 * 1000);

    const form: IntakeForm = {
      id: randomUUID(),
      patientId: input.patientId,
      patientName: patient.fullName,
      appointmentId: input.appointmentId,
      status: 'pending',
      accessToken: generateSecureToken(32),
      tokenExpiresAt: expiresAt,
      createdAt: now,
    };

    await this.intakeRepo.create(form);
    return form;
  }
}
