export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'refunded';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'card_manual' | 'other';

export interface Payment {
  id: string;
  appointmentId?: string;
  patientId: string;
  amount: number;
  currency: string; // e.g. 'HNL' (Lempira Hondureña)
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  notes?: string;
  registeredBy?: string; // User ID
  paidAt?: Date;
  createdAt: Date;
}
