import type { IntakeForm } from '../../domain/entities/IntakeForm.js';
import type { IIntakeFormRepository } from '../../domain/ports/IIntakeFormRepository.js';

export class GetPatientIntakeForms {
  constructor(private readonly intakeRepo: IIntakeFormRepository) {}

  async execute(patientId: string): Promise<IntakeForm[]> {
    if (!patientId) {
      throw new Error('Patient ID is required to query intake forms.');
    }

    return this.intakeRepo.findByPatientId(patientId);
  }
}
