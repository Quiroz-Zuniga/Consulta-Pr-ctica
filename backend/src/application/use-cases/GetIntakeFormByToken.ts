import type { IntakeFormStatus, IntakeClinicalData } from '../../domain/entities/IntakeForm.js';
import type { IIntakeFormRepository } from '../../domain/ports/IIntakeFormRepository.js';

export interface PublicIntakeFormData {
  token: string;
  patientName: string;
  status: IntakeFormStatus;
  tokenExpiresAt: Date;
  isValid: boolean;
  reasonForInvalidity?: 'not_found' | 'expired' | 'already_submitted';
  formData?: IntakeClinicalData;
}

export class GetIntakeFormByToken {
  constructor(private readonly intakeRepo: IIntakeFormRepository) {}

  async execute(token: string): Promise<PublicIntakeFormData> {
    if (!token || !token.trim()) {
      return {
        token: '',
        patientName: '',
        status: 'expired',
        tokenExpiresAt: new Date(0),
        isValid: false,
        reasonForInvalidity: 'not_found',
      };
    }

    const form = await this.intakeRepo.findByToken(token.trim());
    if (!form) {
      return {
        token: token.trim(),
        patientName: '',
        status: 'expired',
        tokenExpiresAt: new Date(0),
        isValid: false,
        reasonForInvalidity: 'not_found',
      };
    }

    const now = new Date();
    if (form.status === 'submitted') {
      return {
        token: form.accessToken,
        patientName: form.patientName || 'Paciente',
        status: 'submitted',
        tokenExpiresAt: form.tokenExpiresAt,
        isValid: false,
        reasonForInvalidity: 'already_submitted',
        formData: form.formData,
      };
    }

    if (now > new Date(form.tokenExpiresAt) || form.status === 'expired') {
      return {
        token: form.accessToken,
        patientName: form.patientName || 'Paciente',
        status: 'expired',
        tokenExpiresAt: form.tokenExpiresAt,
        isValid: false,
        reasonForInvalidity: 'expired',
      };
    }

    return {
      token: form.accessToken,
      patientName: form.patientName || 'Paciente',
      status: form.status,
      tokenExpiresAt: form.tokenExpiresAt,
      isValid: true,
    };
  }
}
