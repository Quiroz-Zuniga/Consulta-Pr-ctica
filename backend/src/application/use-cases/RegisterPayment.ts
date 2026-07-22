import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { IPaymentRepository } from '../../domain/ports/IPaymentRepository.js';
import type { IPatientRepository } from '../../domain/ports/IPatientRepository.js';
import type { Payment, PaymentMethod, PaymentStatus } from '../../domain/entities/Payment.js';

export const RegisterPaymentSchema = z.object({
  appointmentId: z.string().uuid().optional(),
  patientId: z.string().uuid('ID de paciente inválido'),
  amount: z.number().positive('El monto debe ser un número positivo mayor que cero'),
  currency: z.string().default('HNL').optional(),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'card_manual', 'other'], {
    errorMap: () => ({ message: 'Método de pago inválido ( cash, bank_transfer, card_manual, other )' }),
  }),
  status: z.enum(['pending', 'paid', 'partial', 'refunded']).default('paid').optional(),
  notes: z.string().optional(),
  registeredBy: z.string().uuid().optional(),
});

export type RegisterPaymentInput = z.input<typeof RegisterPaymentSchema>;

export interface RegisterPaymentOutput {
  id: string;
  appointmentId?: string;
  patientId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  notes?: string;
  paidAt?: string;
  createdAt: string;
}

export class RegisterPayment {
  constructor(
    private paymentRepository: IPaymentRepository,
    private patientRepository: IPatientRepository,
  ) {}

  async execute(input: RegisterPaymentInput): Promise<RegisterPaymentOutput> {
    const validated = RegisterPaymentSchema.parse(input);

    const patient = await this.patientRepository.findById(validated.patientId);
    if (!patient) {
      throw new Error(`Paciente con ID ${validated.patientId} no encontrado.`);
    }

    const now = new Date();
    const paidAt = validated.status === 'paid' ? now : undefined;

    const payment: Payment = {
      id: randomUUID(),
      appointmentId: validated.appointmentId,
      patientId: validated.patientId,
      amount: validated.amount,
      currency: validated.currency || 'HNL',
      paymentMethod: validated.paymentMethod as PaymentMethod,
      status: validated.status as PaymentStatus,
      notes: validated.notes?.trim() || undefined,
      registeredBy: validated.registeredBy,
      paidAt,
      createdAt: now,
    };

    await this.paymentRepository.create(payment);

    return {
      id: payment.id,
      appointmentId: payment.appointmentId,
      patientId: payment.patientId,
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      status: payment.status,
      notes: payment.notes,
      paidAt: payment.paidAt?.toISOString(),
      createdAt: payment.createdAt.toISOString(),
    };
  }
}
