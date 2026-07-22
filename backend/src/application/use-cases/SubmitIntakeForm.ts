import type { IntakeClinicalData } from '../../domain/entities/IntakeForm.js';
import type { IIntakeFormRepository } from '../../domain/ports/IIntakeFormRepository.js';

export class SubmitIntakeForm {
  constructor(private readonly intakeRepo: IIntakeFormRepository) {}

  async execute(token: string, formData: IntakeClinicalData): Promise<{ success: boolean; message: string }> {
    if (!token || !token.trim()) {
      throw new Error('El token de acceso es requerido.');
    }

    const form = await this.intakeRepo.findByToken(token.trim());
    if (!form) {
      throw new Error('Formulario de preconsulta no encontrado o token inválido.');
    }

    if (form.status === 'submitted') {
      throw new Error('Este formulario de preconsulta ya fue enviado previamente.');
    }

    const now = new Date();
    if (now > new Date(form.tokenExpiresAt) || form.status === 'expired') {
      throw new Error('El enlace de preconsulta ha expirado.');
    }

    if (!formData.chiefComplaint || !formData.chiefComplaint.trim()) {
      throw new Error('El motivo principal de consulta es obligatorio.');
    }

    await this.intakeRepo.markAsSubmitted(form.id, {
      chiefComplaint: formData.chiefComplaint.trim(),
      symptoms: formData.symptoms?.trim() || '',
      symptomDuration: formData.symptomDuration?.trim() || '',
      allergies: formData.allergies?.trim() || 'Ninguna conocida',
      currentMedications: formData.currentMedications?.trim() || 'Ninguno',
      medicalHistoryNotes: formData.medicalHistoryNotes?.trim() || '',
      additionalNotes: formData.additionalNotes?.trim() || '',
    });

    return {
      success: true,
      message: 'Formulario de preconsulta enviado exitosamente.',
    };
  }
}
