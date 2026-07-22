export interface Patient {
  id: string;
  fullName: string;
  birthDate?: Date;
  gender?: string;
  phone: string;
  photoUrl: string;
  isProtected: boolean;
  createdAt: Date;
}

export function getAge(patient: Patient): number | null {
  if (!patient.birthDate) return null;
  const today = new Date();
  const birth = new Date(patient.birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}
